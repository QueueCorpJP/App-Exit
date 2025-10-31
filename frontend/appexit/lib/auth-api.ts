const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LoginRequest {
  email: string;
  password: string;
}

// Register時は認証情報のみ
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id?: string;
  role: string;
  party: string;
  display_name: string;
  age?: number | null;
  icon_url?: string | null;
  nda_flag?: boolean;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  stripe_customer_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileRequest {
  role: 'buyer' | 'seller';
  party: 'individual' | 'organization';
  display_name: string;
  age?: number;
}

// Register時のレスポンス（認証情報のみ）
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
  profile: Profile | null; // プロフィール未作成時はnull
}

/**
 * バックエンドAPIにログインリクエストを送信
 */
export async function loginWithBackend(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'ログインに失敗しました' }));
    throw new Error(error.error || error.message || 'ログインに失敗しました');
  }

  const result = await response.json();
  return result.data;
}

/**
 * バックエンドAPIにサインアップリクエストを送信
 */
export async function registerWithBackend(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'アカウント作成に失敗しました' }));
    
    // レート制限エラーの場合（現在は使用されないが、念のため残す）
    if (response.status === 429) {
      throw new Error('リクエストが多すぎます。しばらく時間をおいてから再度お試しください。');
    }
    
    // 既存ユーザーエラーの場合
    if (response.status === 409) {
      throw new Error('このメールアドレスは既に登録されています。ログインページからサインインしてください。');
    }
    
    throw new Error(error.error || error.message || 'アカウント作成に失敗しました');
  }

  const result = await response.json();
  return result.data;
}

/**
 * プロフィールを作成
 */
export async function createProfile(data: CreateProfileRequest, token: string): Promise<Profile> {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'プロフィール作成に失敗しました' }));
    throw new Error(error.error || error.message || 'プロフィール作成に失敗しました');
  }

  const result = await response.json();
  return result.data;
}
