# Backend Setup Guide

## 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Server Configuration
PORT=8080
ENV=development

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/appexit?sslmode=disable

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Supabase Configuration
SUPABASE_URL=https://zhurlwyfrbpbwemajvqk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXJsd3lmcmJwYndlbWFqdnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzE3NTMsImV4cCI6MjA3NzIwNzc1M30.76pVgQXHzXTkbGkPLhJKLkXpfYNYK6CicChr7D8G9ps
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

### Supabaseキーの取得方法

1. Supabaseダッシュボードにアクセス: https://supabase.com/dashboard/project/zhurlwyfrbpbwemajvqk/settings/api

2. **SERVICE_ROLE_KEY** を取得:
   - "Project API keys" セクションの "service_role" をコピー
   - ⚠️ **重要**: このキーは絶対に公開しないでください（GitHubにpushしない）

3. **JWT_SECRET** を取得:
   - 同じページの "JWT Settings" セクションから "JWT Secret" をコピー

4. `.env` ファイルに貼り付けます

## Supabase Storageのセットアップ

画像アップロード機能を使用するには、Supabase Storageバケットを作成する必要があります：

1. Supabaseダッシュボードにアクセス: https://supabase.com/dashboard/project/zhurlwyfrbpbwemajvqk/storage/buckets

2. **新しいバケットを作成**:
   - "Create a new bucket" をクリック
   - Name: `post-images`
   - Public bucket: **OFF** (プライベートバケット)
   - "Create bucket" をクリック

3. **RLSポリシーを設定** (オプション):
   - 認証済みユーザーのみがアップロード可能
   - すべてのユーザーが署名付きURLで読み取り可能

## 依存関係のインストール

```bash
go mod tidy
```

## サーバーの起動

```bash
go run cmd/api/main.go
```

サーバーが正常に起動すると、以下のように表示されます：
```
Server is running on port 8080
```

## API エンドポイント

### 認証

#### サインアップ
- **POST** `/api/auth/register`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "ユーザー名",
  "role": "buyer", // "buyer" または "seller"
  "party": "individual", // "individual" または "organization"
  "age": 25 // オプション
}
```

#### サインイン
- **POST** `/api/auth/login`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### レスポンス形式

成功時:
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "ユーザー名",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    "profile": {
      "id": "user_id",
      "role": "buyer",
      "party": "individual",
      "display_name": "ユーザー名",
      "age": 25,
      "nda_flag": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

エラー時:
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```


