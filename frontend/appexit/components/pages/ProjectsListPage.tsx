'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getImageUrls } from '@/lib/storage';
import ProjectCard from '@/components/ui/ProjectCard';
import { postApi, Post, AuthorProfile } from '@/lib/api-client';

interface ProjectWithImage {
  id: string;
  title: string;
  category: string;
  image: string;
  imagePath: string | null;
  price: number;
  monthlyRevenue?: number;
  monthlyCost?: number;
  profitMargin?: number;
  status?: string;
  watchCount?: number;
  commentCount?: number;
  updatedAt?: string;
  tag?: string;
  badge?: string;
  authorProfile?: AuthorProfile | null;
  techStack?: string[];
  postType: string;
  isActive: boolean;
  activeViewCount?: number;
}

type PostType = 'all' | 'board' | 'transaction' | 'secret';
type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low' | 'revenue-high' | 'revenue-low' | 'profit-high' | 'profit-low';

const CATEGORIES = [
  'ECサイト',
  'SaaS',
  'マッチングサービス',
  'メディア',
  'コミュニティ',
  'ツール',
  'エンタメ',
  '教育',
  'ヘルスケア',
  'その他'
];

export default function ProjectsListPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  // フィルター状態
  const [showFilters, setShowFilters] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState(''); // 検索入力用の一時的な状態
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPostTypes, setSelectedPostTypes] = useState<PostType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [revenueMin, setRevenueMin] = useState<string>('');
  const [revenueMax, setRevenueMax] = useState<string>('');
  const [profitMarginMin, setProfitMarginMin] = useState<string>('');
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // 利用可能な技術スタックのリスト
  const [availableTechStacks, setAvailableTechStacks] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // URLパラメータから検索キーワードを取得
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchKeyword(searchQuery);
      setSearchInput(searchQuery);
    }
  }, [searchParams]);

  // 初回のみ全データを取得して技術スタックリストを作成し、データも表示
  useEffect(() => {
    if (isInitialLoad) {
      fetchInitialData();
      setIsInitialLoad(false);
    }
  }, []);

  // フィルター変更時にバックエンドから再取得
  useEffect(() => {
    if (!isInitialLoad) {
      fetchPosts();
    }
  }, [
    searchKeyword,
    selectedCategories,
    selectedPostTypes,
    // selectedStatusesはクライアント側で処理するため除外
    priceMin,
    priceMax,
    revenueMin,
    revenueMax,
    selectedTechStack, // profitMarginMinは除外（クライアント側で処理）
  ]);

  // ソート、利益率フィルター、ステータスフィルターをクライアント側で実行
  useEffect(() => {
    applySortingAndProfitFilter();
  }, [projects, sortBy, profitMarginMin, selectedStatuses]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 初回は全データを取得
      const response = await postApi.getPosts({});
      const data = response.data;

      // 技術スタックのリストを収集
      const techStackSet = new Set<string>();
      data.forEach(post => {
        if (post.tech_stack && Array.isArray(post.tech_stack)) {
          post.tech_stack.forEach((tech: string) => techStackSet.add(tech));
        }
      });
      setAvailableTechStacks(Array.from(techStackSet).sort());

      // データを表示用に変換
      await processPostsData(data);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPostsData = async (data: any[]) => {
    if (data.length === 0) {
      console.log('No posts found');
      setProjects([]);
      setFilteredProjects([]);
      return;
    }

    // 画像パスを収集
    const imagePaths = data.map(post => post.eyecatch_url).filter((path): path is string => !!path);
    const imageUrlMap = await getImageUrls(imagePaths);

    // プロジェクトデータに画像URLを追加
    const projectsWithImages: ProjectWithImage[] = data.map(post => {
      const imageUrl = post.eyecatch_url ?
        (imageUrlMap.get(post.eyecatch_url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image') :
        'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

      let badge: string | undefined;
      if (post.type === 'board') badge = '掲示板';
      else if (post.type === 'secret') badge = 'シークレット';
      else if (post.type === 'transaction') badge = '取引';

      const category = post.app_categories && post.app_categories.length > 0
        ? post.app_categories[0]
        : 'カテゴリ不明';

      const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
        ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
        : undefined;

      const status = post.is_active ? '募集中' : '成約済み';

      return {
        id: post.id,
        title: post.title,
        category,
        image: imageUrl,
        imagePath: post.eyecatch_url || null,
        price: post.price || 0,
        monthlyRevenue: post.monthly_revenue,
        monthlyCost: post.monthly_cost,
        profitMargin,
        status,
        watchCount: undefined,
        commentCount: undefined,
        updatedAt: post.updated_at,
        badge,
        authorProfile: post.author_profile,
        techStack: post.tech_stack,
        postType: post.type || 'transaction',
        isActive: post.is_active,
        activeViewCount: post.active_view_count || 0
      };
    });

    setProjects(projectsWithImages);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // バックエンドに検索パラメータを渡す
      const params: any = {};
      
      if (searchKeyword.trim()) {
        params.search_keyword = searchKeyword.trim();
      }
      if (selectedCategories.length > 0) {
        params.categories = selectedCategories;
      }
      if (selectedPostTypes.length > 0) {
        params.post_types = selectedPostTypes;
      }
      if (priceMin) {
        params.price_min = parseInt(priceMin);
      }
      if (priceMax) {
        params.price_max = parseInt(priceMax);
      }
      if (revenueMin) {
        params.revenue_min = parseInt(revenueMin);
      }
      if (revenueMax) {
        params.revenue_max = parseInt(revenueMax);
      }
      if (selectedTechStack.length > 0) {
        params.tech_stacks = selectedTechStack;
      }

      const response = await postApi.getPosts(params);
      const data = response.data;

      await processPostsData(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySortingAndProfitFilter = () => {
    let filtered = [...projects];

    // ステータスフィルター（クライアント側）
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(p => p.status && selectedStatuses.includes(p.status));
    }

    // 利益率フィルター（クライアント側）
    if (profitMarginMin) {
      const min = parseFloat(profitMarginMin);
      filtered = filtered.filter(p => p.profitMargin !== undefined && p.profitMargin >= min);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
        case 'oldest':
          return new Date(a.updatedAt || '').getTime() - new Date(b.updatedAt || '').getTime();
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'revenue-high':
          return (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0);
        case 'revenue-low':
          return (a.monthlyRevenue || 0) - (b.monthlyRevenue || 0);
        case 'profit-high':
          return (b.profitMargin || 0) - (a.profitMargin || 0);
        case 'profit-low':
          return (a.profitMargin || 0) - (b.profitMargin || 0);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const clearAllFilters = () => {
    setSearchKeyword('');
    setSearchInput('');
    setSelectedCategories([]);
    setSelectedPostTypes([]);
    setSelectedStatuses([]);
    setPriceMin('');
    setPriceMax('');
    setRevenueMin('');
    setRevenueMax('');
    setProfitMarginMin('');
    setSelectedTechStack([]);
    setSortBy('newest');
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const togglePostType = (type: PostType) => {
    setSelectedPostTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleTechStack = (tech: string) => {
    setSelectedTechStack(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const activeFilterCount =
    (searchKeyword ? 1 : 0) +
    selectedCategories.length +
    selectedPostTypes.length +
    selectedStatuses.length +
    (priceMin || priceMax ? 1 : 0) +
    (revenueMin || revenueMax ? 1 : 0) +
    (profitMarginMin ? 1 : 0) +
    selectedTechStack.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#323232' }}>プロダクトを探す</h1>
          <p className="text-gray-600 mt-2">条件を指定してプロダクトを検索できます</p>
        </div>

        {/* フィルターエリア（上部） */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          {/* フィルターヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={22} style={{ color: '#E65D65' }} />
              <h2 className="text-xl font-bold" style={{ color: '#323232' }}>検索条件</h2>
              {activeFilterCount > 0 && (
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: '#E65D65', color: '#fff' }}>
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm py-2 px-4 rounded-md border-2 hover:bg-gray-50 transition-colors font-semibold"
                  style={{ borderColor: '#E65D65', color: '#E65D65' }}
                >
                  すべてクリア
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title={showFilters ? 'フィルターを閉じる' : 'フィルターを開く'}
              >
                {showFilters ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </button>
            </div>
          </div>

          {/* フィルターコンテンツ */}
          <div className={`${showFilters ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* キーワード検索 */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  キーワード検索
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="タイトル、説明文..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 rounded-sm text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                    style={{ backgroundColor: '#E65D65' }}
                  >
                    検索
                  </button>
                </div>
              </div>

              {/* 投稿タイプ */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  投稿タイプ
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'transaction', label: '取引' },
                    { value: 'board', label: '掲示板' },
                    { value: 'secret', label: 'シークレット' }
                  ].map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPostTypes.includes(type.value as PostType)}
                        onChange={() => togglePostType(type.value as PostType)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#E65D65' }}
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  ステータス
                </label>
                <div className="space-y-2">
                  {['募集中', '成約済み'].map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleStatus(status)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#E65D65' }}
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  カテゴリ
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {CATEGORIES.map(category => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#E65D65' }}
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 価格帯 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  価格帯（円）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="最小"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                  />
                  <span className="text-gray-500 text-sm">〜</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* 月商 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  月商（円）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="最小"
                    value={revenueMin}
                    onChange={(e) => setRevenueMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                  />
                  <span className="text-gray-500 text-sm">〜</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={revenueMax}
                    onChange={(e) => setRevenueMax(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* 利益率 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                  利益率（%以上）
                </label>
                <input
                  type="number"
                  placeholder="例: 30"
                  value={profitMarginMin}
                  onChange={(e) => setProfitMarginMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
                  style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                />
              </div>

              {/* 技術スタック */}
              {availableTechStacks.length > 0 && (
                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
                    技術スタック
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-md border border-gray-200">
                    {availableTechStacks.map(tech => (
                      <label key={tech} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTechStack.includes(tech)}
                          onChange={() => toggleTechStack(tech)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#E65D65' }}
                        />
                        <span className="text-sm text-gray-700">{tech}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ソートと結果数 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600">
            {loading ? '読み込み中...' : `${filteredProjects.length}件のプロダクト`}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">並び替え:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm"
              style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
            >
              <option value="newest">新着順</option>
              <option value="oldest">古い順</option>
              <option value="price-high">価格が高い順</option>
              <option value="price-low">価格が低い順</option>
              <option value="revenue-high">月商が高い順</option>
              <option value="revenue-low">月商が低い順</option>
              <option value="profit-high">利益率が高い順</option>
              <option value="profit-low">利益率が低い順</option>
            </select>
          </div>
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E65D65' }}></div>
          </div>
        )}

        {/* プロジェクト一覧 */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-sm">
            <Search className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-semibold mb-2" style={{ color: '#323232' }}>該当するプロダクトが見つかりませんでした</p>
            <p className="text-gray-500 mb-4">検索条件を変更してお試しください</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-2 rounded-sm text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#E65D65' }}
              >
                フィルターをクリア
              </button>
            )}
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                category={project.category}
                image={project.image}
                imagePath={project.imagePath}
                price={project.price}
                monthlyRevenue={project.monthlyRevenue}
                monthlyCost={project.monthlyCost}
                profitMargin={project.profitMargin}
                status={project.status}
                watchCount={project.watchCount}
                commentCount={project.commentCount}
                updatedAt={project.updatedAt}
                tag={project.tag}
                badge={project.badge}
                authorProfile={project.authorProfile}
                activeViewCount={project.activeViewCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
