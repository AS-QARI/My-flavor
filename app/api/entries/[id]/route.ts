import { database, files } from '@/db';
import { identity, json, failure } from '@/lib/api';
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await identity(request, true);
    const { id } = await params;
    const row = await database()
      .prepare('SELECT photos FROM entries WHERE id=? AND owner_id=?')
      .bind(id, owner)
      .first();
    if (!row) return json({ error: 'التجربة غير موجودة.' }, 404);
    const photoIds = JSON.parse(String(row.photos)) as string[];
    await database()
      .prepare('DELETE FROM entries WHERE id=? AND owner_id=?')
      .bind(id, owner)
      .run();
    for (const photoId of photoIds) {
      const used = await database()
        .prepare(
          'SELECT id FROM entries WHERE owner_id=? AND EXISTS (SELECT 1 FROM json_each(entries.photos) WHERE value=?) LIMIT 1',
        )
        .bind(owner, photoId)
        .first();
      if (!used) {
        const photo = await database()
          .prepare('SELECT object_key FROM photos WHERE id=? AND owner_id=?')
          .bind(photoId, owner)
          .first();
        if (photo) {
          try {
            await files().delete(String(photo.object_key));
            await database()
              .prepare('DELETE FROM photos WHERE id=? AND owner_id=?')
              .bind(photoId, owner)
              .run();
          } catch {
            console.error('Photo cleanup deferred');
          }
        }
      }
    }
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
