'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { contactPageData, contactFAQ } from './metadata'
import { useParams } from 'next/navigation'
import { loadPageDictionary } from '@/lib/i18n-utils'
import { useEffect } from 'react'

type Step = 'input' | 'confirm' | 'complete' | 'error'

export default function ContactPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

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
  const [dict, setDict] = useState<Record<string, any>>({})

  useEffect(() => {
    loadPageDictionary(locale as 'ja' | 'en', 'contact').then(setDict)
  }, [locale])

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
        console.error(dict.consoleSubmissionError || 'Error:', error)
        setErrorMessage(error.message || dict.errorSubmissionFailed || 'Failed to submit')
        setStep('error')
      } else {
        console.log(dict.consoleSubmitted || 'Submitted:', data)
        setStep('complete')
      }
    } catch (err) {
      console.error(dict.consoleUnexpectedError || 'Error:', err)
      setErrorMessage(dict.errorUnexpected || 'An unexpected error occurred')
      setStep('error')
    } finally {
      setIsSubmitting(false)
      window.scrollTo(0, 0)
    }
  }

  const getCategoryLabel = (value: string) => {
    const categories: { [key: string]: string } = {
      '売却相談': dict.categorySale || value,
      '購入相談': dict.categoryPurchase || value,
      '取引について': dict.categoryTransaction || value,
      '審査について': dict.categoryReview || value,
      '手数料について': dict.categoryFees || value,
      'アカウント': dict.categoryAccount || value,
      '決済について': dict.categoryPayment || value,
      '技術的問題': dict.categoryTechnical || value,
      '規約について': dict.categoryTerms || value,
      'その他': dict.categoryOther || value
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

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.errorTitle}</h1>

              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p className="text-red-600">
                  {errorMessage}
                </p>
                <p>
                  {dict.errorMessage}<br />
                  {dict.errorMessageSuffix}
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
                  {dict.backToConfirmButton}
                </button>
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {dict.backToHomeButton}
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

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.completeTitle}</h1>

              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p>
                  {dict.completeMessage}
                </p>
                <p className="text-sm text-gray-600">
                  {dict.completeNote}
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {dict.backToHomeButton}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{dict.confirmPageTitle}</h1>
            <p className="text-gray-600 mb-8">
              {dict.confirmPageDescription}
            </p>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmNameLabel}</label>
                <p className="text-gray-900">{formData.name}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmEmailLabel}</label>
                <p className="text-gray-900">{formData.email}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmCategoryLabel}</label>
                <p className="text-gray-900">{getCategoryLabel(formData.category)}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmSubjectLabel}</label>
                <p className="text-gray-900">{formData.subject}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmMessageLabel}</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.message}</p>
              </div>

              {formData.targetUrl && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirmTargetUrlLabel}</label>
                  <p className="text-gray-900 break-all">{formData.targetUrl}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-6 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                {dict.editButton}
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
                {isSubmitting ? dict.submittingButton : dict.submitButton}
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
      <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: '#323232' }}>{dict.pageTitle}</h1>
            <p className="text-lg" style={{ color: '#323232' }}>
              {dict.pageDescription}
            </p>
          </div>

          {/* お知らせ */}
          <div className="mb-12 space-y-4">
            <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
              <p className="text-sm" style={{ color: '#323232' }}>
                <strong>{dict.loginNotice}</strong>
                <Link href="/login" className="text-blue-600 hover:text-blue-800 underline mx-1">
                  {dict.loginLink}
                </Link>
                {dict.loginNoticeSuffix}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-green-50">
              <p className="text-sm mb-2" style={{ color: '#323232' }}>
                <strong>{dict.listingNoticeTitle}</strong>
              </p>
              <p className="text-xs" style={{ color: '#323232' }}>
                {dict.listingNoticeDescription}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-yellow-50">
              <p className="text-sm" style={{ color: '#323232' }}>
                <strong>{dict.messageSellerNotice}</strong>
                {dict.messageSellerNoticeSuffix}
              </p>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleConfirm} className="space-y-6 bg-white rounded-lg p-8">
            {/* お名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.nameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={dict.namePlaceholder}
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.emailLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={dict.emailPlaceholder}
              />
            </div>

            {/* お問い合わせ種別 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.categoryLabel} <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{dict.categoryPlaceholder}</option>
                <option value="売却相談">{dict.categorySale}</option>
                <option value="購入相談">{dict.categoryPurchase}</option>
                <option value="取引について">{dict.categoryTransaction}</option>
                <option value="審査について">{dict.categoryReview}</option>
                <option value="手数料について">{dict.categoryFees}</option>
                <option value="アカウント">{dict.categoryAccount}</option>
                <option value="決済について">{dict.categoryPayment}</option>
                <option value="技術的問題">{dict.categoryTechnical}</option>
                <option value="規約について">{dict.categoryTerms}</option>
                <option value="その他">{dict.categoryOther}</option>
              </select>
            </div>

            {/* お問い合わせ件名 */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.subjectLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={dict.subjectPlaceholder}
              />
            </div>

            {/* お問い合わせ内容 */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.messageLabel} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={dict.messagePlaceholder}
              />
            </div>

            {/* 対象のURL */}
            <div>
              <label htmlFor="targetUrl" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
                {dict.targetUrlLabel}
              </label>
              <input
                type="url"
                id="targetUrl"
                name="targetUrl"
                value={formData.targetUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={dict.targetUrlPlaceholder}
              />
              <p className="text-xs mt-1" style={{ color: '#323232' }}>
                {dict.targetUrlHelp}
              </p>
            </div>

            {/* 注意事項 */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 space-y-3">
              <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>{dict.importantNotesTitle}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start" style={{ color: '#323232' }}>
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    {dict.importantNote1}
                  </span>
                </li>
                <li className="flex items-start" style={{ color: '#323232' }}>
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    <strong>{dict.importantNote2Label}</strong>{dict.importantNote2}
                  </span>
                </li>
                <li className="flex items-start" style={{ color: '#323232' }}>
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    {dict.importantNote3}
                  </span>
                </li>
                <li className="flex items-start" style={{ color: '#323232' }}>
                  <span className="text-blue-500 mr-2">•</span>
                  <span>
                    {dict.importantNote4}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                      {dict.importantNote4Link}
                    </Link>
                    {dict.importantNote4Suffix}
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
                {dict.confirmButton}
              </button>
            </div>
          </form>

          {/* 直接連絡先 */}
          <section className="mt-12 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold mb-4" style={{ color: '#323232' }}>{dict.alternativeContactTitle}</h3>
            <div className="space-y-2 text-sm">
              <p style={{ color: '#323232' }}>
                <span className="font-medium">{dict.alternativeContactEmail}</span>
                <a href="mailto:support@appexit.jp" className="text-blue-600 hover:text-blue-800 underline">
                  support@appexit.jp
                </a>
              </p>
              <p style={{ color: '#323232' }}>
                <span className="font-medium">{dict.alternativeContactPhone}</span>
                <a href="tel:03-5324-2678" className="text-blue-600 hover:text-blue-800">
                  03-5324-2678
                </a>
              </p>
              <p style={{ color: '#323232' }}>
                {dict.alternativeContactHours}
              </p>
            </div>
          </section>

          {/* よくある質問へのリンク */}
          <section className="mt-8">
            <Link
              href="/help"
              className="block border border-gray-200 rounded-lg p-6 bg-blue-50 text-center hover:border-gray-400 transition-colors"
            >
              <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>{dict.faqTitle}</h3>
              <p className="text-sm mb-4" style={{ color: '#323232' }}>
                {dict.faqDescription}
              </p>
              <span className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {dict.faqButton}
              </span>
            </Link>
          </section>
      </div>
    </div>
    </>
  )
}
