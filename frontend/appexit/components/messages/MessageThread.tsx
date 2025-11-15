'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageWithSender, ThreadDetail, messageApi, postApi, Post } from '@/lib/api-client';
import { Image as ImageIcon, X, FileText, File, Briefcase, Scale, Users, Info, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { truncateDisplayName } from '@/lib/text-utils';
import { useAuth } from '@/lib/auth-context';

interface MessageThreadProps {
  threadDetail: ThreadDetail | null;
  messages: MessageWithSender[];
  currentUserId: string;
  onSendMessage: (text: string, imageFile?: File | null) => Promise<void>;
  isSending: boolean;
  isLoadingMessages: boolean;
  onBack?: () => void;
}

// 契約書の署名情報
interface ContractSignature {
  user_id: string;
  signed_at: string;
  signature_data?: string;
}

// 契約書の種類
interface ContractDocument {
  id: string; // contract_typeまたはカスタム契約書のID
  name: string;
  icon: any; // Lucide icon component
  file: File | null;
  preview: string | null;
  filePath: string | null; // ストレージに保存されたファイルパス
  signedUrl: string | null; // 署名付きURL
  contentType?: string; // MIMEタイプ
  fileName?: string; // ファイル名
  dbId?: string; // データベースのID（thread_contract_documents.id）
  signatures?: ContractSignature[]; // 署名情報
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
  console.log('[MESSAGE-THREAD-COMPONENT] Render:', { isLoadingMessages, messagesLength: messages.length });
  const router = useRouter();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // 売却モーダルの状態
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [showSaleInfoTooltip, setShowSaleInfoTooltip] = useState(false);
  const [isSaleButtonHovered, setIsSaleButtonHovered] = useState(false);
  
  // 売却リクエストの状態
  const [saleRequests, setSaleRequests] = useState<any[]>([]);
  const [isLoadingSaleRequests, setIsLoadingSaleRequests] = useState(false);

  // 契約書セクションの展開状態
  const [isContractExpanded, setIsContractExpanded] = useState(false);
  
  // バリデーションエラーメッセージ
  const [contractError, setContractError] = useState<string | null>(null);

  // 契約書のリスト
  const [contracts, setContracts] = useState<ContractDocument[]>([
    { id: 'nda', name: '秘密保持契約（NDA）', icon: FileText, file: null, preview: null, filePath: null, signedUrl: null },
    { id: 'loi', name: '基本合意書（LOI / MOU）', icon: File, file: null, preview: null, filePath: null, signedUrl: null },
    { id: 'dd', name: 'デューデリジェンス関連の資料', icon: Briefcase, file: null, preview: null, filePath: null, signedUrl: null },
    { id: 'transfer', name: '事業譲渡契約', icon: Scale, file: null, preview: null, filePath: null, signedUrl: null },
    { id: 'handover', name: '引継ぎ業務委託契約', icon: Users, file: null, preview: null, filePath: null, signedUrl: null },
  ]);

  // 追加の契約書
  const [customContracts, setCustomContracts] = useState<ContractDocument[]>([]);

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
        console.error('投稿の取得に失敗しました:', error);
        setSaleError('投稿の取得に失敗しました');
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
        console.error('売却リクエストの取得に失敗しました:', error);
      } finally {
        setIsLoadingSaleRequests(false);
      }
    };
    
    fetchSaleRequests();
    
    // 5秒ごとに売却リクエストを再取得（リアルタイム更新）
    const intervalId = setInterval(() => {
      if (threadDetail?.id) {
        messageApi.getSaleRequests(threadDetail.id)
          .then(requests => {
            setSaleRequests(Array.isArray(requests) ? requests : []);
          })
          .catch(error => {
            console.error('売却リクエストの取得に失敗しました:', error);
          });
      }
    }, 5000);
    
    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [threadDetail?.id]);

  // 既存の契約書を取得
  useEffect(() => {
    const fetchContractDocuments = async () => {
      if (!threadDetail?.id) {
        return;
      }

      try {
        const { messageApi } = await import('@/lib/api-client');
        const contractDocs = await messageApi.getThreadContractDocuments(threadDetail.id);
        
        console.log('[MessageThread] Fetched contract documents:', contractDocs);
        
        if (Array.isArray(contractDocs) && contractDocs.length > 0) {
          // 標準契約書を更新
          setContracts(prev => prev.map(contract => {
            const existingDoc = contractDocs.find(doc => doc.contract_type === contract.id);
            if (existingDoc) {
              console.log('[MessageThread] Found existing contract:', contract.id, existingDoc);
              return {
                ...contract,
                dbId: existingDoc.id, // データベースIDを保存
                filePath: existingDoc.file_path,
                signedUrl: existingDoc.signed_url,
                preview: null, // 既存のものはsignedUrlを使用
                file: null, // 既存のものはfileオブジェクトなし
                contentType: existingDoc.content_type,
                fileName: existingDoc.file_name,
                signatures: existingDoc.signatures || [], // 署名情報を保存
              };
            }
            return contract;
          }));

          // カスタム契約書を追加（contract_typeが'custom'のもの）
          const customDocs = contractDocs.filter(doc => doc.contract_type === 'custom');
          if (customDocs.length > 0) {
            const customContractsList: ContractDocument[] = customDocs.map((doc) => ({
              id: doc.id, // データベースのIDを使用
              dbId: doc.id, // データベースIDを保存
              name: doc.file_name || 'その他の契約書',
              icon: FileText,
              file: null,
              preview: null,
              filePath: doc.file_path,
              signedUrl: doc.signed_url,
              contentType: doc.content_type,
              fileName: doc.file_name,
              signatures: doc.signatures || [], // 署名情報を保存
            }));
            setCustomContracts(customContractsList);
          } else {
            // カスタム契約書がない場合は空配列にリセット
            setCustomContracts([]);
          }
        } else {
          // 契約書がない場合はリセット
          console.log('[MessageThread] No contract documents found');
          setContracts(prev => prev.map(contract => ({
            ...contract,
            filePath: null,
            signedUrl: null,
            preview: null,
            file: null,
          })));
          setCustomContracts([]);
        }
      } catch (err) {
        console.error('Failed to fetch contract documents:', err);
      }
    };

    fetchContractDocuments();
  }, [threadDetail?.id]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;

    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = () => {
    if (!threadDetail || !threadDetail.participants) return null;
    return threadDetail.participants.find(p => p.id !== currentUserId);
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

  // 契約書ファイルのアップロード（ストレージに保存）
  const handleContractFileSelect = (contractId: string, isCustom: boolean = false) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PDFファイルのみを受け付けるバリデーション
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setContractError('PDFファイルのみアップロード可能です。');
      // エラーメッセージを3秒後に消す
      setTimeout(() => {
        setContractError(null);
      }, 3000);
      // ファイル入力をリセット
      e.target.value = '';
      return;
    }

    // エラーメッセージをクリア
    setContractError(null);

    // PDFファイルの場合はプレビューなしでファイル情報のみ保存
    // PDFは画像としてプレビューできないため、常にpreview: nullとする
    if (isCustom) {
      setCustomContracts(prev =>
        prev.map(contract =>
          contract.id === contractId
            ? { ...contract, file, preview: null }
            : contract
        )
      );
    } else {
      setContracts(prev =>
        prev.map(contract =>
          contract.id === contractId
            ? { ...contract, file, preview: null }
            : contract
        )
      );
    }

    // ストレージに保存
    if (!threadDetail?.id) {
      console.error('Thread ID is required to upload contract');
      return;
    }

    try {
      const { messageApi } = await import('@/lib/api-client');
      // contractIdをcontract_typeとして使用（customの場合は'custom'）
      const contractType = isCustom ? 'custom' : contractId;
      const uploadResponse = await messageApi.uploadContractDocument(file, threadDetail.id, contractType);
      
      if (uploadResponse.success && uploadResponse.data) {
        // アップロード後、契約書一覧を再取得してdbIdを取得
        const contractDocs = await messageApi.getThreadContractDocuments(threadDetail.id);
        const uploadedDoc = contractDocs.find(doc => 
          isCustom 
            ? doc.contract_type === 'custom' && doc.file_path === uploadResponse.data.file_path
            : doc.contract_type === contractId && doc.file_path === uploadResponse.data.file_path
        );
        
        const filePath = uploadResponse.data.file_path;
        const signedUrl = uploadResponse.data.signed_url;

        if (isCustom) {
          setCustomContracts(prev =>
            prev.map(contract =>
              contract.id === contractId
                ? {
                    ...contract,
                    dbId: uploadedDoc?.id, // データベースIDを設定
                    filePath,
                    signedUrl,
                    contentType: file.type,
                    fileName: file.name,
                    signatures: uploadedDoc?.signatures || [], // 署名情報を設定
                  }
                : contract
            )
          );
        } else {
          setContracts(prev =>
            prev.map(contract =>
              contract.id === contractId
                ? {
                    ...contract,
                    dbId: uploadedDoc?.id, // データベースIDを設定
                    filePath,
                    signedUrl,
                    contentType: file.type,
                    fileName: file.name,
                    signatures: uploadedDoc?.signatures || [], // 署名情報を設定
                  }
                : contract
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to upload contract:', err);
      // エラーが発生してもプレビューは表示する
    }
  };

  // カスタム契約書の追加
  const handleAddCustomContract = () => {
    const customId = `custom-${Date.now()}`;
    setCustomContracts(prev => [
      ...prev,
      {
        id: customId,
        name: 'その他の契約書',
        icon: FileText,
        file: null,
        preview: null,
        filePath: null,
        signedUrl: null,
      }
    ]);
  };

  // カスタム契約書の削除
  const handleRemoveCustomContract = (contractId: string) => {
    setCustomContracts(prev => prev.filter(contract => contract.id !== contractId));
  };

  // 契約書ページに遷移
  const handleContractClick = (contract: ContractDocument) => {
    // 契約書が設定されている場合のみ遷移
    if (!contract.filePath && !contract.signedUrl) {
      return;
    }

    if (!threadDetail?.id || !contract.dbId) {
      return;
    }

    // データベースIDを使用して遷移
    router.push(`/messages/${threadDetail.id}/${contract.dbId}`);
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
  
  // 売却リクエストの状態を判定
  const currentUserSaleRequest = saleRequests.find(req => req.user_id === currentUserId && req.status === 'pending');
  const otherUserSaleRequest = saleRequests.find(req => req.user_id !== currentUserId && req.status === 'pending');
  
  // ボタンの表示を判定
  const getSaleButtonConfig = () => {
    if (currentUserSaleRequest) {
      // 自分が売却リクエストを出している場合
      return {
        text: '売却中',
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
        text: '買収する',
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
        text: '売却する',
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
        <div className="grid grid-cols-3 items-center gap-4">
          {/* 左側：ユーザー情報 */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                aria-label="戻る"
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
              className="relative hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {otherParticipant?.icon_url ? (
                  <img
                    src={otherParticipant.icon_url}
                    alt={otherParticipant.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                if (otherParticipant?.id) {
                  router.push(`/profiles/${otherParticipant.id}`);
                }
              }}
              className="hidden md:block hover:opacity-80 transition-opacity cursor-pointer"
            >
              <h2 className="font-semibold" title={otherParticipant?.display_name || 'ユーザー'}>
                {otherParticipant?.display_name ? truncateDisplayName(otherParticipant.display_name, 'header') : 'ユーザー'}
              </h2>
            </button>
          </div>

          {/* 中央：契約書状況 */}
          <div
            className="flex items-center justify-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => setIsContractExpanded(!isContractExpanded)}
          >
            <span className="font-semibold" style={{ color: '#323232' }}>
              契約書状況
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isContractExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: '#323232' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* 右側：売却するボタン */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm border-2 gap-2"
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

      {/* 契約書アップロードエリア（展開時のみ表示） */}
      {isContractExpanded && (
        <div className="absolute top-[73px] left-0 right-0 z-20 p-3 bg-white border-b border-gray-200 shadow-md overflow-y-auto max-h-64">
          <div className="max-w-4xl mx-auto">
            {/* バリデーションエラーメッセージ */}
            {contractError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{contractError}</p>
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
              {/* 標準契約書 */}
              {contracts.map((contract) => {
                const IconComponent = contract.icon;
                const hasContract = contract.filePath || contract.signedUrl;
                const currentUserSigned = contract.signatures?.some(sig => sig.user_id === currentUserId) || false;
                const otherUserSigned = contract.signatures?.some(sig => sig.user_id !== currentUserId) || false;
                return (
                  <div key={contract.id} className="relative">
                    {hasContract ? (
                      <div
                        onClick={() => handleContractClick(contract)}
                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative border-[#323232] hover:opacity-80`}
                      >
                        <div className="absolute inset-0 p-2 flex flex-col">
                          <div className="flex-1 relative">
                            {contract.contentType && contract.contentType.startsWith('image/') ? (
                              <Image
                                src={contract.signedUrl || contract.preview || ''}
                                alt={contract.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                                <IconComponent className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-900 truncate text-center">
                              {contract.name}
                            </p>
                            {/* 署名状況インジケーター */}
                            {currentUserSigned && otherUserSigned ? (
                              <div className="flex items-center justify-center mt-1">
                                <div className="flex items-center justify-center w-full py-1 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                                  <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${currentUserSigned ? 'bg-green-100' : 'bg-gray-100'}`}>
                                  <span className="text-[9px] font-bold" style={{ color: currentUserSigned ? '#10B981' : '#9CA3AF' }}>自分</span>
                                  {currentUserSigned && <Check className="w-2.5 h-2.5" style={{ color: '#10B981' }} />}
                                </div>
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${otherUserSigned ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                  <span className="text-[9px] font-bold" style={{ color: otherUserSigned ? '#3B82F6' : '#9CA3AF' }}>相手</span>
                                  {otherUserSigned && <Check className="w-2.5 h-2.5" style={{ color: '#3B82F6' }} />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative border-gray-300 hover:bg-white`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 p-2">
                          <IconComponent className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-gray-600 text-center leading-tight">
                            {contract.name}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf,.pdf"
                          onChange={handleContractFileSelect(contract.id, false)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}

              {/* カスタム契約書 */}
              {customContracts.map((contract) => {
                const IconComponent = contract.icon;
                const hasContract = contract.filePath || contract.signedUrl;
                const currentUserSigned = contract.signatures?.some(sig => sig.user_id === currentUserId) || false;
                const otherUserSigned = contract.signatures?.some(sig => sig.user_id !== currentUserId) || false;
                return (
                  <div key={contract.id} className="relative">
                    {hasContract ? (
                      <div
                        onClick={() => handleContractClick(contract)}
                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative border-[#323232] hover:opacity-80`}
                      >
                        <div className="absolute inset-0 p-2 flex flex-col">
                          <div className="flex-1 relative">
                            {contract.contentType && contract.contentType.startsWith('image/') ? (
                              <Image
                                src={contract.signedUrl || contract.preview || ''}
                                alt={contract.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                                <IconComponent className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-900 truncate text-center">
                              {contract.name}
                            </p>
                            {/* 署名状況インジケーター */}
                            {currentUserSigned && otherUserSigned ? (
                              <div className="flex items-center justify-center mt-1">
                                <div className="flex items-center justify-center w-full py-1 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                                  <Check className="w-4 h-4" style={{ color: '#10B981' }} />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${currentUserSigned ? 'bg-green-100' : 'bg-gray-100'}`}>
                                  <span className="text-[9px] font-bold" style={{ color: currentUserSigned ? '#10B981' : '#9CA3AF' }}>自分</span>
                                  {currentUserSigned && <Check className="w-2.5 h-2.5" style={{ color: '#10B981' }} />}
                                </div>
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${otherUserSigned ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                  <span className="text-[9px] font-bold" style={{ color: otherUserSigned ? '#3B82F6' : '#9CA3AF' }}>相手</span>
                                  {otherUserSigned && <Check className="w-2.5 h-2.5" style={{ color: '#3B82F6' }} />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative border-gray-300 hover:bg-white`}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 p-2">
                          <IconComponent className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-gray-600 text-center leading-tight">
                            {contract.name}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf,.pdf"
                          onChange={handleContractFileSelect(contract.id, true)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}

              {/* 追加ボタン */}
              <button
                type="button"
                onClick={handleAddCustomContract}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:bg-white transition-colors flex flex-col items-center justify-center gap-2 text-gray-600 p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-semibold text-center leading-tight">その他を追加</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 bg-white shadow-inner">
        {isLoadingMessages ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>メッセージがありません</p>
            <p className="text-sm mt-2">最初のメッセージを送信しましょう</p>
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
                        alt="送信画像"
                        className="max-w-full max-h-64 rounded-lg object-contain"
                        onError={(e) => {
                          console.error('Failed to load image:', message.image_url);
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
                      <span className="text-xs opacity-70">• 送信中...</span>
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
                placeholder="新しいメッセージを作成"
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

      {/* 売却モーダル */}
      {showSaleModal && (
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
                売却リクエストを作成
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowSaleInfoTooltip(true)}
                    onMouseLeave={() => setShowSaleInfoTooltip(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="情報"
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
                        これはアプリを売る側の操作です
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
                  売却するプロダクト
                </label>
                <div className="mt-1">
                  {isLoadingPosts ? (
                    <div className="p-4 text-center text-gray-500 text-sm">読み込み中...</div>
                  ) : userPosts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      投稿したプロダクトがありません
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
                      <option value="">選択してください</option>
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
                  希望価格（円）
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
                    placeholder="例: 1000000"
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

              {/* 送信ボタン */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!selectedPostId || !salePrice || !threadDetail?.id) {
                      setSaleError('プロダクトと価格を入力してください');
                      return;
                    }

                    const price = parseInt(salePrice);
                    if (isNaN(price) || price <= 0) {
                      setSaleError('有効な価格を入力してください');
                      return;
                    }

                    try {
                      setIsSubmittingSale(true);
                      setSaleError(null);

                      await messageApi.createSaleRequest({
                        thread_id: threadDetail.id,
                        post_id: selectedPostId,
                        price: price,
                      });

                      // 売却リクエストのリストを再取得
                      const requests = await messageApi.getSaleRequests(threadDetail.id);
                      setSaleRequests(Array.isArray(requests) ? requests : []);

                      setShowSaleModal(false);
                      setSelectedPostId('');
                      setSalePrice('');
                      setSaleError(null);
                    } catch (error: any) {
                      console.error('売却リクエストの作成に失敗しました:', error);
                      setSaleError(error.message || '売却リクエストの作成に失敗しました');
                    } finally {
                      setIsSubmittingSale(false);
                    }
                  }}
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingSale || !selectedPostId || !salePrice}
                  isLoading={isSubmittingSale}
                  loadingText="送信中..."
                  style={{
                    backgroundColor: isSaleButtonHovered ? '#D14C54' : '#E65D65',
                    color: '#fff'
                  }}
                  onMouseEnter={() => setIsSaleButtonHovered(true)}
                  onMouseLeave={() => setIsSaleButtonHovered(false)}
                >
                  送信
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    setSelectedPostId('');
                    setSalePrice('');
                    setSaleError(null);
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={isSubmittingSale}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MessageThread);
