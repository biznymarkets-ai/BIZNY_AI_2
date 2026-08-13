import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// category values: guide | lesson | pitfall | case_study
// sourceType values: editorial | community

export const knowledgeArticlesTable = pgTable("knowledge_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  industry: text("industry"),
  category: text("category").notNull().default("guide"),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  sourceType: text("source_type").notNull().default("editorial"),
  authorId: integer("author_id").notNull(),
  authorName: text("author_name"),
  sourceExecutionInstanceId: integer("source_execution_instance_id"),
  sourceJournalEntryId: integer("source_journal_entry_id"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticlesTable).omit({
  id: true,
  helpfulCount: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type KnowledgeArticle = typeof knowledgeArticlesTable.$inferSelect;
