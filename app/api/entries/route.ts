import { database } from '@/db';
import {
  identity,
  json,
  failure,
  parseRow,
  validate,
  validatePhotos,
} from '@/lib/api';
export async function GET(request: Request) {
  try {
    const owner = await identity(request);
    const rows = await database()
      .prepare(
        'SELECT * FROM entries WHERE owner_id = ? ORDER BY date DESC, created_at DESC',
      )
      .bind(owner)
      .all();
    return json({ entries: rows.results.map(parseRow) });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const owner = await identity(request, true);
    if (Number(request.headers.get('content-length')) > 30000)
      return json({ error: 'حجم البيانات كبير جدًا.' }, 413);
    const d = validate(await request.json());
    await validatePhotos(d.photos, owner);
    const existing = await database()
      .prepare('SELECT owner_id FROM entries WHERE id = ?')
      .bind(d.id)
      .first();
    if (existing && existing.owner_id !== owner)
      return json({ error: 'هذه التجربة غير متاحة.' }, 404);
    await database()
      .prepare(
        'INSERT INTO entries (id,owner_id,name,area,category,date,rating,notes,lat,lng,photos,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,area=excluded.area,category=excluded.category,date=excluded.date,rating=excluded.rating,notes=excluded.notes,lat=excluded.lat,lng=excluded.lng,photos=excluded.photos WHERE entries.owner_id=excluded.owner_id',
      )
      .bind(
        d.id,
        owner,
        d.name,
        d.area,
        d.category,
        d.date,
        d.rating,
        d.notes,
        d.lat,
        d.lng,
        JSON.stringify(d.photos),
        new Date().toISOString(),
      )
      .run();
    return json({
      entry: parseRow(
        (await database()
          .prepare('SELECT * FROM entries WHERE id=? AND owner_id=?')
          .bind(d.id, owner)
          .first())!,
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
