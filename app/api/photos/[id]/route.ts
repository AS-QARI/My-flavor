import { database, files } from '@/db';
import { identity, json, failure } from '@/lib/api';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await identity(request);
    const { id } = await params;
    const photo = await database()
      .prepare(
        'SELECT object_key,content_type FROM photos WHERE id=? AND owner_id=?',
      )
      .bind(id, owner)
      .first();
    if (!photo) return json({ error: 'الصورة غير موجودة.' }, 404);
    const file = await files().get(String(photo.object_key));
    if (!file) return json({ error: 'الصورة غير موجودة.' }, 404);
    return new Response(file.body, {
      headers: {
        'Content-Type': String(photo.content_type),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    return failure(e);
  }
}
