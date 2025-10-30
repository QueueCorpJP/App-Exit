# クイックスタートガイド

このガイドでは、AppExitプロジェクトを最速でセットアップして起動する方法を説明します。

## 前提条件

- Node.js 18以上
- Go 1.21以上
- Supabaseアカウント

## 1. Supabaseの設定

### 1.1 APIキーを取得

1. https://supabase.com/dashboard/project/zhurlwyfrbpbwemajvqk/settings/api にアクセス

2. 以下のキーをコピーしてメモ帳などに保存:
   - `anon` key (public)
   - `service_role` key (**秘密キー - 公開しないこと**)
   - `JWT Secret`

### 1.2 Storageバケットを作成

1. https://supabase.com/dashboard/project/zhurlwyfrbpbwemajvqk/storage/buckets にアクセス

2. "Create a new bucket" をクリック:
   - Name: `post-images`
   - Public bucket: **OFF**
   - "Create bucket" をクリック

## 2. バックエンドのセットアップ

```bash
cd backend

# .envファイルを編集
# 以下の値をSupabaseダッシュボードから取得したキーに置き換えます:
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_JWT_SECRET

# 依存関係をインストール
go mod tidy

# サーバーを起動
go run cmd/api/main.go
```

✅ `Server is running on port 8080` と表示されれば成功です！

## 3. フロントエンドのセットアップ

新しいターミナルを開いて:

```bash
cd frontend/appexit

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

✅ http://localhost:3000 にアクセスできれば成功です！

## 4. 動作確認

1. ブラウザで http://localhost:3000 を開く
2. 「新規登録」からアカウントを作成
3. ログイン後、「アプリ投稿」から新しいアプリを投稿
4. 画像をアップロードして投稿完了

## トラブルシューティング

### バックエンドが起動しない

**エラー**: `SUPABASE_SERVICE_ROLE_KEY is required`

**解決方法**: `backend/.env` ファイルに正しいキーを設定してください。

### 画像がアップロードできない

**原因**: Storageバケットが作成されていない

**解決方法**: 上記の手順1.2を実行してください。

### フロントエンドからAPIに接続できない

**確認事項**:
- バックエンドサーバーが起動しているか (ポート8080)
- `frontend/appexit/.env.local` に正しいAPI URLが設定されているか

## 次のステップ

- [バックエンド詳細ドキュメント](./backend/SETUP.md)
- [認証フロー](./認証修正まとめ.md)
- [データベース設計](./backend/database.md)
