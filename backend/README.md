# AppExit Backend

## セットアップ

### 1. 環境変数の設定

`env.example`をコピーして`.env`ファイルを作成し、実際の値を設定してください：

```bash
cp env.example .env
```

`.env`ファイルを編集して以下の値を設定：

```env
# Server Configuration
PORT=8080
ENV=development

# JWT Configuration (必須)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Supabase Configuration (必須)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Application Mode
SUPABASE_ONLY=true
```

### 2. 依存関係のインストール

```bash
go mod download
```

### 3. サーバーの起動

```bash
go run cmd/api/main.go
```

## 環境変数

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|-------------|------|
| `PORT` | ❌ | `8080` | サーバーのポート番号 |
| `ENV` | ❌ | `development` | 実行環境 |
| `JWT_SECRET` | ✅ | - | JWT署名用の秘密鍵 |
| `SUPABASE_URL` | ✅ | - | SupabaseプロジェクトのURL |
| `SUPABASE_ANON_KEY` | ✅ | - | Supabaseの匿名キー |
| `DATABASE_URL` | ❌ | - | 直接PostgreSQL接続用（オプション） |
| `SUPABASE_ONLY` | ❌ | `false` | Supabase-onlyモードで実行 |

## セキュリティ

- **絶対に** `.env` ファイルをGitにコミットしないでください
- JWT_SECRETは十分に長くランダムな文字列を使用してください
- 本番環境では適切な環境変数管理システムを使用してください