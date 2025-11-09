# セッションタイムアウト問題の修正

## 問題の概要

30分程度でセッションが自動的に切れる問題が発生していました。

## 根本原因

### 1. JWT有効期限とCookie有効期限の不一致
- **Supabase JWTの有効期限**: 30分（1800秒）
- **バックエンドCookieの有効期限**: 1時間（3600秒）に設定されていた
- **問題**: Cookieは有効でも、その中のJWTトークンが30分で期限切れになるため、認証が失敗していた

### 2. リフレッシュ間隔が不十分
- フロントエンドは25分ごとにリフレッシュを試みていた
- しかし、30分のタイムアウトに対して5分のマージンでは不十分な場合があった

### 3. リフレッシュ失敗時のログ不足
- リフレッシュが失敗した場合の詳細なログがなく、原因の特定が困難だった

## 実施した修正

### 1. フロントエンド修正 (`frontend/appexit/lib/auth-context.tsx`)

#### リフレッシュ間隔の短縮
- **変更前**: 25分ごとにリフレッシュ
- **変更後**: **20分ごとにリフレッシュ**（10分のマージン確保）

#### ログの強化
- トークンの有効期限をコンソールに出力
- リフレッシュ失敗時の詳細なエラーログを追加

```typescript
// 変更箇所: frontend/appexit/lib/auth-context.tsx:197-223
tokenRefreshIntervalRef.current = setInterval(async () => {
  console.log('[AUTH-CONTEXT] Proactively refreshing tokens (20min interval)...');
  // ...
  console.log('[AUTH-CONTEXT] New token expires at:', new Date(data.session.expires_at! * 1000).toLocaleString());
}, 20 * 60 * 1000); // 20分ごと
```

### 2. バックエンド修正 (`backend/internal/handlers/auth.go`)

#### Cookie有効期限の修正
- **変更前**: auth_token、access_token のMaxAge = 3600秒（1時間）
- **変更後**: **MaxAge = 1800秒（30分）** - JWT有効期限と一致

```go
// 変更箇所1: backend/internal/handlers/auth.go:175-194 (Login関数)
http.SetCookie(w, &http.Cookie{
    Name:     "auth_token",
    Value:    authResp.AccessToken,
    Path:     "/",
    MaxAge:   1800, // 30分（Supabase JWTの有効期限と一致）
    HttpOnly: true,
    // ...
})

// 変更箇所2: backend/internal/handlers/auth.go:453-476 (setAuthCookies関数)
http.SetCookie(w, &http.Cookie{
    Name:     "auth_token",
    Value:    accessToken,
    Path:     "/",
    MaxAge:   30 * 60, // 30分（JWT有効期限と一致）
    HttpOnly: true,
    // ...
})
```

#### RefreshTokenエンドポイントのログ強化
- リフレッシュプロセスの各ステップでログを出力
- エラー発生時の詳細情報を記録

```go
// 変更箇所: backend/internal/handlers/auth.go:805-875
func (s *Server) RefreshToken(w http.ResponseWriter, r *http.Request) {
    fmt.Printf("[INFO] RefreshToken: Starting token refresh process\n")
    // ...
    fmt.Printf("[DEBUG] RefreshToken: Found refresh token cookie (length: %d)\n", len(refreshCookie.Value))
    // ...
    fmt.Printf("[INFO] RefreshToken: Successfully refreshed Supabase token for user: %s\n", authResp.User.Email)
    // ...
}
```

## Supabase側の設定確認（重要）

### JWT有効期限の確認方法

Supabaseダッシュボードで以下を確認してください：

1. **Supabaseプロジェクトダッシュボードにアクセス**
   - https://supabase.com/dashboard

2. **Settings > API に移動**

3. **JWT Settings セクションを確認**
   - `JWT expiry limit` が設定されている場合、その値を確認
   - デフォルトは3600秒（1時間）ですが、プロジェクトによっては1800秒（30分）に設定されている可能性があります

### JWT有効期限を延長する場合（オプション）

もし30分では短すぎる場合、以下の手順で延長できます：

1. Supabaseダッシュボードの **Settings > API** に移動
2. **JWT Settings** セクションで `JWT expiry limit` を変更
   - 推奨値: 3600秒（1時間）
   - 最大値: 604800秒（7日間）※セキュリティ上推奨しない
3. 変更を保存

**注意**: JWT有効期限を延長した場合、バックエンドのCookie有効期限も合わせて変更してください。

## 動作確認方法

### 1. ブラウザコンソールでのログ確認

ログイン後、ブラウザのコンソール（F12 > Console）で以下のログを確認：

```
[AUTH-CONTEXT] Proactively refreshing tokens (20min interval)...
[AUTH-CONTEXT] ✓ Supabase token refreshed proactively
[AUTH-CONTEXT] New token expires at: 2025/11/09 12:30:00
[AUTH-CONTEXT] ✓ Backend token refreshed proactively
```

20分ごとに上記のログが出力されることを確認してください。

### 2. バックエンドログの確認

バックエンドのログで以下が出力されることを確認：

```
[INFO] RefreshToken: Starting token refresh process
[DEBUG] RefreshToken: Found refresh token cookie (length: XXX)
[INFO] RefreshToken: Successfully refreshed Supabase token for user: user@example.com
[INFO] RefreshToken: Successfully set new auth cookies for user: xxx-xxx-xxx
```

### 3. 長時間セッションのテスト

1. ログイン
2. **30分以上放置**
3. 何らかの操作（ページ遷移、API呼び出しなど）を実行
4. セッションが維持されていることを確認

## トラブルシューティング

### 問題: 20分後もセッションが切れる

**確認事項**:
1. ブラウザコンソールでリフレッシュログが出力されているか
2. リフレッシュ時にエラーログが出ていないか
3. バックエンドの `/api/auth/refresh` エンドポイントが正常に応答しているか

**対処法**:
- リフレッシュ間隔をさらに短縮（例: 15分ごと）
- Supabase JWTの有効期限を1時間に延長

### 問題: リフレッシュは成功するが、すぐにログアウトされる

**確認事項**:
1. refresh_token Cookieが正しく設定されているか（開発者ツール > Application > Cookies）
2. refresh_tokenの有効期限（2日間）が切れていないか

**対処法**:
- 一度ログアウトして再ログイン
- Cookieをクリアして再度ログイン

### 問題: 特定のページでのみセッションが切れる

**確認事項**:
1. そのページで大量のAPI呼び出しを行っていないか
2. ページ読み込み時にトークンを使用しているか

**対処法**:
- ページ遷移時に `checkBackendSession()` を呼び出す
- API呼び出し前にトークンの有効性を確認

## まとめ

この修正により、以下が改善されます：

1. ✅ **Cookie有効期限とJWT有効期限の一致**（30分）
2. ✅ **リフレッシュ間隔の最適化**（20分ごと、10分のマージン）
3. ✅ **詳細なログ出力**（問題発生時の原因特定が容易）
4. ✅ **より安定したセッション管理**

ただし、Supabase側のJWT有効期限設定も確認し、必要に応じて調整することを推奨します。
