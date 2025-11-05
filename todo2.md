create table public.posts (
  id uuid not null default gen_random_uuid (),
  author_user_id uuid not null,
  author_org_id uuid null,
  type public.post_type not null,
  title text not null,
  body text null,
  price bigint null,
  secret_visibility public.secret_visibility null default 'full'::secret_visibility,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  eyecatch_url text null,
  dashboard_url text null,
  user_ui_url text null,
  performance_url text null,
  app_categories app_category_type[] null,
  service_urls text[] null,
  revenue_models revenue_model_type[] null,
  monthly_revenue bigint null,
  monthly_cost bigint null,
  appeal_text text null,
  tech_stack text[] null,
  user_count integer null,
  release_date date null,
  operation_form public.operation_form_type null,
  operation_effort text null,
  transfer_items transfer_item_type[] null,
  desired_transfer_timing text null,
  growth_potential text null,
  target_customers text null,
  marketing_channels marketing_channel_type[] null,
  media_mentions text null,
  extra_image_urls text[] null,
  monthly_profit bigint GENERATED ALWAYS as (
    (
      COALESCE(monthly_revenue, (0)::bigint) - COALESCE(monthly_cost, (0)::bigint)
    )
  ) STORED null,
  constraint posts_pkey primary key (id, type),
  constraint posts_author_org_id_fkey foreign KEY (author_org_id) references organizations (id),
  constraint posts_author_user_id_fkey foreign KEY (author_user_id) references auth.users (id) on delete RESTRICT,
  constraint posts_check check (
    (
      (type <> 'transaction'::post_type)
      or (price is not null)
    )
  ),
  constraint posts_transaction_required_fields check (
    (
      (type <> 'transaction'::post_type)
      or (
        (price is not null)
        and (app_categories is not null)
        and (cardinality(app_categories) > 0)
        and (monthly_revenue is not null)
        and (monthly_cost is not null)
        and (appeal_text is not null)
        and (length(appeal_text) >= 50)
        and (eyecatch_url is not null)
        and (dashboard_url is not null)
        and (user_ui_url is not null)
        and (performance_url is not null)
      )
    )
  )
)
partition by
  LIST (type);

create index IF not exists idx_posts_active_created on only public.posts using btree (is_active, created_at desc);

create index IF not exists idx_posts_author on only public.posts using btree (author_user_id);

create index IF not exists idx_posts_type_created on only public.posts using btree (type, created_at desc);