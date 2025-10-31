'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function DebugAuthPage() {
  const { user, token, loading } = useAuth();
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSupabaseSession(session);

      setLocalStorageData({
        access_token: localStorage.getItem('access_token'),
        auth_token: localStorage.getItem('auth_token'),
        auth_user: localStorage.getItem('auth_user'),
      });
    };

    checkAuth();
  }, []);

  const handleClearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">認証デバッグページ</h1>

        {/* Auth Context */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Auth Context</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
            <p><strong>Token (first 50 chars):</strong> {token ? token.substring(0, 50) + '...' : 'null'}</p>
            <p><strong>Token length:</strong> {token ? token.length : 0}</p>
            <p><strong>Token segments:</strong> {token ? token.split('.').length : 0}</p>
          </div>
        </div>

        {/* Supabase Session */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Supabase Session</h2>
          <div className="space-y-2">
            <p><strong>Session exists:</strong> {supabaseSession ? 'true' : 'false'}</p>
            {supabaseSession && (
              <>
                <p><strong>User email:</strong> {supabaseSession.user?.email}</p>
                <p><strong>User ID:</strong> {supabaseSession.user?.id}</p>
                <p><strong>Token (first 50 chars):</strong> {supabaseSession.access_token.substring(0, 50) + '...'}</p>
                <p><strong>Token length:</strong> {supabaseSession.access_token.length}</p>
                <p><strong>Token segments:</strong> {supabaseSession.access_token.split('.').length}</p>
                <p><strong>Expires at:</strong> {new Date(supabaseSession.expires_at * 1000).toLocaleString()}</p>
              </>
            )}
          </div>
        </div>

        {/* LocalStorage */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">LocalStorage</h2>
          <div className="space-y-2">
            <p><strong>access_token (first 50 chars):</strong> {localStorageData.access_token ? localStorageData.access_token.substring(0, 50) + '...' : 'null'}</p>
            <p><strong>auth_token (first 50 chars):</strong> {localStorageData.auth_token ? localStorageData.auth_token.substring(0, 50) + '...' : 'null'}</p>
            <p><strong>auth_user:</strong> {localStorageData.auth_user || 'null'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">アクション</h2>
          <div className="flex gap-4">
            <button
              onClick={handleClearStorage}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              LocalStorageをクリア
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
            <li>ログイン状態が正しく取得できているか確認</li>
            <li>ログイン/ログアウト時にログが出力されるか確認</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
