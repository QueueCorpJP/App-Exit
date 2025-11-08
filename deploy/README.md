# デプロイスクリプト

このディレクトリには、appexit.jpをAWS EC2にデプロイするためのスクリプトと設定ファイルが含まれています。

## ファイル一覧

### 設定ファイル

- `nginx/appexit.conf` - Nginx設定ファイル(リバースプロキシ、SSL設定)

### スクリプト

- `setup-nginx-ssl.sh` - Nginx + SSL(Let's Encrypt)の初期セットアップスクリプト
- `start-services.sh` - バックエンドとフロントエンドを起動
- `stop-services.sh` - バックエンドとフロントエンドを停止

## クイックスタート

### 1. DNS設定を完了させる

プロジェクトルートの `DNS_SETUP.md` を参照してDNS設定を行ってください。

### 2. EC2にファイルをアップロード

```bash
# ローカルマシンで実行
rsync -avz --exclude 'node_modules' --exclude '.git' \
  . ec2-user@54.250.252.70:~/appexit/
```

### 3. Nginx + SSL をセットアップ

```bash
# EC2インスタンスで実行
cd ~/appexit/deploy
sudo chmod +x setup-nginx-ssl.sh
sudo ./setup-nginx-ssl.sh
```

メールアドレスの入力を求められます。

### 4. 環境変数を設定

#### バックエンド
```bash
cd ~/appexit/backend
cp .env.example .env
nano .env  # 必要な値を設定
```

#### フロントエンド
```bash
cd ~/appexit/frontend/appexit
# .env.production は既に設定済み
# または .env.local を作成して設定
```

### 5. ログディレクトリを作成

```bash
mkdir -p ~/appexit/backend/logs
mkdir -p ~/appexit/frontend/appexit/logs
```

### 6. サービスを起動

```bash
cd ~/appexit/deploy
chmod +x start-services.sh stop-services.sh
./start-services.sh
```

### 7. 動作確認

```bash
# サービスの確認
curl http://localhost:8080/health
curl http://localhost:3000

# ブラウザでアクセス
# https://appexit.jp
```

## 詳細なガイド

より詳しい手順は、プロジェクトルートの `DEPLOYMENT_GUIDE.md` を参照してください。

## トラブルシューティング

### SSL証明書取得エラー

- DNSが反映されているか確認: `nslookup appexit.jp`
- セキュリティグループでポート80, 443が開放されているか確認

### 502 Bad Gateway

- バックエンド・フロントエンドが起動しているか確認
- ログを確認:
  ```bash
  sudo tail -f /var/log/nginx/appexit_error.log
  tail -f ~/appexit/backend/logs/backend.log
  tail -f ~/appexit/frontend/appexit/logs/frontend.log
  ```

### サービスが起動しない

- ポートが既に使用されていないか確認:
  ```bash
  lsof -i :8080
  lsof -i :3000
  ```

- 環境変数が正しく設定されているか確認

## サービスのアップグレード

### コードの更新

```bash
cd ~/appexit
git pull origin main  # または rsync で最新ファイルをアップロード

# サービス再起動
./deploy/stop-services.sh
./deploy/start-services.sh
```

### SSL証明書の手動更新

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## systemd サービス化

本番環境での運用には、systemdサービスとして登録することを推奨します。
詳細は `DEPLOYMENT_GUIDE.md` の「systemdサービス化」セクションを参照してください。
