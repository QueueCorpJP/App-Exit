# 🔧 Stripe 初期設定ガイド

アカウント作成後、以下の手順でStripeを設定してください。

---

## 📋 設定の流れ

1. **Stripe Connectを有効化**
2. **APIキーを取得**
3. **Webhookを設定**
4. **環境変数に追加**
5. **テスト**

---

## 1️⃣ Stripe Connectを有効化

### ステップ1: Stripe Dashboardにログイン

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 右上の「テストモード」がONになっていることを確認（開発時）

### ステップ2: Connectを有効化

1. 左メニューから **「Connect」** をクリック
2. 初回の場合、**「Get started」** ボタンが表示されるのでクリック
3. **「Custom」** を選択
   - Standard: 不可（Stripeホストのフォームを使用）
   - Express: 不可（簡易版）
   - **Custom: 選択してください** ← これを選ぶ
4. **「Continue」** をクリック

### ステップ3: プラットフォーム情報を入力

以下の情報を入力：

| 項目 | 入力内容 |
|---|---|
| **Platform name** | appexit（またはあなたのプラットフォーム名） |
| **Platform URL** | https://appexit.jp |
| **Support email** | support@appexit.jp |
| **Business type** | Company（法人）または Individual（個人） |

### ステップ4: Connect設定を完了

1. **「Activate Connect」** をクリック
2. Connectが有効化されます

---

## 2️⃣ APIキーを取得

### ステップ1: APIキー画面を開く

1. 左メニューから **「Developers」** → **「API keys」** をクリック

### ステップ2: キーを確認・コピー

以下の2つのキーが表示されています：

#### **Publishable key（公開可能キー）**
```
pk_test_51Qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- フロントエンドで使用
- 公開してもOK

#### **Secret key（シークレットキー）**
```
sk_test_51Qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- バックエンドで使用
- **絶対に公開しないでください**
- 「Reveal test key」をクリックして表示

### ステップ3: キーをコピー

1. **Secret key** の右側の **「Reveal test key」** をクリック
2. キーをコピー
3. メモ帳などに一時保存

---

## 3️⃣ Webhookを設定

### ステップ1: Webhook画面を開く

1. 左メニューから **「Developers」** → **「Webhooks」** をクリック
2. **「+ Add endpoint」** ボタンをクリック

### ステップ2: エンドポイント情報を入力

#### **Endpoint URL**
```
https://api.appexit.jp/api/stripe/webhook
```

> ⚠️ 注意:
> - **本番環境**: `https://api.appexit.jp/api/stripe/webhook`
> - **テスト環境**: ローカル開発の場合は ngrok などのトンネリングツールを使用
>   - 例: `https://abcd1234.ngrok.io/api/stripe/webhook`

#### **Description** (オプション)
```
Connect account status updates
```

### ステップ3: イベントを選択

**「Select events to listen to」** で以下を選択：

1. **「Account」** カテゴリを展開
   - ✅ `account.updated`
   - ✅ `account.external_account.created`
   - ✅ `account.external_account.deleted`
   - ✅ `account.external_account.updated`

2. **「Add events」** をクリック

### ステップ4: エンドポイントを追加

1. **「Add endpoint」** ボタンをクリック
2. エンドポイントが作成されます

### ステップ5: Signing Secretを取得

1. 作成したエンドポイントをクリック
2. **「Signing secret」** セクションを探す
3. **「Click to reveal」** をクリック
4. シークレット（`whsec_xxxxx`）をコピー
5. メモ帳などに一時保存

---

## 4️⃣ 環境変数に追加

### EC2サーバーで設定

```bash
# SSH接続
ssh ec2-user@api.appexit.jp

# .envファイルを編集
cd /path/to/backend
sudo nano .env
```

### .envファイルに以下を追加

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51Qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLIC_KEY=pk_test_51Qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ 必ず実際の値に置き換えてください

### サーバーを再起動

```bash
# systemdサービスを再起動
sudo systemctl restart appexit-backend

# または手動起動の場合
pkill appexit-backend
./appexit-backend &
```

---

## 5️⃣ テスト

### テスト1: APIキーの動作確認

```bash
# ログを確認
sudo journalctl -u appexit-backend -f

# サーバーが正常に起動していればOK
```

### テスト2: Webhookのテスト送信

1. Stripe Dashboard → **Developers** → **Webhooks**
2. 作成したエンドポイントをクリック
3. 右上の **「Send test webhook」** をクリック
4. イベントタイプで **`account.updated`** を選択
5. **「Send test webhook」** をクリック
6. **ステータスが「Succeeded」** になればOK

### テスト3: フロントエンドからAPI呼び出し

フロントエンドから以下のAPIを呼び出してテスト：

```javascript
// Stripe Connectアカウント作成
const response = await fetch('https://api.appexit.jp/api/stripe/create-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    tosAccepted: true,
    tosAcceptedIp: '123.45.67.89'
  })
});

const data = await response.json();
console.log(data);
// { "accountId": "acct_xxx", "onboardingCompleted": false }
```

---

## 🔒 セキュリティチェックリスト

設定後、以下を確認してください：

- ✅ Secret KeyをGitにコミットしていない
- ✅ .envファイルが.gitignoreに含まれている
- ✅ Webhook Secret がコードにハードコードされていない
- ✅ 本番環境ではテストキーではなく本番キーを使用
- ✅ HTTPSを使用している（HTTPは不可）

---

## 📊 確認用チェックリスト

以下をすべてチェックしてください：

- [ ] Stripe Connectを有効化（Custom mode）
- [ ] Secret Key を取得
- [ ] Publishable Key を取得
- [ ] Webhookエンドポイントを追加
- [ ] Webhook Signing Secret を取得
- [ ] .envファイルに3つのキーを追加
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_PUBLIC_KEY
  - [ ] STRIPE_WEBHOOK_SECRET
- [ ] サーバーを再起動
- [ ] Webhookテストが成功
- [ ] APIが正常に動作

---

## ❗ トラブルシューティング

### エラー: "No such application"

**原因**: Stripe Connectが有効化されていない

**解決策**:
1. Stripe Dashboard → Connect → Get started
2. Custom modeを選択

### エラー: "Invalid API key"

**原因**: Secret Keyが間違っている

**解決策**:
1. Stripe Dashboard → Developers → API keys
2. Secret keyを再度コピー
3. .envファイルを更新
4. サーバー再起動

### Webhookが届かない

**原因**: URLが間違っている、またはファイアウォールでブロックされている

**解決策**:
1. エンドポイントURLを確認（`https://api.appexit.jp/api/stripe/webhook`）
2. nginxの設定を確認
3. ファイアウォール（ufw）でHTTPSポートが開いているか確認

---

## 🎯 次のステップ

設定完了後、以下のドキュメントを参照してください：

- **STRIPE_WEBHOOK_SETUP.md** - Webhookの詳細設定
- **todo.md** - 全体のタスク管理

---

これでStripeの初期設定は完了です！🎉
