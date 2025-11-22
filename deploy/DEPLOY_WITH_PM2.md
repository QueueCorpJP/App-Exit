# PM2を使用したデプロイ手順

## 前提条件

- EC2インスタンスにSSHでアクセス可能
- PM2がインストール済み（未インストールの場合: `npm install -g pm2`）
- Nginxがインストール済み
- Rustがインストール済み（未インストールの場合は下記参照）

## 1. サーバーにログイン

```bash
ssh ec2-user@your-server-ip
```

## 2. Rustのインストール（未インストールの場合のみ）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# インストール確認
rustc --version
cargo --version
```

## 3. プロジェクトディレクトリの準備

```bash
# プロジェクトディレクトリに移動
cd /opt/appexit

# 最新コードを取得
git pull origin main

# または、ローカルからrsyncでアップロード
# rsync -avz --exclude 'node_modules' --exclude 'target' --exclude '.next' \
#   /path/to/local/appexit/ ec2-user@your-server:/opt/appexit/
```

## 4. Rust BFFのビルド

```bash
cd /opt/appexit/bff

# ログディレクトリを作成
mkdir -p logs

# リリースビルド
cargo build --release

# ビルド確認
ls -lh target/release/bff
```

## 5. フロントエンドの環境変数設定

```bash
cd /opt/appexit/frontend/appexit

# 本番環境用の .env.production ファイルを作成
cat > .env.production << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Backend API（Nginx経由）
NEXT_PUBLIC_API_URL=https://appexit.jp

# Rust BFF
# クライアントサイド: Nginx経由でアクセス
NEXT_PUBLIC_BFF_URL=https://appexit.jp

# サーバーサイド: 内部通信（高速）
BFF_INTERNAL_URL=http://localhost:8082

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EOF

# 権限設定
chmod 600 .env.production
```

## 6. フロントエンドのビルド

```bash
cd /opt/appexit/frontend/appexit

# 依存関係のインストール（初回または package.json 変更時）
npm install

# ログディレクトリを作成
mkdir -p logs

# プロダクションビルド（.env.productionが読み込まれる）
npm run build
```

## 7. バックエンドのビルド

```bash
cd /opt/appexit/backend

# ログディレクトリを作成
mkdir -p logs

# Goビルド
go build -o bin/api ./cmd/api

# ビルド確認
ls -lh bin/api
```

## 8. Nginx設定の更新（初回のみ）

```bash
# Nginx設定ファイルをバックアップ
sudo cp /etc/nginx/sites-available/appexit.conf /etc/nginx/sites-available/appexit.conf.backup

# 新しい設定をコピー
sudo cp /opt/appexit/deploy/nginx/appexit.conf /etc/nginx/sites-available/appexit.conf

# シンボリックリンクを作成（初回のみ）
sudo ln -sf /etc/nginx/sites-available/appexit.conf /etc/nginx/sites-enabled/

# 設定をテスト
sudo nginx -t

# Nginxをリロード
sudo systemctl reload nginx
```

## 9. PM2でサービス起動

### 初回起動

```bash
cd /opt/appexit/deploy

# PM2設定ファイルで全サービスを起動
pm2 start ecosystem.config.js

# 起動確認
pm2 status

# ログ確認
pm2 logs

# PM2をシステム起動時に自動起動するよう設定
pm2 startup
pm2 save
```

### 更新時の再起動

```bash
# 全サービスを再起動
pm2 restart all

# または個別に再起動
pm2 restart appexit-backend
pm2 restart appexit-frontend
pm2 restart appexit-bff
```

### コード更新時

```bash
cd /opt/appexit

# 最新コードを取得
git pull origin main

# BFFをリビルド
cd bff
cargo build --release

# フロントエンドをリビルド
cd ../frontend/appexit
npm run build

# バックエンドをリビルド
cd ../../backend
go build -o bin/api ./cmd/api

# PM2で全サービスを再起動
cd ..
pm2 restart all

# ステータス確認
pm2 status
```

## 10. 動作確認

```bash
# ローカルからBFFにアクセス
curl http://localhost:8082/bff/health

# 期待されるレスポンス:
# {"status":"ok","service":"rust-bff"}

# Nginx経由でアクセス
curl https://appexit.jp/bff/health

# 期待されるレスポンス:
# {"status":"ok","service":"rust-bff"}

# バックエンド確認
curl http://localhost:8080/api/health

# フロントエンド確認
curl http://localhost:3000
```

## 11. PM2管理コマンド

### ステータス確認

```bash
# 全サービスのステータス
pm2 status

# 詳細情報
pm2 show appexit-bff
```

### ログ確認

```bash
# 全サービスのログをリアルタイム表示
pm2 logs

# 特定サービスのログ
pm2 logs appexit-bff

# エラーログのみ
pm2 logs --err

# 最新100行を表示
pm2 logs --lines 100
```

### リソース監視

```bash
# リアルタイムモニタリング
pm2 monit

# メトリクス表示
pm2 describe appexit-bff
```

### サービス制御

```bash
# 停止
pm2 stop appexit-bff
pm2 stop all

# 再起動
pm2 restart appexit-bff
pm2 restart all

# 削除（設定から削除）
pm2 delete appexit-bff
pm2 delete all

# リロード（ダウンタイムなし）
pm2 reload appexit-bff
```

## トラブルシューティング

### BFFが起動しない

```bash
# PM2ステータス確認
pm2 status

# エラーログ確認
pm2 logs appexit-bff --err --lines 50

# 手動で起動してエラー確認
cd /opt/appexit/bff
./target/release/bff

# ポート使用状況確認
sudo netstat -tlnp | grep 8082
```

### Go APIに接続できない

```bash
# Go APIが稼働しているか確認
curl http://localhost:8080/api/health

# PM2ログ確認
pm2 logs appexit-backend --lines 50

# 環境変数確認
pm2 show appexit-bff
```

### メモリ不足

```bash
# メモリ使用量確認
pm2 list

# メモリ制限を変更（ecosystem.config.jsを編集）
# max_memory_restart: '1G' -> '2G'

# 設定をリロード
pm2 delete all
pm2 start ecosystem.config.js
```

### Nginxエラー

```bash
# Nginx設定テスト
sudo nginx -t

# エラーログ確認
sudo tail -f /var/log/nginx/appexit_error.log

# Nginxステータス確認
sudo systemctl status nginx
```

## 環境変数の変更

```bash
# ecosystem.config.jsを編集
nano /opt/appexit/deploy/ecosystem.config.js

# 変更後、PM2をリロード
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

## パフォーマンスモニタリング

### リアルタイム監視

```bash
# PM2のモニタリングツール
pm2 monit

# システムリソース確認
top
htop
```

### メトリクス

```bash
# CPU・メモリ使用量
pm2 status

# 詳細メトリクス
pm2 describe appexit-bff
```

## セキュリティ

### ファイアウォール設定

```bash
# 8082ポートは外部に公開しない（Nginx経由のみ）
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
# 8082は開けない（内部通信のみ）
```

### ログローテーション

PM2は自動的にログローテーションを行いますが、手動で設定することも可能：

```bash
# PM2のログローテーションモジュールをインストール
pm2 install pm2-logrotate

# 設定
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## バックアップ

```bash
# PM2設定を保存
pm2 save

# 設定ファイルのバックアップ
cp /opt/appexit/deploy/ecosystem.config.js ~/ecosystem.config.js.backup

# PM2設定の復元（必要時）
pm2 resurrect
```

## アンインストール

```bash
# PM2サービスを停止・削除
pm2 delete all

# PM2自動起動設定を削除
pm2 unstartup

# Nginxから設定を削除
sudo rm /etc/nginx/sites-enabled/appexit.conf
sudo nginx -t
sudo systemctl reload nginx
```

## まとめ

今回の修正で追加されたもの：

1. **Rust BFF** - ポート8082で並列API呼び出しを処理
2. **サーバーコンポーネント** - 初期データをサーバーサイドで取得
3. **認証ヘッダーのパススルー** - BFFがGoバックエンドに認証を転送

PM2による管理で：
- ✅ 自動再起動
- ✅ ログ管理
- ✅ リソースモニタリング
- ✅ ゼロダウンタイムデプロイ（pm2 reload）
