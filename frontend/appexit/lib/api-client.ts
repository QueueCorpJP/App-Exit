const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * API クライアント
 * Go バックエンドとの通信を担当（Cookie認証）
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * リクエストヘッダーを構築（Cookie認証）
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
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
 * Profile API
 */
export const profileApi = {
  getProfile: () => apiClient.get<any>('/api/profiles'),
  updateProfile: (data: any) => apiClient.put<any>('/api/profiles', data),
};

/**
 * Post API
 */
export const postApi = {
  createPost: (data: any) => apiClient.post<any>('/api/posts', data),
  getPost: (id: string) => apiClient.get<any>(`/api/posts/${id}`),
  updatePost: (id: string, data: any) => apiClient.put<any>(`/api/posts/${id}`, data),
  deletePost: (id: string) => apiClient.delete<any>(`/api/posts/${id}`),
};
