import ProfileViewPage from '@/components/pages/ProfileViewPage';
import type { Locale } from '@/i18n/config';

interface ProfileViewProps {
  params: Promise<{
    id: string;
    locale: Locale;
  }>;
}

export default async function ProfileView({ params }: ProfileViewProps) {
  const { id } = await params;
  return <ProfileViewPage userId={id} />;
}
