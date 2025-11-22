# Rust BFF セットアップガイド

このガイドでは、Rust BFFをフロントエンドと統合する手順を説明します。

## 1. Rust BFFのビルドと起動

### ビルド

```bash
cd bff
cargo build --release
```

### 環境変数の設定（オプション）

Go APIのURLを環境変数で指定できます：

```bash
export GO_API_URL=http://localhost:8081
```

デフォルトは `http://localhost:8081` です。

### 起動

```bash
./target/release/bff
```

または開発モードで：

```bash
cargo run
```

BFFは `http://0.0.0.0:8080` で起動します。

## 2. フロントエンドの環境変数設定

### .env.local を作成

`frontend/appexit/.env.local` ファイルを作成し、以下を追加：

```env
# Rust BFF URL
NEXT_PUBLIC_BFF_URL=http://localhost:8080
```

本番環境では `.env.production` に以下を設定：

```env
# Rust BFF URL (本番環境)
NEXT_PUBLIC_BFF_URL=https://appexit.jp
```

## 3. 動作確認

### BFFヘルスチェック

```bash
curl http://localhost:8080/bff/health
```

期待されるレスポンス：
```json
{
  "status": "ok",
  "service": "rust-bff"
}
```

### プロフィールと投稿の取得

```bash
curl "http://localhost:8080/bff/profile-and-posts?limit=3&offset=0"
```

### スレッドとメッセージの取得

```bash
curl "http://localhost:8080/bff/thread-and-messages?thread_id=THREAD_ID&limit=50&offset=0"
```

## 4. フロントエンドの起動

```bash
cd frontend/appexit
npm run dev
```

Next.jsアプリが `http://localhost:3000` で起動します。

## 5. 修正されたコンポーネント

以下のコンポーネントがBFFを使用するように修正されています：

### ✅ ProfilePage.tsx
- **Before**: `Promise.allSettled` で2つのAPIを並列呼び出し
- **After**: BFFの `/bff/profile-and-posts` エンドポイントを1回呼び出し

### ✅ ProfileViewPage.tsx
- **Before**: `Promise.allSettled` で2つのAPIを並列呼び出し
- **After**: BFFの `/bff/profile-and-posts` エンドポイントを1回呼び出し

### ✅ MessageThreadContainer.tsx
- **Before**: `Promise.all` で2つのAPIを並列呼び出し
- **After**: BFFの `/bff/thread-and-messages` エンドポイントを1回呼び出し

## 6. アーキテクチャ

```
┌─────────────┐
│  Next.js    │
│  Frontend   │
│   :3000     │
└──────┬──────┘
       │
       │ fetch()
       ▼
┌─────────────┐     tokio::join!     ┌─────────────┐
│  Rust BFF   │ ◄──────────────────► │   Go API    │
│   :8080     │                       │   :8081     │
└─────────────┘                       └─────────────┘
```

### データフロー

1. **フロントエンド** → BFFへ1回のリクエスト
2. **BFF** → Go APIへ複数リクエストを並列実行 (`tokio::join!`)
3. **BFF** → 結果を統合してフロントエンドへ返却
4. **フロントエンド** → 1つのレスポンスを処理

## 7. パフォーマンス比較

### Before (フロントエンド直接)

```
Frontend ─┬→ API 1 (100ms)
          └→ API 2 (100ms)

ネットワークラウンドトリップ: 2回
合計時間: ~100ms (並列実行)
```

### After (BFF経由)

```
Frontend → BFF → [API 1 (100ms) + API 2 (100ms)]
                  ↑ 並列実行

ネットワークラウンドトリップ: 1回
合計時間: ~100ms (BFF内で並列実行)
```

**メリット**:
- ネットワーク往復回数が半減
- フロントエンドのロジックがシンプルに
- BFF側で認証・キャッシュ・ログなどを一元管理可能

## 8. トラブルシューティング

### BFFに接続できない

```bash
# BFFが起動しているか確認
curl http://localhost:8080/bff/health
```

### Go APIに接続できない

BFFのログを確認：
```
❌ Failed to fetch profile: connection refused
```

Go APIが起動しているか確認：
```bash
curl http://localhost:8081/api/health
```

### CORS エラー

BFFのログに以下が表示される場合：
```
OPTIONS /bff/profile-and-posts
```

CORS設定は自動的に有効になっているため、通常は問題ありません。

### 環境変数が反映されない

Next.jsを再起動：
```bash
# フロントエンド
cd frontend/appexit
npm run dev
```

環境変数は `.env.local` に設定し、`NEXT_PUBLIC_` プレフィックスが必要です。

## 9. 本番デプロイ

### Nginx設定例

```nginx
# Rust BFF へのプロキシ
location /bff/ {
    proxy_pass http://localhost:8080/bff/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### systemd サービス例

```ini
[Unit]
Description=Rust BFF Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/bff
Environment="GO_API_URL=http://localhost:8081"
ExecStart=/path/to/bff/target/release/bff
Restart=always

[Install]
WantedBy=multi-user.target
```

起動：
```bash
sudo systemctl start rust-bff
sudo systemctl enable rust-bff
```

## 10. 今後の拡張

現在のBFFは基本的な並列API呼び出しのみを実装していますが、以下の拡張が可能です：

- [ ] 認証トークンの検証とパススルー
- [ ] Redisを使用したレスポンスキャッシュ
- [ ] レート制限（ユーザー/IPベース）
- [ ] メトリクス収集（Prometheus）
- [ ] 構造化ログ（JSON形式）
- [ ] GraphQL対応
- [ ] WebSocket対応

拡張のご要望があれば、issueを作成してください！
