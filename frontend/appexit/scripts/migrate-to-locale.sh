#!/bin/bash

# このスクリプトは、既存のappディレクトリの構造を[locale]配下に移動します
# 実行前にバックアップを取ってください

set -e

APP_DIR="app"
LOCALE_DIR="app/[locale]"

echo "Creating locale directory structure..."
mkdir -p "$LOCALE_DIR"

# 移動するファイル/ディレクトリのリスト
# layout.tsx と globals.css は除外（ルートに残す）
ITEMS_TO_MOVE=(
  "page.tsx"
  "not-found.tsx"
  "about"
  "checkout"
  "compliance"
  "contact"
  "cookie-policy"
  "customer-harassment"
  "debug-auth"
  "faq"
  "form"
  "help"
  "login"
  "messages"
  "nda"
  "onboarding"
  "payment"
  "privacy"
  "profile"
  "projects"
  "register"
  "report"
  "safety"
  "security"
  "seminar"
  "settings"
  "support-service"
  "terms"
  "tokusho"
  "transactions"
)

echo "Moving files to locale directory..."
for item in "${ITEMS_TO_MOVE[@]}"; do
  if [ -e "$APP_DIR/$item" ]; then
    echo "Moving $item..."
    mv "$APP_DIR/$item" "$LOCALE_DIR/"
  else
    echo "Warning: $item not found, skipping..."
  fi
done

echo "Migration complete!"
echo "Please update app/layout.tsx manually to be the root layout for i18n."
