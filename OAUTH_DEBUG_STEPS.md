# OAuth デバッグ手順

## 🔍 ステップ1: ブラウザコンソールの確認

1. **ブラウザを開く**
2. **開発者ツールを開く** (F12)
3. **Console タブを選択**
4. **ログをクリア** (コンソール左上のゴミ箱アイコン)
5. **ログインページに移動**: http://localhost:3000/login
6. **GitHub ボタンをクリック**
7. **すべてのログをコピーして共有**

## 期待されるログの流れ

### ✅ 正常な場合：

```
[OAuth Login] Starting github login with redirect: http://localhost:3000/login
[Auth API] OAuth login request: {method: "github", ...}
[Auth API] OAuth response status: 200
[Auth API] OAuth success response: {...}
[OAuth Login] Redirecting to provider URL: https://...

// GitHub認証後、ログインページに戻ってくる

[OAuth Callback] Checking URL hash: #access_token=...
[OAuth Callback] Access token found in URL fragment
[OAuth Callback] Access token length: 300
[OAuth Callback] Sending tokens to backend: http://localhost:8080
[OAuth Callback] Backend response status: 200
[OAuth Callback] Session established successfully
[OAuth Callback] Redirecting to: /
```

### ❌ 問題がある場合：

**パターン1: トークンが見つからない**
```
[OAuth Callback] Checking URL hash:
// または
[OAuth Callback] Checking URL hash: #error=...
```

**パターン2: バックエンドエラー**
```
[OAuth Callback] Backend response status: 400
[OAuth Callback] Backend error: {...}
```

**パターン3: 何もログが出ない**
```
// コールバック処理が実行されていない
```

## 🔍 ステップ2: URLの確認

GitHubで認証した後、ブラウザのアドレスバーに表示されるURLを確認してください：

### ✅ 正常な場合：
```
http://localhost:3000/login#access_token=eyJhb...&refresh_token=...&expires_in=3600
```

### ❌ 問題がある場合：
```
http://localhost:3000/login
// または
http://localhost:3000/login#error=access_denied
// または
http://localhost:3000/
```

## 🔍 ステップ3: ネットワークタブの確認

1. **Network タブを選択**
2. **ログをクリア**
3. **GitHub ボタンをクリック**
4. **以下のリクエストを確認**:
   - `POST /api/auth/login/oauth` → 200 OK
   - `POST /api/auth/oauth/callback` → 200 OK (GitHub認証後)

## 📋 報告内容

以下の情報を共有してください：

1. **ブラウザコンソールのログ** (全文)
2. **GitHubで認証した後のURL** (アドレスバー)
3. **ネットワークタブで `/api/auth/oauth/callback` が呼ばれているか**
4. **エラーメッセージ** (もしあれば)

---

## 🚨 よくある問題と解決策

### 問題1: URLフラグメントにトークンがない

**原因**: Supabaseの設定でリダイレクトURLが正しく設定されていない

**解決策**:
1. Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs** に以下を追加:
   - `http://localhost:3000/login`
   - `http://localhost:3000/**`

### 問題2: `/api/auth/oauth/callback` が呼ばれない

**原因**: フロントエンドのコールバック処理が実行されていない

**解決策**:
1. ページをリロードしてもう一度試す
2. ブラウザのキャッシュをクリア
3. コンソールログを確認

### 問題3: GitHubの設定が間違っている

**原因**: GitHub OAuth App の設定が正しくない

**解決策**:
1. GitHub → Settings → Developer settings → OAuth Apps
2. **Authorization callback URL** を確認:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Client ID と Client Secret をSupabaseに正しく設定

---

## 次のステップ

上記の情報を共有していただければ、正確な問題を特定できます！
