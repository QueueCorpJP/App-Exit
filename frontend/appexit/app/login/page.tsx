import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginPageClient from '@/components/pages/LoginPageClient';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  // すでにログインしている場合はホームにリダイレクト
  if (authToken) {
    redirect('/');
  }

  return <LoginPageClient />;
}
