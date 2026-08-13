import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const industriesTable = pgTable("industries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  ventureCount: integer("venture_count").notNull().default(0),
  iconUrl: text("icon_url"),
});

export const insertIndustrySchema = createInsertSchema(industriesTable).omit({ id: true });
export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Industry = typeof industriesTable.$inferSelect;
