const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  _isRetry?: boolean; // 内部フラグ：リトライ中かどうか
}

/**
 * API クライアント
 * Go バックエンドとの通信を担当（Cookie ベース認証）
 */
class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * リクエストヘッダーを構築
   * 認証はHttpOnly Cookieで自動送信されるため、Authorizationヘッダーは不要
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  /**
   * バックエンドトークンをリフレッシュ（Cookieベースのセッション管理）
   */
  private async refreshToken(): Promise<boolean> {
    // 既にリフレッシュ中の場合は、同じPromiseを返す（複数リクエストが同時に来た場合の対策）
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[API-CLIENT] Already refreshing token, waiting...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('[API-CLIENT] Refreshing backend token (Cookie-based)...');

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          // トークンリフレッシュは常に最新を取得
          cache: 'no-store',
        });

        if (response.ok) {
          console.log('[API-CLIENT] ✓ Token refreshed successfully');
          return true;
        } else if (response.status === 401) {
          const errorText = await response.text();
          console.error('[API-CLIENT] ❌ Refresh token expired (401):', errorText);
          
          if (typeof document !== 'undefined') {
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          
          return false;
        } else {
          const errorText = await response.text();
          console.error('[API-CLIENT] Failed to refresh token:', response.status, errorText);
          return false;
        }
      } catch (error) {
        console.error('[API-CLIENT] Error during token refresh:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * HTTP リクエストを送信
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, _isRetry, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    const headers = {
      ...this.getHeaders(),
      ...fetchOptions.headers,
    };

    console.log(`[API-CLIENT] ${fetchOptions.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
        // デフォルトのキャッシュ設定を使用（Next.jsが適切に処理）
        next: { revalidate: 60 }, // 60秒キャッシュ
      });

      if (response.status === 401 && !_isRetry) {
        const publicApiEndpoints = [
          '/api/posts',
          '/api/posts/',
          '/api/users/',
          '/api/storage/signed-url',
          '/api/storage/signed-urls',
        ];
        
        const isPublicApi = publicApiEndpoints.some(apiPath => 
          endpoint === apiPath || endpoint.startsWith(apiPath)
        );
        
        if (isPublicApi) {
          console.log('[API-CLIENT] 401 on public API endpoint, returning empty data');
          return [] as T;
        }
        
        console.log('[API-CLIENT] 401 Unauthorized, attempting token refresh...');

        const refreshed = await this.refreshToken();

        if (refreshed) {
          console.log('[API-CLIENT] Retrying request with refreshed token...');
          // リトライフラグを立てて再度リクエスト
          return this.request<T>(endpoint, { ...options, _isRetry: true });
        } else {
          console.error('[API-CLIENT] Token refresh failed');
          // 公開ページの場合はリダイレクトしない
          const publicPaths = [
            '/',
            '/login',
            '/register',
            '/reset-password',
            '/privacy',
            '/terms',
            '/tokusho',
            '/faq',
            '/contact',
            '/compliance',
            '/cookie-policy',
            '/security',
            '/report',
            '/customer-harassment',
            '/seminar',
            '/support-service',
            '/projects',  // プロダクト一覧（公開）
          ];
          
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isPublicPath = publicPaths.some(path => {
            if (path === '/') {
              return currentPath === '/';
            }
            // /projectsの場合は、/projects/newで始まるパスを除外
            if (path === '/projects') {
              return currentPath.startsWith('/projects') && !currentPath.startsWith('/projects/new');
            }
            return currentPath === path || currentPath.startsWith(path + '/');
          });
          
          // 公開ページでない場合のみログインページへリダイレクト
          if (typeof window !== 'undefined' && !isPublicPath) {
            console.log('[API-CLIENT] Redirecting to login (not a public page)');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          } else {
            console.log('[API-CLIENT] Skipping redirect (public page)');
          }
          
          // 公開ページの場合はエラーをスローしない
          if (isPublicPath) {
            console.log('[API-CLIENT] Returning empty data for public page');
            // getPostsの戻り値の型に合わせて空配列を返す
            return [] as T;
          }
        }
      }

      // エラーレスポンスの処理
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));

        console.error('[API-CLIENT] Request failed:', {
          url,
          status: response.status,
          error: errorData,
        });

        const error: any = new Error(errorData.error || errorData.message || 'リクエストに失敗しました');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // レスポンスボディが空の場合
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      const data = await response.json();

      // バックエンドのレスポンス形式 { success: true, data: ... } から data を取り出す
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return data.data as T;
      }

      return data;
    } catch (error) {
      console.error('[API-CLIENT] Request error:', error);
      throw error;
    }
  }

  // HTTP メソッド
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// シングルトンインスタンスをエクスポート
export const apiClient = new ApiClient(API_URL);

/**
 * Profile types
 */
export interface Profile {
  id: string;
  user_id: string;
  role: string;
  party: string;
  display_name: string;
  age?: number;
  icon_url?: string;
  stripe_customer_id?: string;
  stripe_account_id?: string;
  stripe_onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
  // その他のフィールド
  [key: string]: any;
}

/**
 * Profile API
 */
export const profileApi = {
  getProfile: () => apiClient.get<Profile>('/api/auth/profile'),
  getProfileById: (userId: string) => apiClient.get<Profile>(`/api/users/${userId}`),
  updateProfile: (data: Partial<Profile>) => apiClient.put<Profile>('/api/auth/profile', data),
};

/**
 * Post types
 */
export interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string;
  role: string;
  party: string;
}

export interface Post {
  id: string;
  author_user_id: string;
  author_org_id?: string;
  type: 'board' | 'transaction' | 'secret';
  title: string;
  body?: string;
  price?: number;
  secret_visibility?: 'full' | 'price_only' | 'hidden';
  is_active: boolean;
  subscribe?: boolean;
  created_at: string;
  updated_at: string;
  eyecatch_url?: string;
  dashboard_url?: string;
  user_ui_url?: string;
  performance_url?: string;
  app_categories?: string[];
  service_urls?: string[];
  revenue_models?: string[];
  monthly_revenue?: number;
  monthly_cost?: number;
  monthly_profit?: number;
  appeal_text?: string;
  tech_stack?: string[];
  user_count?: number;
  release_date?: string;
  operation_form?: string;
  operation_effort?: string;
  transfer_items?: string[];
  desired_transfer_timing?: string;
  growth_potential?: string;
  target_customers?: string;
  marketing_channels?: string[];
  media_mentions?: string;
  extra_image_urls?: string[];
  author_profile?: AuthorProfile;
  active_view_count?: number; // アクティブビュー数
  // その他のフィールド
  [key: string]: any;
}

/**
 * Post API
 */
export const postApi = {
  getPosts: (params?: { 
    type?: string; 
    author_user_id?: string; 
    limit?: number; 
    offset?: number;
    search_keyword?: string;
    categories?: string[];
    post_types?: string[];
    statuses?: string[];
    price_min?: number;
    price_max?: number;
    revenue_min?: number;
    revenue_max?: number;
    profit_margin_min?: number;
    tech_stacks?: string[];
    sort_by?: string;
  }) => {
    // Convert arrays to comma-separated strings
    const queryParams: Record<string, string | number> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              queryParams[key] = value.join(',');
            }
          } else {
            queryParams[key] = value;
          }
        }
      });
    }
    return apiClient.get<Post[]>('/api/posts', { params: queryParams });
  },
  createPost: (data: Partial<Post>) => apiClient.post<Post>('/api/posts', data),
  getPost: (id: string) => apiClient.get<Post>(`/api/posts/${id}`),
  updatePost: (id: string, data: Partial<Post>) => apiClient.put<Post>(`/api/posts/${id}`, data),
  deletePost: (id: string) => apiClient.delete<void>(`/api/posts/${id}`),
  getLikes: (postId: string) =>
    apiClient.get<{ post_id: string; like_count: number; is_liked: boolean }>(`/api/posts/${postId}/likes`),
  toggleLike: (postId: string) =>
    apiClient.post<{ like_count: number; is_liked: boolean }>(`/api/posts/${postId}/likes`, {}),
  getDislikes: (postId: string) =>
    apiClient.get<{ post_id: string; dislike_count: number; is_disliked: boolean }>(`/api/posts/${postId}/dislikes`),
  toggleDislike: (postId: string) =>
    apiClient.post<{ dislike_count: number; is_disliked: boolean }>(`/api/posts/${postId}/dislikes`, {}),
  getBatchMetadata: async (postIds: string[]) => {
    if (postIds.length === 0) return [];

    // Build query string with post_ids[] parameter
    const queryParams = new URLSearchParams();
    postIds.forEach(id => queryParams.append('post_ids[]', id));

    return apiClient.get<Array<{
      post_id: string;
      like_count: number;
      is_liked: boolean;
      dislike_count: number;
      is_disliked: boolean;
      comment_count: number;
    }>>(`/api/posts/metadata?${queryParams.toString()}`);
  },
};

/**
 * Comment types
 */
export interface PostCommentWithDetails {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  like_count: number;
  dislike_count?: number;
  reply_count: number;
  is_liked: boolean;
  is_disliked?: boolean;
  created_at: string;
  updated_at: string;
  author_profile?: {
    id: string;
    display_name: string;
    icon_url?: string;
  };
}

export interface CreateCommentRequest {
  content: string;
}

export interface ToggleLikeResponse {
  like_count: number;
  is_liked: boolean;
}

/**
 * Comment API
 */
export const commentApi = {
  getPostComments: (postId: string) =>
    apiClient.get<PostCommentWithDetails[]>(`/api/posts/${postId}/comments`),
  createComment: (postId: string, data: CreateCommentRequest) =>
    apiClient.post<PostCommentWithDetails>(`/api/posts/${postId}/comments`, data),
  toggleCommentLike: (commentId: string) =>
    apiClient.post<ToggleLikeResponse>(`/api/comments/${commentId}/likes`, {}),
  getCommentDislikes: (commentId: string) =>
    apiClient.get<{ comment_id: string; dislike_count: number; is_disliked: boolean }>(`/api/comments/${commentId}/dislikes`),
  toggleCommentDislike: (commentId: string) =>
    apiClient.post<{ dislike_count: number; is_disliked: boolean }>(`/api/comments/${commentId}/dislikes`, {}),
};

/**
 * Message types
 */
export interface ThreadDetail {
  id: string;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message?: {
    content: string;
    text?: string;
    created_at: string;
  };
  participants?: Array<{
    id: string;
    display_name: string;
    icon_url?: string;
  }>;
}

export type ThreadWithLastMessage = ThreadDetail;

export interface MessageWithSender {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_user_id: string;
  type: string;
  content: string;
  text?: string;
  image_url?: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    icon_url?: string;
  };
}

export interface SendMessageRequest {
  thread_id: string;
  type?: string;
  content?: string;
  text?: string;
  image_url?: string;
  file_url?: string;
  contract_type?: string;
}

export interface CreateThreadRequest {
  participant_ids: string[];
}

export interface UploadImageResponse {
  path: string;
}

/**
 * Message API
 */
export const messageApi = {
  getThreads: () =>
    apiClient.get<ThreadDetail[]>('/api/threads'),
  getThread: (threadId: string) =>
    apiClient.get<ThreadDetail>(`/api/threads/${threadId}`),
  createThread: (data: CreateThreadRequest) =>
    apiClient.post<ThreadDetail>('/api/threads', data),
  getMessages: (threadId: string) =>
    apiClient.get<MessageWithSender[]>('/api/messages', { params: { thread_id: threadId } }),
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<MessageWithSender>('/api/messages', data),
  uploadMessageImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    // FormData送信時はContent-Typeを自動設定させるため、手動で設定しない
    // HttpOnly Cookieで認証されるため、Authorizationヘッダーは不要
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const response = await fetch(`${API_URL}/api/messages/upload-image`, {
      method: 'POST',
      credentials: 'include', // HttpOnly Cookieを自動送信
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    // バックエンドのレスポンス形式 {success: true, data: {...}} をそのまま返す
    return result;
  },
  uploadContractDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('contract', file);

    // FormData送信時はContent-Typeを自動設定させるため、手動で設定しない
    // HttpOnly Cookieで認証されるため、Authorizationヘッダーは不要
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const response = await fetch(`${API_URL}/api/messages/upload-contract`, {
      method: 'POST',
      credentials: 'include', // HttpOnly Cookieを自動送信
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload contract');
    }

    const result = await response.json();
    // バックエンドのレスポンス形式 {success: true, data: {...}} をそのまま返す
    return result;
  },
};

/**
 * Active View types
 */
export interface ActiveViewResponse {
  success: boolean;
  message?: string;
  data?: any;
  active_view_count?: number; // 最新のカウント数
}

export interface ActiveViewStatusResponse {
  success: boolean;
  data: {
    is_active: boolean;
  };
}

/**
 * Active View API
 */
export const activeViewApi = {
  // アクティブビューを追加
  createActiveView: (postId: string) =>
    apiClient.post<ActiveViewResponse>(`/api/posts/${postId}/active-views`, {}),
  // アクティブビューを削除
  deleteActiveView: (postId: string) =>
    apiClient.delete<ActiveViewResponse>(`/api/posts/${postId}/active-views`),
  // アクティブビューの状態を取得
  getActiveViewStatus: (postId: string) =>
    apiClient.get<ActiveViewStatusResponse>(`/api/posts/${postId}/active-views/status`),
};

/**
 * Stripe types
 */
export interface StripeAccountStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  tosAcceptedAt?: string;
  tosAcceptedIp?: string;
}

export interface PayoutInfo {
  totalEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
}

export interface CreateStripeAccountRequest {
  tosAccepted: boolean;
  tosAcceptedIp?: string;
}

export interface CreateStripeAccountResponse {
  success: boolean;
  data?: {
    accountId: string;
    onboardingCompleted: boolean;
  };
  message?: string;
}

export interface StripeOnboardingLinkResponse {
  success: boolean;
  data?: {
    url: string;
  };
  message?: string;
}

/**
 * Stripe API
 * バックエンド実装後に使用されるAPI
 */
export const stripeApi = {
  // Stripeアカウント情報を取得
  getAccountStatus: () =>
    apiClient.get<{ success: boolean; data: StripeAccountStatus }>('/api/stripe/account-status'),
  
  // Stripeアカウントを作成
  createAccount: (data: CreateStripeAccountRequest) =>
    apiClient.post<CreateStripeAccountResponse>('/api/stripe/create-account', data),
  
  // Stripe本人確認フローのリンクを取得
  getOnboardingLink: () =>
    apiClient.post<StripeOnboardingLinkResponse>('/api/stripe/onboarding-link', {}),
  
  // 精算情報を取得
  getPayoutInfo: () =>
    apiClient.get<{ success: boolean; data: PayoutInfo }>('/api/stripe/payout-info'),
};
