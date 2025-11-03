/**
 * API URLの取得
 * 優先順位:
 * 1. 環境変数 NEXT_PUBLIC_API_URL (推奨)
 * 2. ブラウザ環境の場合、現在のホストから推測 (本番環境用)
 * 3. デフォルト: http://localhost:8080 (開発環境用)
 */
function getApiUrl(): string {
  // 環境変数が設定されている場合はそれを使用（ビルド時に埋め込まれる）
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // ブラウザ環境の場合、現在のホストから推測
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    
    // 本番環境（localhost以外）の場合、同じホストのポート8080を使用
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${protocol}//${host}:8080`;
    }
  }

  // デフォルト（開発環境）
  return 'http://localhost:8080';
}

// API URLを取得する関数（クライアントサイドで動的に決定）
let cachedApiUrl: string | null = null;

function getApiUrlWithCache(): string {
  if (cachedApiUrl === null) {
    cachedApiUrl = getApiUrl();
  }
  return cachedApiUrl;
}

// デフォルト値（SSR時や初期化時用）
const API_URL = typeof window !== 'undefined' ? getApiUrl() : 'http://localhost:8080';

// 開発環境での警告
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[auth-api] NEXT_PUBLIC_API_URLが設定されていません。', {
      currentApiUrl: API_URL,
      note: '環境変数を設定することで、明示的にAPI URLを指定できます。',
    });
  } else {
    console.log('[auth-api] API URL:', API_URL);
  }
}

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
  // クライアントサイドで動的にAPI URLを取得
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const url = `${apiUrl}/api/auth/login`;
  
  // デバッグ用ログ（本番環境では出力されない）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[auth-api] Login request to:', url);
  }

  try {
    const response = await fetch(url, {
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
  } catch (error) {
    // ネットワークエラーの場合、より詳細な情報を提供
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('[auth-api] API接続エラー:', {
        url,
        error: 'APIサーバーに接続できません。環境変数NEXT_PUBLIC_API_URLを確認してください。',
        currentApiUrl: apiUrl,
      });
    }
    throw error;
  }
}

/**
 * バックエンドAPIにサインアップリクエストを送信
 */
export async function registerWithBackend(data: RegisterRequest): Promise<AuthResponse> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register`, {
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
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/profile`, {
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
