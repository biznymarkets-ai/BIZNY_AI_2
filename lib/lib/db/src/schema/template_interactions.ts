import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templateFollowsTable = pgTable("template_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateId: integer("template_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templateSavesTable = pgTable("template_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateId: integer("template_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemplateFollowSchema = createInsertSchema(templateFollowsTable).omit({ id: true, createdAt: true });
export const insertTemplateSaveSchema = createInsertSchema(templateSavesTable).omit({ id: true, createdAt: true });

export type TemplateFollow = typeof templateFollowsTable.$inferSelect;
export type TemplateSave = typeof templateSavesTable.$inferSelect;
export type InsertTemplateFollow = z.infer<typeof insertTemplateFollowSchema>;
export type InsertTemplateSave = z.infer<typeof insertTemplateSaveSchema>;
