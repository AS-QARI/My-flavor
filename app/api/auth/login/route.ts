import { createSessionCookie, verifyLogin } from '@/app/auth';

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { username?: unknown; password?: unknown };
  } catch {
    return Response.json({ error: 'تعذّر قراءة بيانات الدخول.' }, { status: 400 });
  }

  const result = await verifyLogin(body.username, body.password);
  if (!result.configured)
    return Response.json(
      { error: 'إعداد تسجيل الدخول غير مكتمل. أضف أسرار Cloudflare أولًا.' },
      { status: 503 },
    );
  if (!result.valid)
    return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' }, { status: 401 });

  const username = String(body.username).trim();
  const cookie = await createSessionCookie(username);
  const response = Response.json({ authenticated: true });
  response.headers.append(
    'Set-Cookie',
    `${cookie.name}=${cookie.value}; Path=/; Max-Age=${cookie.maxAge}; HttpOnly; Secure; SameSite=Lax`,
  );
  return response;
}
