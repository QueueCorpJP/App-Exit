#!/bin/bash

echo "=== フォント (5.2MB) ==="
du -sh .next/static/media
ls -lh .next/static/media/ | wc -l
echo "フォントファイル数"

echo ""
echo "=== サーバーサイドチャンク (トップ10) ==="
find .next/server/chunks/ssr -name "*.js" -type f -exec du -h {} \; | sort -hr | head -10

echo ""
echo "=== クライアントサイドチャンク (トップ10) ==="
find .next/static/chunks -name "*.js" -type f -exec du -h {} \; | sort -hr | head -10

echo ""
echo "=== 総サイズ ==="
echo "Server: $(du -sh .next/server | cut -f1)"
echo "Static: $(du -sh .next/static | cut -f1)"
echo "Total: $(du -sh .next | cut -f1)"

