'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { contactPageData, contactFAQ } from './metadata'

type Step = 'input' | 'confirm' | 'complete' | 'error'

export default function ContactPage() {
  const [step, setStep] = useState<Step>('input')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    targetUrl: ''
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
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()
      
      // Supabaseにデータを送信
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          user_id: user?.id || null,
          name: formData.name,
          email: formData.email,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          target_url: formData.targetUrl || null,
          status: 'pending'
        }])
        .select()
      
      if (error) {
        console.error('お問い合わせの送信エラー:', error)
        setErrorMessage(error.message || 'お問い合わせの送信に失敗しました')
        setStep('error')
      } else {
        console.log('お問い合わせが送信されました:', data)
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

  const getCategoryLabel = (value: string) => {
    const categories: { [key: string]: string } = {
      '売却相談': 'アプリ・サービスの売却相談',
      '購入相談': 'アプリ・サービスの購入相談',
      '取引について': '取引の進め方について',
      '審査について': '審査について',
      '手数料について': '手数料について',
      'アカウント': 'アカウント・ログインについて',
      '決済について': '決済・支払いについて',
      '技術的問題': '技術的な問題',
      '規約について': '利用規約について',
      'その他': 'その他'
    }
    return categories[value] || value
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
                <p className="text-red-600">
                  {errorMessage}
                </p>
                <p>
                  お手数ですが、時間をおいて再度お試しいただくか、<br />
                  以下のメールアドレスまで直接お問い合わせください。
                </p>
                <p className="font-medium">
                  <a href="mailto:support@appexit.jp" className="text-blue-600 hover:text-blue-800 underline">
                    support@appexit.jp
                  </a>
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
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">お問い合わせを受け付けました</h1>
              
              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p>
                  内容をご確認させていただき、順次ご入力いただいたメールアドレス宛へ返答させていただきます。
                </p>
                <p className="text-sm text-gray-600">
                  ご意見・ご要望などは、返答を控えさせていただく場合もございます。
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">入力内容をご確認ください</h1>
            <p className="text-gray-600 mb-8">
              以下の内容でお問い合わせを送信します。内容をご確認の上、送信ボタンを押してください。
            </p>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">お名前</label>
                <p className="text-gray-900">{formData.name}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">メールアドレス</label>
                <p className="text-gray-900">{formData.email}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">お問い合わせ種別</label>
                <p className="text-gray-900">{getCategoryLabel(formData.category)}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">お問い合わせ件名</label>
                <p className="text-gray-900">{formData.subject}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">お問い合わせ内容</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.message}</p>
              </div>

              {formData.targetUrl && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">対象アプリ・サービスのURL</label>
                  <p className="text-gray-900 break-all">{formData.targetUrl}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactFAQ) }}
      />
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
          <p className="text-gray-600 mb-8">
            APPEXITに関するご質問やご相談は、以下のフォームよりお問い合わせください。
          </p>

          {/* お知らせ */}
          <div className="mb-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>APPEXITに会員登録をしている場合は、</strong>
                <Link href="/login" className="text-blue-600 hover:text-blue-800 underline mx-1">
                  ログイン
                </Link>
                してからお問い合わせください。
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>アプリ・サービスの出品に関するご質問やご相談はこちらから</strong>
              </p>
              <p className="text-xs text-gray-600">
                ※審査や取引に関するお問い合わせは、マイページ内の「メッセージ」より専任担当者までご連絡ください。
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>出品されているアプリ・サービスに関するご質問は、</strong>
                各出品ページより出品者にメッセージでお問い合わせください。
              </p>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleConfirm} className="space-y-6">
            {/* お名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="mail@appexit.jp"
              />
            </div>

            {/* お問い合わせ種別 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                お問い合わせ種別 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">お選びください</option>
                <option value="売却相談">アプリ・サービスの売却相談</option>
                <option value="購入相談">アプリ・サービスの購入相談</option>
                <option value="取引について">取引の進め方について</option>
                <option value="審査について">審査について</option>
                <option value="手数料について">手数料について</option>
                <option value="アカウント">アカウント・ログインについて</option>
                <option value="決済について">決済・支払いについて</option>
                <option value="技術的問題">技術的な問題</option>
                <option value="規約について">利用規約について</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* お問い合わせ件名 */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                お問い合わせ件名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="お問い合わせの件名を入力してください"
              />
            </div>

            {/* お問い合わせ内容 */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                お問い合わせ内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="お問い合わせ内容を詳しくご記入ください"
              />
            </div>

            {/* 対象のURL */}
            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-2">
                対象アプリ・サービスのURL（任意）
              </label>
              <input
                type="url"
                id="targetUrl"
                name="targetUrl"
                value={formData.targetUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://appexit.jp/apps/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                特定のアプリ・サービスに関するお問い合わせの場合は、URLをご記入ください
              </p>
            </div>

            {/* 注意事項 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">事前にお読みください</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    出品されているアプリ・サービスに関するご質問は、各出品ページより出品者にメッセージでお問い合わせください。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>営業時間：</strong>平日 10:00～18:00（土日祝日除く）
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    お問い合わせ内容によっては、回答にお時間をいただく場合や、お応えできかねる場合もございます。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    お問い合わせ内容に関しては、
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                      プライバシーポリシー
                    </Link>
                    に準じて管理させていただきます。
                  </span>
                </li>
              </ul>
            </div>

            {/* 確認画面へボタン */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                確認画面へ
              </button>
            </div>
          </form>

          {/* 直接連絡先 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">その他のお問い合わせ方法</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">メールアドレス：</span>
                <a href="mailto:support@appexit.jp" className="text-blue-600 hover:text-blue-800 underline">
                  support@appexit.jp
                </a>
              </p>
              <p>
                <span className="font-medium">電話番号：</span>
                <a href="tel:03-5324-2678" className="text-blue-600 hover:text-blue-800">
                  03-5324-2678
                </a>
              </p>
              <p className="text-gray-600">
                受付時間：平日 10:00～18:00（土日祝日除く）
              </p>
            </div>
          </div>

          {/* よくある質問へのリンク */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">よくある質問</h3>
              <p className="text-sm text-gray-700 mb-4">
                お問い合わせの前に、よくある質問もご確認ください。
              </p>
              <Link
                href="/help"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ヘルプセンターへ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

