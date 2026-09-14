import { getRequestUser } from '@/app/auth';
import { database } from '@/db';
import { googleMapsURL } from './google-maps';
export async function identity(request: Request, write = false) {
  const user = await getRequestUser(request);
  if (!user)
    throw new Response(
      JSON.stringify({ error: 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  if (write) {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      throw new Response('Forbidden', { status: 403 });
  }
  return user.userId;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
export function failure(error: unknown) {
  if (error instanceof Response) return error;
  console.error(
    'Journal request failed',
    error instanceof Error ? error.message : 'unknown',
  );
  return json(
    { error: 'تعذّر إكمال العملية. حاول مرة أخرى؛ لم نفقد مدخلاتك.' },
    500,
  );
}
export function parseRow(row: Record<string, unknown>) {
  const {
    owner_id: _ownerId,
    created_at: _createdAt,
    google_maps_url,
    ...rest
  } = row;
  return {
    ...rest,
    googleMapsUrl: typeof google_maps_url === 'string' ? google_maps_url : '',
    photos: (JSON.parse(String(row.photos)) as string[]).map(
      (id) => '/api/photos/' + id,
    ),
  };
}
export function validate(data: Record<string, unknown>) {
  const str = (k: string, max: number, required = false) => {
    if (
      typeof data[k] !== 'string' ||
      (required && !String(data[k]).trim()) ||
      String(data[k]).length > max
    )
      throw new Response(
        JSON.stringify({ error: 'راجع الحقول المطلوبة وطول النص.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    return String(data[k]).trim();
  };
  const name = str('name', 100, true),
    area = str('area', 150),
    category = str('category', 40, true),
    date = str('date', 10, true),
    notes = str('notes', 5000);
  const { rating, lat, lng, id } = data;
  const googleMapsUrl = data.googleMapsUrl ?? '';
  if (
    typeof googleMapsUrl !== 'string' ||
    googleMapsUrl.length > 4096 ||
    (googleMapsUrl && !googleMapsURL(googleMapsUrl))
  )
    throw json({ error: 'رابط قوقل ماب غير صالح.' }, 400);
  if (
    typeof id !== 'string' ||
    !/^[\w-]{10,80}$/.test(id) ||
    typeof rating !== 'number' ||
    !Number.isInteger(rating) ||
    rating < 0 ||
    rating > 5 ||
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    Math.abs(lat) > 85 ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng) ||
    Math.abs(lng) > 180 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Response(
      JSON.stringify({ error: 'تحقق من التاريخ والتقييم وموقع المطعم.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  if (
    !Array.isArray(data.photos) ||
    data.photos.length > 6 ||
    data.photos.some(
      (p) => typeof p !== 'string' || !/^\/api\/photos\/[\w-]{10,80}$/.test(p),
    )
  )
    throw new Response(JSON.stringify({ error: 'الحد الأقصى ٦ صور للتجربة.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  return {
    id,
    googleMapsUrl,
    name,
    area,
    category,
    date,
    notes,
    rating,
    lat,
    lng,
    photos: [
      ...new Set(data.photos.map((p) => (p as string).split('/').pop()!)),
    ],
  };
}
export async function validatePhotos(ids: string[], owner: string) {
  for (const id of ids) {
    if (
      !(await database()
        .prepare('SELECT id FROM photos WHERE id = ? AND owner_id = ?')
        .bind(id, owner)
        .first())
    )
      throw new Response('Invalid photo', { status: 400 });
  }
}
