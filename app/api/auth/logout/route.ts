import { expiredSessionCookie } from '@/app/auth';

export async function POST() {
  const response = Response.json({ signedOut: true });
  response.headers.append(
    'Set-Cookie',
    `${expiredSessionCookie.name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  );
  return response;
}
