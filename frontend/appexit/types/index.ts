// ユーザータイプ
export type UserType = 'buyer' | 'seller';
export type EntityType = 'company' | 'individual';

// ユーザープロフィール
export interface UserProfile {
  id: string;
  user_type: UserType;
  entity_type: EntityType;
  company_name?: string;
  display_name: string;
  age?: number;
  avatar_url?: string;
  nda_accepted: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  stripe_account_id?: string;
  created_at: Date;
  updated_at: Date;
}

// プロダクト投稿タイプ
export type PostType = 'board' | 'transaction' | 'secret';
export type AppStatus = 'active' | 'sold' | 'draft' | 'closed';

// プロダクト情報
export interface App {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  category?: string;
  tech_stack?: string[];
  price: number;
  monthly_revenue?: number;
  user_count?: number;
  demo_url?: string;
  images?: string[];
  post_type: PostType;
  is_secret: boolean;
  nda_required: boolean;
  status: AppStatus;
  created_at: Date;
  updated_at: Date;
  seller?: UserProfile;
}

// 掲示板投稿
export interface BoardPost {
  id: string;
  author_user_id: string;
  author_type: UserType;
  content: string;
  image_url?: string;
  budget?: number;
  created_at: Date;
  author?: UserProfile;
}

// DM会話
export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  app_id?: string;
  created_at: Date;
  buyer?: UserProfile;
  seller?: UserProfile;
  app?: App;
  last_message?: Message;
}

// メッセージタイプ
export type MessageType = 'text' | 'image' | 'contract';
export type ContractType = 'nda' | 'transfer' | 'terms';
export type ContractStatus = 'pending' | 'signed' | 'rejected';

// DMメッセージ
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  type: MessageType;
  image_url?: string;
  contract_type?: ContractType;
  contract_status?: ContractStatus;
  is_deleted: boolean;
  created_at: Date;
  sender?: UserProfile;
}

// NDA締結記録
export interface NdaAgreement {
  id: string;
  buyer_id: string;
  seller_id: string;
  app_id?: string;
  signed_at: Date;
  document_url?: string;
}

// 取引記録
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  app_id: string;
  amount: number;
  stripe_payment_intent_id?: string;
  status: TransactionStatus;
  created_at: Date;
  completed_at?: Date;
  buyer?: UserProfile;
  seller?: UserProfile;
  app?: App;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
