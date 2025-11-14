import MessagePage from '@/components/pages/MessagePage';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function Messages({ params }: PageProps) {
  const { id } = use(params);

  return (
      <MessagePage threadId={id} />
  );
}
