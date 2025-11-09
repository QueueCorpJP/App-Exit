# 🧩 Stripe Connect Custom アカウント作成セットアップガイド（Supabase + Go）

このドキュメントでは、**Stripe Connect の Custom アカウント**を  
あなたのウェブアプリ内で作成できるようにするまでの手順をまとめます。

目的：  
あなたのサイト上でユーザーが Stripe 登録フォームを使わず、  
内部API（Go）経由で Stripe の **Customアカウント（売り手・提供者など）** を作成できるようにする。

---

## ⚙️ 1. 全体構成概要

[User] → [Your Site] → [Go API] → [Stripe API]
│
▼
[Supabase Database]

yaml
コードをコピーする

あなたのサーバー（Go）で Stripe の Custom アカウントを作成し、  
返された `acct_XXXXXX` を Supabase に保存します。

---

## 🧾 2. Stripe 側設定

### 1. Stripe Dashboard
1. ログイン → 左メニュー「Connect」→「Settings」
2. **Custom accounts** を有効化  
3. 「Developers」→「API keys」→ **Secret key** を取得  

> ⚠️ 公開キーではなく Secret Key（`sk_test_〜`）を使用します。

---

## 🔑 3. 環境変数設定

`.env` に以下を追加してください：

STRIPE_SECRET_KEY=sk_test_****************************
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=****************************

pgsql
コードをコピーする

---

## 🧱 4. Supabase テーブル構成

StripeアカウントIDを保存するために `profiles` テーブルにカラムを追加します。

```sql
ALTER TABLE public.profiles
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_account_status text DEFAULT 'unverified',
ADD COLUMN stripe_verified_at timestamp with time zone;
🧑‍💻 5. Go API 実装例
ファイル：main.go

go
コードをコピーする
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"

    "github.com/stripe/stripe-go/v78"
    "github.com/stripe/stripe-go/v78/account"
)

// Customアカウント作成エンドポイント
func createCustomAccount(w http.ResponseWriter, r *http.Request) {
    stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

    // Stripe Custom アカウント作成
    params := &stripe.AccountParams{
        Type:         stripe.String("custom"),
        Country:      stripe.String("JP"),
        Email:        stripe.String("user@example.com"),
        BusinessType: stripe.String("individual"),
        Capabilities: &stripe.AccountCapabilitiesParams{
            Transfers: &stripe.AccountCapabilitiesTransfersParams{
                Requested: stripe.Bool(true),
            },
        },
    }

    acct, err := account.New(params)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // 結果を返却
    json.NewEncoder(w).Encode(acct)
}

func main() {
    http.HandleFunc("/api/stripe/account/create", createCustomAccount)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
🧩 6. APIテスト方法
cURL でのテスト例
bash
コードをコピーする
curl -X POST http://localhost:8080/api/stripe/account/create
レスポンス例：

json
コードをコピーする
{
  "id": "acct_1Q1eABCDEF123456",
  "object": "account",
  "country": "JP",
  "email": "user@example.com",
  "capabilities": {
    "transfers": { "requested": true, "status": "pending" }
  }
}
これで Stripe 側に Custom アカウントが作成されます。

🧠 7. Supabase への保存（任意）
Go 側で acct.ID を Supabase REST API 経由で保存します。

go
コードをコピーする
import "bytes"

func saveToSupabase(userID, stripeID string) error {
    data := map[string]string{"stripe_account_id": stripeID}
    body, _ := json.Marshal(data)

    req, _ := http.NewRequest(
        "PATCH",
        os.Getenv("SUPABASE_URL")+"/rest/v1/profiles?id=eq."+userID,
        bytes.NewBuffer(body),
    )

    req.Header.Set("apikey", os.Getenv("SUPABASE_ANON_KEY"))
    req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_ANON_KEY"))
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    _, err := client.Do(req)
    return err
}
🧭 8. KYCフォームへの誘導（Account Link）
Customアカウントは、作成後に Stripe 側で本人確認を行う必要があります。
Stripeの Account Links API を使うと、あなたのUIから本人確認フォームに誘導できます。

go
コードをコピーする
import "github.com/stripe/stripe-go/v78/accountlink"

func createAccountLink(accountID string) (*stripe.AccountLink, error) {
    params := &stripe.AccountLinkParams{
        Account:    stripe.String(accountID),
        RefreshURL: stripe.String("https://your-site.com/retry"),
        ReturnURL:  stripe.String("https://your-site.com/success"),
        Type:       stripe.String("account_onboarding"),
    }
    return accountlink.New(params)
}
ユーザーに accountLink.URL を返して、
そのURLを開かせるとStripe公式フォームで本人確認を完了できます。

🧩 9. Webhook設定（状態同期）
Stripeからの「アカウント更新通知」を受け取るためにWebhookを設定します。

1. Stripe Dashboard
Developers → Webhooks → + Add endpoint
URL: https://your-domain.com/webhook/stripe
イベント：

account.updated

2. GoでのWebhook受信例
go
コードをコピーする
import (
    "github.com/stripe/stripe-go/v78/webhook"
    "io/ioutil"
)

func handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
    payload, _ := ioutil.ReadAll(r.Body)
    event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), os.Getenv("STRIPE_WEBHOOK_SECRET"))
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if event.Type == "account.updated" {
        var acc stripe.Account
        json.Unmarshal(event.Data.Raw, &acc)
        log.Println("Account updated:", acc.ID)
        // Supabase上でステータス更新
    }

    w.WriteHeader(http.StatusOK)
}