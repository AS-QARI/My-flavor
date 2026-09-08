import { database, files } from '@/db';
import { identity, json, failure } from '@/lib/api';
export async function POST(request: Request) {
  try {
    const owner = await identity(request, true);
    if (Number(request.headers.get('content-length')) > 9 * 1024 * 1024)
      return json({ error: 'الصورة أكبر من ٨ ميغابايت.' }, 413);
    const form = await request.formData();
    const photo = form.get('photo');
    if (
      !(photo instanceof File) ||
      photo.size > 8 * 1024 * 1024 ||
      photo.size === 0
    )
      return json({ error: 'اختر صورة صالحة بحجم لا يتجاوز ٨ ميغابايت.' }, 400);
    const bytes = await photo.arrayBuffer();
    const h = new Uint8Array(bytes).slice(0, 12);
    const mime =
      h[0] === 255 && h[1] === 216 && h[2] === 255
        ? 'image/jpeg'
        : h[0] === 137 && h[1] === 80 && h[2] === 78 && h[3] === 71
          ? 'image/png'
          : String.fromCharCode(...h.slice(0, 4)) === 'RIFF' &&
              String.fromCharCode(...h.slice(8, 12)) === 'WEBP'
            ? 'image/webp'
            : null;
    if (!mime)
      return json({ error: 'استخدم صورة بصيغة JPG أو PNG أو WebP.' }, 400);
    const id = crypto.randomUUID(),
      key = `photos/${owner}/${id}`;
    await files().put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      await database()
        .prepare(
          'INSERT INTO photos (id,owner_id,object_key,content_type,created_at) VALUES (?,?,?,?,?)',
        )
        .bind(id, owner, key, mime, new Date().toISOString())
        .run();
    } catch (e) {
      await files().delete(key);
      throw e;
    }
    return json({ url: '/api/photos/' + id }, 201);
  } catch (e) {
    return failure(e);
  }
}
