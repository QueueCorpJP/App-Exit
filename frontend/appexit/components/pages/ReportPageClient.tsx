'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Locale } from '@/i18n/config'

type Step = 'input' | 'confirm' | 'complete' | 'error'

type ReportPageClientProps = {
  locale: Locale
  dict: Record<string, any>
}

export default function ReportPageClient({ locale, dict }: ReportPageClientProps) {
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
        // Submission error - continue without submission
        setErrorMessage(error.message || dict.console.submissionFailed)
        setStep('error')
      } else {
        // Report submitted successfully
        setStep('complete')
      }
    } catch (err) {
      // Unexpected error - continue without submission
      setErrorMessage(dict.console.unexpectedErrorOccurred)
      setStep('error')
    } finally {
      setIsSubmitting(false)
      window.scrollTo(0, 0)
    }
  }

  const getReportTypeLabel = (value: string) => {
    const types: { [key: string]: string } = {
      '不適切なコンテンツ': dict.reportTypes.inappropriateContent,
      '詐欺・不正行為': dict.reportTypes.fraud,
      'スパム': dict.reportTypes.spam,
      '著作権侵害': dict.reportTypes.copyright,
      'ハラスメント': dict.reportTypes.harassment,
      '虚偽の情報': dict.reportTypes.falseInfo,
      'なりすまし': dict.reportTypes.impersonation,
      'その他': dict.reportTypes.other
    }
    return types[value] || value
  }

  const getTargetTypeLabel = (value: string) => {
    const types: { [key: string]: string } = {
      'アプリ・サービス': dict.targetTypes.appService,
      'ユーザープロフィール': dict.targetTypes.userProfile,
      'コメント': dict.targetTypes.comment,
      'メッセージ': dict.targetTypes.message,
      'その他': dict.targetTypes.other
    }
    return types[value] || value
  }

  // Error Screen
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

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.error.title}</h1>

              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p className="text-red-600">{errorMessage}</p>
                <p>
                  {dict.error.message}<br />
                  {dict.error.messageBreak}
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setStep('confirm')}
                  className="inline-block px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {dict.error.backToConfirm}
                </button>
                <Link
                  href="/contact"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {dict.error.contact}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Complete Screen
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

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.complete.title}</h1>

              <div className="max-w-2xl mx-auto space-y-4 text-gray-700">
                <p>{dict.complete.thankyou}</p>
                <p>{dict.complete.review}</p>
                <p className="text-sm text-gray-600">{dict.complete.note}</p>
              </div>

              <div className="mt-8">
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {dict.complete.backToHome}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Screen
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{dict.confirm.title}</h1>
            <p className="text-gray-600 mb-8">{dict.confirm.subtitle}</p>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.name}</label>
                <p className="text-gray-900">{formData.reporterName}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.email}</label>
                <p className="text-gray-900">{formData.reporterEmail}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.reportType}</label>
                <p className="text-gray-900">{getReportTypeLabel(formData.reportType)}</p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.reportTarget}</label>
                <p className="text-gray-900">{getTargetTypeLabel(formData.targetType)}</p>
              </div>

              {formData.targetUrl && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.targetUrl}</label>
                  <p className="text-gray-900 break-all">{formData.targetUrl}</p>
                </div>
              )}

              {formData.targetUserId && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.targetUserId}</label>
                  <p className="text-gray-900">{formData.targetUserId}</p>
                </div>
              )}

              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.description}</label>
                <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
              </div>

              {formData.evidenceUrls && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{dict.confirm.evidenceUrls}</label>
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
                {dict.confirm.edit}
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
                {isSubmitting ? dict.confirm.submitting : dict.confirm.submit}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Input Screen
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{dict.input.title}</h1>
          <p className="text-lg">{dict.input.subtitle}</p>
        </div>

        {/* 注意事項 */}
        <div className="mb-12 space-y-4">
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>{dict.input.notice.title}</h3>
            <ul className="text-sm space-y-1 ml-4 list-disc" style={{ color: '#323232' }}>
              {dict.input.notice.items.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleConfirm} className="space-y-6 bg-white rounded-lg p-8">
          {/* お名前 */}
          <div>
            <label htmlFor="reporterName" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.name.label} <span className="text-red-500">{dict.input.form.name.required}</span>
            </label>
            <input
              type="text"
              id="reporterName"
              name="reporterName"
              value={formData.reporterName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.name.placeholder}
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label htmlFor="reporterEmail" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.email.label} <span className="text-red-500">{dict.input.form.email.required}</span>
            </label>
            <input
              type="email"
              id="reporterEmail"
              name="reporterEmail"
              value={formData.reporterEmail}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.email.placeholder}
            />
          </div>

          {/* 報告の種類 */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.reportType.label} <span className="text-red-500">{dict.input.form.reportType.required}</span>
            </label>
            <select
              id="reportType"
              name="reportType"
              value={formData.reportType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">{dict.input.form.reportType.placeholder}</option>
              <option value="不適切なコンテンツ">{dict.reportTypes.inappropriateContent}</option>
              <option value="詐欺・不正行為">{dict.reportTypes.fraud}</option>
              <option value="スパム">{dict.reportTypes.spam}</option>
              <option value="著作権侵害">{dict.reportTypes.copyright}</option>
              <option value="ハラスメント">{dict.reportTypes.harassment}</option>
              <option value="虚偽の情報">{dict.reportTypes.falseInfo}</option>
              <option value="なりすまし">{dict.reportTypes.impersonation}</option>
              <option value="その他">{dict.reportTypes.other}</option>
            </select>
          </div>

          {/* 報告対象 */}
          <div>
            <label htmlFor="targetType" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.targetType.label} <span className="text-red-500">{dict.input.form.targetType.required}</span>
            </label>
            <select
              id="targetType"
              name="targetType"
              value={formData.targetType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">{dict.input.form.targetType.placeholder}</option>
              <option value="アプリ・サービス">{dict.targetTypes.appService}</option>
              <option value="ユーザープロフィール">{dict.targetTypes.userProfile}</option>
              <option value="コメント">{dict.targetTypes.comment}</option>
              <option value="メッセージ">{dict.targetTypes.message}</option>
              <option value="その他">{dict.targetTypes.other}</option>
            </select>
          </div>

          {/* 対象のURL */}
          <div>
            <label htmlFor="targetUrl" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.targetUrl.label} <span className="text-red-500">{dict.input.form.targetUrl.required}</span>
            </label>
            <input
              type="url"
              id="targetUrl"
              name="targetUrl"
              value={formData.targetUrl}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.targetUrl.placeholder}
            />
            <p className="text-xs mt-1" style={{ color: '#323232' }}>
              {dict.input.form.targetUrl.help}
            </p>
          </div>

          {/* 対象ユーザーID（任意） */}
          <div>
            <label htmlFor="targetUserId" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.targetUserId.label}
            </label>
            <input
              type="text"
              id="targetUserId"
              name="targetUserId"
              value={formData.targetUserId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.targetUserId.placeholder}
            />
          </div>

          {/* 詳細説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.description.label} <span className="text-red-500">{dict.input.form.description.required}</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.description.placeholder}
            />
          </div>

          {/* 証拠URL */}
          <div>
            <label htmlFor="evidenceUrls" className="block text-sm font-medium mb-2" style={{ color: '#323232' }}>
              {dict.input.form.evidenceUrls.label}
            </label>
            <textarea
              id="evidenceUrls"
              name="evidenceUrls"
              value={formData.evidenceUrls}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={dict.input.form.evidenceUrls.placeholder}
            />
            <p className="text-xs mt-1" style={{ color: '#323232' }}>
              {dict.input.form.evidenceUrls.help}
            </p>
          </div>

          {/* 注意事項 */}
          <div className="rounded-lg p-6 bg-gray-50">
            <h3 className="font-semibold mb-2" style={{ color: '#323232' }}>{dict.input.privacy.title}</h3>
            <p className="text-sm" style={{ color: '#323232' }}>
              {dict.input.privacy.content}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                {dict.input.privacy.privacyPolicy}
              </Link>
              {dict.input.privacy.contentSuffix}
            </p>
          </div>

          {/* 確認画面へボタン */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              {dict.input.submitButton}
            </button>
          </div>
        </form>

        {/* よくある質問 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-semibold mb-4" style={{ color: '#323232' }}>{dict.input.faq.title}</h3>
          <div className="space-y-3 text-sm" style={{ color: '#323232' }}>
            <div>
              <p className="font-medium">{dict.input.faq.q1.question}</p>
              <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>{dict.input.faq.q1.answer}</p>
            </div>
            <div>
              <p className="font-medium">{dict.input.faq.q2.question}</p>
              <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>{dict.input.faq.q2.answer}</p>
            </div>
            <div>
              <p className="font-medium">{dict.input.faq.q3.question}</p>
              <p className="ml-4" style={{ color: '#323232', opacity: 0.7 }}>{dict.input.faq.q3.answer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
