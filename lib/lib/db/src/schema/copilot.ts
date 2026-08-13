import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const copilotConversationsTable = pgTable("copilot_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  reply: text("reply").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCopilotConversationSchema = createInsertSchema(copilotConversationsTable).omit({ id: true, createdAt: true });
export type InsertCopilotConversation = z.infer<typeof insertCopilotConversationSchema>;
export type CopilotConversation = typeof copilotConversationsTable.$inferSelect;
