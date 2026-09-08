import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    name: text('name').notNull(),
    area: text('area').notNull(),
    category: text('category').notNull(),
    date: text('date').notNull(),
    rating: integer('rating').notNull().default(0),
    notes: text('notes').notNull(),
    lat: real('lat').notNull(),
    lng: real('lng').notNull(),
    photos: text('photos').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('idx_entries_owner_date').on(t.ownerId, t.date)],
);
export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('idx_photos_owner').on(t.ownerId)],
);
