import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// entry_type values: milestone_complete | checkin | note

export const executionJournalEntriesTable = pgTable("execution_journal_entries", {
  id: serial("id").primaryKey(),
  executionInstanceId: integer("execution_instance_id").notNull(),
  day: integer("day").notNull(),
  entryType: text("entry_type").notNull().default("note"),
  title: text("title"),
  notes: text("notes"),
  evidenceUrls: text("evidence_urls").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExecutionJournalEntrySchema = createInsertSchema(executionJournalEntriesTable).omit({ id: true, createdAt: true });
export type InsertExecutionJournalEntry = z.infer<typeof insertExecutionJournalEntrySchema>;
export type ExecutionJournalEntry = typeof executionJournalEntriesTable.$inferSelect;
