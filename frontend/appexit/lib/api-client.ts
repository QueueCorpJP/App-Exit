const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  _isRetry?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          return true;
        } else if (response.status === 401) {
          const errorText = await response.text();
          
          if (typeof document !== 'undefined') {
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          
          return false;
        } else {
          const errorText = await response.text();
          return false;
        }
      } catch (error) {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

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

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
        cache: 'no-store',
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
          return [] as T;
        }
        
        const refreshed = await this.refreshToken();

        if (refreshed) {
          return this.request<T>(endpoint, { ...options, _isRetry: true });
        } else {
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
            '/projects',
          ];
          
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isPublicPath = publicPaths.some(path => {
            if (path === '/') {
              return currentPath === '/';
            }
            if (path === '/projects') {
              return currentPath.startsWith('/projects') && !currentPath.startsWith('/projects/new');
            }
            return currentPath === path || currentPath.startsWith(path + '/');
          });
          
          if (typeof window !== 'undefined' && !isPublicPath) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          }
          
          if (isPublicPath) {
            return [] as T;
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));

        const error: any = new Error(errorData.error || errorData.message || 'リクエストに失敗しました');
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      const data = await response.json();

      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return data.data as T;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

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

export const apiClient = new ApiClient(API_URL);
export interface Profile {
  id: string;
  user_id: string;
  role: string;
  party: string;
  display_name: string;
  age?: number;
  icon_url?: string;
  nda_flag?: boolean;
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
  active_view_count?: number;
  watch_count?: number;
  comment_count?: number;
  [key: string]: any;
}

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
    const queryParams: Record<string, string | number> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              queryParams[key] = JSON.stringify(value);
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
  replies?: CommentReplyWithDetails[];
}

export interface CommentReplyWithDetails {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_profile?: {
    id: string;
    display_name: string;
    icon_url?: string;
  };
  like_count: number;
  is_liked: boolean;
  dislike_count: number;
  is_disliked: boolean;
  reply_count?: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateReplyRequest {
  content: string;
}

export interface ToggleLikeResponse {
  like_count: number;
  is_liked: boolean;
}

export interface ToggleDislikeResponse {
  dislike_count: number;
  is_disliked: boolean;
}

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
    apiClient.post<ToggleDislikeResponse>(`/api/comments/${commentId}/dislikes`, {}),
  getReplies: (commentId: string) =>
    apiClient.get<CommentReplyWithDetails[]>(`/api/comments/${commentId}/replies`),
  createReply: (commentId: string, data: CreateReplyRequest) =>
    apiClient.post<CommentReplyWithDetails>(`/api/comments/${commentId}/replies`, data),
  updateReply: (replyId: string, data: CreateReplyRequest) =>
    apiClient.put<CommentReplyWithDetails>(`/api/replies/${replyId}`, data),
  deleteReply: (replyId: string) =>
    apiClient.delete<void>(`/api/replies/${replyId}`),
  toggleReplyLike: (replyId: string) =>
    apiClient.post<{ reply_id: string; like_count: number; is_liked: boolean }>(`/api/replies/${replyId}/likes`, {}),
  toggleReplyDislike: (replyId: string) =>
    apiClient.post<{ reply_id: string; dislike_count: number; is_disliked: boolean }>(`/api/replies/${replyId}/dislikes`, {}),
};
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

export const messageApi = {
  getThreads: () =>
    apiClient.get<ThreadDetail[]>('/api/threads'),
  getThread: (threadId: string) =>
    apiClient.get<ThreadDetail>(`/api/threads/${threadId}`),
  createThread: (data: CreateThreadRequest) =>
    apiClient.post<ThreadDetail>('/api/threads', data),
  getMessages: (threadId: string, options?: { limit?: number; offset?: number }) =>
    apiClient.get<MessageWithSender[]>('/api/messages', {
      params: {
        thread_id: threadId,
        ...(options?.limit && { limit: options.limit }),
        ...(options?.offset !== undefined && { offset: options.offset }),
      }
    }),
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<MessageWithSender>('/api/messages', data),
  uploadMessageImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const response = await fetch(`${API_URL}/api/messages/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    return result;
  },

  createSaleRequest: (data: { thread_id: string; post_id: string; price: number; phone_number?: string }) =>
    apiClient.post<SaleRequest>('/api/sale-requests', data),

  getSaleRequests: (threadId: string) =>
    apiClient.get<SaleRequest[]>('/api/sale-requests', { params: { thread_id: threadId } }),

  refundSaleRequest: (data: { sale_request_id: string; amount?: number; reason?: string }) =>
    apiClient.post<{ refund_id: string; amount: number; status: string; message: string }>('/api/sale-requests/refund', data),

  confirmSaleRequest: (data: { sale_request_id: string }) =>
    apiClient.post<{ client_secret: string; amount: number; sale_request_id: string; payment_intent_id: string }>('/api/sale-requests/confirm', data),
};
export interface SaleRequest {
  id: string;
  thread_id: string;
  user_id: string;
  post_id: string;
  price: number;
  phone_number?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  post?: Post;
}

export interface ActiveViewResponse {
  success: boolean;
  message?: string;
  data?: any;
  active_view_count?: number;
}

export interface ActiveViewStatusResponse {
  success: boolean;
  data: {
    is_active: boolean;
  };
}

export interface ActiveViewStatusData {
  is_active: boolean;
}

export const activeViewApi = {
  createActiveView: (postId: string) =>
    apiClient.post<ActiveViewResponse>(`/api/posts/${postId}/active-views`, {}),
  deleteActiveView: (postId: string) =>
    apiClient.delete<ActiveViewResponse>(`/api/posts/${postId}/active-views`),
  getActiveViewStatus: (postId: string) =>
    apiClient.get<ActiveViewStatusData>(`/api/posts/${postId}/active-views/status`),
};
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

export const stripeApi = {
  getAccountStatus: () =>
    apiClient.get<{ success: boolean; data: StripeAccountStatus }>('/api/stripe/account-status'),
  
  createAccount: (data: CreateStripeAccountRequest) =>
    apiClient.post<CreateStripeAccountResponse>('/api/stripe/create-account', data),
  
  getOnboardingLink: () =>
    apiClient.post<StripeOnboardingLinkResponse>('/api/stripe/onboarding-link', {}),
  
  getPayoutInfo: () =>
    apiClient.get<{ success: boolean; data: PayoutInfo }>('/api/stripe/payout-info'),
};
