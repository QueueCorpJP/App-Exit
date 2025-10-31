import ProfileViewPage from '@/components/pages/ProfileViewPage';

interface ProfileViewProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfileView({ params }: ProfileViewProps) {
  const { id } = await params;
  return (
    <>
      <ProfileViewPage userId={id} />
    </>
  );
}
