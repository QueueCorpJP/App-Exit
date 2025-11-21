# Google/GitHub OAuth設定ガイド

## 問題の概要
ログイン画面でGoogle/GitHub認証が機能しない場合、以下の原因が考えられます：

1. **Supabaseの設定でOAuthプロバイダーが有効化されていない**
2. **リダイレクトURLが正しく設定されていない**
3. **環境変数が正しく設定されていない**

## 修正内容

以下のファイルを修正し、デバッグログとエラーハンドリングを改善しました：

- `backend/internal/handlers/auth.go` - OAuthログイン処理にデバッグログを追加
- `frontend/appexit/components/pages/LoginPageClient.tsx` - エラーハンドリングとログを改善
- `frontend/appexit/lib/auth-api.ts` - OAuthリクエストのログを追加

## Supabase設定の確認手順

### 1. Supabase管理画面にアクセス
1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 該当のプロジェクトを選択
3. 左サイドバーから **Authentication** → **Providers** をクリック

### 2. Google認証の設定

1. **Google** プロバイダーを見つけて **Enable** をONにする
2. Google Cloud Consoleで以下を設定：
   - [Google Cloud Console](https://console.cloud.google.com/)にアクセス
   - プロジェクトを作成または選択
   - **APIs & Services** → **Credentials** へ移動
   - **Create Credentials** → **OAuth 2.0 Client ID** を選択
   - Application type: **Web application**
   - **Authorized redirect URIs** に以下を追加：
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Client IDとClient Secretをコピー

3. Supabaseに戻って設定：
   - **Client ID** (from Google): Google Cloud ConsoleのClient IDを貼り付け
   - **Client Secret** (from Google): Google Cloud ConsoleのClient Secretを貼り付け
   - **Authorized Client IDs**: 空欄でOK（必要に応じて設定）
   - **Skip nonce check**: OFF（デフォルト）
   - **Save** をクリック

### 3. GitHub認証の設定

1. **GitHub** プロバイダーを見つけて **Enable** をONにする
2. GitHubで以下を設定：
   - [GitHub Developer Settings](https://github.com/settings/developers)にアクセス
   - **OAuth Apps** → **New OAuth App** をクリック
   - 以下の情報を入力：
     - **Application name**: AppExit (任意の名前)
     - **Homepage URL**: `https://appexit.jp` (または開発環境のURL)
     - **Authorization callback URL**:
       ```
       https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
       ```
   - **Register application** をクリック
   - Client IDとClient Secretをコピー

3. Supabaseに戻って設定：
   - **Client ID** (from GitHub): GitHubのClient IDを貼り付け
   - **Client Secret** (from GitHub): GitHubのClient Secretを貼り付け
   - **Save** をクリック

### 4. リダイレクトURL（Site URL）の設定

1. Supabase管理画面の **Authentication** → **URL Configuration** へ移動
2. 以下を確認：
   - **Site URL**: フロントエンドのURL（例: `https://appexit.jp` または `http://localhost:3000`）
   - **Redirect URLs**: 以下のURLを追加：
     ```
     https://appexit.jp/login
     http://localhost:3000/login
     ```

### 5. 環境変数の確認

#### バックエンド (.env)
```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://appexit.jp  # または http://localhost:3000
```

#### フロントエンド (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://appexit.jp/api  # または http://localhost:8080
```

## デバッグ方法

### 1. ブラウザのコンソールログを確認
1. ログインページを開く
2. 開発者ツール（F12）を開く
3. **Console** タブを選択
4. GoogleまたはGitHubログインボタンをクリック
5. 以下のログが表示されることを確認：
   ```
   [OAuth Login] Starting google login with redirect: http://localhost:3000/login
   [Auth API] OAuth login request: {...}
   [Auth API] OAuth response status: 200
   [Auth API] OAuth success response: {...}
   [OAuth Login] Redirecting to provider URL: https://...
   ```

### 2. バックエンドのログを確認
バックエンドのターミナルで以下のログが表示されることを確認：
```
========== OAUTH LOGIN START ==========
[OAUTH LOGIN] Request received from ...
[OAUTH LOGIN] Requested provider: google
[OAUTH LOGIN] Frontend callback URL: http://localhost:3000/login
[OAUTH LOGIN] ✓ Generated OAuth URL: https://...
========== OAUTH LOGIN END ==========
```

### 3. 一般的なエラーと解決方法

#### エラー: "OAuthログインの開始に失敗しました"
- バックエンドのログを確認
- 環境変数が正しく設定されているか確認
- バックエンドが起動しているか確認

#### エラー: "OAuth認証に失敗しました" (コールバック時)
- Supabaseのプロバイダーが有効化されているか確認
- Client IDとClient Secretが正しいか確認
- リダイレクトURLが正しく設定されているか確認

#### エラー: "redirect_uri_mismatch"
- Google Cloud ConsoleまたはGitHubのAuthorized redirect URIsが正しいか確認
- Supabaseの正しいCallback URLを使用しているか確認：
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```

#### Googleログインで何も起こらない
1. ブラウザのコンソールでエラーを確認
2. SupabaseのClient IDが正しいか確認
3. Google Cloud Consoleでプロジェクトが正しく設定されているか確認
4. ブラウザのサードパーティCookieが有効になっているか確認

## テスト手順

1. バックエンドを再起動：
   ```bash
   cd backend
   go run cmd/api/main.go
   ```

2. フロントエンドを再起動：
   ```bash
   cd frontend/appexit
   npm run dev
   ```

3. ログインページにアクセス：
   - 開発環境: http://localhost:3000/login
   - 本番環境: https://appexit.jp/login

4. GoogleまたはGitHubログインボタンをクリック

5. プロバイダーの認証画面が表示されることを確認

6. 認証後、ログインページにリダイレクトされ、自動的にログインが完了することを確認

## 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
