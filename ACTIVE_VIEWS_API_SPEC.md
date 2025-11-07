# アクティブビュー機能 API仕様書

## 概要
プロダクトカードの目のアイコンの下にアクティブビュー数を表示する機能のバックエンドAPI仕様です。

## データベーステーブル

### `product_active_views` テーブル
プロダクトに対するアクティブビュー（ウォッチ）を記録するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|---------|---------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| post_id | UUID | NO | - | プロダクト（投稿）のID |
| user_id | UUID | NO | - | アクティブにしたユーザーのID |
| created_at | TIMESTAMPTZ | NO | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | now() | 更新日時 |

**制約:**
- UNIQUE(post_id, user_id) - 同じユーザーが同じプロダクトに対して複数回アクティブにできないようにする
- FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE

**インデックス:**
- idx_product_active_views_post_id ON post_id
- idx_product_active_views_user_id ON user_id

**RLS ポリシー:**
- SELECT: 全員がアクティブビューを閲覧可能
- INSERT: 認証済みユーザーは自分のアクティブビューを作成可能（auth.uid() = user_id）
- DELETE: 認証済みユーザーは自分のアクティブビューを削除可能（auth.uid() = user_id）

## 必要なAPIエンドポイント

### 1. プロダクト一覧取得時にアクティブビュー数を含める

**既存エンドポイント:** `GET /api/posts`

**変更内容:**
- レスポンスの各投稿に `active_view_count` フィールドを追加する
- このフィールドには、各投稿に対するアクティブビューの総数を含める

**実装例（SQL）:**
```sql
SELECT 
  p.*,
  COUNT(pav.id) as active_view_count
FROM posts_transaction p
LEFT JOIN product_active_views pav ON p.id = pav.post_id
GROUP BY p.id
```

**レスポンス例:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "タイトル",
      "price": 1000000,
      "active_view_count": 5,
      ...
    }
  ]
}
```

### 2. アクティブビューの追加

**エンドポイント:** `POST /api/posts/:post_id/active-views`

**認証:** 必須（Bearer Token）

**リクエスト:**
```json
{}
```

**レスポンス（成功 - 201 Created）:**
```json
{
  "success": true,
  "message": "アクティブビューを追加しました",
  "data": {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "created_at": "2025-11-06T10:00:00Z",
    "updated_at": "2025-11-06T10:00:00Z"
  }
}
```

**レスポンス（エラー - 409 Conflict）:**
```json
{
  "success": false,
  "error": "既にアクティブビューに追加されています"
}
```

**実装例（疑似コード）:**
```go
func CreateActiveView(c *gin.Context) {
    postID := c.Param("post_id")
    userID := c.GetString("user_id") // JWT トークンから取得
    
    // データベースに挿入（UNIQUE制約によりエラーが発生する可能性あり）
    activeView := ProductActiveView{
        PostID: postID,
        UserID: userID,
    }
    
    err := db.Create(&activeView).Error
    if err != nil {
        if isDuplicateKeyError(err) {
            c.JSON(409, gin.H{"success": false, "error": "既にアクティブビューに追加されています"})
            return
        }
        c.JSON(500, gin.H{"success": false, "error": "サーバーエラー"})
        return
    }
    
    c.JSON(201, gin.H{"success": true, "data": activeView})
}
```

### 3. アクティブビューの削除

**エンドポイント:** `DELETE /api/posts/:post_id/active-views`

**認証:** 必須（Bearer Token）

**リクエスト:**
```json
{}
```

**レスポンス（成功 - 200 OK）:**
```json
{
  "success": true,
  "message": "アクティブビューを削除しました"
}
```

**レスポンス（エラー - 404 Not Found）:**
```json
{
  "success": false,
  "error": "アクティブビューが見つかりません"
}
```

**実装例（疑似コード）:**
```go
func DeleteActiveView(c *gin.Context) {
    postID := c.Param("post_id")
    userID := c.GetString("user_id") // JWT トークンから取得
    
    // データベースから削除
    result := db.Where("post_id = ? AND user_id = ?", postID, userID).Delete(&ProductActiveView{})
    
    if result.Error != nil {
        c.JSON(500, gin.H{"success": false, "error": "サーバーエラー"})
        return
    }
    
    if result.RowsAffected == 0 {
        c.JSON(404, gin.H{"success": false, "error": "アクティブビューが見つかりません"})
        return
    }
    
    c.JSON(200, gin.H{"success": true, "message": "アクティブビューを削除しました"})
}
```

### 4. アクティブビュー状態の確認（オプション）

**エンドポイント:** `GET /api/posts/:post_id/active-views/status`

**認証:** 必須（Bearer Token）

**リクエスト:**
```json
{}
```

**レスポンス（成功 - 200 OK）:**
```json
{
  "success": true,
  "data": {
    "is_active": true
  }
}
```

**実装例（疑似コード）:**
```go
func GetActiveViewStatus(c *gin.Context) {
    postID := c.Param("post_id")
    userID := c.GetString("user_id") // JWT トークンから取得
    
    var count int64
    db.Model(&ProductActiveView{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count)
    
    c.JSON(200, gin.H{
        "success": true,
        "data": gin.H{
            "is_active": count > 0,
        },
    })
}
```

## フロントエンドの変更点

### 1. 型定義の更新
`frontend/appexit/lib/api-client.ts` の `Post` インターフェースに `active_view_count?: number` を追加済み

### 2. ProjectCard コンポーネント
- `activeViewCount` プロパティを追加済み
- 目のアイコンの下にアクティブビュー数を表示するように更新済み

### 3. TopPage コンポーネント
- `ProjectWithImage` インターフェースに `activeViewCount` を追加済み
- バックエンドから取得したデータを `ProjectCard` に渡すように更新済み

## 次のステップ

1. **バックエンド実装:**
   - Go バックエンドに上記の API エンドポイントを実装
   - データベースモデルの追加（`internal/models/product_active_view.go`）
   - ハンドラーの実装（`internal/handlers/active_view.go`）
   - ルートの追加（`internal/handlers/routes.go`）

2. **フロントエンド実装（完了）:**
   - ✅ Supabase に `product_active_views` テーブルを作成
   - ✅ API 型定義を更新
   - ✅ ProjectCard コンポーネントを更新
   - ✅ TopPage コンポーネントを更新

3. **テスト:**
   - API エンドポイントの動作確認
   - フロントエンドとバックエンドの連携確認
   - エラーハンドリングの確認

## 注意事項

- アクティブビューの追加・削除は認証が必須です
- 同じユーザーが同じプロダクトに複数回アクティブビューを追加することはできません（UNIQUE制約）
- RLS ポリシーにより、ユーザーは自分のアクティブビューのみ削除できます
- アクティブビュー数はプロダクト一覧取得時に自動的に集計されます

