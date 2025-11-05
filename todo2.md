追加したい情報のマッピング

フォーム → カラム設計イメージ：

カテゴリ（SaaS/アプリ/Webサービス…）
→ app_categories app_category_type[]

サービスURL / LP / ストアリンク（複数）
→ service_urls text[]

希望売却価格（税抜）
→ 既存 price bigint を利用（type='transaction' のとき必須）

月間売上 / 月間コスト / 月間純利益（自動計算）
→ monthly_revenue bigint, monthly_cost bigint, monthly_profit bigint generated …

アピール文（紹介文）
→ appeal_text text（bodyは他用途として残す）

開発技術・スタック
→ tech_stack text[]

ユーザー数
→ user_count integer

リリース時期
→ release_date date

運営形態（個人/法人/チーム/外注）
→ operation_form operation_form_type

運営工数
→ operation_effort text

引き渡し範囲（ソースコード/ドメイン/SNS …）
→ transfer_items transfer_item_type[]

希望引き渡し時期
→ desired_transfer_timing text

成長余地・改善ポイント
→ growth_potential text

顧客層・ターゲット
→ target_customers text

主な集客チャネル（SEO / X / ストア検索…）
→ marketing_channels marketing_channel_type[]

メディア掲載・口コミ・受賞歴
→ media_mentions text

画像アップロード（必須 + 任意）
→ 既存 eyecatch_url / dashboard_url / user_ui_url / performance_url を必須にし、
任意の追加画像は extra_image_urls text[] に。

マイグレーション SQL（一式）

※ Supabase/Postgres なので、CREATE TYPE IF NOT EXISTS が使えないため
DO $$ ... $$ で存在チェック＋作成にしてあります。

1. Enum 型を作成
-- アプリ種別カテゴリ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_category_type'
  ) THEN
    CREATE TYPE public.app_category_type AS ENUM (
      'saas',          -- SaaS
      'app',           -- アプリ
      'web_service',   -- Webサービス
      'media',         -- メディア
      'tool',          -- ツール
      'other'          -- その他
    );
  END IF;
END$$;

-- 収益モデル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'revenue_model_type'
  ) THEN
    CREATE TYPE public.revenue_model_type AS ENUM (
      'subscription',  -- サブスクリプション
      'ads',           -- 広告
      'one_off',       -- 単発販売
      'affiliate',     -- アフィリエイト
      'other'          -- その他
    );
  END IF;
END$$;

-- 運営形態
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'operation_form_type'
  ) THEN
    CREATE TYPE public.operation_form_type AS ENUM (
      'individual',    -- 個人
      'corporation',   -- 法人
      'team',          -- チーム
      'outsourced'     -- 外注中心
    );
  END IF;
END$$;

-- 引き渡し範囲
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'transfer_item_type'
  ) THEN
    CREATE TYPE public.transfer_item_type AS ENUM (
      'source_code',   -- ソースコード
      'domain',        -- ドメイン
      'sns_account',   -- SNSアカウント
      'manual',        -- 運用マニュアル
      'ad_account',    -- 広告アカウント
      'other'          -- その他
    );
  END IF;
END$$;

-- 集客チャネル
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'marketing_channel_type'
  ) THEN
    CREATE TYPE public.marketing_channel_type AS ENUM (
      'seo',           -- SEO
      'x',             -- X (Twitter)
      'app_store',     -- アプリストア検索
      'other'          -- その他
    );
  END IF;
END$$;

2. posts テーブルにカラム追加

※ partitioned table なので、親テーブル public.posts に対してだけ ALTER TABLE すれば
全てのパーティションにカラムが伝搬します（子テーブル個別に ALTER しないこと）。

ALTER TABLE public.posts
  ADD COLUMN app_categories public.app_category_type[] NULL,         -- SaaS / アプリ / ...
  ADD COLUMN service_urls text[] NULL,                               -- LP / ストアリンクなど
  ADD COLUMN revenue_models public.revenue_model_type[] NULL,        -- サブスク / 広告 / ...
  ADD COLUMN monthly_revenue bigint NULL,                            -- 月間売上
  ADD COLUMN monthly_cost bigint NULL,                               -- 月間コスト
  ADD COLUMN appeal_text text NULL,                                  -- アピール文
  ADD COLUMN tech_stack text[] NULL,                                 -- 技術スタック
  ADD COLUMN user_count integer NULL,                                -- ユーザー数
  ADD COLUMN release_date date NULL,                                 -- リリース時期
  ADD COLUMN operation_form public.operation_form_type NULL,         -- 運営形態
  ADD COLUMN operation_effort text NULL,                             -- 運営工数
  ADD COLUMN transfer_items public.transfer_item_type[] NULL,        -- 引き渡し範囲
  ADD COLUMN desired_transfer_timing text NULL,                      -- 希望引き渡し時期
  ADD COLUMN growth_potential text NULL,                             -- 成長余地・改善ポイント
  ADD COLUMN target_customers text NULL,                             -- 顧客層・ターゲット
  ADD COLUMN marketing_channels public.marketing_channel_type[] NULL,-- 集客チャネル
  ADD COLUMN media_mentions text NULL,                               -- メディア掲載等
  ADD COLUMN extra_image_urls text[] NULL;                           -- 任意の追加画像（SNS・LPなど）

3. 月間純利益の自動計算カラム
ALTER TABLE public.posts
  ADD COLUMN monthly_profit bigint
    GENERATED ALWAYS AS (
      COALESCE(monthly_revenue, 0) - COALESCE(monthly_cost, 0)
    ) STORED;

4. 「アプリ売却（transaction）」用の必須チェック

すでに posts_check で
type = 'transaction' のとき price IS NOT NULL は担保されています。
ここに 追加で requirement を積む 形です。

ALTER TABLE public.posts
  ADD CONSTRAINT posts_transaction_required_fields
  CHECK (
    type <> 'transaction'::post_type
    OR (
      -- 価格
      price IS NOT NULL AND

      -- カテゴリ
      app_categories IS NOT NULL AND
      cardinality(app_categories) > 0 AND

      -- 売上・コスト（両方入っていれば自動で monthly_profit が出る）
      monthly_revenue IS NOT NULL AND
      monthly_cost IS NOT NULL AND

      -- アピール文
      appeal_text IS NOT NULL AND length(appeal_text) >= 50 AND

      -- 必須画像（アイキャッチ / 管理画面 / UI / 売上・トラフィック）
      eyecatch_url IS NOT NULL AND
      dashboard_url IS NOT NULL AND
      user_ui_url IS NOT NULL AND
      performance_url IS NOT NULL
    )
  );