import { redirect } from 'next/navigation';
import { getAppUser } from '../auth';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  if (await getAppUser()) redirect('/');
  const { return_to: returnTo } = await searchParams;
  const safeReturnTo =
    typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo
      : '/';
  return <LoginForm returnTo={safeReturnTo} />;
}
