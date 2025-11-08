# appexit.jp デプロイメントガイド

このガイドに従って、appexit.jpドメインでSSL対応のWebサイトをデプロイします。

## 前提条件

- EC2インスタンス(54.250.252.70)が稼働中
- セキュリティグループでポート80, 443が開放済み
- Go、Node.js、npmがインストール済み
- appexit.jpドメインを取得済み

## デプロイ手順

### 1. DNS設定

`DNS_SETUP.md` の手順に従って、DNSレコードを設定してください。

重要なポイント:
- **Aレコード**: `@` (ルートドメイン) → `54.250.252.70`
- **Aレコード**: `www` → `54.250.252.70`

DNS反映確認:
```bash
nslookup appexit.jp
# 54.250.252.70 が返ってくることを確認
```

### 2. プロジェクトファイルをEC2にアップロード

ローカルからEC2へファイルをアップロードします:

```bash
# ローカルマシンで実行
cd /path/to/appexit
rsync -avz --exclude 'node_modules' --exclude '.git' \
  . ec2-user@54.250.252.70:~/appexit/
```

または、Git経由でデプロイ:
```bash
# EC2で実行
cd ~
git clone <your-repo-url> appexit
cd appexit
```

### 3. 環境変数の設定

#### バックエンド (.env)

```bash
cd ~/appexit/backend
cp .env.example .env
nano .env
```

以下を設定:
```bash
# Server Configuration
PORT=8080
ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# CORS Configuration - HTTPSドメインを追加
ALLOWED_ORIGINS=https://appexit.jp,https://www.appexit.jp,http://localhost:3000
```

#### フロントエンド (.env.local)

```bash
cd ~/appexit/frontend/appexit
nano .env.local
```

以下を設定:
```bash
NEXT_PUBLIC_API_URL=https://appexit.jp/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. ログディレクトリの作成

```bash
mkdir -p ~/appexit/backend/logs
mkdir -p ~/appexit/frontend/appexit/logs
```

### 5. Nginx + SSL のセットアップ

**重要: DNSが反映されてから実行してください**

```bash
cd ~/appexit/deploy
sudo chmod +x setup-nginx-ssl.sh
sudo ./setup-nginx-ssl.sh
```

このスクリプトは以下を実行します:
1. Nginxのインストール
2. Certbot(Let's Encrypt)のインストール
3. SSL証明書の取得
4. Nginx設定ファイルの配置
5. 自動更新の設定

メールアドレスを求められたら、有効なメールアドレスを入力してください。

### 6. サービスの起動

```bash
cd ~/appexit/deploy
chmod +x start-services.sh stop-services.sh
./start-services.sh
```

このスクリプトは:
- バックエンド(Go)をポート8080で起動
- フロントエンド(Next.js)をポート3000で起動
- ログファイルにPIDを保存

### 7. 動作確認

#### サービスが起動しているか確認

```bash
# バックエンドの確認
curl http://localhost:8080/health

# フロントエンドの確認
curl http://localhost:3000

# Nginxの確認
sudo systemctl status nginx
```

#### ブラウザでアクセス

1. https://appexit.jp にアクセス
2. SSL証明書が有効か確認(ブラウザのアドレスバーに鍵マークが表示される)
3. フロントエンドが正常に表示されるか確認
4. APIエンドポイント https://appexit.jp/api が動作するか確認

#### ログの確認

```bash
# Nginxログ
sudo tail -f /var/log/nginx/appexit_access.log
sudo tail -f /var/log/nginx/appexit_error.log

# バックエンドログ
tail -f ~/appexit/backend/logs/backend.log

# フロントエンドログ
tail -f ~/appexit/frontend/appexit/logs/frontend.log
```

## サービス管理

### サービスの停止

```bash
cd ~/appexit/deploy
./stop-services.sh
```

### サービスの再起動

```bash
cd ~/appexit/deploy
./stop-services.sh
./start-services.sh
```

### Nginxの再起動

```bash
sudo systemctl restart nginx
```

## systemdサービス化(オプション)

本番環境では、systemdサービスとして登録することを推奨します。

### バックエンドサービス

```bash
sudo nano /etc/systemd/system/appexit-backend.service
```

```ini
[Unit]
Description=Appexit Backend API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/appexit/backend
ExecStart=/home/ec2-user/appexit/backend/bin/api
Restart=always
RestartSec=5
StandardOutput=append:/home/ec2-user/appexit/backend/logs/backend.log
StandardError=append:/home/ec2-user/appexit/backend/logs/backend.log

[Install]
WantedBy=multi-user.target
```

### フロントエンドサービス

```bash
sudo nano /etc/systemd/system/appexit-frontend.service
```

```ini
[Unit]
Description=Appexit Frontend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/appexit/frontend/appexit
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
StandardOutput=append:/home/ec2-user/appexit/frontend/appexit/logs/frontend.log
StandardError=append:/home/ec2-user/appexit/frontend/appexit/logs/frontend.log

[Install]
WantedBy=multi-user.target
```

### サービスの有効化と起動

```bash
sudo systemctl daemon-reload
sudo systemctl enable appexit-backend
sudo systemctl enable appexit-frontend
sudo systemctl start appexit-backend
sudo systemctl start appexit-frontend

# 状態確認
sudo systemctl status appexit-backend
sudo systemctl status appexit-frontend
```

## トラブルシューティング

### SSL証明書取得エラー

**エラー**: `Failed to obtain SSL certificate`

**原因と対処**:
1. DNS未反映: `nslookup appexit.jp` で確認。反映を待つ(最大48時間)
2. ポート80未開放: セキュリティグループを確認
3. Nginx未起動: `sudo systemctl status nginx` で確認

### 502 Bad Gateway

**原因**: バックエンドまたはフロントエンドが起動していない

**対処**:
```bash
# サービスの状態確認
lsof -i :8080  # バックエンド
lsof -i :3000  # フロントエンド

# 再起動
cd ~/appexit/deploy
./stop-services.sh
./start-services.sh
```

### CORS エラー

**原因**: バックエンドのALLOWED_ORIGINSが正しく設定されていない

**対処**:
```bash
# backend/.env を編集
ALLOWED_ORIGINS=https://appexit.jp,https://www.appexit.jp
```

サービスを再起動してください。

### SSL証明書の手動更新

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## セキュリティ推奨事項

1. **ファイアウォールの設定**: 不要なポートを閉じる
2. **定期的なアップデート**: `sudo apt update && sudo apt upgrade`
3. **ログのモニタリング**: 不審なアクセスを監視
4. **バックアップ**: データベースとコードの定期バックアップ
5. **環境変数の保護**: `.env` ファイルのパーミッション設定 `chmod 600 .env`

## 参考情報

- Nginx設定: `/etc/nginx/sites-available/appexit.conf`
- SSL証明書: `/etc/letsencrypt/live/appexit.jp/`
- Let's Encrypt更新: 自動(cron)で1日2回チェック
- 証明書有効期限: 90日(自動更新)

## サポート

問題が発生した場合は、以下を確認してください:
1. DNSが正しく設定されているか
2. セキュリティグループでポート80, 443が開放されているか
3. バックエンド・フロントエンドが起動しているか
4. ログファイルにエラーメッセージがないか
