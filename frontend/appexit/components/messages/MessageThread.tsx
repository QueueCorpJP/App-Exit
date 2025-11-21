'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MessageWithSender, ThreadDetail, messageApi, postApi, Post } from '@/lib/api-client';
import { Image as ImageIcon, X, Info, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { truncateDisplayName } from '@/lib/text-utils';
import { useAuth } from '@/lib/auth-context';
import { getImageUrl } from '@/lib/storage';

interface MessageThreadProps {
  threadDetail: ThreadDetail | null;
  messages: MessageWithSender[];
  currentUserId: string;
  onSendMessage: (text: string, imageFile?: File | null) => Promise<void>;
  isSending: boolean;
  isLoadingMessages: boolean;
  onBack?: () => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
}


function MessageThread({
  threadDetail,
  messages,
  currentUserId,
  onSendMessage,
  isSending,
  isLoadingMessages,
  onBack,
}: MessageThreadProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [otherParticipantIconUrl, setOtherParticipantIconUrl] = useState<string | null>(null);
  
  // 売却モーダルの状態
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [showSaleInfoTooltip, setShowSaleInfoTooltip] = useState(false);
  const [isSaleButtonHovered, setIsSaleButtonHovered] = useState(false);
  
  // 売却リクエストの状態
  const [saleRequests, setSaleRequests] = useState<any[]>([]);
  const [isLoadingSaleRequests, setIsLoadingSaleRequests] = useState(false);

  // ユーザーの投稿を取得
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id || !showSaleModal) {
        return;
      }

      try {
        setIsLoadingPosts(true);
        const posts = await postApi.getPosts({
          author_user_id: user.id,
          limit: 100,
        });
        setUserPosts(Array.isArray(posts) ? posts : []);
      } catch (error) {
        setSaleError(t('messages.failedToFetchPosts'));
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user?.id, showSaleModal]);
  
  // 売却リクエストを取得
  useEffect(() => {
    const fetchSaleRequests = async () => {
      if (!threadDetail?.id) {
        return;
      }
      
      try {
        setIsLoadingSaleRequests(true);
        const requests = await messageApi.getSaleRequests(threadDetail.id);
        setSaleRequests(Array.isArray(requests) ? requests : []);
      } catch (error) {
        // Failed to fetch sale requests - continue without sale requests
      } finally {
        setIsLoadingSaleRequests(false);
      }
    };
    
    fetchSaleRequests();

    // 60秒ごとに売却リクエストを再取得（スケーラビリティ改善のためポーリング間隔を延長）
    const intervalId = setInterval(() => {
      if (threadDetail?.id) {
        messageApi.getSaleRequests(threadDetail.id)
          .then((requests: any) => {
            setSaleRequests(Array.isArray(requests) ? requests : []);
          })
          .catch(() => {
          });
      }
    }, 60000);

    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [threadDetail?.id]);


  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return locale === 'ja' ? 'たった今' : 'Just now';
    if (diffInMinutes < 60) return locale === 'ja' ? `${diffInMinutes}分前` : `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return locale === 'ja' ? `${diffInHours}時間前` : `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return locale === 'ja' ? `${diffInDays}日前` : `${diffInDays}d ago`;

    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = () => {
    if (!threadDetail || !threadDetail.participants) {
      return null;
    }
    const otherUser = threadDetail.participants.find(p => p.id !== currentUserId);
    return otherUser;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImageFile) || isSending || isLoadingMessages) return;

    const messageText = newMessage.trim();
    const imageFile = selectedImageFile;
    setNewMessage('');
    setSelectedImageFile(null);
    setImagePreview(null);

    try {
      await onSendMessage(messageText, imageFile);
    } catch (err) {
      // エラー時はメッセージを復元
      setNewMessage(messageText);
      if (imageFile) {
        setSelectedImageFile(imageFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(imageFile);
      }
    }
  };

  const otherParticipant = threadDetail ? getOtherParticipant() : null;
  
  // 相手のアイコンURLを取得
  useEffect(() => {
    const fetchOtherParticipantIconUrl = async () => {
      if (otherParticipant?.icon_url) {
        // 既に完全なURLの場合はそのまま使用
        if (otherParticipant.icon_url.startsWith('http://') || otherParticipant.icon_url.startsWith('https://')) {
          setOtherParticipantIconUrl(otherParticipant.icon_url);
          return;
        }
        
        try {
          const url = await getImageUrl(otherParticipant.icon_url, 'profile-icons');
          setOtherParticipantIconUrl(url);
        } catch (error) {
          setOtherParticipantIconUrl(null);
        }
      } else {
        setOtherParticipantIconUrl(null);
      }
    };
    
    fetchOtherParticipantIconUrl();
  }, [otherParticipant?.icon_url]);
  
  // 売却リクエストの状態を判定
  const currentUserSaleRequest = saleRequests.find(req => req.user_id === currentUserId && req.status === 'pending');
  const otherUserSaleRequest = saleRequests.find(req => req.user_id !== currentUserId && req.status === 'pending');
  
  // ボタンの表示を判定
  const getSaleButtonConfig = () => {
    if (currentUserSaleRequest) {
      // 自分が売却リクエストを出している場合
      return {
        text: t('messages.selling'),
        color: '#E65D65',
        hoverColor: '#D14C54',
        textColor: '#FFFFFF',
        backgroundColor: '#E65D65',
        hoverBackgroundColor: '#D14C54',
        borderColor: '#E65D65',
        hoverBorderColor: '#D14C54',
        disabled: true,
      };
    } else if (otherUserSaleRequest) {
      // 相手が売却リクエストを出している場合
      return {
        text: t('messages.purchase'),
        color: '#E65D65',
        hoverColor: '#D14C54',
        textColor: '#E65D65',
        backgroundColor: 'transparent',
        hoverBackgroundColor: 'transparent',
        borderColor: '#E65D65',
        hoverBorderColor: '#D14C54',
        disabled: false,
      };
    } else {
      // デフォルト
      return {
        text: t('messages.sell'),
        color: '#E65D65',
        hoverColor: '#D14C54',
        textColor: '#E65D65',
        backgroundColor: 'transparent',
        hoverBackgroundColor: 'transparent',
        borderColor: '#E65D65',
        hoverBorderColor: '#D14C54',
        disabled: false,
      };
    }
  };
  
  const saleButtonConfig = getSaleButtonConfig();

  return (
    <div className="flex-1 md:flex-1 w-full md:w-auto flex flex-col h-full overflow-hidden bg-white relative">
      {/* チャットヘッダー */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between gap-4">
          {/* 左側：ユーザー情報 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden flex-shrink-0"
                aria-label={t('messages.back')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                if (otherParticipant?.id) {
                  router.push(`/profiles/${otherParticipant.id}`);
                }
              }}
              className="relative hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {otherParticipantIconUrl ? (
                  <img
                    src={otherParticipantIconUrl}
                    alt={otherParticipant?.display_name || ''}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        const fallback = e.currentTarget.parentElement.querySelector('.icon-fallback') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span className="icon-fallback" style={{ display: otherParticipantIconUrl ? 'none' : 'flex' }}>👤</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (otherParticipant?.id) {
                  router.push(`/profiles/${otherParticipant.id}`);
                }
              }}
              className="hidden md:block hover:opacity-80 transition-opacity cursor-pointer min-w-0"
            >
              <h2 className="font-semibold truncate" title={otherParticipant?.display_name || t('messages.user')}>
                {otherParticipant?.display_name ? truncateDisplayName(otherParticipant.display_name, 'header') : t('messages.user')}
              </h2>
            </button>
          </div>

          {/* 右側：売却するボタン */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-2 gap-2 whitespace-nowrap"
              style={{
                borderColor: isSaleButtonHovered && !saleButtonConfig.disabled ? saleButtonConfig.hoverBorderColor : saleButtonConfig.borderColor,
                color: saleButtonConfig.disabled ? saleButtonConfig.textColor : (isSaleButtonHovered ? saleButtonConfig.hoverColor : saleButtonConfig.color),
                backgroundColor: saleButtonConfig.disabled ? saleButtonConfig.backgroundColor : (isSaleButtonHovered ? saleButtonConfig.hoverBackgroundColor : saleButtonConfig.backgroundColor),
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (!saleButtonConfig.disabled) {
                  setShowSaleModal(true);
                }
              }}
              onMouseEnter={() => setIsSaleButtonHovered(true)}
              onMouseLeave={() => setIsSaleButtonHovered(false)}
              disabled={saleButtonConfig.disabled}
            >
              {saleButtonConfig.text}
              <svg
                className="w-5 h-5"
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
            </Button>
          </div>
        </div>
      </div>


      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 bg-white shadow-inner">
        {isLoadingMessages ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">{t('messages.loading')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>{t('messages.noMessages')}</p>
            <p className="text-sm mt-2">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_user_id === currentUserId;
            const isSendingMessage = (message as any).is_sending;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? isSendingMessage
                        ? 'bg-blue-400 text-white opacity-70'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isOwnMessage && message.sender && (
                    <p className="text-xs mb-1 opacity-70" title={message.sender.display_name}>{truncateDisplayName(message.sender.display_name, 'post')}</p>
                  )}
                  {message.type === 'image' && message.image_url && (
                    <div className="mb-2">
                      <img
                        src={message.image_url}
                        alt={t('messages.sentImage')}
                        className="max-w-full max-h-64 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <p className={`text-xs ${isOwnMessage ? 'opacity-70' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                    {isSendingMessage && (
                      <span className="text-xs opacity-70">• {t('messages.sending')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* メッセージ入力エリア */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 画像プレビュー */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-300" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('messages.inputPlaceholder')}
                disabled={isSending || isLoadingMessages}
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none resize-none disabled:opacity-50"
                style={{ '--tw-ring-color': '#E65D65' } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E65D65'
                  e.currentTarget.style.outline = '2px solid #E65D65'
                  e.currentTarget.style.outlineOffset = '0px'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.outline = 'none'
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <label className={`p-1 hover:bg-gray-100 rounded-full ${isLoadingMessages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isSending || isLoadingMessages}
                  />
                </label>
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImageFile) || isSending || isLoadingMessages}
                  className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 売却モーダル（売却側） */}
      {showSaleModal && !otherUserSaleRequest && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 py-12 sm:px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          <div className="bg-white py-8 px-4 sm:px-10 rounded-md w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold text-center flex-1"
                style={{
                  color: '#323232',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  letterSpacing: '0.02em'
                }}
              >
                {t('messages.createSaleRequest')}
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowSaleInfoTooltip(true)}
                    onMouseLeave={() => setShowSaleInfoTooltip(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={t('messages.info')}
                  >
                    <Info className="w-4 h-4 text-gray-500" />
                  </button>
                  {showSaleInfoTooltip && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3 z-50"
                      onMouseEnter={() => setShowSaleInfoTooltip(true)}
                      onMouseLeave={() => setShowSaleInfoTooltip(false)}
                    >
                      <p className="text-sm text-gray-700 font-bold">
                        {t('messages.sellerOperation')}
                      </p>
                      {/* 上向きの矢印 */}
                      <div className="absolute right-4 bottom-full -mb-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                      <div className="absolute right-4 bottom-full w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-transparent border-b-gray-300"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedPostId('');
                    setSalePrice('');
                    setPhoneNumber('');
                    setSaleError(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {saleError && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="text-sm text-red-700">{saleError}</div>
              </div>
            )}

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* プロダクト選択 */}
              <div>
                <label htmlFor="post-select" className="block text-sm font-medium text-gray-700">
                  {t('messages.productToSell')}
                </label>
                <div className="mt-1">
                  {isLoadingPosts ? (
                    <div className="p-4 text-center text-gray-500 text-sm">{t('messages.loadingPosts')}</div>
                  ) : userPosts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {t('messages.noProductsPosted')}
                    </div>
                  ) : (
                    <select
                      id="post-select"
                      value={selectedPostId}
                      onChange={(e) => setSelectedPostId(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900"
                      style={{
                        '--tw-ring-color': '#E65D65'
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#E65D65'
                        e.currentTarget.style.outline = '2px solid #E65D65'
                        e.currentTarget.style.outlineOffset = '0px'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB'
                        e.currentTarget.style.outline = 'none'
                      }}
                    >
                      <option value="">{t('messages.pleaseSelect')}</option>
                      {userPosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 値段設定 */}
              <div>
                <label htmlFor="price-input" className="block text-sm font-medium text-gray-700">
                  {t('messages.desiredPrice')}
                </label>
                <div className="mt-1">
                  <input
                    id="price-input"
                    type="number"
                    value={salePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setSalePrice(value);
                      }
                    }}
                    placeholder={t('messages.examplePrice')}
                    min="1"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900"
                    style={{
                      '--tw-ring-color': '#E65D65'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#E65D65'
                      e.currentTarget.style.outline = '2px solid #E65D65'
                      e.currentTarget.style.outlineOffset = '0px'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.outline = 'none'
                    }}
                  />
                </div>
              </div>

              {/* 電話番号 */}
              <div>
                <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700">
                  {t('messages.phoneNumberOptional')}
                </label>
                <div className="mt-1">
                  <input
                    id="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('messages.examplePhone')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900"
                    style={{
                      '--tw-ring-color': '#E65D65'
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#E65D65'
                      e.currentTarget.style.outline = '2px solid #E65D65'
                      e.currentTarget.style.outlineOffset = '0px'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.outline = 'none'
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t('messages.phoneFormatHint')}
                  </p>
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!selectedPostId || !salePrice || !threadDetail?.id) {
                      setSaleError(t('messages.pleaseEnterProductAndPrice'));
                      return;
                    }

                    const price = parseInt(salePrice);
                    if (isNaN(price) || price <= 0) {
                      setSaleError(t('messages.pleaseEnterValidPrice'));
                      return;
                    }

                    try {
                      setIsSubmittingSale(true);
                      setSaleError(null);

                      await messageApi.createSaleRequest({
                        thread_id: threadDetail.id,
                        post_id: selectedPostId,
                        price: price,
                        phone_number: phoneNumber || undefined,
                      });

                      // 売却リクエストのリストを再取得
                      const requests = await messageApi.getSaleRequests(threadDetail.id);
                      setSaleRequests(Array.isArray(requests) ? requests : []);

                      setShowSaleModal(false);
                      setSelectedPostId('');
                      setSalePrice('');
                      setPhoneNumber('');
                      setSaleError(null);
                    } catch (error: any) {
                      setSaleError(error.message || t('messages.failedToCreateSaleRequest'));
                    } finally {
                      setIsSubmittingSale(false);
                    }
                  }}
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingSale || !selectedPostId || !salePrice}
                  isLoading={isSubmittingSale}
                  loadingText={t('messages.submitting')}
                  style={{
                    backgroundColor: isSaleButtonHovered ? '#D14C54' : '#E65D65',
                    color: '#fff'
                  }}
                  onMouseEnter={() => setIsSaleButtonHovered(true)}
                  onMouseLeave={() => setIsSaleButtonHovered(false)}
                >
                  {t('messages.submit')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedPostId('');
                    setSalePrice('');
                    setPhoneNumber('');
                    setSaleError(null);
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={isSubmittingSale}
                >
                  {t('messages.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 買収モーダル（買収側） */}
      {showSaleModal && otherUserSaleRequest && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 py-12 sm:px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          <div className="bg-white py-8 px-4 sm:px-10 rounded-md w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold text-center flex-1"
                style={{
                  color: '#323232',
                  fontWeight: 900,
                  fontSize: '1.125rem',
                  letterSpacing: '0.02em'
                }}
              >
                {t('messages.saleInfo')}
              </h2>
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSaleError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {saleError && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="text-sm text-red-700">{saleError}</div>
              </div>
            )}

            <div className="space-y-6">
              {/* プロダクト名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('messages.productName')}
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-900">{otherUserSaleRequest.post?.title || t('messages.noInformation')}</p>
                </div>
              </div>

              {/* 価格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('messages.price')}
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-900 font-bold text-lg">
                    {otherUserSaleRequest.price ? `¥${otherUserSaleRequest.price.toLocaleString()}` : t('messages.noInformation')}
                  </p>
                </div>
              </div>

              {/* 電話番号 */}
              {otherUserSaleRequest.phone_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('messages.phoneNumber')}
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{otherUserSaleRequest.phone_number}</p>
                  </div>
                </div>
              )}


              {/* 買収ボタン */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!otherUserSaleRequest?.id) {
                      setSaleError(t('messages.saleRequestNotFound'));
                      return;
                    }

                    try {
                      setIsSubmittingSale(true);
                      setSaleError(null);

                      // エスクロー型決済: ステータスをactiveに変更
                      await messageApi.confirmSaleRequest({
                        sale_request_id: otherUserSaleRequest.id,
                      });

                      // 購入確定成功メッセージを表示
                      alert(t('messages.purchaseConfirmed'));

                      // ページをリロードして最新の状態を取得
                      window.location.reload();
                    } catch (error: any) {
                      setSaleError(error.message || t('messages.failedToPurchase'));
                    } finally {
                      setIsSubmittingSale(false);
                    }
                  }}
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingSale}
                  isLoading={isSubmittingSale}
                  loadingText={t('messages.processing')}
                  style={{
                    backgroundColor: isSaleButtonHovered ? '#D14C54' : '#E65D65',
                    color: '#fff'
                  }}
                  onMouseEnter={() => setIsSaleButtonHovered(true)}
                  onMouseLeave={() => setIsSaleButtonHovered(false)}
                >
                  {t('messages.purchase')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSaleError(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {t('messages.close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MessageThread);
