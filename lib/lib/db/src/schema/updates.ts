import { pgTable, serial, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const updatesTable = pgTable("updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id"),
  venture: text("venture"),
  progressPercent: real("progress_percent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUpdateSchema = createInsertSchema(updatesTable).omit({ id: true, createdAt: true });
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updatesTable.$inferSelect;
