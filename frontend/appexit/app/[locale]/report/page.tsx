import { loadPageDictionary } from '@/lib/i18n-utils'
import { Locale } from '@/i18n/config'
import ReportPageClient from '@/components/pages/ReportPageClient'

type PageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function ReportPage({ params }: PageProps) {
  const { locale } = await params
  const dict = await loadPageDictionary(locale, 'report')

  return <ReportPageClient locale={locale} dict={dict} />
}
