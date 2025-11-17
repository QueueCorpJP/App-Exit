'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function DebugAuthPage() {
  const { user, loading } = useAuth();
  const [backendSession, setBackendSession] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      // バックエンドセッションをチェック
      const apiUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`)
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

      try {
        const response = await fetch(`${apiUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const result = await response.json();
          setBackendSession(result.data);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }

      // Cookieを表示
      setCookies(document.cookie);
    };

    checkAuth();
  }, []);

  const handleClearCookies = async () => {
    const apiUrl = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`)
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

    await fetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    window.location.reload();
  };

  const handleSignOut = async () => {
    const { signOut } = useAuth();
    await signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">認証デバッグページ</h1>

        {/* Auth Context */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Auth Context (Cookie-based)</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>User:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{user ? JSON.stringify(user, null, 2) : 'null'}</pre>
          </div>
        </div>

        {/* Backend Session */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Backend Session</h2>
          <div className="space-y-2">
            <p><strong>Session exists:</strong> {backendSession ? 'true' : 'false'}</p>
            {backendSession && (
              <>
                <p><strong>User email:</strong> {backendSession.email}</p>
                <p><strong>User ID:</strong> {backendSession.id}</p>
                <p><strong>Profile:</strong></p>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(backendSession.profile, null, 2)}</pre>
              </>
            )}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Cookies</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">HTTPOnly Cookieは表示されません（セキュリティ上の理由）</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{cookies || 'No cookies'}</pre>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">アクション</h2>
          <div className="flex gap-4">
            <button
              onClick={handleClearCookies}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cookieをクリア（ログアウト）
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              サインアウト
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ログインページへ
            </button>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">使い方</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>ブラウザのDevTools (F12) を開いてConsoleタブを表示</li>
            <li>[AUTH-CONTEXT] で始まるログを確認</li>
            <li>ログイン状態が正しく取得できているか確認（Cookie認証）</li>
            <li>ログイン/ログアウト時にログが出力されるか確認</li>
            <li>auth_tokenとrefresh_tokenのHTTPOnly Cookieが設定されているか確認（Application &gt; Cookies）</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
