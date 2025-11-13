'use client';

import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { Image as ImageIcon, X, FileText, File, Briefcase, Scale, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { truncateDisplayName } from '@/lib/text-utils';

interface MessageThreadProps {
  threadDetail: ThreadDetail | null;
  messages: MessageWithSender[];
  currentUserId: string;
  onSendMessage: (text: string, imageFile?: File | null) => Promise<void>;
  isSending: boolean;
  isLoadingMessages: boolean;
  onBack?: () => void;
}

// 契約書の種類
interface ContractDocument {
  id: string;
  name: string;
  icon: any; // Lucide icon component
  file: File | null;
  preview: string | null;
  filePath: string | null; // ストレージに保存されたファイルパス
  signedUrl: string | null; // 署名付きURL
  contentType?: string; // MIMEタイプ
  fileName?: string; // ファイル名
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
  const [newMessage, setNewMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 契約書セクションの展開状態
  const [isContractExpanded, setIsContractExpanded] = useState(false);

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
                filePath: existingDoc.file_path,
                signedUrl: existingDoc.signed_url,
                preview: null, // 既存のものはsignedUrlを使用
                file: null, // 既存のものはfileオブジェクトなし
                contentType: existingDoc.content_type,
                fileName: existingDoc.file_name,
              };
            }
            return contract;
          }));

          // カスタム契約書を追加（contract_typeが'custom'のもの）
          const customDocs = contractDocs.filter(doc => doc.contract_type === 'custom');
          if (customDocs.length > 0) {
            const customContractsList: ContractDocument[] = customDocs.map((doc) => ({
              id: doc.id, // データベースのIDを使用
              name: doc.file_name || 'その他の契約書',
              icon: FileText,
              file: null,
              preview: null,
              filePath: doc.file_path,
              signedUrl: doc.signed_url,
              contentType: doc.content_type,
              fileName: doc.file_name,
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

    // プレビューを生成
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;

      if (isCustom) {
        setCustomContracts(prev =>
          prev.map(contract =>
            contract.id === contractId
              ? { ...contract, file, preview }
              : contract
          )
        );
      } else {
        setContracts(prev =>
          prev.map(contract =>
            contract.id === contractId
              ? { ...contract, file, preview }
              : contract
          )
        );
      }
    };
    reader.readAsDataURL(file);

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
        const filePath = uploadResponse.data.file_path;
        
        // 署名付きURLを取得
        const { getImageUrl } = await import('@/lib/storage');
        const signedUrl = await getImageUrl(filePath, 'contract-documents');

        if (isCustom) {
          setCustomContracts(prev =>
            prev.map(contract =>
              contract.id === contractId
                ? { 
                    ...contract, 
                    filePath, 
                    signedUrl,
                    contentType: file.type,
                    fileName: file.name,
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
                    filePath, 
                    signedUrl,
                    contentType: file.type,
                    fileName: file.name,
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

  // 契約書を削除
  const handleRemoveContract = (contractId: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomContracts(prev =>
        prev.map(c =>
          c.id === contractId
            ? { ...c, file: null, preview: null, filePath: null, signedUrl: null }
            : c
        )
      );
    } else {
      setContracts(prev =>
        prev.map(c =>
          c.id === contractId
            ? { ...c, file: null, preview: null, filePath: null, signedUrl: null }
            : c
        )
      );
    }
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
            <div className="relative">
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
            </div>
            <div className="hidden md:block">
              <h2 className="font-semibold" title={otherParticipant?.display_name || 'ユーザー'}>
                {otherParticipant?.display_name ? truncateDisplayName(otherParticipant.display_name, 'header') : 'ユーザー'}
              </h2>
            </div>
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
              className="rounded-sm bg-transparent border-2 hover:opacity-80 gap-2"
              style={{ borderColor: '#E65D65', color: '#E65D65' }}
            >
              売却する
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
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
              {/* 標準契約書 */}
              {contracts.map((contract) => {
                const IconComponent = contract.icon;
                return (
                  <div key={contract.id} className="relative">
                    <label
                      className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                        (contract.preview || contract.signedUrl) ? 'border-[#323232]' : 'border-gray-300 hover:bg-white'
                      }`}
                    >
                      {(contract.preview || contract.signedUrl) ? (
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
                            <p className="text-[10px] text-gray-500 truncate text-center">
                              {contract.file?.name || contract.fileName || (contract.filePath ? contract.filePath.split('/').pop() : '')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-2">
                          <IconComponent className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-gray-600 text-center leading-tight">
                            {contract.name}
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleContractFileSelect(contract.id, false)}
                      />
                    </label>
                    {(contract.file || contract.filePath) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveContract(contract.id, false)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              {/* カスタム契約書 */}
              {customContracts.map((contract) => {
                const IconComponent = contract.icon;
                return (
                  <div key={contract.id} className="relative">
                    <label
                      className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                        (contract.preview || contract.signedUrl) ? 'border-[#323232]' : 'border-gray-300 hover:bg-white'
                      }`}
                    >
                      {(contract.preview || contract.signedUrl) ? (
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
                            <p className="text-[10px] text-gray-500 truncate text-center">
                              {contract.file?.name || contract.fileName || (contract.filePath ? contract.filePath.split('/').pop() : '')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 p-2">
                          <IconComponent className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                          <p className="text-xs font-semibold text-gray-600 text-center leading-tight">
                            {contract.name}
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleContractFileSelect(contract.id, true)}
                      />
                    </label>
                    {(contract.file || contract.filePath) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (contract.file) {
                            handleRemoveContract(contract.id, true);
                          } else {
                            handleRemoveCustomContract(contract.id);
                          }
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      >
                        ×
                      </button>
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
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
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
    </div>
  );
}

export default memo(MessageThread);
