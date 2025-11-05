-- ENUM型を削除してtext/text[]に変更するSQL
-- Supabase SQL Editorで実行してください

-- postsテーブルのカラムをtext/text[]に変更
ALTER TABLE posts
  ALTER COLUMN app_categories TYPE text[] USING app_categories::text[],
  ALTER COLUMN revenue_models TYPE text[] USING revenue_models::text[],
  ALTER COLUMN transfer_items TYPE text[] USING transfer_items::text[],
  ALTER COLUMN marketing_channels TYPE text[] USING marketing_channels::text[],
  ALTER COLUMN operation_form TYPE text USING operation_form::text;

-- ENUM型を削除（もう使われていないので安全）
DROP TYPE IF EXISTS app_category_type CASCADE;
DROP TYPE IF EXISTS revenue_model_type CASCADE;
DROP TYPE IF EXISTS transfer_item_type CASCADE;
DROP TYPE IF EXISTS marketing_channel_type CASCADE;
DROP TYPE IF EXISTS operation_form_type CASCADE;
