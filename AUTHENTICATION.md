# Authentication Architecture

このドキュメントでは、APPEXITアプリケーションの認証アーキテクチャについて説明します。

## 概要

APPEXITは**Bearer Token認証**を使用しています。認証トークンはHTTPOnly Cookieに保存され、APIリクエスト時にAuthorizationヘッダーとして送信されます。

## 認証フロー

### 1. ログイン/登録

1. ユーザーがログイン/登録フォームに入力
2. フロントエンドが`/api/auth/login`または`/api/auth/register`にリクエスト
3. バックエンドがSupabase Authで認証
4. バックエンドが`auth_token`をHTTPOnly Cookieにセット
5. フロントエンドがCookieからトークンを取得

### 2. 認証済みAPIリクエスト

1. フロントエンドがCookieから`auth_token`を取得
2. `Authorization: Bearer <token>`ヘッダーを付与
3. バックエンドの認証ミドルウェアがトークンを検証
4. 検証成功時、リクエストを処理

### 3. セッション管理

- フロントエンドは30秒ごとに`/api/auth/session`をポーリング
- ページフォーカス時にもセッションチェック
- セッション切れ時、自動的にログアウト

## コンポーネント

### フロントエンド

#### `/lib/cookie-utils.ts`
```typescript
// Cookieからトークンを取得するユーティリティ関数
export function getAuthToken(): string | null
export function getAuthHeader(): { Authorization?: string }
```

#### `/lib/api-client.ts`
```typescript
// すべてのAPIリクエストに自動的にAuthorizationヘッダーを付与
class ApiClient {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };
  }
}
```

#### `/lib/auth-context.tsx`
```typescript
// グローバルな認証状態管理
// セッションの自動チェックとリフレッシュ
export function AuthProvider({ children })
```

#### `/lib/storage.ts`
```typescript
// ファイルアップロード時もAuthorizationヘッダーを付与
export async function uploadImage(file: File): Promise<string>
```

### バックエンド

#### `/internal/middleware/auth.go`
```go
// Authorizationヘッダーからトークンを抽出
// Supabase JWTトークンを検証
// ユーザーIDをコンテキストに設定
func AuthWithSupabase(supabaseJWTSecret string, supabaseService *services.SupabaseService)
```

#### `/internal/handlers/routes.go`
```go
// 認証が必要なエンドポイントに auth() ミドルウェアを適用
mux.HandleFunc("/api/posts", server.HandlePostsRoute)  // POST時のみ認証
mux.HandleFunc("/api/storage/upload", auth(server.UploadFile))  // 常に認証
```

## 重要な注意点

### 1. Authorizationヘッダーは必須

バックエンドの認証ミドルウェアは**Authorizationヘッダーのみ**をチェックします。Cookieだけでは認証されません。

❌ **間違い**:
```typescript
fetch('/api/posts', {
  method: 'POST',
  credentials: 'include',  // Cookieだけでは不十分
  body: JSON.stringify(data),
})
```

✅ **正しい**:
```typescript
fetch('/api/posts', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`,  // 必須
  },
  body: JSON.stringify(data),
})
```

### 2. api-client.tsを使用する

新しいAPIリクエストを追加する場合は、`api-client.ts`を使用してください。自動的にAuthorizationヘッダーが付与されます。

```typescript
import { apiClient } from '@/lib/api-client';

// 自動的にAuthorizationヘッダーが付与される
const result = await apiClient.post('/api/posts', data);
```

### 3. 公開エンドポイント

以下のエンドポイントは認証不要です:

- `/api/auth/login`
- `/api/auth/register/step1`
- `/api/auth/session`
- `/api/auth/logout`
- `/api/posts` (GET)
- `/api/storage/signed-url`
- `/api/storage/signed-urls`

## トラブルシューティング

### 401 Unauthorized エラー

1. ブラウザのCookieに`auth_token`が存在するか確認
2. Authorizationヘッダーが送信されているか確認（DevToolsのNetworkタブ）
3. トークンの有効期限が切れていないか確認

### トークンが見つからない

1. ログイン/登録が正常に完了しているか確認
2. ブラウザのCookie設定を確認
3. HTTPSを使用しているか確認（本番環境）

## セキュリティ

- トークンはHTTPOnly Cookieに保存（XSS攻撃対策）
- CORS設定で許可されたオリジンのみアクセス可能
- トークンは1時間で期限切れ（自動リフレッシュ機能あり）
- HTTPS使用を推奨（本番環境では必須）
