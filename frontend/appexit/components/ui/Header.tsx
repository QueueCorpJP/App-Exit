'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isMobilePostMenuOpen, setIsMobilePostMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      
      // デスクトップ用の「プロダクトを掲載する」メニュー（モバイルメニューが開いている時は無視）
      if (postMenuRef.current && !postMenuRef.current.contains(target) && !isMobileMenuOpen) {
        setIsPostMenuOpen(false);
      }
      
      // モバイルメニュー：ヘッダーボタンやメニュー外をクリックした時だけ閉じる
      if (mobileMenuRef.current) {
        const isClickInsideMenu = mobileMenuRef.current.contains(target);
        const isClickOnMenuButton = mobileMenuButtonRef.current?.contains(target);
        
        if (!isClickInsideMenu && !isClickOnMenuButton) {
          setIsMobileMenuOpen(false);
          setIsMobilePostMenuOpen(false);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    // ハードリロードして状態を完全にリセット
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6 flex-1 max-w-3xl">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img src="/icon.png" alt="AppExit" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-stretch flex-1 max-w-2xl mr-6 gap-2">
              <input
                type="text"
                placeholder="キーワード検索"
                className="w-full px-4 py-2 border border-gray-400 rounded-l-full rounded-r-none text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const keyword = (e.target as HTMLInputElement).value;
                    window.location.href = `/projects?search=${encodeURIComponent(keyword)}`;
                  }
                }}
              />
              <button
                className="px-4 bg-red-600 text-white rounded-l-none rounded-r-full text-sm font-semibold hover:bg-red-700 transition-colors border border-red-600 flex items-center whitespace-nowrap"
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  const keyword = input?.value || '';
                  window.location.href = `/projects?search=${encodeURIComponent(keyword)}`;
                }}
              >
                検索
              </button>
            </div>
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-6">
            {/* プロダクトを掲載する - ドロップダウンメニュー */}
            <div className="relative" ref={postMenuRef}>
              <button
                onClick={() => setIsPostMenuOpen(!isPostMenuOpen)}
                className="text-gray-700 hover:text-gray-900 text-sm font-semibold flex items-center gap-1"
              >
                プロダクトを掲載する
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
                    <div className="text-xs text-gray-500">詳細情報付きでプロダクトを出品</div>
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
              プロダクトをみつける
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
                    href="/profile"
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
                  </Link>
                  <Link
                    href="/profile"
                    className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    {profile?.display_name || user.email?.split('@')[0] || 'ユーザー'}
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

          {/* モバイルメニューボタン */}
          <div className="md:hidden flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <Link
                href="/profile"
                className="flex items-center"
              >
                {profile?.icon_url ? (
                  <img
                    src={profile.icon_url}
                    alt={profile.display_name || user.email}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                    {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            ) : null}
            <button
              ref={mobileMenuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="text-gray-700 hover:text-gray-900"
              aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        <div
          ref={mobileMenuRef}
          className={`md:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
          }`}
        >
          {/* 検索バー */}
          <div className="mb-4 px-4 flex items-stretch gap-2">
            <input
              type="text"
              placeholder="キーワード検索"
              className="flex-1 px-4 py-2 border border-gray-400 rounded-l-full rounded-r-none text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const keyword = (e.target as HTMLInputElement).value;
                  window.location.href = `/projects?search=${encodeURIComponent(keyword)}`;
                  setIsMobileMenuOpen(false);
                }
              }}
            />
            <button
              className="px-4 bg-red-600 text-white rounded-l-none rounded-r-full text-sm font-semibold hover:bg-red-700 transition-colors border border-red-600 flex items-center whitespace-nowrap"
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                const keyword = input?.value || '';
                window.location.href = `/projects?search=${encodeURIComponent(keyword)}`;
                setIsMobileMenuOpen(false);
              }}
            >
              検索
            </button>
          </div>

          {/* ナビゲーションリンク */}
          <div className="space-y-4 px-4">
              <div className="relative">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMobilePostMenuOpen(!isMobilePostMenuOpen);
                    }}
                    className="flex-1 text-left text-gray-700 hover:text-gray-900 text-sm font-semibold flex items-center justify-between py-2"
                  >
                    <span>プロダクトを掲載する</span>
                    <svg
                      className={`w-4 h-4 transition-transform ml-2 ${isMobilePostMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isMobilePostMenuOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobilePostMenuOpen(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1 ml-2"
                      aria-label="メニューを閉じる"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isMobilePostMenuOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                    <Link
                      href="/projects/new/board"
                      className="block py-2 text-sm text-gray-700 hover:text-gray-900"
                      onClick={() => {
                        setIsMobilePostMenuOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="font-semibold">掲示板投稿</div>
                      <div className="text-xs text-gray-500">簡易的な募集や提案を投稿</div>
                    </Link>
                    <Link
                      href="/projects/new/transaction"
                      className="block py-2 text-sm text-gray-700 hover:text-gray-900"
                      onClick={() => {
                        setIsMobilePostMenuOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="font-semibold">取引投稿</div>
                      <div className="text-xs text-gray-500">詳細情報付きでプロダクトを出品</div>
                    </Link>
                    <Link
                      href="/projects/new/secret"
                      className="block py-2 text-sm text-gray-700 hover:text-gray-900"
                      onClick={() => {
                        setIsMobilePostMenuOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="font-semibold">シークレット投稿</div>
                      <div className="text-xs text-gray-500">NDA締結企業のみに公開</div>
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/projects"
                className="block text-gray-700 hover:text-gray-900 text-sm font-semibold py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                プロダクトをみつける
              </Link>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block text-gray-700 hover:text-gray-900 text-sm font-semibold py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    プロフィール設定
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left text-gray-700 hover:text-gray-900 text-sm font-semibold py-2"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-gray-900 text-sm font-semibold py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    className="block text-gray-700 hover:text-gray-900 text-sm font-semibold py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    新規会員登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
    </header>
  );
}
