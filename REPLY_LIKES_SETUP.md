# コメント返信のいいね・バッド機能セットアップ手順

## 問題
/projects/new/board ページにてコメントの返信に対するいいね・バッド機能が動作していない

## 根本原因
データベースに `comment_reply_likes` と `comment_reply_dislikes` テーブルが存在しない

## 解決手順

### 1. Supabaseダッシュボードでテーブルを作成

Supabase Dashboard (https://app.supabase.com) にログインして、以下のSQLを実行してください:

```sql
-- backend/migrations/create_comment_reply_likes_tables.sql の内容を実行
```

または、SQL Editorで以下を実行:

1. Supabase Dashboard → SQL Editor を開く
2. `backend/migrations/create_comment_reply_likes_tables.sql` の内容を貼り付け
3. Run を実行

### 2. テーブルが作成されたか確認

以下のSQLで確認:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('comment_reply_likes', 'comment_reply_dislikes');
```

### 3. フロントエンド・バックエンドの再起動

#### バックエンド
```bash
cd backend
go run cmd/api/main.go
```

#### フロントエンド
```bash
cd frontend/appexit
npm run dev
```

### 4. 動作確認

1. /projects/new/board にアクセス
2. コメントを投稿
3. コメントに返信
4. 返信の下にいいね・バッドボタンが表示されることを確認
5. ボタンをクリックして動作確認

## 修正済みファイル

### バックエンド
- `internal/models/comment.go` - CommentReplyWithDetails に like/dislike フィールド追加
- `internal/handlers/comment.go` - 返信のいいね・バッドAPIハンドラ追加
- `internal/handlers/comment.go` - ListCommentReplies でいいね・バッドカウント取得

### フロントエンド
- `lib/api-client.ts` - CommentReplyWithDetails 型定義更新、API関数追加
- `components/pages/PostBoardPage.tsx` - UI追加、状態管理、ハンドラ実装

## トラブルシューティング

### エラー: "Failed to fetch"
- バックエンドが起動しているか確認
- CORS設定を確認

### エラー: "relation 'comment_reply_likes' does not exist"
- Supabaseでテーブルが作成されているか確認
- RLSポリシーが有効か確認

### いいね・バッドボタンが表示されない
- ブラウザのコンソールでエラーを確認
- フロントエンドのビルドエラーがないか確認: `npm run build`
