# Rust BFF デプロイ手順

このガイドでは、本番環境にRust BFFをデプロイする手順を説明します。

## 前提条件

- EC2インスタンスにSSHでアクセス可能
- Nginxがインストール済み
- Go APIが8080ポートで稼働中
- 必要なパッケージ: `rust`, `cargo`, `git`

## デプロイ手順

### 1. サーバーにログイン

```bash
ssh ec2-user@your-server-ip
```

### 2. Rustのインストール（未インストールの場合）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 3. BFFコードのデプロイ

```bash
# デプロイディレクトリを作成
sudo mkdir -p /opt/appexit/bff
sudo chown $USER:$USER /opt/appexit/bff

# Gitからコードを取得（または rsync/scp でアップロード）
cd /opt/appexit/bff
git clone https://github.com/your-org/appexit.git .
# または: rsync -avz --exclude 'target' ./bff/ user@server:/opt/appexit/bff/

# リリースビルド
cd /opt/appexit/bff
cargo build --release
```

### 4. systemdサービスのセットアップ

```bash
# サービスファイルをコピー
sudo cp /opt/appexit/bff/deploy/rust-bff.service /etc/systemd/system/

# サービスファイルの権限を変更（必要に応じてパスを調整）
sudo sed -i 's|/opt/appexit/bff|'"$(pwd)"'|g' /etc/systemd/system/rust-bff.service

# systemdをリロード
sudo systemctl daemon-reload

# サービスを有効化
sudo systemctl enable rust-bff

# サービスを起動
sudo systemctl start rust-bff

# ステータス確認
sudo systemctl status rust-bff
```

### 5. Nginx設定の更新

```bash
# Nginx設定ファイルをバックアップ
sudo cp /etc/nginx/sites-available/appexit.conf /etc/nginx/sites-available/appexit.conf.backup

# 新しい設定をコピー
sudo cp /opt/appexit/bff/deploy/nginx/appexit.conf /etc/nginx/sites-available/appexit.conf

# 設定をテスト
sudo nginx -t

# Nginxをリロード
sudo systemctl reload nginx
```

### 6. 動作確認

```bash
# ローカルからBFFにアクセス
curl http://localhost:8082/bff/health

# 期待されるレスポンス:
# {"status":"ok","service":"rust-bff"}

# Nginx経由でアクセス
curl https://appexit.jp/bff/health

# 期待されるレスポンス:
# {"status":"ok","service":"rust-bff"}
```

### 7. ログの確認

```bash
# BFFのログを確認
sudo journalctl -u rust-bff -f

# Nginxのログを確認
sudo tail -f /var/log/nginx/appexit_access.log
sudo tail -f /var/log/nginx/appexit_error.log
```

## トラブルシューティング

### BFFが起動しない

```bash
# ステータス確認
sudo systemctl status rust-bff

# 詳細なログを確認
sudo journalctl -u rust-bff -n 100 --no-pager

# ポートが使用中か確認
sudo netstat -tlnp | grep 8082
```

### Go APIに接続できない

```bash
# Go APIが稼働しているか確認
curl http://localhost:8080/api/health

# BFFの環境変数を確認
sudo systemctl show rust-bff | grep Environment
```

### Nginxエラー

```bash
# Nginx設定テスト
sudo nginx -t

# エラーログを確認
sudo tail -f /var/log/nginx/appexit_error.log
```

## 更新手順

### コードの更新

```bash
# BFFディレクトリに移動
cd /opt/appexit/bff

# 最新コードを取得
git pull origin main

# リビルド
cargo build --release

# サービスを再起動
sudo systemctl restart rust-bff

# ステータス確認
sudo systemctl status rust-bff
```

### ゼロダウンタイム更新（推奨）

```bash
# 新しいバイナリをビルド
cd /opt/appexit/bff
cargo build --release

# バイナリを別名でコピー
sudo cp target/release/bff target/release/bff.new

# systemdサービスファイルを更新して新しいバイナリを使用
# （または既存のバイナリを上書き）
sudo mv target/release/bff.new target/release/bff

# サービスを再起動（systemdが自動的に再起動）
sudo systemctl restart rust-bff
```

## 環境変数の変更

```bash
# systemdサービスファイルを編集
sudo systemctl edit rust-bff

# または直接ファイルを編集
sudo nano /etc/systemd/system/rust-bff.service

# 変更後、リロードして再起動
sudo systemctl daemon-reload
sudo systemctl restart rust-bff
```

## パフォーマンスモニタリング

### CPU・メモリ使用量

```bash
# リアルタイム監視
top -p $(pgrep -f rust-bff)

# systemdのリソース使用量
systemctl status rust-bff
```

### リクエストログ

```bash
# BFFへのリクエストを確認
sudo journalctl -u rust-bff -f | grep "Fetching"

# 成功/失敗を確認
sudo journalctl -u rust-bff -f | grep -E "✅|❌"
```

## セキュリティ

### ファイアウォール設定

```bash
# 8082ポートは外部に公開しない（Nginx経由のみ）
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# 8082は開けない（内部通信のみ）
```

### ログローテーション

```bash
# journalのログサイズを制限
sudo journalctl --vacuum-size=500M
sudo journalctl --vacuum-time=30d
```

## アンインストール

```bash
# サービスを停止
sudo systemctl stop rust-bff
sudo systemctl disable rust-bff

# サービスファイルを削除
sudo rm /etc/systemd/system/rust-bff.service
sudo systemctl daemon-reload

# BFFディレクトリを削除
sudo rm -rf /opt/appexit/bff

# Nginx設定を元に戻す
sudo cp /etc/nginx/sites-available/appexit.conf.backup /etc/nginx/sites-available/appexit.conf
sudo nginx -t
sudo systemctl reload nginx
```

## サポート

問題が発生した場合は、以下の情報を含めてissueを作成してください：

- `sudo systemctl status rust-bff` の出力
- `sudo journalctl -u rust-bff -n 100 --no-pager` の出力
- Nginxのエラーログ
- サーバーのOS・バージョン情報
