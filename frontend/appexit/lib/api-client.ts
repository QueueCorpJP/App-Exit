import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * API クライアント
 * Go バックエンドとの通信を担当
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * トークンの有効期限をチェック
   */
  private isTokenExpired(expiresAt: number | undefined): boolean {
    if (!expiresAt) return false;
    // 有効期限の5分前から期限切れとみなす（マージンを持たせる）
    const margin = 5 * 60 * 1000; // 5分（ミリ秒）
    const now = Date.now();
    return expiresAt * 1000 - margin < now;
  }

  /**
   * 認証トークンを取得（Supabaseセッションから）
   *
   * 統一戦略: Supabaseセッション（LocalStorage）を唯一の真実の源とする
   * - HttpOnly Cookieは使用しない（JavaScriptから読めないため）
   * - Supabase SDKが自動トークンリフレッシュを提供
   * - トークンが期限切れの場合は自動的にリフレッシュを試みる
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (!session) {
        console.log('[API-CLIENT] No active Supabase session');
        return null;
      }

      const token = session.access_token;
      const expiresAt = session.expires_at;

      // トークンの有効期限をチェック
      if (this.isTokenExpired(expiresAt)) {
        console.log('[API-CLIENT] Token expired or expiring soon, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          console.error('[API-CLIENT] Failed to refresh expired token');
          return null;
        }
        // リフレッシュ後、新しいセッションを取得
        const { data: refreshedData } = await supabase.auth.getSession();
        return refreshedData.session?.access_token || null;
      }

      if (token) {
        console.log('[API-CLIENT] Token found in Supabase session:', {
          length: token.length,
          segments: token.split('.').length,
          first50: token.substring(0, 50),
          expiresAt: expiresAt,
          expiresIn: expiresAt ? `${Math.floor((expiresAt * 1000 - Date.now()) / 1000 / 60)}分` : 'unknown'
        });
      }

      return token;
    } catch (error) {
      console.error('[API-CLIENT] Error getting token:', error);
      return null;
    }
  }

  /**
   * リクエストヘッダーを構築
   */
  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[API-CLIENT] Authorization header set', {
        tokenLength: token.length,
        tokenFirst50: token.substring(0, 50),
        headerValue: `Bearer ${token.substring(0, 30)}...`
      });
    } else {
      console.log('[API-CLIENT] No Authorization header (no token)');
    }

    return headers;
  }

  /**
   * トークンをリフレッシュ
   * @returns リフレッシュ後のトークン（失敗時はnull）
   */
  private async refreshToken(): Promise<string | null> {
    try {
      console.log('[API-CLIENT] Refreshing token via Supabase...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('[API-CLIENT] Token refresh failed:', error);
        
        // リフレッシュに失敗した場合、セッションが無効になった可能性がある
        // ユーザーにログアウトを促すために、セッションをクリア
        if (error?.message?.includes('refresh_token_not_found') || 
            error?.message?.includes('invalid_grant') ||
            error?.message?.includes('session_not_found')) {
          console.log('[API-CLIENT] Session is invalid, clearing session...');
          await supabase.auth.signOut();
        }
        
        return null;
      }
      
      console.log('[API-CLIENT] Token refreshed successfully', {
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_at ? `${Math.floor((data.session.expires_at * 1000 - Date.now()) / 1000 / 60)}分` : 'unknown'
      });
      
      // リフレッシュ後のトークンを直接返す
      return data.session.access_token;
    } catch (error) {
      console.error('[API-CLIENT] Error refreshing token:', error);
      return null;
    }
  }

  /**
   * クエリパラメータを構築
   */
  private buildQueryString(params?: Record<string, string | number | boolean>): string {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      query.append(key, String(value));
    });
    return `?${query.toString()}`;
  }

  /**
   * GET リクエスト
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const queryString = this.buildQueryString(options?.params);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    const headers = await this.getHeaders();

    console.log('[API-CLIENT] Making GET request:', {
      url,
      headers: {
        ...headers,
        Authorization: (headers as Record<string, string>)['Authorization'] ? `${((headers as Record<string, string>)['Authorization']).substring(0, 30)}...` : 'NOT SET'
      }
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        ...options,
      });

      // 401エラーの場合、トークンをリフレッシュして再試行
      if (response.status === 401) {
        console.log('[API-CLIENT] 401 error detected, attempting token refresh...');
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
          // リフレッシュ後のトークンを直接使用してリトライ
          const newHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedToken}`,
          };
          console.log('[API-CLIENT] Retrying request with refreshed token...', {
            url,
            tokenLength: refreshedToken.length,
            tokenFirst50: refreshedToken.substring(0, 50)
          });
          const retryResponse = await fetch(url, {
            method: 'GET',
            headers: newHeaders,
            ...options,
          });
          console.log('[API-CLIENT] Retry response status:', retryResponse.status);
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || retryResponse.statusText };
            }
            // リトライ後も401エラーの場合、セッションが無効になったことを示す
            if (retryResponse.status === 401) {
              console.error('[API-CLIENT] Retry failed with 401 - session expired');
              const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
              (error as any).code = 'SESSION_EXPIRED';
              throw error;
            }
            throw new Error(errorData.error || `API Error: ${retryResponse.statusText}`);
          }
          console.log('[API-CLIENT] Retry successful');
          return retryResponse.json();
        } else {
          // リフレッシュに失敗した場合、セッションが無効になったことを示す
          console.error('[API-CLIENT] Token refresh failed - session expired');
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || response.statusText };
          }
          const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
          // カスタムプロパティでエラーを識別できるようにする
          (error as any).code = 'SESSION_EXPIRED';
          throw error;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }

        // 404エラー（Not Found）の場合はログレベルを下げる（正常なフローの一部の可能性がある）
        if (response.status === 404) {
          console.log('[API-CLIENT] Resource not found:', errorText);
          const errorMessage = (typeof errorData === 'string' ? errorData : errorData?.error) || 'リソースが見つかりません';
          const error = new Error(errorMessage);
          (error as any).status = 404;
          throw error;
        } else {
          console.error('[API-CLIENT] Error response:', errorText);
        }

        // 503エラー（Service Unavailable）の場合は特別なメッセージを返す
        if (response.status === 503) {
          const error = new Error(errorData.error || 'サービスが一時的に利用できません。データベース接続を確認してください。');
          (error as any).status = 503;
          throw error;
        }

        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // 404エラーは正常なフローの一部の可能性があるため、ログレベルを下げる
      if (error?.status === 404) {
        // 404エラーは既にthrowする前にログ出力済みなので、ここでは再スローのみ
        throw error;
      }
      console.error('[API-CLIENT] Network error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }

  /**
   * POST リクエスト
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    console.log('[API-CLIENT] POST request:', {
      url,
      headers: Object.fromEntries(Object.entries(headers)),
      hasAuthHeader: 'Authorization' in headers
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options,
      });

      console.log('[API-CLIENT] Response:', {
        status: response.status,
        statusText: response.statusText
      });

      // 401エラーの場合、トークンをリフレッシュして再試行
      if (response.status === 401) {
        console.log('[API-CLIENT] 401 error detected, attempting token refresh...');
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
          // リフレッシュ後のトークンを直接使用してリトライ
          const newHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedToken}`,
          };
          console.log('[API-CLIENT] Retrying request with refreshed token...');
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: newHeaders,
            body: JSON.stringify(data),
            ...options,
          });
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || retryResponse.statusText };
            }
            throw new Error(errorData.error || `API Error: ${retryResponse.statusText}`);
          }
          return retryResponse.json();
        } else {
          // リフレッシュに失敗した場合、セッションが無効になったことを示す
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || response.statusText };
          }
          const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
          (error as any).code = 'SESSION_EXPIRED';
          throw error;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }

        // 404エラー（Not Found）の場合はログレベルを下げる（正常なフローの一部の可能性がある）
        if (response.status === 404) {
          console.log('[API-CLIENT] Resource not found:', errorText);
        } else {
          console.error('[API-CLIENT] Error response:', errorText);
        }

        // 503エラー（Service Unavailable）の場合は特別なメッセージを返す
        if (response.status === 503) {
          const error = new Error(errorData.error || 'サービスが一時的に利用できません。データベース接続を確認してください。');
          (error as any).status = 503;
          throw error;
        }

        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('[API-CLIENT] Network error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }

  /**
   * PUT リクエスト
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options,
      });

      // 401エラーの場合、トークンをリフレッシュして再試行
      if (response.status === 401) {
        console.log('[API-CLIENT] 401 error detected, attempting token refresh...');
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
          // リフレッシュ後のトークンを直接使用してリトライ
          const newHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedToken}`,
          };
          console.log('[API-CLIENT] Retrying request with refreshed token...');
          const retryResponse = await fetch(url, {
            method: 'PUT',
            headers: newHeaders,
            body: JSON.stringify(data),
            ...options,
          });
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || retryResponse.statusText };
            }
            throw new Error(errorData.error || `API Error: ${retryResponse.statusText}`);
          }
          return retryResponse.json();
        } else {
          // リフレッシュに失敗した場合、セッションが無効になったことを示す
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || response.statusText };
          }
          const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
          (error as any).code = 'SESSION_EXPIRED';
          throw error;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }

        // 404エラー（Not Found）の場合はログレベルを下げる（正常なフローの一部の可能性がある）
        if (response.status === 404) {
          console.log('[API-CLIENT] Resource not found:', errorText);
        } else {
          console.error('[API-CLIENT] Error response:', errorText);
        }

        // 503エラー（Service Unavailable）の場合は特別なメッセージを返す
        if (response.status === 503) {
          const error = new Error(errorData.error || 'サービスが一時的に利用できません。データベース接続を確認してください。');
          (error as any).status = 503;
          throw error;
        }

        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('[API-CLIENT] Network error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }

  /**
   * DELETE リクエスト
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        ...options,
      });

      // 401エラーの場合、トークンをリフレッシュして再試行
      if (response.status === 401) {
        console.log('[API-CLIENT] 401 error detected, attempting token refresh...');
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
          // リフレッシュ後のトークンを直接使用してリトライ
          const newHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedToken}`,
          };
          console.log('[API-CLIENT] Retrying request with refreshed token...');
          const retryResponse = await fetch(url, {
            method: 'DELETE',
            headers: newHeaders,
            ...options,
          });
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || retryResponse.statusText };
            }
            throw new Error(errorData.error || `API Error: ${retryResponse.statusText}`);
          }
          return retryResponse.json();
        } else {
          // リフレッシュに失敗した場合、セッションが無効になったことを示す
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || response.statusText };
          }
          const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
          (error as any).code = 'SESSION_EXPIRED';
          throw error;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }

        // 404エラー（Not Found）の場合はログレベルを下げる（正常なフローの一部の可能性がある）
        if (response.status === 404) {
          console.log('[API-CLIENT] Resource not found:', errorText);
        } else {
          console.error('[API-CLIENT] Error response:', errorText);
        }

        // 503エラー（Service Unavailable）の場合は特別なメッセージを返す
        if (response.status === 503) {
          const error = new Error(errorData.error || 'サービスが一時的に利用できません。データベース接続を確認してください。');
          (error as any).status = 503;
          throw error;
        }

        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('[API-CLIENT] Network error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('バックエンドサーバーに接続できません。サーバーが起動していることを確認してください。');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_URL);

// API エンドポイント定義
export const API_ENDPOINTS = {
  // User
  ME: '/api/v1/users/me',
  USER: (id: string) => `/api/users/${id}`,

  // Apps
  APPS: '/api/v1/apps',
  APP: (id: string) => `/api/v1/apps/${id}`,

  // Boards
  BOARDS: '/api/v1/boards',
  BOARD: (id: string) => `/api/v1/boards/${id}`,

  // Conversations
  CONVERSATIONS: '/api/v1/conversations',
  CONVERSATION_MESSAGES: (conversationId: string) => `/api/v1/conversations/${conversationId}/messages`,

  // NDA
  NDA_REQUEST: '/api/v1/nda/request',
  NDA_SIGN: '/api/v1/nda/sign',

  // Payments
  CHECKOUT: '/api/v1/payments/checkout',
  PAYMENT_HISTORY: '/api/v1/payments/history',

  // Posts
  POSTS: '/api/posts',
  POST: (id: string) => `/api/posts/${id}`,

  // Profile
  PROFILE: '/api/auth/profile',

  // Messages & Threads
  THREADS: '/api/threads',
  THREAD: (id: string) => `/api/threads/${id}`,
  MESSAGES: '/api/messages',
  MESSAGES_UPLOAD_IMAGE: '/api/messages/upload-image',

  // Comments
  POST_COMMENTS: (postId: string) => `/api/posts/${postId}/comments`,
  COMMENT: (id: string) => `/api/comments/${id}`,
  COMMENT_REPLIES: (commentId: string) => `/api/comments/${commentId}/replies`,
  REPLY: (id: string) => `/api/replies/${id}`,
  COMMENT_LIKES: (commentId: string) => `/api/comments/${commentId}/likes`,
} as const;

// Profile types
export interface Profile {
  id: string;
  role: 'buyer' | 'seller';
  party: 'individual' | 'organization';
  display_name: string;
  age?: number | null;
  icon_url?: string | null;
  nda_flag: boolean;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  age?: number;
  icon_url?: string;
}

// Post types
export interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string | null;
  role: string;
  party: string;
}

export interface Post {
  id: string;
  author_user_id: string;
  author_org_id: string | null;
  type: 'board' | 'transaction' | 'secret';
  title: string;
  body: string | null;
  cover_image_url: string | null;
  budget_min: number | null;
  budget_max: number | null;
  price: number | null;
  secret_visibility: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author_profile?: AuthorProfile | null;
}

export interface PostDetail {
  id: string;
  post_id: string;
  app_name: string | null;
  app_category: string | null;
  monthly_revenue: number | null;
  monthly_profit: number | null;
  mau: number | null;
  dau: number | null;
  store_url: string | null;
  tech_stack: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithDetails {
  Post: Post;
  Details: PostDetail | null;
  AuthorProfile?: AuthorProfile | null;
}

// Post API methods
export const postApi = {
  /**
   * Get all posts
   */
  async getPosts(params?: { type?: string; author_user_id?: string; limit?: number; offset?: number }): Promise<Post[]> {
    const response = await apiClient.get<{ success: boolean; data: Post[] } | Post[]>(API_ENDPOINTS.POSTS, { params });
    // response.Success形式に対応（直接配列の場合も対応）
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      const posts = response.data || [];
      console.log('[POST-API] Received posts:', posts.length, posts);
      return posts;
    }
    // 直接配列の場合
    if (Array.isArray(response)) {
      console.log('[POST-API] Received array directly:', response.length, response);
      return response;
    }
    console.log('[POST-API] Unexpected response format:', response);
    return [];
  },

  /**
   * Get a post by ID
   */
  async getPost(id: string): Promise<PostWithDetails> {
    return apiClient.get<PostWithDetails>(API_ENDPOINTS.POST(id));
  },

  /**
   * Create a new post
   */
  async createPost(data: {
    type: string;
    title: string;
    body?: string | null;
    cover_image_url?: string | null;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: Post }> {
    return apiClient.post<{ success: boolean; data: Post }>(API_ENDPOINTS.POSTS, data);
  },
};

// Profile API methods
export const profileApi = {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<{ success: boolean; data: Profile }> {
    return apiClient.get<{ success: boolean; data: Profile }>(API_ENDPOINTS.PROFILE);
  },

  /**
   * Get user profile by ID
   */
  async getProfileById(userId: string): Promise<{ success: boolean; data: Profile | null }> {
    // バックエンドAPI経由でプロフィールを取得
    return apiClient.get<{ success: boolean; data: Profile | null }>(API_ENDPOINTS.USER(userId));
  },

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<{ success: boolean; data: Profile }> {
    return apiClient.put<{ success: boolean; data: Profile }>(API_ENDPOINTS.PROFILE, data);
  },
};

// Message types
export type MessageType = 'text' | 'image' | 'file' | 'contract' | 'nda';

export interface Thread {
  id: string;
  created_by: string;
  related_post_id?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_user_id: string;
  type: MessageType;
  text?: string | null;
  image_url?: string | null;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender_name: string;
  sender_icon_url?: string | null;
  is_sending?: boolean; // 楽観的UIで送信中を示すフラグ
}

export interface ThreadWithLastMessage extends Thread {
  last_message?: Message | null;
  participant_ids: string[];
  participants: Profile[];
  unread_count: number;
}

export interface ThreadDetail extends Thread {
  participants: Profile[];
}

export interface CreateThreadRequest {
  related_post_id?: string | null;
  participant_ids: string[];
}

export interface CreateMessageRequest {
  thread_id: string;
  type: MessageType;
  text?: string | null;
  file_url?: string | null;
}

// Message API methods
export const messageApi = {
  /**
   * Get all threads for the current user
   */
  async getThreads(): Promise<{ success: boolean; data: ThreadWithLastMessage[] }> {
    return apiClient.get<{ success: boolean; data: ThreadWithLastMessage[] }>(API_ENDPOINTS.THREADS);
  },

  /**
   * Get a thread by ID
   */
  async getThread(id: string): Promise<{ success: boolean; data: ThreadDetail }> {
    return apiClient.get<{ success: boolean; data: ThreadDetail }>(API_ENDPOINTS.THREAD(id));
  },

  /**
   * Create a new thread
   */
  async createThread(data: CreateThreadRequest): Promise<{ success: boolean; data: Thread }> {
    return apiClient.post<{ success: boolean; data: Thread }>(API_ENDPOINTS.THREADS, data);
  },

  /**
   * Get messages for a thread
   */
  async getMessages(threadId: string): Promise<{ success: boolean; data: MessageWithSender[] }> {
    return apiClient.get<{ success: boolean; data: MessageWithSender[] }>(
      API_ENDPOINTS.MESSAGES,
      { params: { thread_id: threadId } }
    );
  },

  /**
   * Send a message
   */
  async sendMessage(data: CreateMessageRequest): Promise<{ success: boolean; data: Message }> {
    return apiClient.post<{ success: boolean; data: Message }>(API_ENDPOINTS.MESSAGES, data);
  },

  /**
   * Upload a message image
   */
  async uploadMessageImage(file: File): Promise<{ success: boolean; data: { file_path: string } }> {
    // Get auth token from Supabase session directly
    const { supabase } = await import('./supabase');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || null;
    
    if (!token) {
      throw new Error('認証トークンが取得できませんでした。再度ログインしてください。');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}${API_ENDPOINTS.MESSAGES_UPLOAD_IMAGE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      },
      body: formData,
    });

    // Handle 401 errors with token refresh
    if (response.status === 401) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData.session) {
        // Recreate FormData for retry (FormData can only be used once)
        const retryFormData = new FormData();
        retryFormData.append('image', file);
        
        const retryResponse = await fetch(`${API_URL}${API_ENDPOINTS.MESSAGES_UPLOAD_IMAGE}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${refreshData.session.access_token}`,
          },
          body: retryFormData,
        });
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          let errorData: { error?: string; message?: string } = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || retryResponse.statusText };
          }
          
          if (retryResponse.status === 401) {
            const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
            (error as any).code = 'SESSION_EXPIRED';
            throw error;
          }
          throw new Error(errorData.error || errorData.message || `API Error: ${retryResponse.statusText}`);
        }
        
        const result = await retryResponse.json();
        if (result.success && result.data) {
          return { success: true, data: result.data };
        }
        if (result.file_path) {
          return { success: true, data: { file_path: result.file_path } };
        }
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        let errorData: { error?: string; message?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || response.statusText };
        }
        const error = new Error(errorData.error || 'セッションの有効期限が切れました。再度ログインしてください。');
        (error as any).code = 'SESSION_EXPIRED';
        throw error;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: { error?: string; message?: string } = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || response.statusText };
      }
      // エラーメッセージを詳細に表示
      const errorMessage = errorData.error || errorData.message || `API Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Handle response format: { success: true, data: { file_path: ... } }
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    
    // Fallback: direct file_path in response
    if (result.file_path) {
      return { success: true, data: { file_path: result.file_path } };
    }
    
    // Last resort: return as-is
    return { success: true, data: result };
  },
};

// Comment types
export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PostCommentWithDetails extends PostComment {
  author_profile?: AuthorProfile | null;
  like_count: number;
  is_liked: boolean;
  reply_count: number;
  replies?: CommentReplyWithDetails[];
}

export interface CommentReplyWithDetails extends CommentReply {
  author_profile?: AuthorProfile | null;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateReplyRequest {
  content: string;
}

// Comment API methods
export const commentApi = {
  /**
   * Get all comments for a post
   */
  async getPostComments(postId: string): Promise<PostCommentWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: PostCommentWithDetails[] } | PostCommentWithDetails[]>(
      API_ENDPOINTS.POST_COMMENTS(postId)
    );
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      return response.data || [];
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  },

  /**
   * Create a comment on a post
   */
  async createComment(postId: string, data: CreateCommentRequest): Promise<PostCommentWithDetails> {
    return apiClient.post<PostCommentWithDetails>(API_ENDPOINTS.POST_COMMENTS(postId), data);
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, data: CreateCommentRequest): Promise<PostCommentWithDetails> {
    return apiClient.put<PostCommentWithDetails>(API_ENDPOINTS.COMMENT(commentId), data);
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.COMMENT(commentId));
  },

  /**
   * Get all replies for a comment
   */
  async getCommentReplies(commentId: string): Promise<CommentReplyWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: CommentReplyWithDetails[] } | CommentReplyWithDetails[]>(
      API_ENDPOINTS.COMMENT_REPLIES(commentId)
    );
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      return response.data || [];
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  },

  /**
   * Create a reply to a comment
   */
  async createReply(commentId: string, data: CreateReplyRequest): Promise<CommentReplyWithDetails> {
    return apiClient.post<CommentReplyWithDetails>(API_ENDPOINTS.COMMENT_REPLIES(commentId), data);
  },

  /**
   * Update a reply
   */
  async updateReply(replyId: string, data: CreateReplyRequest): Promise<CommentReplyWithDetails> {
    return apiClient.put<CommentReplyWithDetails>(API_ENDPOINTS.REPLY(replyId), data);
  },

  /**
   * Delete a reply
   */
  async deleteReply(replyId: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.REPLY(replyId));
  },

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(commentId: string): Promise<{ comment_id: string; like_count: number; is_liked: boolean }> {
    return apiClient.post<{ comment_id: string; like_count: number; is_liked: boolean }>(
      API_ENDPOINTS.COMMENT_LIKES(commentId),
      {}
    );
  },

  /**
   * Get like status for a comment
   */
  async getCommentLikes(commentId: string): Promise<{ comment_id: string; like_count: number; is_liked: boolean }> {
    return apiClient.get<{ comment_id: string; like_count: number; is_liked: boolean }>(
      API_ENDPOINTS.COMMENT_LIKES(commentId)
    );
  },
};
