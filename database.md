-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_01 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_01_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_02 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_02_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_03 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_03_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_04 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_04_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_05 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_05_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_06 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_06_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_07 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_07_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_08 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_08_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_09 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_09_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_10 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_10_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_11 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_11_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.audit_logs_2025_12 (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  table_name text NOT NULL,
  row_id uuid,
  action text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  diff jsonb,
  CONSTRAINT audit_logs_2025_12_pkey PRIMARY KEY (id, occurred_at)
);
CREATE TABLE public.comment_likes (
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (comment_id, user_id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comments(id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.comment_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_replies_pkey PRIMARY KEY (id),
  CONSTRAINT comment_replies_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comments(id),
  CONSTRAINT comment_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contract_checks (
  item_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::contract_check_status,
  checked_at timestamp with time zone,
  CONSTRAINT contract_checks_pkey PRIMARY KEY (item_id, user_id),
  CONSTRAINT contract_checks_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.contract_items(id),
  CONSTRAINT contract_checks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contract_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  label text NOT NULL,
  required boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contract_items_pkey PRIMARY KEY (id),
  CONSTRAINT contract_items_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id)
);
CREATE TABLE public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'text'::message_type,
  text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id),
  CONSTRAINT messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.nda_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_org_id uuid,
  buyer_user_id uuid,
  seller_org_id uuid,
  seller_user_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'requested'::nda_status,
  signed_at timestamp with time zone,
  doc_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nda_agreements_pkey PRIMARY KEY (id),
  CONSTRAINT nda_agreements_buyer_org_id_fkey FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id),
  CONSTRAINT nda_agreements_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id),
  CONSTRAINT nda_agreements_seller_org_id_fkey FOREIGN KEY (seller_org_id) REFERENCES public.organizations(id),
  CONSTRAINT nda_agreements_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL CHECK (buyer_user_id IS NOT NULL),
  buyer_org_id uuid,
  seller_user_id uuid,
  seller_org_id uuid,
  post_id uuid NOT NULL,
  amount bigint NOT NULL,
  currency text NOT NULL DEFAULT 'jpy'::text,
  payment_status USER-DEFINED NOT NULL DEFAULT 'none'::payment_status,
  all_contract_items_checked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_buyer_org_id_fkey FOREIGN KEY (buyer_org_id) REFERENCES public.organizations(id),
  CONSTRAINT orders_seller_user_id_fkey FOREIGN KEY (seller_user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_seller_org_id_fkey FOREIGN KEY (seller_org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.org_memberships (
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_in_org text DEFAULT 'member'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_memberships_pkey PRIMARY KEY (org_id, user_id),
  CONSTRAINT org_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT org_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  legal_name text NOT NULL,
  nda_status USER-DEFINED NOT NULL DEFAULT 'none'::nda_status,
  stripe_account_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.post_details (
  post_id uuid NOT NULL,
  app_name text,
  app_category text,
  monthly_revenue bigint,
  monthly_profit bigint,
  mau bigint,
  dau bigint,
  store_url text,
  tech_stack text,
  notes text,
  CONSTRAINT post_details_pkey PRIMARY KEY (post_id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  author_org_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  cover_image_url text,
  budget_min bigint,
  budget_max bigint,
  price bigint,
  secret_visibility USER-DEFINED DEFAULT 'full'::secret_visibility,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id, type),
  CONSTRAINT posts_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id),
  CONSTRAINT posts_author_org_id_fkey FOREIGN KEY (author_org_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.posts_board (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  author_org_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  cover_image_url text,
  budget_min bigint,
  budget_max bigint,
  price bigint,
  secret_visibility USER-DEFINED DEFAULT 'full'::secret_visibility,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT posts_board_pkey PRIMARY KEY (id, type),
  CONSTRAINT posts_author_org_id_fkey FOREIGN KEY (author_org_id) REFERENCES public.organizations(id),
  CONSTRAINT posts_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.posts_secret (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  author_org_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  cover_image_url text,
  budget_min bigint,
  budget_max bigint,
  price bigint,
  secret_visibility USER-DEFINED DEFAULT 'full'::secret_visibility,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT posts_secret_pkey PRIMARY KEY (id, type),
  CONSTRAINT posts_author_org_id_fkey FOREIGN KEY (author_org_id) REFERENCES public.organizations(id),
  CONSTRAINT posts_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.posts_transaction (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_user_id uuid NOT NULL,
  author_org_id uuid,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  body text,
  cover_image_url text,
  budget_min bigint,
  budget_max bigint,
  price bigint,
  secret_visibility USER-DEFINED DEFAULT 'full'::secret_visibility,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT posts_transaction_pkey PRIMARY KEY (id, type),
  CONSTRAINT posts_author_org_id_fkey FOREIGN KEY (author_org_id) REFERENCES public.organizations(id),
  CONSTRAINT posts_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  party USER-DEFINED NOT NULL,
  display_name text NOT NULL,
  icon_url text,
  nda_flag boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  listing_count integer,
  service_categories ARRAY,
  desired_exit_timing text,
  investment_min integer,
  investment_max integer,
  target_categories ARRAY,
  operation_type text,
  expertise ARRAY,
  portfolio_summary text,
  proposal_style text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id, role),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles_advisor (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  party USER-DEFINED NOT NULL,
  display_name text NOT NULL,
  icon_url text,
  nda_flag boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  listing_count integer,
  service_categories ARRAY,
  desired_exit_timing text,
  investment_min integer,
  investment_max integer,
  target_categories ARRAY,
  operation_type text,
  expertise ARRAY,
  portfolio_summary text,
  proposal_style text,
  CONSTRAINT profiles_advisor_pkey PRIMARY KEY (id, role),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles_buyer (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  party USER-DEFINED NOT NULL,
  display_name text NOT NULL,
  icon_url text,
  nda_flag boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  listing_count integer,
  service_categories ARRAY,
  desired_exit_timing text,
  investment_min integer,
  investment_max integer,
  target_categories ARRAY,
  operation_type text,
  expertise ARRAY,
  portfolio_summary text,
  proposal_style text,
  CONSTRAINT profiles_buyer_pkey PRIMARY KEY (id, role),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles_seller (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  party USER-DEFINED NOT NULL,
  display_name text NOT NULL,
  icon_url text,
  nda_flag boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  listing_count integer,
  service_categories ARRAY,
  desired_exit_timing text,
  investment_min integer,
  investment_max integer,
  target_categories ARRAY,
  operation_type text,
  expertise ARRAY,
  portfolio_summary text,
  proposal_style text,
  CONSTRAINT profiles_seller_pkey PRIMARY KEY (id, role),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.stripe_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  payment_intent_id text NOT NULL,
  client_secret text,
  status USER-DEFINED NOT NULL DEFAULT 'processing'::payment_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stripe_payments_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.thread_participants (
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT thread_participants_pkey PRIMARY KEY (thread_id, user_id),
  CONSTRAINT thread_participants_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id),
  CONSTRAINT thread_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  related_post_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT threads_pkey PRIMARY KEY (id),
  CONSTRAINT threads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);