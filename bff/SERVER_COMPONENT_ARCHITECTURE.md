# Server Component Architecture

## 概要

メッセージ機能を適切なNext.js Server Componentアーキテクチャに修正しました。

## 問題点

以前の実装では、すべてのコンポーネントが `'use client'` を使用しており、初期データの取得をクライアントサイドの `useEffect` で行っていました。これにより：

- サーバーサイドレンダリング（SSR）の利点が失われる
- BFFの利点が活かされない（クライアント側で実行される）
- 初期表示が遅くなる（クライアント側でデータ取得が必要）
- SEOに不利

## 修正内容

### 1. サーバーコンポーネントでの初期データ取得

**ファイル**: `app/[locale]/messages/[id]/page.tsx`

```typescript
export default async function Messages({ params }: PageProps) {
  // サーバーサイドでBFFからデータを取得
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  if (authToken?.value) {
    const bffUrl = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8082';
    const response = await fetch(
      `${bffUrl}/bff/thread-and-messages?thread_id=${id}&limit=50&offset=0`,
      {
        headers: {
          Authorization: `Bearer ${authToken.value}`,
        },
      }
    );

    if (response.ok) {
      initialData = await response.json();
    }
  }

  return <MessagePage threadId={id} initialData={initialData} />;
}
```

### 2. BFFへの認証ヘッダー対応

**ファイル**: `bff/src/main.rs`

```rust
async fn get_thread_and_messages(
    headers: HeaderMap,  // <- 追加
    Query(params): Query<ThreadAndMessagesQuery>,
) -> Result<Json<ThreadAndMessagesResponse>, StatusCode> {
    // 認証ヘッダーを取得
    let auth_header = headers.get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    // Go APIへのリクエストに認証ヘッダーを追加
    let mut thread_req = client.get(&thread_url);
    let mut messages_req = client.get(&messages_url);

    if !auth_header.is_empty() {
        thread_req = thread_req.header(header::AUTHORIZATION, auth_header);
        messages_req = messages_req.header(header::AUTHORIZATION, auth_header);
    }
}
```

### 3. クライアントコンポーネントでの初期データ利用

**ファイル**: `components/messages/MessageThreadContainer.tsx`

```typescript
function MessageThreadContainer({ threadId, onBack, initialData }: MessageThreadContainerProps) {
  useEffect(() => {
    const fetchThreadData = async () => {
      let data;

      // initialDataが利用可能な場合はそれを使用
      if (initialData && initialData.thread && initialData.thread.id === currentThreadId) {
        data = initialData;
      } else {
        // そうでなければBFFから取得
        const response = await fetch(`${bffUrl}/bff/thread-and-messages?...`);
        data = await response.json();
      }

      // データを処理...
    };
  }, [threadId, user, initialData]);
}
```

## アーキテクチャの利点

### サーバーコンポーネント

- **高速な初期表示**: サーバーで事前にデータを取得してHTMLに埋め込む
- **SEO対応**: 初期HTMLにコンテンツが含まれる
- **セキュア**: 認証トークンがクライアントに露出しない
- **小さいバンドルサイズ**: データ取得ロジックがクライアントバンドルに含まれない

### BFF (Backend for Frontend)

- **並列リクエスト**: Rust BFFがGo APIへの複数リクエストを並列実行
- **レイテンシ削減**: サーバー間通信は高速
- **認証の一元管理**: BFFが認証ヘッダーを適切にパススルー

### クライアントコンポーネント

- **インタラクティビティ**: メッセージ送信、リアルタイム更新など
- **フォールバック**: 初期データがない場合は自動的にBFFから取得
- **最適化**: 初期データがある場合は不要な再取得を回避

## データフロー

```
1. ユーザーがページアクセス
   ↓
2. Next.js Server Component (page.tsx)
   - Cookieから認証トークンを取得
   - BFFに認証ヘッダー付きでリクエスト
   ↓
3. Rust BFF (bff/src/main.rs)
   - 認証ヘッダーをパススルー
   - Go APIへ並列リクエスト（スレッド詳細 + メッセージ一覧）
   - 結果を統合してレスポンス
   ↓
4. Server Component
   - データをpropsとしてクライアントコンポーネントに渡す
   ↓
5. Client Component (MessageThreadContainer)
   - initialDataがあればそれを使用（追加リクエストなし）
   - なければBFFから取得（フォールバック）
   - インタラクティブ機能（メッセージ送信など）を提供
```

## パフォーマンス比較

### Before（クライアントサイド取得）

```
ページロード → Hydration → useEffect実行 → BFF呼び出し → データ表示
                                        ^^^^^^^^^^^^^^^^^^^^
                                        クライアント側で実行（遅い）
```

### After（サーバーサイド取得）

```
ページロード → データ既に含まれる → Hydration → インタラクティブ
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
サーバー側で実行（速い）
```

## 今後の拡張

同じパターンをプロフィールページや他のページにも適用可能：

1. `app/[locale]/profile/[id]/page.tsx` でサーバーサイド取得
2. `ProfilePage.tsx` に `initialData` propsを追加
3. `useEffect` で `initialData` があればそれを使用

## まとめ

この修正により：

- ✅ サーバーコンポーネントの利点を活用
- ✅ BFFによる並列処理を最大化
- ✅ 初期表示の高速化
- ✅ セキュアな認証処理
- ✅ クライアントバンドルサイズの削減
- ✅ SEO対応
