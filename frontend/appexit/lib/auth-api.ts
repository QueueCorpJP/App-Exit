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

export type LoginMethod = 'email' | 'google' | 'github' | 'x';

export interface OAuthLoginRequest {
  method: LoginMethod;
  redirect_url?: string;
}

export interface OAuthLoginResponse {
  type: 'oauth';
  provider_url: string;
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
  roles?: string[];
  party: string;
  display_name: string;
  age?: number | null;
  icon_url?: string | null;
  nda_flag?: boolean;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_account_id?: string | null;
  stripe_onboarding_completed?: boolean | null;
  created_at?: string;
  updated_at?: string;
  listing_count?: number | null;
  service_categories?: string[] | null;
  desired_exit_timing?: string | null;
  investment_min?: number | null;
  investment_max?: number | null;
  target_categories?: string[] | null;
  operation_type?: string | null;
  desired_purchase_timing?: string | null;
  expertise?: string[] | null;
  portfolio_summary?: string | null;
  proposal_style?: string | null;
  prefecture?: string | null;
  company_name?: string | null;
  introduction?: string | null;
}

export interface CreateProfileRequest {
  role: 'buyer' | 'seller';
  party: 'individual' | 'organization';
  display_name: string;
  age?: number;
}

// Register時のレスポンス（認証情報のみ）
// セキュリティ: RefreshTokenはHttpOnly Cookieにのみ保存され、JSONレスポンスには含まれない
export interface AuthResponse {
  access_token: string;
  refresh_token?: never; // セキュリティ: フロントエンドに送信されない（HttpOnly Cookieのみ）
  user: User;
}

export interface LoginResponse {
  token: string;
  refresh_token?: never; // セキュリティ: フロントエンドに送信されない（HttpOnly Cookieのみ）
  user: User;
  profile: Profile | null; // プロフィール未作成時はnull
}

export type RegistrationMethod = 'email' | 'google' | 'github' | 'x';

export interface RegistrationStep1Request {
  method: RegistrationMethod;
  email?: string;
  password?: string;
  redirect_url?: string;
}

export interface RegistrationStep1Response {
  type: 'email' | 'oauth';
  auth?: AuthResponse;
  provider_url?: string;
  selected_method: RegistrationMethod;
}

export interface RegistrationStep2Request {
  roles: string[];
}

export interface RegistrationStep2Response {
  roles: string[];
}

export interface UserLinkInput {
  name: string;
  url: string;
}

export interface UserLink {
  id: string;
  user_id: string;
  name: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RegistrationStep3Request {
  display_name: string;
  party: 'individual' | 'organization';
  icon_url?: string;
  prefecture?: string;
  company_name?: string;
  introduction?: string;
  links?: UserLinkInput[];
  roles: string[];
}

export interface RegistrationStep3Response {
  roles: string[];
  profile: Profile;
}

export interface SellerProfileInput {
  listing_count?: number;
  service_categories?: string[];
  desired_exit_timing?: string;
}

export interface BuyerProfileInput {
  investment_min?: number;
  investment_max?: number;
  target_categories?: string[];
  operation_type?: string;
  desired_acquisition_timing?: string;
}

export interface AdvisorProfileInput {
  investment_min?: number;
  investment_max?: number;
  target_categories?: string[];
  desired_acquisition_timing?: string;
  expertise?: string[];
  portfolio_summary?: string;
  proposal_style?: string;
}

export interface RegistrationStep4Request {
  seller?: SellerProfileInput;
  buyer?: BuyerProfileInput;
  advisor?: AdvisorProfileInput;
}

export interface RegistrationStep5Request {
  nda_agreed: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

export interface RegistrationCompletionResponse {
  completed: boolean;
  roles: string[];
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
      credentials: 'include', // HTTPOnly Cookieを送受信するために必要
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

export async function registerStep1(data: RegistrationStep1Request): Promise<RegistrationStep1Response> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register/step1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '登録処理に失敗しました' }));
    throw new Error(error.error || error.message || '登録処理に失敗しました');
  }

  const result = await response.json();
  return result.data as RegistrationStep1Response;
}

export async function registerStep2(data: RegistrationStep2Request, token: string): Promise<RegistrationStep2Response> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register/step2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'ロール選択の保存に失敗しました' }));
    throw new Error(error.error || error.message || 'ロール選択の保存に失敗しました');
  }

  const result = await response.json();
  return result.data as RegistrationStep2Response;
}

export async function registerStep3(data: RegistrationStep3Request, token: string): Promise<RegistrationStep3Response> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register/step3`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '基本プロフィールの保存に失敗しました' }));
    throw new Error(error.error || error.message || '基本プロフィールの保存に失敗しました');
  }

  const result = await response.json();
  return result.data as RegistrationStep3Response;
}

export async function registerStep4(data: RegistrationStep4Request, token: string): Promise<Profile[]> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register/step4`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '追加情報の保存に失敗しました' }));
    throw new Error(error.error || error.message || '追加情報の保存に失敗しました');
  }

  const result = await response.json();
  return result.data as Profile[];
}

export async function registerStep5(data: RegistrationStep5Request, token: string): Promise<RegistrationCompletionResponse> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/register/step5`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '同意手続きに失敗しました' }));
    throw new Error(error.error || error.message || '同意手続きに失敗しました');
  }

  const result = await response.json();
  return result.data as RegistrationCompletionResponse;
}

/**
 * OAuthログインを開始
 */
export async function loginWithOAuth(data: OAuthLoginRequest): Promise<OAuthLoginResponse> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/auth/login/oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'OAuthログインの開始に失敗しました' }));
    throw new Error(error.error || error.message || 'OAuthログインの開始に失敗しました');
  }

  const result = await response.json();
  return result.data as OAuthLoginResponse;
}

/**
 * ユーザーのリンク一覧を取得
 */
export async function getUserLinks(userId: string): Promise<UserLink[]> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/user-links?user_id=${userId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'リンクの取得に失敗しました' }));
    throw new Error(error.error || error.message || 'リンクの取得に失敗しました');
  }

  const result = await response.json();
  return result.data as UserLink[];
}

/**
 * 新しいリンクを作成
 */
export async function createUserLink(data: UserLinkInput, token: string): Promise<UserLink> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/user-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'リンクの作成に失敗しました' }));
    throw new Error(error.error || error.message || 'リンクの作成に失敗しました');
  }

  const result = await response.json();
  return result.data as UserLink;
}

/**
 * リンクを更新
 */
export async function updateUserLink(linkId: string, data: UserLinkInput, token: string): Promise<UserLink> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/user-links?id=${linkId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'リンクの更新に失敗しました' }));
    throw new Error(error.error || error.message || 'リンクの更新に失敗しました');
  }

  const result = await response.json();
  return result.data as UserLink;
}

/**
 * リンクを削除
 */
export async function deleteUserLink(linkId: string, token: string): Promise<void> {
  const apiUrl = typeof window !== 'undefined' ? getApiUrlWithCache() : API_URL;
  const response = await fetch(`${apiUrl}/api/user-links?id=${linkId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'リンクの削除に失敗しました' }));
    throw new Error(error.error || error.message || 'リンクの削除に失敗しました');
  }
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
