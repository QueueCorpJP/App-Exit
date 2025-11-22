/**
 * ユーザー関連の型定義
 */

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

// プロフィール情報（APIレスポンス用）
export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  icon_url?: string;
  company_name?: string;
  company_address?: string;
  phone_number?: string;
  role: string;
  party: string;
  public?: boolean;
  created_at: string;
  updated_at: string;
}

// 著者プロフィール（投稿やコメントに添付される簡易プロフィール）
export interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string;
  role: string;
  party: string;
}
