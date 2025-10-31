# PM2デプロイガイド

このプロジェクトはPM2を使用してバックエンド（Go）とフロントエンド（Next.js）を管理します。

## 前提条件

### 必要なソフトウェア
- Node.js (v18以上)
- Go (v1.21以上)
- PM2

### PM2のインストール
```bash
npm install -g pm2
```

## ビルド手順

### バックエンドのビルド
```bash
cd backend
go build -o appexit-backend ./cmd/api
```

### フロントエンドのビルド
```bash
cd frontend/appexit
npm install
npm run build
```

## 環境変数の設定

### バックエンド (.env)
`backend/.env` ファイルを作成：
```bash
PORT=8080
ENV=production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# カンマ区切りで複数ドメイン指定可能
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### フロントエンド (.env.local)
`frontend/appexit/.env.local` ファイルを作成：
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## PM2コマンド

### アプリケーションの起動

#### すべて起動（本番環境）
```bash
pm2 start ecosystem.config.js --env production
```

#### すべて起動（開発環境）
```bash
pm2 start ecosystem.config.js --env development
```

#### バックエンドのみ起動
```bash
pm2 start ecosystem.config.js --only appexit-backend
```

#### フロントエンドのみ起動
```bash
pm2 start ecosystem.config.js --only appexit-frontend
```

### アプリケーションの管理

#### ステータス確認
```bash
pm2 status
# または詳細表示
pm2 list
```

#### ログの確認
```bash
# すべてのログ
pm2 logs

# バックエンドのログのみ
pm2 logs appexit-backend

# フロントエンドのログのみ
pm2 logs appexit-frontend

# リアルタイムで監視
pm2 logs --lines 100
```

#### アプリケーションの再起動
```bash
# すべて再起動
pm2 restart all

# バックエンドのみ
pm2 restart appexit-backend

# フロントエンドのみ
pm2 restart appexit-frontend

# ダウンタイムなしで再起動（reload）
pm2 reload all
```

#### アプリケーションの停止
```bash
# すべて停止
pm2 stop all

# バックエンドのみ
pm2 stop appexit-backend

# フロントエンドのみ
pm2 stop appexit-frontend
```

#### アプリケーションの削除
```bash
# すべて削除
pm2 delete all

# バックエンドのみ
pm2 delete appexit-backend
```

### モニタリング

#### リアルタイムモニター
```bash
pm2 monit
```

#### Webダッシュボード（PM2 Plus）
```bash
pm2 web
```

### プロセスの永続化

#### 起動時に自動起動
```bash
# 現在のPM2プロセスリストを保存
pm2 save

# スタートアップスクリプトを生成
pm2 startup

# 表示されたコマンドを実行（sudoが必要な場合あり）
```

#### 保存したプロセスの復元
```bash
pm2 resurrect
```

## デプロイ

### 本番環境へのデプロイ
```bash
# 初回セットアップ
pm2 deploy ecosystem.config.js production setup

# デプロイ実行
pm2 deploy ecosystem.config.js production
```

### ステージング環境へのデプロイ
```bash
pm2 deploy ecosystem.config.js staging setup
pm2 deploy ecosystem.config.js staging
```

## トラブルシューティング

### アプリケーションが起動しない場合

1. **バックエンドのビルド確認**
   ```bash
   cd backend
   ./appexit-backend
   ```

2. **フロントエンドのビルド確認**
   ```bash
   cd frontend/appexit
   npm start
   ```

3. **環境変数の確認**
   ```bash
   pm2 env <app-id>
   ```

4. **ログの確認**
   ```bash
   pm2 logs --err
   ```

### メモリ不足の場合
```bash
# max_memory_restartの値を変更
pm2 restart appexit-frontend --max-memory-restart 2G
```

### ポートが使用中の場合
```bash
# プロセスを確認
lsof -i :8080
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

## ログファイル

ログは以下のディレクトリに保存されます：
- バックエンド: `logs/backend-*.log`
- フロントエンド: `logs/frontend-*.log`

## パフォーマンス最適化

### クラスタモード（フロントエンド）
```javascript
// ecosystem.config.jsで設定
instances: 'max',  // CPUコア数分起動
exec_mode: 'cluster',
```

### メモリ制限
```javascript
max_memory_restart: '1G',  // 1GBを超えたら再起動
```

## セキュリティ

### 環境変数の管理
- `.env` ファイルはGitに含めない
- 本番環境では環境変数を直接設定するか、PM2のエコシステムファイルで管理

### アクセス制限
- CORS設定で許可するドメインを制限
- ファイアウォールでポートを制限

## 参考リンク

- [PM2公式ドキュメント](https://pm2.keymetrics.io/docs/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)
- [PM2 Deploy](https://pm2.keymetrics.io/docs/usage/deployment/)
