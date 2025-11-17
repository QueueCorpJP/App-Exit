'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { messageApi } from '@/lib/api-client';
import { FileText, Download, Trash2, X, FileSignature } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';

interface ContractDocumentPageProps {
  threadId: string;
  contractId: string;
  pageDict?: Record<string, any>;
}

interface ContractDocument {
  id: string;
  thread_id: string;
  uploaded_by: string;
  contract_type: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  content_type: string;
  signed_url: string;
  created_at: string;
  updated_at: string;
  signatures?: ContractSignature[];
}

interface ContractSignature {
  user_id: string;
  signed_at: string;
  signature_data?: string;
}


export default function ContractDocumentPage({ threadId, contractId, pageDict }: ContractDocumentPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signToAllPages, setSignToAllPages] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // モーダルが開いているときにbodyのスクロールを無効化
  useEffect(() => {
    if (showSignaturePad || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSignaturePad, showDeleteConfirm]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ContractDocumentPage] Fetching contract:', { threadId, contractId });

        const contracts = await messageApi.getThreadContractDocuments(threadId);
        const foundContract = contracts.find(c => c.id === contractId);

        console.log('[ContractDocumentPage] All contracts:', contracts);
        console.log('[ContractDocumentPage] Found contract:', foundContract);

        if (!foundContract) {
          setError(t('contractNotFound'));
          return;
        }

        setContract(foundContract);

        // プレビューURLを作成（キャッシュ無効化）
        if ((foundContract.content_type === 'application/pdf' ||
             foundContract.file_name?.toLowerCase().endsWith('.pdf')) &&
            foundContract.signed_url) {
          try {
            const cacheBustedUrl = `${foundContract.signed_url}${foundContract.signed_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
            const resp = await fetch(cacheBustedUrl, { cache: 'no-store' });
            const blob = await resp.blob();
            const objectUrl = URL.createObjectURL(blob);
            // 既存URLの解放
            setPdfPreviewUrl(prev => {
              if (prev) URL.revokeObjectURL(prev);
              return objectUrl;
            });
          } catch (e) {
            console.warn('[ContractDocumentPage] Failed to prepare preview URL:', e);
            setPdfPreviewUrl(null);
          }
        } else {
          setPdfPreviewUrl(null);
        }

        // PDFの場合、ページ数を取得
        if ((foundContract.content_type === 'application/pdf' ||
             foundContract.file_name?.toLowerCase().endsWith('.pdf')) &&
            foundContract.signed_url) {
          try {
            const { PDFDocument } = await import('pdf-lib');
            const response = await fetch(foundContract.signed_url);
            const arrayBuffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            setPdfPageCount(pdfDoc.getPageCount());
          } catch (err) {
            console.error('[ContractDocumentPage] Failed to load PDF:', err);
          }
        }
      } catch (err) {
        console.error('[ContractDocumentPage] Failed to fetch contract:', err);
        setError(t('contractFetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (threadId && contractId) {
      fetchContract();
    }
  }, [threadId, contractId]);


  const handleDelete = async () => {
    if (!contract) return;

    try {
      setIsDeleting(true);
      // TODO: 削除APIエンドポイントができたら実装
      alert(t('contractDeleteInDev'));
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete contract:', err);
      alert(t('deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureData || !contract) return;

    try {
      setIsSaving(true);

      // PDFの場合、署名を埋め込んだ新しいPDFを作成
      if ((contract.content_type === 'application/pdf' ||
           contract.file_name?.toLowerCase().endsWith('.pdf')) &&
          contract.signed_url) {

        // pdf-libを動的にインポート
        const { PDFDocument } = await import('pdf-lib');

        // 元のPDFを取得
        const response = await fetch(contract.signed_url);
        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // 署名画像をPNGとして埋め込む
        const signatureImageBytes = await fetch(signatureData).then(res => res.arrayBuffer());
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

        // 署名の基準サイズ（ページごとに動的調整）
        const getSignatureSize = (pageWidth: number) => {
          const targetWidth = Math.min(pageWidth * 0.28, 320); // ページ幅の約28%（最大320px）
          const targetHeight = (signatureImage.height / signatureImage.width) * targetWidth;
          return { w: targetWidth, h: targetHeight };
        };

        const pages = pdfDoc.getPages();
        console.log(`[ContractDocumentPage] PDF has ${pages.length} pages`);
        console.log(`[ContractDocumentPage] Sign to all pages: ${signToAllPages}`);
        
        if (signToAllPages) {
          // すべてのページに署名を配置
          console.log('[ContractDocumentPage] Adding signature to all pages');
          pages.forEach((page, index) => {
            const { width, height } = page.getSize();
            const { w, h } = getSignatureSize(width);
            console.log(`[ContractDocumentPage] Page ${index + 1}: ${width}x${height}`);
            page.drawImage(signatureImage, {
              x: (width - w) / 2, // 中央配置（確実に視認できる位置）
              y: (height - h) / 2,
              width: w,
              height: h,
            });
            console.log(`[ContractDocumentPage] Signature added to page ${index + 1}`);
          });
        } else {
          // 最後のページのみに署名を配置
          console.log('[ContractDocumentPage] Adding signature to last page only');
          const lastPage = pages[pages.length - 1];
          const { width, height } = lastPage.getSize();
          const { w, h } = getSignatureSize(width);
          console.log(`[ContractDocumentPage] Last page: ${width}x${height}`);
          lastPage.drawImage(signatureImage, {
            x: (width - w) / 2,
            y: (height - h) / 2,
            width: w,
            height: h,
          });
        }

        // PDFを保存
        console.log('[ContractDocumentPage] Saving PDF...');
        const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
        const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        // デバッグ: 生成PDFをその場で確認できるURLをコンソールに出力
        try {
          const debugUrl = URL.createObjectURL(pdfBlob);
          console.log('[ContractDocumentPage] Preview signed PDF URL (copy & open in new tab):', debugUrl);
        } catch {}
        console.log(`[ContractDocumentPage] PDF saved, size: ${pdfBlob.size} bytes`);

        // 署名入りPDFをアップロード
        console.log('[ContractDocumentPage] Uploading signed PDF...');
        await messageApi.updateContract(contract.id, pdfBlob, contract.file_name);
        console.log('[ContractDocumentPage] Upload complete');

        alert(t('contractSignatureAddedToPdf'));
      } else {
        // 画像の場合は従来通りデータベースに保存
        await messageApi.addContractSignature(contract.id, signatureData);
        alert(t('contractSignatureSaved'));
      }

      setSignatureData(null);
      setShowSignaturePad(false);
      setSignToAllPages(false);

      // 契約書情報を再取得（キャッシュを回避するため少し待つ）
      await new Promise(resolve => setTimeout(resolve, 1000));
      const contracts = await messageApi.getThreadContractDocuments(threadId);
      const updatedContract = contracts.find(c => c.id === contractId);
      if (updatedContract) {
        setContract(updatedContract);
        
        // PDFページ数も再取得
        if ((updatedContract.content_type === 'application/pdf' ||
             updatedContract.file_name?.toLowerCase().endsWith('.pdf')) &&
            updatedContract.signed_url) {
          try {
            const { PDFDocument } = await import('pdf-lib');
            // キャッシュバスティングのためタイムスタンプを追加
            const cacheBustedUrl = `${updatedContract.signed_url}${updatedContract.signed_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
            const response = await fetch(cacheBustedUrl);
            const arrayBuffer = await response.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            setPdfPageCount(pdfDoc.getPageCount());
            console.log('[ContractDocumentPage] PDF reloaded, pages:', pdfDoc.getPageCount());

            // プレビューURLも更新
            const previewResp = await fetch(cacheBustedUrl, { cache: 'no-store' });
            const previewBlob = await previewResp.blob();
            const objectUrl = URL.createObjectURL(previewBlob);
            setPdfPreviewUrl(prev => {
              if (prev) URL.revokeObjectURL(prev);
              return objectUrl;
            });
          } catch (err) {
            console.error('[ContractDocumentPage] Failed to reload PDF:', err);
            setPdfPreviewUrl(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to save signature:', err);
      alert(t('contractSignatureSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!contract?.signed_url) return;

    try {
      const response = await fetch(contract.signed_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
      alert(t('downloadFailed'));
    }
  };

  // 署名パッド関連
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#323232';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignatureComplete = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return t('contractFileSizeUnknown');
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getContractTypeName = (contractType: string) => {
    const typeMap: Record<string, string> = {
      'nda': t('contractTypeNDA'),
      'loi': t('contractTypeLOI'),
      'dd': t('contractTypeDD'),
      'transfer': t('contractTypeTransfer'),
      'handover': t('contractTypeHandover'),
      'custom': t('contractTypeCustom'),
    };
    return typeMap[contractType] || contractType;
  };

  // 契約状態の判定
  const getContractStatus = () => {
    if (!contract?.signatures || contract.signatures.length === 0) {
      return {
        text: t('contractStatusUnsigned'),
        color: 'bg-gray-100 text-gray-800'
      };
    }
    if (contract.signatures.length === 1) {
      return {
        text: t('contractStatusPartial'),
        color: 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      text: t('contractStatusFully'),
      color: 'bg-green-100 text-green-800'
    };
  };

  const contractStatus = contract ? getContractStatus() : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E65D65' }}></div>
          <p className="mt-4 text-gray-600">
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="sticky top-16 bg-white z-10 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center h-14">
              <button
                onClick={() => router.push(`/messages/${threadId}`)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors mr-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold" style={{ color: '#323232' }}>
                {t('contractDocumentTitle')}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="mb-4" style={{ color: '#E65D65' }}>
              {error || t('contractNotFound')}
            </p>
            <Button
              onClick={() => router.push(`/messages/${threadId}`)}
              variant="outline"
            >
              {t('contractBackToMessages')}
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* ヘッダー */}
      <div className="sticky top-16 bg-white z-10 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/messages/${threadId}`)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold" style={{ color: '#323232' }}>{getContractTypeName(contract.contract_type)}</h1>
              {contractStatus && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${contractStatus.color}`}>
                  {contractStatus.text}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSignaturePad(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={t('contractSign')}
              >
                <FileSignature className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={t('contractDownload')}
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={t('delete')}
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto">
        {/* 契約書情報 */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#323232' }}>{contract.file_name}</h2>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>
                  {t('contractType')}: {getContractTypeName(contract.contract_type)}
                </span>
                <span>
                  {t('contractSize')}: {formatFileSize(contract.file_size)}
                </span>
                {contract.signatures && contract.signatures.length > 0 && (
                  <span>
                    {t('contractSignatures')}: {t('contractSignatureCount', { count: contract.signatures.length })}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500 text-right">
              {formatDate(contract.created_at)}
            </div>
          </div>
        </div>

        {/* プレビュー/署名エリア */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#323232' }}>
            {t('contractPreview')}
          </h3>

          {/* 画像と署名のオーバーレイ表示エリア */}
          <div className="mb-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {contract.signed_url ? (
                <>
                  {(() => {
                    console.log('[ContractDocumentPage] Rendering contract:', {
                      content_type: contract.content_type,
                      signed_url: contract.signed_url,
                      file_name: contract.file_name
                    });
                    return null;
                  })()}
                  {/* MIME 判定が不正な場合があるため、拡張子でもPDFを判定 */}
                  {(contract.content_type === 'application/pdf' ||
                    contract.file_name?.toLowerCase().endsWith('.pdf')) ? (
                    // PDFの場合はiframeで表示（キャッシュバスティング付き）
                    <div className="w-full" style={{ height: '800px' }}>
                      <iframe
                        key={pdfPreviewUrl || contract.signed_url} 
                        src={`${(pdfPreviewUrl || contract.signed_url)}#toolbar=1&view=FitH`}
                        className="w-full h-full"
                        title={contract.file_name}
                        style={{ border: 'none' }}
                      />
                    </div>
                  ) : contract.content_type?.startsWith('image/') ? (
                    // 画像の場合は従来通り表示
                    <div className="flex justify-center items-start p-4">
                      <div className="relative inline-block">
                        <img
                          src={contract.signed_url}
                          alt={contract.file_name}
                          className="max-w-full h-auto shadow-lg"
                        />

                        {/* 署名をオーバーレイ表示 */}
                        {contract.signatures && contract.signatures.map((sig, index) => (
                          sig.signature_data && (
                            <div
                              key={index}
                              className="absolute bg-white bg-opacity-90 border-2 rounded p-2 shadow-lg"
                              style={{
                                borderColor: '#323232',
                                top: `${20 + index * 120}px`,
                                right: '20px',
                                maxWidth: '250px',
                              }}
                            >
                              <img
                                src={sig.signature_data}
                                alt={`署名 ${index + 1}`}
                                className="w-full h-auto"
                              />
                              <p className="text-xs text-gray-600 mt-1 text-center">
                                {formatDate(sig.signed_at)}
                              </p>
                            </div>
                          )
                        ))}

                        {/* 現在の署名（未保存）をオーバーレイ表示 */}
                        {signatureData && (
                          <div
                            className="absolute bg-white bg-opacity-90 border-2 rounded p-2 shadow-lg"
                            style={{
                              borderColor: '#E65D65',
                              top: `${20 + (contract.signatures?.length || 0) * 120}px`,
                              right: '20px',
                              maxWidth: '250px',
                            }}
                          >
                            <img
                              src={signatureData}
                              alt="新しい署名"
                              className="w-full h-auto"
                            />
                            <p className="text-xs mt-1 text-center" style={{ color: '#E65D65' }}>
                              未保存
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // その他のファイル形式はダウンロードのみ
                    <div className="flex flex-col items-center justify-center p-12">
                      <FileText className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">
                        {t('contractFileCannotPreview')}
                      </p>
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        {t('contractDownload')}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    {t('contractFileNotFound')}
                  </p>
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    {t('contractDownload')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 署名コントロールエリア */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-md font-semibold mb-4" style={{ color: '#323232' }}>
              {t('contractSignatureManagement')}
            </h4>
            {signatureData ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSignatureData(null);
                    setShowSignaturePad(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {t('contractRedraw')}
                </Button>
                <Button
                  onClick={() => setSignatureData(null)}
                  variant="outline"
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSaveSignature}
                  disabled={isSaving}
                  className="flex-1"
                  style={{ backgroundColor: '#E65D65', color: '#fff' }}
                >
                  {isSaving ? t('saving') : t('contractSaveSignature')}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 items-center">
                <p className="text-sm text-gray-600">
                  {contract.signatures && contract.signatures.length > 0
                    ? `${t('contractSavedSignatures')}: ${t('contractSavedSignatureCount', { count: contract.signatures.length })}`
                    : t('contractNoSignatures')}
                </p>
                <Button
                  onClick={() => setShowSignaturePad(true)}
                  style={{ backgroundColor: '#323232', color: '#fff' }}
                  className="ml-auto"
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  {t('contractAddSignature')}
                </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* 署名パッドモーダル */}
      {showSignaturePad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div style={{ backgroundColor: '#fff' }} className="rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#323232' }}>
                  {t('contractDrawSignature')}
                </h3>
                <button
                  onClick={() => {
                    setShowSignaturePad(false);
                    clearSignature();
                    setSignToAllPages(false);
                  }}
                  className="p-1 rounded-full transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X className="w-5 h-5" style={{ color: '#323232' }} />
                </button>
              </div>

              {/* PDFページ数表示と署名オプション */}
              {pdfPageCount && pdfPageCount > 1 && (
                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 mb-2">
                    {locale === 'ja'
                      ? `このPDFは${pdfPageCount}ページあります。署名をどのページに配置しますか？`
                      : `This PDF has ${pdfPageCount} pages. Where would you like to place your signature?`}
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={!signToAllPages}
                        onChange={() => setSignToAllPages(false)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {t('contractLastPageOnly')}
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        checked={signToAllPages}
                        onChange={() => setSignToAllPages(true)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {t('contractAllPages')}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <canvas
                  ref={signatureCanvasRef}
                  width={600}
                  height={200}
                  className="rounded cursor-crosshair w-full"
                  style={{
                    touchAction: 'none',
                    border: '2px solid #323232',
                    backgroundColor: '#fff'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="flex-1"
                  style={{ borderColor: '#323232', color: '#323232' }}
                >
                  {t('contractClear')}
                </Button>
                <Button
                  onClick={() => {
                    handleSignatureComplete();
                    setShowSignaturePad(false);
                  }}
                  className="flex-1"
                  style={{ backgroundColor: '#323232', color: '#fff' }}
                >
                  {t('contractConfirmSignature')}
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff' }} className="rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#323232' }}>
                {t('contractConfirmDelete')}
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 rounded-full transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" style={{ color: '#323232' }} />
              </button>
            </div>
            <p style={{ color: '#323232' }} className="mb-6">
              {t('contractDeleteConfirmMessage')}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                disabled={isDeleting}
                style={{ borderColor: '#323232', color: '#323232' }}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                disabled={isDeleting}
                style={{ backgroundColor: '#323232', color: '#fff', borderColor: '#323232' }}
              >
                {isDeleting ? t('contractDeleting') : t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
