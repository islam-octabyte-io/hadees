import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const hadiths = pgTable('hadiths', {
  id: serial('id').primaryKey(),
  collection: varchar('collection', { length: 100 }).notNull(),
  hadithNumber: integer('hadith_number').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Hadith = typeof hadiths.$inferSelect;
export type NewHadith = typeof hadiths.$inferInsert;
