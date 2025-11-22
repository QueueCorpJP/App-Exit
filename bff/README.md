# Rust BFF (Backend For Frontend)

このBFFは、Next.jsフロントエンドからのAPI呼び出しを集約し、Go APIへの並列リクエストを実行するためのRustサーバーです。

## 機能

- **並列API呼び出し**: `tokio::join!`を使用して複数のAPIリクエストを並列実行
- **CORS対応**: フロントエンドからのリクエストに対応
- **エラーハンドリング**: APIエラーを適切に処理し、部分的な成功にも対応
- **環境変数対応**: Go APIのベースURLを環境変数で設定可能
- **詳細なログ出力**: リクエストとレスポンスの状態を絵文字付きで表示

## エンドポイント

### GET /bff/health

ヘルスチェックエンドポイント

**レスポンス例:**
```json
{
  "status": "ok",
  "service": "rust-bff"
}
```

### GET /bff/profile-and-posts

プロフィールと投稿を並列で取得するエンドポイント

**使用箇所:**
- `ProfilePage.tsx` - 自分のプロフィールページ
- `ProfileViewPage.tsx` - 他ユーザーのプロフィールページ

**クエリパラメータ:**
- `user_id` (オプション): 特定のユーザーIDでプロフィールと投稿を取得
- `limit` (オプション): 投稿の取得件数 (デフォルト: 3)
- `offset` (オプション): 投稿のオフセット (デフォルト: 0)

**リクエスト例:**
```bash
# 自分のプロフィールと投稿を取得
curl "http://localhost:8080/bff/profile-and-posts?limit=10&offset=0"

# 特定ユーザーのプロフィールと投稿を取得
curl "http://localhost:8080/bff/profile-and-posts?user_id=USER_ID&limit=50"
```

**レスポンス例:**
```json
{
  "profile": {
    "id": "...",
    "display_name": "...",
    "icon_url": "...",
    ...
  },
  "posts": [
    {
      "id": "...",
      "title": "...",
      "type": "board",
      ...
    }
  ]
}
```

### GET /bff/thread-and-messages

メッセージスレッド詳細とメッセージ一覧を並列で取得するエンドポイント

**使用箇所:**
- `MessageThreadContainer.tsx` - メッセージスレッド表示

**クエリパラメータ:**
- `thread_id` (必須): スレッドID
- `limit` (オプション): メッセージの取得件数 (デフォルト: 50)
- `offset` (オプション): メッセージのオフセット (デフォルト: 0)

**リクエスト例:**
```bash
# スレッド詳細とメッセージ一覧を取得
curl "http://localhost:8080/bff/thread-and-messages?thread_id=THREAD_ID&limit=50&offset=0"
```

**レスポンス例:**
```json
{
  "thread": {
    "id": "...",
    "participants": [...],
    ...
  },
  "messages": [
    {
      "id": "...",
      "content": "...",
      "sender_id": "...",
      ...
    }
  ]
}
```

## セットアップ

### 1. ビルド

```bash
cargo build --release
```

### 2. 環境変数の設定

Go APIのベースURLを設定します（オプション）:

```bash
export GO_API_URL=http://localhost:8081
```

デフォルト値は `http://localhost:8081` です。

### 3. 起動

```bash
./target/release/bff
```

または開発モードで:

```bash
cargo run
```

サーバーは `http://0.0.0.0:8080` で起動します。

## フロントエンド側の利用例

### 1. プロフィールと投稿の並列取得

**Before（Promise.allSettled使用）**

```typescript
const [profileResult, postsResult] = await Promise.allSettled([
  profileApi.getProfile(),
  postApi.getPosts({
    author_user_id: currentUser.id,
    limit: 3,
    offset: 0
  })
]);

if (profileResult.status === 'fulfilled' && profileResult.value) {
  setProfile(profileResult.value);
}

if (postsResult.status === 'fulfilled') {
  const postsArray = Array.isArray(postsResult.value) ? postsResult.value : [];
  setPosts(postsArray);
}
```

**After（BFF経由）**

```typescript
const res = await fetch("http://localhost:8080/bff/profile-and-posts?limit=3&offset=0");
const data = await res.json();

if (data.profile) {
  setProfile(data.profile);
}

if (Array.isArray(data.posts)) {
  setPosts(data.posts);
}
```

### 2. スレッドとメッセージの並列取得

**Before（Promise.all使用）**

```typescript
const [detailResponse, messagesResponse] = await Promise.all([
  messageApi.getThread(currentThreadId),
  messageApi.getMessages(currentThreadId, { limit: 50, offset: 0 }),
]);

if (detailResponse && typeof detailResponse === 'object' && 'id' in detailResponse) {
  setThreadDetail(detailResponse);
}

let messages = [];
if (messagesResponse && Array.isArray(messagesResponse)) {
  messages = messagesResponse;
}
setMessages(messages);
```

**After（BFF経由）**

```typescript
const res = await fetch(`http://localhost:8080/bff/thread-and-messages?thread_id=${threadId}&limit=50&offset=0`);
const data = await res.json();

if (data.thread) {
  setThreadDetail(data.thread);
}

if (Array.isArray(data.messages)) {
  setMessages(data.messages);
}
```

## メリット

1. **フロントエンドのロジック削減**: 並列処理とエラーハンドリングをBFFに集約
2. **API呼び出しの1本化**: 複数のAPIコールを1つのエンドポイントに統合
3. **パフォーマンス向上**: Rustの高速な並列処理により、レスポンスタイムを短縮
4. **セキュリティ向上**: APIキーなどの機密情報をBFF側で管理可能
5. **拡張性**: 将来的にキャッシュや権限管理を追加しやすい

## 技術スタック

- **Rust**: 高速で安全な並列処理
- **Axum**: 非同期Webフレームワーク
- **Tokio**: 非同期ランタイム
- **Reqwest**: HTTPクライアント
- **tower-http**: CORS対応

## 開発

### ログの確認

BFFは実行時に以下のログを出力します:

```
📡 Go API URL: http://localhost:8081
✅ Rust BFF running on http://0.0.0.0:8080
🔍 Fetching profile from: http://localhost:8081/api/profile
🔍 Fetching posts from: http://localhost:8081/api/posts?limit=3&offset=0
✅ Profile fetched successfully
✅ Posts fetched successfully
```

エラーが発生した場合は `❌` マークで表示されます。

## BFF化済みのエンドポイント

✅ `/bff/profile-and-posts` - プロフィールと投稿の並列取得
✅ `/bff/thread-and-messages` - スレッドとメッセージの並列取得

## 今後の拡張予定

- [ ] 認証トークンの処理（Authorization ヘッダーのパススルー）
- [ ] レスポンスキャッシュ（Redis統合）
- [ ] レート制限（ユーザー/IPベース）
- [ ] メトリクス収集（Prometheus対応）
- [ ] より多くのエンドポイントの追加
- [ ] GraphQL対応
- [ ] WebSocketサポート
