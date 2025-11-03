import React from 'react';

const Sidebar = () => {
  const tags = [
    '災害支援',
    '生録祭',
    '防災',
    'ビール',
    '便利グッズ',
    'ヘア・スキンケア',
    '美容',
    'スポーツ',
    'アウトドア',
    'サッカー'
  ];

  const genres = [
    'フード・飲食店',
    'テクノロジー・ガジェット',
    'プロダクト',
    'ファッション',
    'スポーツ',
    '音楽'
  ];

  return (
    <div className="hidden lg:block w-80 bg-white p-6 border-r border-gray-200">
      {/* 注目のタグセクション */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">注目のタグ</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <button
              key={index}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-gray-200 mb-8"></div>

      {/* 気になるジャンルを支援セクション */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">気になるジャンルを支援</h2>
        <div className="space-y-3">
          {genres.map((genre, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded cursor-pointer transition-colors duration-200"
            >
              <span className="text-gray-700 text-sm">{genre}</span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
