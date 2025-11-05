# 認証の修正まとめ

このドキュメントでは、認証の不整合を修正するために行った変更をまとめています。

## 発見された問題

### 1. 認証方式の不整合
- **問題**: フロントエンドがCookieのみで認証しようとしていたが、バックエンドは`Authorization`ヘッダーを要求
- **影響**: 画像アップロードを含むすべての保護されたエンドポイントで401エラー

### 2. コードの重複
- **問題**: Cookie取得ロジックが複数のファイルに散在
- **影響**: メンテナンス性の低下、バグの増加リスク

### 3. 古い実装の残存
- **問題**: `useAuth()`から存在しない`token`プロパティを取得しようとしていた
- **影響**: PostSecretPageでランタイムエラー

### 4. 製品エンドポイントの認証欠如
- **問題**: POST/PUT/DELETE `/api/products`に認証ミドルウェアが適用されていなかった
- **影響**: 誰でも製品を作成・更新・削除できる脆弱性

## 修正内容

### フロントエンド

#### 1. 共通ユーティリティの作成 (`/lib/cookie-utils.ts`)
```typescript
// 新規作成
export function getCookie(name: string): string | null
export function getAuthToken(): string | null
export function getAuthHeader(): { Authorization?: string }
```

#### 2. api-client.tsの修正
```typescript
// 修正前
private getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// 修正後
private getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeader(), // ← Authorizationヘッダーを自動追加
  };
}
```

#### 3. storage.tsの修正
```typescript
// 修正前
const response = await fetch(`${API_URL}/api/storage/upload`, {
  method: 'POST',
  credentials: 'include', // Cookieのみ
  body: formData,
});

// 修正後
const token = getAuthToken();
if (!token) {
  throw new Error('Missing authentication token');
}

const response = await fetch(`${API_URL}/api/storage/upload`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${token}`, // ← 追加
  },
  body: formData,
});
```

#### 4. UserTypeSelectionPage.tsxの修正
```typescript
// 修正前
const response = await fetch(`${API_URL}/api/profiles`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(profileData),
});

// 修正後
import { getAuthHeader } from '@/lib/cookie-utils';

const response = await fetch(`${API_URL}/api/profiles`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...getAuthHeader(), // ← 追加
  },
  credentials: 'include',
  body: JSON.stringify(profileData),
});
```

#### 5. PostSecretPage.tsxの修正
```typescript
// 修正前
const { user, token, profile } = useAuth(); // tokenは存在しない

// 修正後
import { getAuthToken } from '@/lib/cookie-utils';

const { user, profile } = useAuth();

// handleSubmit内で
const token = getAuthToken();
if (!token) {
  throw new Error('認証トークンが見つかりません');
}
```

### バックエンド

#### 1. storage.goの修正
```go
// 修正前
serviceRoleClient := s.supabase.GetServiceRoleClient() // 存在しないメソッド
_, _, err = serviceRoleClient.Storage.From(bucket).Upload(...)

// 修正後
contentType := header.Header.Get("Content-Type")
if contentType == "" {
  contentType = "application/octet-stream"
}
_, err = s.supabase.UploadFile("", bucket, filePath, fileBytes, contentType)
```

```go
// 修正前
signedURL, err := anonClient.Storage.From(req.Bucket).CreateSignedUrl(...)

// 修正後
signedURL, err := s.supabase.GetSignedURL(req.Bucket, req.Path, req.ExpiresIn)
```

#### 2. routes.goの修正
```go
// 修正前
mux.HandleFunc("/api/products", server.HandleProducts)
mux.HandleFunc("/api/products/", server.HandleProductByID)

// 修正後
mux.HandleFunc("/api/products", server.HandleProductsRoute)
mux.HandleFunc("/api/products/", server.HandleProductByIDRoute)

// 新規追加
func (s *Server) HandleProductsRoute(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		auth(s.HandleProducts)(w, r)
	} else {
		s.HandleProducts(w, r)
	}
}

func (s *Server) HandleProductByIDRoute(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		s.HandleProductByID(w, r)
	} else {
		auth := middleware.AuthWithSupabase(s.config.SupabaseJWTSecret, s.supabase)
		auth(s.HandleProductByID)(w, r)
	}
}
```

## 修正後のエンドポイント一覧

### 認証不要（公開）
- GET `/health`
- POST `/api/auth/login`
- POST `/api/auth/register/step1`
- GET `/api/auth/session`
- POST `/api/auth/logout`
- GET `/api/posts`
- GET `/api/posts/:id`
- GET `/api/products`
- GET `/api/products/:id`
- GET `/api/users/:id`
- POST `/api/storage/signed-url`
- POST `/api/storage/signed-urls`

### 認証必要（保護）
- POST `/api/posts`
- PUT `/api/posts/:id`
- DELETE `/api/posts/:id`
- POST `/api/products`
- PUT `/api/products/:id`
- DELETE `/api/products/:id`
- POST `/api/storage/upload`
- GET/POST/PUT/DELETE `/api/messages/*`
- GET/POST/PUT/DELETE `/api/threads/*`
- POST/PUT/DELETE `/api/user-links`
- GET `/api/auth/profile`
- POST `/api/auth/profile`
- PUT `/api/auth/profile`
- POST `/api/auth/register/step2-5`

## テスト方法

### 1. 画像アップロードのテスト
1. ログイン
2. `/projects/new/transaction`にアクセス
3. フォームを入力して画像をアップロード
4. エラーが発生しないことを確認

### 2. 認証の確認
```bash
# ブラウザのコンソールで
document.cookie // auth_tokenが含まれていることを確認
```

### 3. APIリクエストの確認
1. DevToolsのNetworkタブを開く
2. 保護されたエンドポイントにリクエスト
3. Request HeadersにAuthorizationが含まれることを確認

## 今後の注意点

1. **新しいAPIリクエストは必ずapi-client.tsを使用**
   - 自動的にAuthorizationヘッダーが付与される

2. **Cookieからトークンを取得する場合はcookie-utils.tsを使用**
   - コードの重複を避ける

3. **新しいバックエンドエンドポイントは認証要件を明確に**
   - 公開: 認証ミドルウェアなし
   - 保護: `auth(handler)`でラップ
   - 条件付き: `HandleXXXRoute`パターンを使用

4. **AUTHENTICATION.mdを参照**
   - 認証アーキテクチャの詳細はAUTHENTICATION.mdに記載

## 影響範囲

### 破壊的変更
なし（後方互換性を維持）

### 非破壊的変更
- すべてのAPIリクエストに自動的にAuthorizationヘッダーが追加される
- 既存の機能は引き続き動作する

### セキュリティの改善
- 製品エンドポイントに認証が追加され、脆弱性が修正された
- 統一された認証方式により、セキュリティホールのリスクが減少

## チェックリスト

- [x] フロントエンドのすべてのfetch呼び出しを確認
- [x] バックエンドのすべてのエンドポイントの認証を確認
- [x] 共通ユーティリティの作成
- [x] ドキュメントの作成
- [ ] 画像アップロード機能のテスト
- [ ] すべての保護されたエンドポイントのテスト
