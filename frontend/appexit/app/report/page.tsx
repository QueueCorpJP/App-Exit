'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Step = 'input' | 'confirm' | 'complete' | 'error'

export default function ReportPage() {
  const [step, setStep] = useState<Step>('input')
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    reportType: '',
    targetType: '',
    targetUrl: '',
    targetUserId: '',
    description: '',
    evidenceUrls: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirm')
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setStep('input')
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          reporter_user_id: user?.id || null,
          reporter_name: formData.reporterName,
          reporter_email: formData.reporterEmail,
          report_type: formData.reportType,
          target_type: formData.targetType,
          target_url: formData.targetUrl || null,
          target_user_id: formData.targetUserId || null,
          description: formData.description,
          evidence_urls: formData.evidenceUrls ? formData.evidenceUrls.split('\n').filter(url => url.trim()) : [],
          status: 'pending'
        }])
        .select()
      
      if (error) {
        console.error('報告の送信エラー:', error)
        setErrorMessage(error.message || '報告の送信に失敗しました')
        setStep('error')
      } else {
        console.log('報告が送信されました:', data)
        setStep('complete')
      }
    } catch (err) {
      console.error('予期しないエラー:', err)
      setErrorMessage('予期しないエラーが発生しました')
      setStep('error')
    } finally {
      setIsSubmitting(false)
      window.scrollTo(0, 0)
    }
  }

  const getReportTypeLabel = (value: string) => {
    const types: { [key: string]: string } = {
      '不適切なコンテンツ': '不適切なコンテンツ',
      '詐欺・不正行為': '詐欺・不正行為',
      'スパム': 'スパム',
      '著作権侵害': '著作権侵害',
      'ハラスメント': 'ハラスメント',
      '虚偽の情報': '虚偽の情報',
      'なりすまし': 'なりすまし',
      'その他': 'その他'
    }
    return types[value] || value
  }

  const getTargetTypeLabel = (value: string) => {
    const types: { [key: string]: string } = {
      'アプリ・サービス': 'アプリ・サービスの出品',
      'ユーザープロフィール': 'ユーザープロフィール',
      'コメント': 'コメント',
      'メッセージ': 'メッセージ',
      'その他': 'その他'
    }
    return types[value] || value
  }

  // エラー画面
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">送信に失敗しました</h1>
              
              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p className="text-red-600">{errorMessage}</p>
                <p>
                  お手数ですが、時間をおいて再度お試しいただくか、<br />
                  お問い合わせフォームよりご連絡ください。
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setStep('confirm')}
                  className="inline-block px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  確認画面に戻る
                </button>
                <Link
                  href="/contact"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 完了画面
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">報告を受け付けました</h1>
              
              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p>
                  ご報告いただきありがとうございます。
                </p>
                <p>
                  内容を確認させていただき、適切な対応を行います。
                  対応状況については、必要に応じてご入力いただいたメールアドレス宛にご連絡させていただきます。
                </p>
                <p className="text-sm text-gray-600">
                  ※ 報告内容によっては対応に時間がかかる場合や、対応結果をお知らせできない場合がございます。
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  トップページへ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 確認画面
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">報告内容をご確認ください</h1>
            <p className="text-gray-600 mb-8">
              以下の内容で報告を送信します。内容をご確認の上、送信ボタンを押してください。
            </p>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">お名前</label>
                <p className="text-gray-900">{formData.reporterName}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">メールアドレス</label>
                <p className="text-gray-900">{formData.reporterEmail}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">報告の種類</label>
                <p className="text-gray-900">{getReportTypeLabel(formData.reportType)}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">報告対象</label>
                <p className="text-gray-900">{getTargetTypeLabel(formData.targetType)}</p>
              </div>

              {formData.targetUrl && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">対象のURL</label>
                  <p className="text-gray-900 break-all">{formData.targetUrl}</p>
                </div>
              )}

              {formData.targetUserId && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">対象ユーザーID</label>
                  <p className="text-gray-900">{formData.targetUserId}</p>
                </div>
              )}

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">詳細説明</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
              </div>

              {formData.evidenceUrls && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">証拠となるURL</label>
                  <p className="text-gray-900 whitespace-pre-wrap break-all">{formData.evidenceUrls}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                修正する
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? '送信中...' : '報告を送信する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 入力画面
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12" style={{ color: '#323232' }}>
            <h1 className="text-2xl font-extrabold mb-12 text-center">違反報告</h1>
            <p className="text-lg">
              不適切なコンテンツや行為を発見した場合は、以下のフォームよりご報告ください
            </p>
          </div>

          {/* 注意事項 */}
          <div className="mb-12 space-y-4">
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>報告する前にご確認ください</h3>
              <ul className="text-sm space-y-1 ml-4 list-disc" style={{ color: '#323232' }}>
                <li>虚偽の報告は利用規約違反となります</li>
                <li>報告内容は慎重に審査され、適切な対応を行います</li>
                <li>報告者の情報は厳重に管理し、第三者に開示することはありません</li>
                <li>緊急性の高い事案（犯罪行為など）は警察にもご相談ください</li>
              </ul>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleConfirm} className="space-y-6 bg-white rounded-lg p-8">
            {/* お名前 */}
            <div>
              <label htmlFor="reporterName" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="reporterName"
                name="reporterName"
                value={formData.reporterName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="reporterEmail" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="reporterEmail"
                name="reporterEmail"
                value={formData.reporterEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="mail@example.com"
              />
            </div>

            {/* 報告の種類 */}
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                報告の種類 <span className="text-red-500">*</span>
              </label>
              <select
                id="reportType"
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="不適切なコンテンツ">不適切なコンテンツ</option>
                <option value="詐欺・不正行為">詐欺・不正行為</option>
                <option value="スパム">スパム</option>
                <option value="著作権侵害">著作権侵害</option>
                <option value="ハラスメント">ハラスメント</option>
                <option value="虚偽の情報">虚偽の情報</option>
                <option value="なりすまし">なりすまし</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 報告対象 */}
            <div>
              <label htmlFor="targetType" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                報告対象 <span className="text-red-500">*</span>
              </label>
              <select
                id="targetType"
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="アプリ・サービス">アプリ・サービスの出品</option>
                <option value="ユーザープロフィール">ユーザープロフィール</option>
                <option value="コメント">コメント</option>
                <option value="メッセージ">メッセージ</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 対象のURL */}
            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                対象のURL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="targetUrl"
                name="targetUrl"
                value={formData.targetUrl}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://appexit.jp/..."
              />
              <p className="text-xs mt-1" style={{ color: '#323232' }}>
                報告対象のページURLをコピーして貼り付けてください
              </p>
            </div>

            {/* 対象ユーザーID（任意） */}
            <div>
              <label htmlFor="targetUserId" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                対象ユーザーID（任意）
              </label>
              <input
                type="text"
                id="targetUserId"
                name="targetUserId"
                value={formData.targetUserId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="ユーザーIDが分かる場合は入力してください"
              />
            </div>

            {/* 詳細説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                詳細説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="問題の内容を具体的にご記入ください&#10;&#10;例：&#10;- どのような問題があるか&#10;- いつ発見したか&#10;- どのような影響があるか"
              />
            </div>

            {/* 証拠URL */}
            <div>
              <label htmlFor="evidenceUrls" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                証拠となるURL（任意）
              </label>
              <textarea
                id="evidenceUrls"
                name="evidenceUrls"
                value={formData.evidenceUrls}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="スクリーンショットや関連資料のURLを1行ごとに入力&#10;https://example.com/screenshot1.png&#10;https://example.com/screenshot2.png"
              />
              <p className="text-xs mt-1" style={{ color: '#323232' }}>
                画像共有サービス等にアップロードしたURLを入力してください（1行に1つのURL）
              </p>
            </div>

            {/* 注意事項 */}
            <div className="rounded-lg p-6 bg-gray-50">
              <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>個人情報の取り扱いについて</h3>
              <p className="text-sm" style={{ color: '#323232' }}>
                ご提供いただいた情報は、報告内容の確認と対応のためにのみ使用し、
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                  プライバシーポリシー
                </Link>
                に従って適切に管理いたします。
              </p>
            </div>

            {/* 確認画面へボタン */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                確認画面へ
              </button>
            </div>
          </form>

          {/* よくある質問 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold mb-4" style={{ color: '#323232' }}>報告に関するよくある質問</h3>
            <div className="space-y-3 text-sm" style={{ color: '#323232' }}>
              <div>
                <p className="font-medium">Q. 報告後、どのくらいで対応されますか？</p>
                <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>A. 報告内容により異なりますが、通常1〜3営業日以内に確認し、対応いたします。</p>
              </div>
              <div>
                <p className="font-medium">Q. 報告者の情報は相手に知られますか？</p>
                <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>A. いいえ。報告者の情報は厳重に管理し、報告対象者に開示することはありません。</p>
              </div>
              <div>
                <p className="font-medium">Q. 緊急の場合はどうすればよいですか？</p>
                <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>A. 犯罪行為や生命に関わる緊急事態の場合は、まず警察（110番）にご連絡ください。</p>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

