'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setIsPostMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsDropdownOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <span className="text-red-600 font-bold text-xl">AppExit</span>
            </Link>
            <div className="hidden md:flex items-center">
              <input
                type="text"
                placeholder="キーワード検索"
                className="w-64 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <nav className="flex items-center gap-6">
            {/* アプリを掲載する - ドロップダウンメニュー */}
            <div className="relative" ref={postMenuRef}>
              <button
                onClick={() => setIsPostMenuOpen(!isPostMenuOpen)}
                className="text-gray-700 hover:text-gray-900 text-sm font-semibold flex items-center gap-1"
              >
                アプリを掲載する
                <svg
                  className={`w-4 h-4 transition-transform ${isPostMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isPostMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <Link
                    href="/projects/new/board"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setIsPostMenuOpen(false)}
                  >
                    <div className="font-semibold mb-1">掲示板投稿</div>
                    <div className="text-xs text-gray-500">簡易的な募集や提案を投稿</div>
                  </Link>
                  <Link
                    href="/projects/new/transaction"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setIsPostMenuOpen(false)}
                  >
                    <div className="font-semibold mb-1">取引投稿</div>
                    <div className="text-xs text-gray-500">詳細情報付きでアプリを出品</div>
                  </Link>
                  <Link
                    href="/projects/new/secret"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsPostMenuOpen(false)}
                  >
                    <div className="font-semibold mb-1">シークレット投稿</div>
                    <div className="text-xs text-gray-500">NDA締結企業のみに公開</div>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/projects" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
              アプリをみつける
            </Link>

            {loading ? (
              // ローディング中: スケルトン表示
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              // ログイン済み: アイコンとユーザー名を表示
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    {profile?.icon_url ? (
                      <img
                        src={profile.icon_url}
                        alt={profile.display_name || user.email}
                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold cursor-pointer">
                        {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold">
                      {profile?.display_name || user.email?.split('@')[0] || 'ユーザー'}
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      プロフィール設定
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 未ログイン: ログインと新規登録ボタンを表示
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  ログイン
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  新規会員登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
