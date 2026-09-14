import Journal from './journal';
import { requireAppUser } from './auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await requireAppUser('/');
  return <Journal />;
}
