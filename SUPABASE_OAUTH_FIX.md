# Supabase OAuth 設定の修正手順

## 🚨 問題

GitHubで認証後、フロントエンドのコールバック処理が実行されていません。
これは、Supabaseの設定が正しくないためです。

## ✅ 解決手順

### ステップ1: Supabase Dashboard にログイン

1. https://app.supabase.com にアクセス
2. プロジェクト `zhurlwyfrbpbwemajvqk` を選択

### ステップ2: URL Configuration を確認

1. 左サイドバー → **Authentication** → **URL Configuration**
2. 以下を設定：

#### Site URL
```
http://localhost:3000
```

#### Redirect URLs
**重要**: 以下のURLを**すべて**追加してください（1行に1つ）:
```
http://localhost:3000/login
http://localhost:3000/**
http://localhost:3000/ja/login
http://localhost:3000/en/login
https://appexit.jp/login
https://appexit.jp/**
https://appexit.jp/ja/login
https://appexit.jp/en/login
```

**Note**: `/**` は全てのパスを許可するワイルドカードです

### ステップ3: GitHub Provider の設定を確認

1. 左サイドバー → **Authentication** → **Providers**
2. **GitHub** を探す
3. **Enabled** がONになっているか確認
4. **Client ID** と **Client Secret** が設定されているか確認

### ステップ4: GitHub OAuth App の設定を確認

1. https://github.com/settings/developers にアクセス
2. OAuth Apps → 該当アプリを選択
3. **Authorization callback URL** を確認:
   ```
   https://zhurlwyfrbpbwemajvqk.supabase.co/auth/v1/callback
   ```
   **注意**: これは `http://localhost:3000/login` では**ありません**！
   Supabaseの URL である必要があります。

### ステップ5: 設定を保存して再テスト

1. すべての設定を **Save** または **Update**
2. ブラウザのキャッシュをクリア:
   - Chrome: Ctrl+Shift+Delete → 「キャッシュされた画像とファイル」を選択 → クリア
3. ログインページにアクセス: http://localhost:3000/login
4. GitHubボタンをクリック
5. ブラウザのコンソール（F12 → Console）でログを確認:
   ```
   [OAuth Callback] Checking URL hash: #access_token=...
   ```

## 🔍 デバッグ方法

### 期待される動作

1. **GitHubボタンクリック** → Supabase経由でGitHub認証ページへ
2. **GitHub認証完了** → Supabaseへリダイレクト
3. **Supabase** → `http://localhost:3000/login#access_token=...&refresh_token=...` へリダイレクト
4. **フロントエンド** → トークンを抽出して `/api/auth/oauth/callback` にPOST
5. **バックエンド** → セッション確立
6. **フロントエンド** → ホーム画面へリダイレクト

### 実際に何が起こっているか確認

GitHubで認証した後、**ブラウザのアドレスバーのURL** を確認してください：

#### ✅ 正常な場合:
```
http://localhost:3000/login#access_token=eyJhbGc...&refresh_token=...&expires_in=3600&token_type=bearer
```

#### ❌ 問題がある場合:
```
http://localhost:3000/login
```
または
```
http://localhost:3000/
```
または
```
http://localhost:3000/login#error=access_denied&error_description=...
```

## 📋 チェックリスト

- [ ] Supabase Site URL: `http://localhost:3000` が設定されている
- [ ] Supabase Redirect URLs: `http://localhost:3000/login` が追加されている
- [ ] Supabase Redirect URLs: `http://localhost:3000/**` が追加されている
- [ ] GitHub Provider が Enabled になっている
- [ ] GitHub OAuth App の Authorization callback URL が `https://zhurlwyfrbpbwemajvqk.supabase.co/auth/v1/callback` になっている
- [ ] GitHub OAuth App の Client ID が Supabase に設定されている
- [ ] GitHub OAuth App の Client Secret が Supabase に設定されている
- [ ] ブラウザのキャッシュをクリアした
- [ ] 再テストした

## 🎯 よくある間違い

### ❌ 間違い 1: GitHub の Authorization callback URL を間違える
```
❌ http://localhost:3000/login
✅ https://zhurlwyfrbpbwemajvqk.supabase.co/auth/v1/callback
```

### ❌ 間違い 2: Supabase の Redirect URLs にワイルドカードを含めない
```
❌ http://localhost:3000/login のみ
✅ http://localhost:3000/login と http://localhost:3000/** の両方
```

### ❌ 間違い 3: ロケール付きURLを忘れる
```
❌ http://localhost:3000/login のみ
✅ http://localhost:3000/login, /ja/login, /en/login も追加
```

## 🔧 それでも動かない場合

1. **Supabase ログを確認**:
   - Supabase Dashboard → Logs → Auth Logs
   - エラーメッセージを確認

2. **ブラウザコンソールを確認**:
   - F12 → Console タブ
   - `[OAuth Callback]` で始まるログを確認

3. **ネットワークタブを確認**:
   - F12 → Network タブ
   - `/api/auth/oauth/callback` が呼ばれているか確認

4. **この情報を共有**:
   - GitHubで認証した後のURL（アドレスバー）
   - ブラウザコンソールのログ
   - ネットワークタブのリクエスト一覧
