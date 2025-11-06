import { getAuthHeader, getAuthToken } from './cookie-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * API クライアント
 * Go バックエンドとの通信を担当（Bearer Token認証）
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * リクエストヘッダーを構築（Bearer Token認証）
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    };

    return headers;
  }

  /**
   * HTTP リクエストを送信
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // URLを構築
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    // デフォルトヘッダーをマージ
    const headers = {
      ...this.getHeaders(),
      ...fetchOptions.headers,
    };

    console.log(`[API-CLIENT] ${fetchOptions.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // HTTPOnly Cookieを送信
        cache: 'no-store',
      });

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
  created_at: string;
  updated_at: string;
  // その他のフィールド
  [key: string]: any;
}

/**
 * Profile API
 */
export const profileApi = {
  getProfile: () => apiClient.get<Profile>('/api/profiles'),
  getProfileById: (userId: string) => apiClient.get<{ success: boolean; data: Profile }>(`/api/users/${userId}`),
  updateProfile: (data: Partial<Profile>) => apiClient.put<Profile>('/api/profiles', data),
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
  author_profile?: AuthorProfile;
  // その他のフィールド
  [key: string]: any;
}

/**
 * Post API
 */
export const postApi = {
  getPosts: (params?: { type?: string; author_user_id?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ data: Post[] }>('/api/posts', { params }),
  createPost: (data: Partial<Post>) => apiClient.post<Post>('/api/posts', data),
  getPost: (id: string) => apiClient.get<Post>(`/api/posts/${id}`),
  updatePost: (id: string, data: Partial<Post>) => apiClient.put<Post>(`/api/posts/${id}`, data),
  deletePost: (id: string) => apiClient.delete<void>(`/api/posts/${id}`),
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
  reply_count: number;
  is_liked: boolean;
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
    apiClient.get<{ success: boolean; data: ThreadDetail[] }>('/api/threads'),
  getThread: (threadId: string) =>
    apiClient.get<{ success: boolean; data: ThreadDetail }>(`/api/threads/${threadId}`),
  createThread: (data: CreateThreadRequest) =>
    apiClient.post<{ success: boolean; data: ThreadDetail }>('/api/threads', data),
  getMessages: (threadId: string) =>
    apiClient.get<{ success: boolean; data: MessageWithSender[] }>(`/api/threads/${threadId}/messages`),
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<{ success: boolean; data: MessageWithSender }>('/api/messages', data),
  uploadMessageImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // FormData送信時はContent-Typeを自動設定させるため、手動で設定しない
    const token = getAuthToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const response = await fetch(`${API_URL}/api/messages/upload-image`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
  },
};
