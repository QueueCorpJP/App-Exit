# 🔔 Stripe Webhook セットアップガイド

このドキュメントでは、Stripe Connect の **Webhook** を設定し、アカウント状態の変更をリアルタイムでSupabaseに同期する手順を説明します。

---

## 📌 Webhookの目的

Stripe Webhookを使用すると、以下のイベントを自動的に検知してデータベースを更新できます：

- **`account.updated`**: Stripe Connectアカウントの本人確認完了時
- **`account.external_account.created`**: 銀行口座追加時
- **`account.external_account.updated`**: 銀行口座更新時
- **`account.external_account.deleted`**: 銀行口座削除時

これにより、ユーザーが本人確認を完了した瞬間に、自動的に `stripe_onboarding_completed` フラグが `true` に更新されます。

### ⚠️ 重要: 売り手（Connect Account）専用

**このWebhookは売り手（Connect Account）専用です。**

| ユーザータイプ | Stripeアカウント種類 | 保存先カラム | Webhook対応 |
|---|---|---|---|
| **売り手 (seller)** | Connect Account (`acct_xxx`) | `stripe_account_id` | ✅ 必要 |
| **買い手 (buyer)** | Customer (`cus_xxx`) | `stripe_customer_id` | ❌ 不要 |

**理由:**
- 売り手: 本人確認（KYC）が必要なため、Webhookで完了通知を受け取る
- 買い手: 本人確認不要で、決済情報はリアルタイムで確認できるためWebhook不要

---

## 🔧 1. Stripe Dashboard でWebhookエンドポイントを作成

### ステップ1: Stripe Dashboardにアクセス

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 左メニューから **「Developers」** → **「Webhooks」** をクリック
3. **「+ Add endpoint」** ボタンをクリック

### ステップ2: エンドポイントURLを入力

**Endpoint URL** に以下を入力：

```
https://api.appexit.jp/api/stripe/webhook
```

> ⚠️ **重要**:
> - 本番環境では必ず `https://` を使用してください
> - ローカル開発時は `https://localhost:8080/api/stripe/webhook` ではなく、ngrokなどのトンネリングサービスを使用してください

### ステップ3: 監視するイベントを選択

**「Select events to listen to」** で以下のイベントを選択：

- ✅ `account.updated`
- ✅ `account.external_account.created`
- ✅ `account.external_account.updated`
- ✅ `account.external_account.deleted`

### ステップ4: Webhookを保存

**「Add endpoint」** ボタンをクリックして保存します。

---

## 🔑 2. Webhook Signing Secret を取得

### ステップ1: Signing Secretをコピー

1. 作成したWebhookエンドポイントをクリック
2. **「Signing secret」** セクションの **「Reveal」** をクリック
3. シークレット（`whsec_xxxxxx`）をコピー

### ステップ2: 環境変数に追加

EC2サーバーの `.env` ファイルに以下を追加：

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ステップ3: サーバーを再起動

```bash
# サーバーを再起動して環境変数を反映
sudo systemctl restart appexit-backend

# または手動でプロセスを再起動
cd /path/to/backend
./appexit-backend
```

---

## 🧪 3. Webhookのテスト

### テスト方法1: Stripe CLI（ローカル開発用）

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# Stripeにログイン
stripe login

# Webhookをローカルでリッスン
stripe listen --forward-to localhost:8080/api/stripe/webhook

# テストイベントを送信
stripe trigger account.updated
```

### テスト方法2: Stripe Dashboardからテスト送信

1. Stripe Dashboard → **Developers** → **Webhooks**
2. 作成したエンドポイントをクリック
3. **「Send test webhook」** をクリック
4. イベントタイプで **`account.updated`** を選択
5. **「Send test webhook」** をクリック

### テスト方法3: 実際の本人確認フローでテスト

1. アプリケーションでStripe Connectアカウントを作成
2. 本人確認リンク（Account Link）を開く
3. Stripeの本人確認フォームで情報を入力
4. 完了後、WebhookがトリガーされてSupabaseが更新される

---

## 📊 4. Webhookログの確認

### バックエンドログを確認

```bash
# systemdサービスのログを確認
sudo journalctl -u appexit-backend -f

# または直接ログファイルを確認
tail -f /var/log/appexit-backend.log
```

**成功時のログ例：**

```
[STRIPE WEBHOOK] Received event: account.updated
[STRIPE WEBHOOK] Processing account.updated for: acct_1Qxxxxxxxxxxxxx
[STRIPE WEBHOOK] Successfully updated profile for account: acct_1Qxxxxxxxxxxxxx (onboarding_completed: true)
```

### Stripe Dashboardでログを確認

1. Stripe Dashboard → **Developers** → **Webhooks**
2. エンドポイントをクリック
3. **「Events」** タブで送信履歴を確認
4. ステータスが **「Succeeded」** であればOK

---

## 🛡️ 5. セキュリティ考慮事項

### Webhook署名検証

実装済みの `ConstructWebhookEvent()` メソッドが自動的に以下を検証します：

1. **署名の真正性**: Stripeからのリクエストであることを確認
2. **タイムスタンプ検証**: リプレイ攻撃を防止
3. **ペイロード整合性**: データが改ざんされていないことを確認

### ファイアウォール設定

Stripeのサーバーからのアクセスを許可：

```bash
# Stripe IPレンジを許可（オプション）
# https://stripe.com/docs/ips
sudo ufw allow from 3.18.12.0/23
sudo ufw allow from 3.130.192.0/25
```

---

## 🔄 6. Webhookイベントの処理内容

### `account.updated` イベント

```go
// 以下の処理が自動実行されます
updateData := map[string]interface{}{
    "stripe_onboarding_completed": true/false,  // charges_enabled && payouts_enabled
    "stripe_requirements_due":     "{...}",     // 不足情報のJSON
    "updated_at":                  time.Now(),
}

// profilesテーブルとorganizationsテーブルの両方を更新
```

### 同期される情報

| フィールド | 説明 |
|---|---|
| `stripe_onboarding_completed` | 本人確認完了フラグ（charges_enabled && payouts_enabled） |
| `stripe_requirements_due` | 不足している情報のリスト（JSON形式） |
| `updated_at` | 最終更新日時 |

---

## ❗ トラブルシューティング

### エラー: "Webhook signature verification failed"

**原因**: `STRIPE_WEBHOOK_SECRET` が正しく設定されていない

**解決策**:
1. `.env` ファイルで `STRIPE_WEBHOOK_SECRET` を確認
2. Stripe Dashboardから正しいシークレットをコピー
3. サーバーを再起動

### エラー: "Failed to update profiles table"

**原因**: Supabaseへの接続エラーまたはアカウントIDが見つからない

**解決策**:
1. `SUPABASE_SERVICE_ROLE_KEY` が正しく設定されているか確認
2. データベースに該当の `stripe_account_id` が存在するか確認

### Webhookが届かない

**原因**: ファイアウォールまたはネットワーク設定

**解決策**:
1. サーバーのファイアウォールでHTTPSポート（443）が開いているか確認
2. nginxの設定で `/api/stripe/webhook` が正しくプロキシされているか確認
3. Stripe Dashboardで「Attempts」を確認してエラーメッセージを確認

---

## 📝 チェックリスト

実装完了後、以下を確認してください：

- ✅ Stripe DashboardでWebhookエンドポイントを作成
- ✅ `STRIPE_WEBHOOK_SECRET` を `.env` に追加
- ✅ サーバーを再起動
- ✅ テストWebhookを送信して成功を確認
- ✅ 実際の本人確認フローでWebhookがトリガーされることを確認
- ✅ Supabaseのデータが正しく更新されることを確認

---

## 📚 関連ドキュメント

- [Stripe Webhooks 公式ドキュメント](https://stripe.com/docs/webhooks)
- [Stripe Connect Account Events](https://stripe.com/docs/api/events/types#event_types-account.updated)
- [Webhook署名検証](https://stripe.com/docs/webhooks/signatures)

---

これでStripe Webhookの設定は完了です！🎉
