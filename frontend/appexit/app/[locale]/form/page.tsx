import RegisterFormPage from '@/components/pages/RegisterFormPage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function FormPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const formDict = await loadPageDictionary(locale, 'form');
  return <RegisterFormPage pageDict={formDict} />;
}
