

---

以下に、あなたの現在のスキーマ構成に完全対応した
**Supabase + Go + Stripe Custom C2C決済統合ガイド（Markdown版）** を再構築しました。
これは本番の `README.md` としてそのまま使えます。

---

````md
# 💰 Supabase + Go + Stripe Custom C2C 決済統合ガイド（既存DB対応版）

このドキュメントは、既存の Supabase スキーマを保持したまま、  
**Stripe Connect Custom** を用いた C2C（売り手⇄買い手）決済機能を安全に追加するための  
設定・実装手順をまとめたものです。

---

## 🧩 現状のスキーマとの整合性

既存DB内の下記テーブルが、Stripe連携に直接関与します。

| テーブル名 | 役割 | Stripe関連カラム |
|-------------|------|------------------|
| `profiles` | 個人ユーザー（売り手・買い手） | `stripe_account_id`, `stripe_customer_id`, `stripe_onboarding_completed`, `stripe_requirements_due` |
| `organizations` | 法人アカウント（運営・企業売り手） | `stripe_account_id`, `stripe_onboarding_completed`, `stripe_requirements_due` |
| `orders` | 売買取引履歴 | `payment_status`, `settlement_status`, `platform_fee_amount`, `seller_payout_amount` |
| `stripe_payments` | Stripe側の決済履歴 | `payment_intent_id`, `client_secret`, `status` |

これらの構成により、Stripe Connect Customを導入する際に新規テーブルを追加する必要はありません。

---

## ⚙️ 1. Stripe Connect の設定

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン  
2. 「Connect」 → 「設定」 → **Custom アカウント** を有効化  
3. 「開発者」→「APIキー」→ `sk_test_xxx` を取得  
4. 「Webhook」 → 新規作成  
   - URL: `https://your-backend.com/stripe/webhook`
   - イベント:  
     - `payment_intent.succeeded`  
     - `account.updated`  
     - `payout.paid`
5. `.env`に以下を追加：

```bash
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sbp_***
````

---

## 🐹 2. Go バックエンド構成

```
backend/
 ├── main.go
 ├── handlers/
 │   ├── stripe_create_account.go
 │   ├── stripe_payment.go
 │   ├── stripe_webhook.go
 ├── supabase/
 │   └── client.go
 ├── go.mod
 └── .env
```

### 依存パッケージ

```bash
go get github.com/stripe/stripe-go/v76
go get github.com/supabase-community/postgrest-go
```

---

## 🧱 3. 売り手アカウント登録API

Stripe上でCustomアカウントを作成し、その`account_id`をSupabaseに保存します。

```go
// handlers/stripe_create_account.go
package handlers

import (
  "encoding/json"
  "net/http"
  "os"

  "github.com/stripe/stripe-go/v76"
  "github.com/stripe/stripe-go/v76/account"
)

type CreateAccountReq struct {
  UserID string `json:"user_id"`
}

func CreateSellerAccount(w http.ResponseWriter, r *http.Request) {
  stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

  var req CreateAccountReq
  json.NewDecoder(r.Body).Decode(&req)

  acc, err := account.New(&stripe.AccountParams{
    Type: stripe.String("custom"),
    Country: stripe.String("JP"),
    Capabilities: &stripe.AccountCapabilitiesParams{
      CardPayments: &stripe.AccountCapabilitiesCardPaymentsParams{Requested: stripe.Bool(true)},
      Transfers: &stripe.AccountCapabilitiesTransfersParams{Requested: stripe.Bool(true)},
    },
    BusinessType: stripe.String("individual"),
  })
  if err != nil {
    http.Error(w, err.Error(), 400)
    return
  }

  // Supabaseに紐付け更新
  // UPDATE profiles SET stripe_account_id = acc.ID WHERE id = req.UserID;
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(map[string]string{"account_id": acc.ID})
}
```

---

## 💳 4. 支払い作成API（買い手 → 売り手）

StripeのPaymentIntentを作成し、`orders`と`stripe_payments`に保存します。

```go
// handlers/stripe_payment.go
package handlers

import (
  "encoding/json"
  "net/http"
  "os"

  "github.com/stripe/stripe-go/v76"
  "github.com/stripe/stripe-go/v76/paymentintent"
)

type PaymentReq struct {
  Amount        int64  `json:"amount"`
  SellerAccount string `json:"seller_account"`
  OrderID       string `json:"order_id"`
}

func CreatePaymentIntent(w http.ResponseWriter, r *http.Request) {
  stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

  var body PaymentReq
  json.NewDecoder(r.Body).Decode(&body)

  params := &stripe.PaymentIntentParams{
    Amount:   stripe.Int64(body.Amount),
    Currency: stripe.String("jpy"),
    PaymentMethodTypes: []*string{stripe.String("card")},
    TransferData: &stripe.PaymentIntentTransferDataParams{
      Destination: stripe.String(body.SellerAccount),
    },
  }

  pi, err := paymentintent.New(params)
  if err != nil {
    http.Error(w, err.Error(), 400)
    return
  }

  // Supabase: stripe_paymentsに記録
  json.NewEncoder(w).Encode(pi)
}
```

---

## 🔄 5. Webhookで決済完了同期

```go
// handlers/stripe_webhook.go
package handlers

import (
  "encoding/json"
  "io"
  "net/http"
  "os"

  "github.com/stripe/stripe-go/v76/webhook"
)

func StripeWebhookHandler(w http.ResponseWriter, r *http.Request) {
  payload, _ := io.ReadAll(r.Body)
  sig := r.Header.Get("Stripe-Signature")
  secret := os.Getenv("STRIPE_WEBHOOK_SECRET")

  event, err := webhook.ConstructEvent(payload, sig, secret)
  if err != nil {
    http.Error(w, "Invalid signature", http.StatusBadRequest)
    return
  }

  switch event.Type {
  case "payment_intent.succeeded":
    var data map[string]interface{}
    json.Unmarshal(event.Data.Raw, &data)
    paymentID := data["id"].(string)
    // UPDATE stripe_payments SET status='succeeded' WHERE payment_intent_id = paymentID;
    // UPDATE orders SET payment_status='paid' WHERE id = (対応するorder_id);
  }

  w.WriteHeader(http.StatusOK)
}
```

---

## 🧠 6. Supabase × Stripe データ対応表

| Stripe項目                | Supabaseテーブル                 | カラム                  | 用途          |
| ----------------------- | ---------------------------- | -------------------- | ----------- |
| `account.id`            | `profiles` / `organizations` | `stripe_account_id`  | 売り手Stripe口座 |
| `customer.id`           | `profiles`                   | `stripe_customer_id` | 買い手クレジット登録  |
| `payment_intent.id`     | `stripe_payments`            | `payment_intent_id`  | 支払い識別子      |
| `payment_intent.status` | `orders`                     | `payment_status`     | 支払い状態       |
| `transfer` / `payout`   | `orders`                     | `settlement_status`  | 売上の入金状況     |

---

## 🧾 7. 運用ポイント

* Stripeアカウント作成後に `requirements_due` が返る場合、`profiles.stripe_requirements_due` に保存してUI表示
* 売り手アカウントが `stripe_onboarding_completed=false` の場合は出金不可
* 買い手・売り手双方に `auth.users.id` を共通キーとして利用
* `orders` テーブルで金額・ステータス整合性を保つ（`payment_status` + `settlement_status`）

---

## ✅ 8. テスト手順

```bash
stripe login
stripe listen --forward-to localhost:8080/stripe/webhook
go run main.go
```

1. 売り手登録 → Stripeダッシュボードで確認
2. 買い手が支払い → `stripe_payments` に反映
3. Webhook経由で `orders.payment_status` が `paid` に変化
4. 売り手ダッシュボードに入金予定が表示される

---

## 📚 参考リンク

* [Stripe Connect Custom Accounts](https://docs.stripe.com/connect/custom-accounts?locale=ja-JP)
* [Stripe Transfers / PaymentIntents](https://docs.stripe.com/connect/charges-transfers)
* [Supabase Go SDK](https://github.com/supabase-community/postgrest-go)
* [Stripe Go SDK](https://github.com/stripe/stripe-go)


```
