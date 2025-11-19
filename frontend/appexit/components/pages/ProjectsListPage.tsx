'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchCheck, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getImageUrls } from '@/lib/storage';
import ProjectCard from '@/components/ui/ProjectCard';
import { postApi, Post, AuthorProfile } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

interface ProjectWithImage {
  id: string;
  title: string;
  category: string | string[];
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

export default function ProjectsListPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const CATEGORIES = [
    { key: 'social', label: t('categories.social') },
    { key: 'ecommerce', label: t('categories.ecommerce') },
    { key: 'game', label: t('categories.game') },
    { key: 'education', label: t('categories.education') },
    { key: 'health', label: t('categories.health') },
    { key: 'finance', label: t('categories.finance') },
    { key: 'productivity', label: t('categories.productivity') },
    { key: 'entertainment', label: t('categories.entertainment') },
    { key: 'news', label: t('categories.news') },
    { key: 'travel', label: t('categories.travel') },
    { key: 'food', label: t('categories.food') },
    { key: 'lifestyle', label: t('categories.lifestyle') },
    { key: 'sports', label: t('categories.sports') },
    { key: 'music', label: t('categories.music') },
    { key: 'photo', label: t('categories.photo') },
    { key: 'communication', label: t('categories.communication') },
    { key: 'utilities', label: t('categories.utilities') },
    { key: 'weather', label: t('categories.weather') },
    { key: 'navigation', label: t('categories.navigation') },
    { key: 'medical', label: t('categories.medical') },
    { key: 'matching', label: t('categories.matching') },
    { key: 'ai', label: t('categories.ai') },
    { key: 'other', label: t('categories.other') },
  ];
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const POSTS_PER_PAGE = 20;

  // フィルター状態
  const [showFilters, setShowFilters] = useState(false);

  // 検索実行用の状態（実際に適用されるフィルター）
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [appliedPostTypes, setAppliedPostTypes] = useState<PostType[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [appliedPriceMin, setAppliedPriceMin] = useState<string>('');
  const [appliedPriceMax, setAppliedPriceMax] = useState<string>('');
  const [appliedRevenueMin, setAppliedRevenueMin] = useState<string>('');
  const [appliedRevenueMax, setAppliedRevenueMax] = useState<string>('');
  const [appliedProfitMarginMin, setAppliedProfitMarginMin] = useState<string>('');
  const [appliedTechStack, setAppliedTechStack] = useState<string[]>([]);

  // フィルター入力用の一時的な状態
  const [searchInput, setSearchInput] = useState('');
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

  // 初期ロード処理
  useEffect(() => {
    if (isInitialLoad) {
      const searchQuery = searchParams.get('search');
      if (searchQuery) {
        // URLパラメータから検索キーワードがある場合は、すぐに検索を実行
        setSearchInput(searchQuery);
        setSearchKeyword(searchQuery);
        setShowFilters(true); // 検索フィールドを開く
      } else {
        // URLパラメータがない場合は空のリストを表示
        setLoading(false);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, searchParams]);

  // URLパラメータの変更を監視（ヘッダーからの検索に対応）
  useEffect(() => {
    if (!isInitialLoad) {
      const searchQuery = searchParams.get('search');
      if (searchQuery && searchQuery !== searchKeyword) {
        // URLパラメータが変更された場合、検索を更新
        setSearchInput(searchQuery);
        setSearchKeyword(searchQuery);
        setShowFilters(true); // 検索フィールドを開く
      }
    }
  }, [searchParams]);

  // フィルター変更時にバックエンドから再取得（appliedフィルターを使用）
  useEffect(() => {
    if (!isInitialLoad) {
      fetchPosts();
    }
  }, [
    searchKeyword,
    appliedCategories,
    appliedPostTypes,
    // appliedStatusesはクライアント側で処理するため除外
    appliedPriceMin,
    appliedPriceMax,
    appliedRevenueMin,
    appliedRevenueMax,
    appliedTechStack, // appliedProfitMarginMinは除外（クライアント側で処理）
  ]);

  // ソート、利益率フィルター、ステータスフィルターをクライアント側で実行
  useEffect(() => {
    applySortingAndProfitFilter();
  }, [projects, sortBy, appliedProfitMarginMin, appliedStatuses]);


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
      if (post.type === 'board') badge = t('projects.postTypes.board');
      else if (post.type === 'secret') badge = t('projects.postTypes.secret');
      else if (post.type === 'transaction') badge = t('projects.postTypes.transaction');

      const categories = post.app_categories && post.app_categories.length > 0
        ? post.app_categories
        : [t('categories.unknown')];

      const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
        ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
        : undefined;

      const status = post.is_active ? t('common.recruiting') : t('common.completed');

      return {
        id: post.id,
        title: post.title,
        category: categories,
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

  const processPostsDataForAppend = async (data: Post[]): Promise<ProjectWithImage[]> => {
    // 画像URLマップを取得（eyecatch_url のみ）
    const imagePaths = data.map(post => post.eyecatch_url).filter((url): url is string => !!url);
    let imageUrlMap: Map<string, string> = new Map();

    try {
      imageUrlMap = await getImageUrls(imagePaths);
    } catch (err) {
      console.error('[PROJECTS] Failed to load image URLs:', err);
    }

    return data.map(post => ({
      id: post.id,
      title: post.title,
      category: post.category || 'その他',
      image: post.eyecatch_url ? (imageUrlMap.get(post.eyecatch_url) || '/placeholder.png') : '/placeholder.png',
      imagePath: post.eyecatch_url || null,
      price: post.price || 0,
      monthlyRevenue: post.monthly_revenue,
      monthlyCost: post.monthly_cost,
      profitMargin: post.profit_margin,
      status: post.status,
      watchCount: post.watch_count,
      commentCount: post.comment_count,
      updatedAt: post.updated_at,
      tag: post.tag,
      badge: post.badge,
      authorProfile: post.author_profile || null,
      techStack: post.tech_stack,
      postType: post.type,
      isActive: post.is_active,
      activeViewCount: post.active_view_count,
    }));
  };

  const fetchPosts = async (loadMore = false) => {
    setLoading(true);
    try {
      const page = loadMore ? currentPage + 1 : 0;

      // バックエンドに検索パラメータを渡す（appliedフィルターを使用）
      const params: any = {
        limit: POSTS_PER_PAGE,
        offset: page * POSTS_PER_PAGE,
      };

      if (searchKeyword.trim()) {
        params.search_keyword = searchKeyword.trim();
      }
      if (appliedCategories.length > 0) {
        params.categories = appliedCategories;
      }
      if (appliedPostTypes.length > 0) {
        params.post_types = appliedPostTypes;
      }
      if (appliedPriceMin) {
        params.price_min = parseInt(appliedPriceMin);
      }
      if (appliedPriceMax) {
        params.price_max = parseInt(appliedPriceMax);
      }
      if (appliedRevenueMin) {
        params.revenue_min = parseInt(appliedRevenueMin);
      }
      if (appliedRevenueMax) {
        params.revenue_max = parseInt(appliedRevenueMax);
      }
      if (appliedTechStack.length > 0) {
        params.tech_stacks = appliedTechStack;
      }

      const response = await postApi.getPosts(params);
      // レスポンスはPost[]型（api-client.tsのrequestメソッドでdata.dataを返すため）
      const data = Array.isArray(response) ? response : [];

      // データが配列でない場合は空配列を使用
      if (!Array.isArray(data)) {
        console.warn('Invalid data format received:', response);
        await processPostsData([]);
        setHasMore(false);
        return;
      }

      // 技術スタックのリストを収集（検索結果から更新）
      const techStackSet = new Set<string>(availableTechStacks);
      data.forEach(post => {
        if (post.tech_stack && Array.isArray(post.tech_stack)) {
          post.tech_stack.forEach((tech: string) => techStackSet.add(tech));
        }
      });
      setAvailableTechStacks(Array.from(techStackSet).sort());

      // ページネーション処理
      if (loadMore) {
        const processedData = await processPostsDataForAppend(data);
        setProjects(prev => [...prev, ...processedData]);
        setCurrentPage(page);
      } else {
        await processPostsData(data);
        setCurrentPage(0);
      }

      // データが取得件数より少なければ、これ以上ないと判断
      setHasMore(data.length >= POSTS_PER_PAGE);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const applySortingAndProfitFilter = () => {
    let filtered = [...projects];

    // ステータスフィルター（クライアント側、appliedフィルターを使用）
    if (appliedStatuses.length > 0) {
      filtered = filtered.filter(p => p.status && appliedStatuses.includes(p.status));
    }

    // 利益率フィルター（クライアント側、appliedフィルターを使用）
    if (appliedProfitMarginMin) {
      const min = parseFloat(appliedProfitMarginMin);
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
    // 一時的な状態をクリア
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

    // 適用済みの状態もクリア
    setSearchKeyword('');
    setAppliedCategories([]);
    setAppliedPostTypes([]);
    setAppliedStatuses([]);
    setAppliedPriceMin('');
    setAppliedPriceMax('');
    setAppliedRevenueMin('');
    setAppliedRevenueMax('');
    setAppliedProfitMarginMin('');
    setAppliedTechStack([]);
    setSortBy('newest');
  };

  const handleApplyFilters = () => {
    // すべての一時的なフィルター状態を適用済み状態にコピー
    setSearchKeyword(searchInput);
    setAppliedCategories(selectedCategories);
    setAppliedPostTypes(selectedPostTypes);
    setAppliedStatuses(selectedStatuses);
    setAppliedPriceMin(priceMin);
    setAppliedPriceMax(priceMax);
    setAppliedRevenueMin(revenueMin);
    setAppliedRevenueMax(revenueMax);
    setAppliedProfitMarginMin(profitMarginMin);
    setAppliedTechStack(selectedTechStack);
  };

  const handleSearch = () => {
    handleApplyFilters();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleCategory = (categoryLabel: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryLabel)
        ? prev.filter(c => c !== categoryLabel)
        : [...prev, categoryLabel]
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
    appliedCategories.length +
    appliedPostTypes.length +
    appliedStatuses.length +
    (appliedPriceMin || appliedPriceMax ? 1 : 0) +
    (appliedRevenueMin || appliedRevenueMax ? 1 : 0) +
    (appliedProfitMarginMin ? 1 : 0) +
    appliedTechStack.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルターエリア（上部） */}
        <div className="rounded-lg p-4 sm:p-6 mb-6 bg-white border border-gray-200">
          {/* フィルターヘッダー */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <SlidersHorizontal size={20} className="sm:w-[22px] sm:h-[22px]" style={{ color: '#E65D65' }} />
              <h2 className="text-lg sm:text-xl font-bold text-gray-500">{t('filters.search')}</h2>
              {activeFilterCount > 0 && (
                <span className="px-2 sm:px-3 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: '#E65D65', color: '#fff' }}>
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 rounded-md border-2 hover:opacity-80 transition-opacity font-bold whitespace-nowrap"
                  style={{ borderColor: '#E65D65', color: '#E65D65' }}
                >
                  {t('filters.clear')}
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 sm:p-2 hover:opacity-80 rounded-md transition-opacity text-gray-500"
                title={showFilters ? t('filters.close') : t('filters.open')}
              >
                {showFilters ? <ChevronUp size={20} className="sm:w-[22px] sm:h-[22px]" /> : <ChevronDown size={20} className="sm:w-[22px] sm:h-[22px]" />}
              </button>
            </div>
          </div>

          {/* 選択中のフィルター表示（閉じている時も表示、appliedフィルターを使用） */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchKeyword && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold truncate max-w-[120px] sm:max-w-none text-gray-500">{searchKeyword}</span>
                </span>
              )}
              {appliedCategories.map((cat) => (
                <span key={cat} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold truncate max-w-[100px] sm:max-w-none text-gray-500">{cat}</span>
                </span>
              ))}
              {appliedPostTypes.map((type) => (
                <span key={type} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold text-gray-500">
                    {type === 'transaction' ? t('projects.postTypes.transaction') : type === 'board' ? t('projects.postTypes.board') : t('projects.postTypes.secret')}
                  </span>
                </span>
              ))}
              {appliedStatuses.map((status) => (
                <span key={status} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold text-gray-500">{status}</span>
                </span>
              ))}
              {(appliedPriceMin || appliedPriceMax) && (
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold whitespace-nowrap text-gray-500">
                    {appliedPriceMin && `${Number(appliedPriceMin).toLocaleString()}${t('common.jpyCurrency')}${t('filters.from')}`}
                    {appliedPriceMax && `${Number(appliedPriceMax).toLocaleString()}${t('common.jpyCurrency')}`}
                  </span>
                </span>
              )}
              {appliedTechStack.map((tech) => (
                <span key={tech} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border" style={{ backgroundColor: '#fff', borderColor: '#9CA3AF' }}>
                  <span className="font-bold truncate max-w-[100px] sm:max-w-none text-gray-500">{tech}</span>
                </span>
              ))}
            </div>
          )}

          {/* フィルターコンテンツ */}
          <div
            className="overflow-hidden transition-all duration-200 ease-in-out"
            style={{
              maxHeight: showFilters ? '2000px' : '0',
              opacity: showFilters ? 1 : 0,
            }}
          >
            <div className="space-y-4 sm:space-y-6">
              {/* キーワード検索（全幅） */}
              <div>
                <div className="relative">
                  <SearchCheck className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#E65D65' }} size={20} />
                  <input
                    type="text"
                    placeholder={t('filters.search')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full pl-11 pr-3 py-3 border rounded-sm focus:outline-none focus:ring-2 text-sm sm:text-base font-bold"
                    style={{ '--tw-ring-color': '#E65D65', borderColor: '#D1D5DB' } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* その他のフィルター（グリッド） */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* 投稿タイプ */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.type')}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'transaction', label: t('projects.postTypes.transaction') },
                      { value: 'board', label: t('projects.postTypes.board') },
                      { value: 'secret', label: t('projects.postTypes.secret') }
                    ].map(type => (
                      <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPostTypes.includes(type.value as PostType)}
                          onChange={() => togglePostType(type.value as PostType)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#E65D65' }}
                        />
                        <span className="text-sm font-bold text-gray-500">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ステータス */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.status')}
                  </label>
                  <div className="space-y-2">
                    {[t('common.recruiting'), t('common.completed')].map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#E65D65' }}
                        />
                        <span className="text-sm font-bold text-gray-500">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.category')}
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {CATEGORIES.map(category => (
                      <label key={category.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.label)}
                          onChange={() => toggleCategory(category.label)}
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ accentColor: '#E65D65' }}
                        />
                        <span className="text-sm font-bold text-gray-500">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 価格帯 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.price')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t('filters.min')}
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
                      style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                    />
                    <span className="text-sm font-bold whitespace-nowrap text-gray-500">{t('filters.from')}</span>
                    <input
                      type="number"
                      placeholder={t('filters.max')}
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
                      style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* 月商 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.monthlyRevenue')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t('filters.min')}
                      value={revenueMin}
                      onChange={(e) => setRevenueMin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
                      style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                    />
                    <span className="text-sm font-bold whitespace-nowrap text-gray-500">{t('filters.from')}</span>
                    <input
                      type="number"
                      placeholder={t('filters.max')}
                      value={revenueMax}
                      onChange={(e) => setRevenueMax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
                      style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                    />
                  </div>
                </div>

                {/* 利益率 */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">
                    {t('filters.profitMargin')}
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    value={profitMarginMin}
                    onChange={(e) => setProfitMarginMin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
                    style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                  />
                </div>

                {/* 技術スタック */}
                {availableTechStacks.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-bold mb-2 text-gray-500">
                      {t('filters.technology')}
                      {availableTechStacks.length > 50 && (
                        <span className="ml-2 text-xs text-gray-400">
                          (上位50個を表示中)
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 rounded-md border border-gray-200">
                      {availableTechStacks.slice(0, 50).map(tech => (
                        <label key={tech} className="flex items-center gap-2 cursor-pointer hover:opacity-80 p-2 rounded transition-opacity">
                          <input
                            type="checkbox"
                            checked={selectedTechStack.includes(tech)}
                            onChange={() => toggleTechStack(tech)}
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ accentColor: '#E65D65' }}
                          />
                          <span className="text-sm font-bold truncate text-gray-500">{tech}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 検索ボタン */}
              <div className="flex justify-center pt-2 sm:pt-4">
                <button
                  onClick={handleApplyFilters}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-sm text-white font-bold hover:opacity-90 transition-opacity text-sm sm:text-base"
                  style={{ backgroundColor: '#E65D65' }}
                >
                  {t('filters.searchButton')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ソートと結果数 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="font-bold text-gray-500">
            {loading ? t('common.loading') : t('filters.resultsCount', { count: filteredProjects.length })}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-500">{t('filters.sort')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 text-sm font-bold text-gray-500"
              style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
            >
              <option value="newest">{t('projects.sortBy.newest')}</option>
              <option value="oldest">{t('projects.sortBy.oldest')}</option>
              <option value="price-high">{t('projects.sortBy.priceHigh')}</option>
              <option value="price-low">{t('projects.sortBy.priceLow')}</option>
              <option value="revenue-high">{t('projects.sortBy.revenueHigh')}</option>
              <option value="revenue-low">{t('projects.sortBy.revenueLow')}</option>
              <option value="profit-high">{t('projects.sortBy.profitHigh')}</option>
              <option value="profit-low">{t('projects.sortBy.profitLow')}</option>
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
          <div className="text-center py-12 rounded-sm">
            <SearchCheck className="mx-auto mb-4" style={{ color: '#E65D65' }} size={48} />
            {activeFilterCount === 0 ? (
              <>
                <p className="text-lg font-bold mb-2 text-gray-500">{t('projects.searchPrompt')}</p>
                <p className="font-bold text-gray-500">{t('projects.setConditions')}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold mb-2 text-gray-500">{t('projects.noResults')}</p>
                <p className="font-bold mb-4 text-gray-500">{t('projects.changeConditions')}</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 rounded-sm text-white hover:opacity-90 transition-opacity font-bold"
                  style={{ backgroundColor: '#E65D65' }}
                >
                  {t('filters.clear')}
                </button>
              </>
            )}
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <>
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

            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchPosts(true)}
                  className="px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#E65D65' }}
                >
                  {t('common.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
