import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from 'cloudflare:workers';

const SESSION_COOKIE = 'dhaiqati_session';
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;

type Session = { sub: string; exp: number; v: 1 };
export type AppUser = { userId: string; displayName: string };

function configuredSecret() {
  const secret = env.SESSION_SECRET;
  return typeof secret === 'string' && secret.length >= 32 ? secret : null;
}

function configuredUsername() {
  const username = env.ADMIN_USERNAME;
  return typeof username === 'string' && username.trim() ? username.trim() : null;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((value.length + 3) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function utf8(value: string) {
  return new TextEncoder().encode(value);
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    utf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let different = 0;
  for (let index = 0; index < left.length; index++) different |= left[index] ^ right[index];
  return different === 0;
}

async function sessionFor(username: string, secret: string) {
  const payload = base64UrlEncode(
    utf8(
      JSON.stringify({
        sub: username,
        exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
        v: 1,
      } satisfies Session),
    ),
  );
  const signature = base64UrlEncode(await hmac(payload, secret));
  return `${payload}.${signature}`;
}

async function parseSession(token: string | undefined): Promise<AppUser | null> {
  const secret = configuredSecret();
  const username = configuredUsername();
  if (!secret || !username || !token) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const providedSignature = base64UrlDecode(signature);
  if (!providedSignature) return null;
  const expectedSignature = await hmac(payload, secret);
  if (!constantTimeEqual(providedSignature, expectedSignature)) return null;

  const decodedPayload = base64UrlDecode(payload);
  if (!decodedPayload) return null;
  try {
    const session = JSON.parse(new TextDecoder().decode(decodedPayload)) as Session;
    if (
      session.v !== 1 ||
      session.sub !== username ||
      !Number.isSafeInteger(session.exp) ||
      session.exp <= Math.floor(Date.now() / 1000)
    )
      return null;
    return { userId: username, displayName: username };
  } catch {
    return null;
  }
}

function cookieValue(header: string | null, name: string) {
  if (!header) return undefined;
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function getAppUser() {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}

export async function getRequestUser(request: Request) {
  return parseSession(cookieValue(request.headers.get('cookie'), SESSION_COOKIE));
}

export async function requireAppUser(returnTo: string) {
  const user = await getAppUser();
  if (user) return user;
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  redirect(`/login?return_to=${encodeURIComponent(safeReturnTo)}`);
}

export async function verifyLogin(username: unknown, password: unknown) {
  const configuredUser = configuredUsername();
  const configuredPassword = env.ADMIN_PASSWORD;
  const secret = configuredSecret();
  if (!configuredUser || typeof configuredPassword !== 'string' || !secret)
    return { configured: false as const, valid: false as const };
  if (typeof username !== 'string' || typeof password !== 'string')
    return { configured: true as const, valid: false as const };

  const [submittedUser, submittedPassword, expectedUser, expectedPassword] = await Promise.all([
    crypto.subtle.digest('SHA-256', utf8(username)),
    crypto.subtle.digest('SHA-256', utf8(password)),
    crypto.subtle.digest('SHA-256', utf8(configuredUser)),
    crypto.subtle.digest('SHA-256', utf8(configuredPassword)),
  ]);
  return {
    configured: true as const,
    valid:
      constantTimeEqual(new Uint8Array(submittedUser), new Uint8Array(expectedUser)) &&
      constantTimeEqual(new Uint8Array(submittedPassword), new Uint8Array(expectedPassword)),
  };
}

export async function createSessionCookie(username: string) {
  const secret = configuredSecret();
  if (!secret) throw new Error('Session secret is not configured');
  return {
    name: SESSION_COOKIE,
    value: await sessionFor(username, secret),
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_LIFETIME_SECONDS,
  };
}

export const expiredSessionCookie = {
  name: SESSION_COOKIE,
  value: '',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};
