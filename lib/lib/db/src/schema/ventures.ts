import { pgTable, serial, text, timestamp, integer, real, pgEnum, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ventureStatusEnum = pgEnum("venture_status", ["active","paused","completed","abandoned"]);
export const contentTypeEnum = pgEnum("content_type", ["text","photo","video","document","voice","livestream"]);

export const venturesTable = pgTable("ventures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  templateId: integer("template_id"),
  userId: integer("user_id").notNull(),
  status: ventureStatusEnum("status").notNull().default("active"),
  currentDay: integer("current_day").notNull().default(1),
  progressPercent: real("progress_percent").notNull().default(0),
  // rich fields
  description: text("description"),
  problem: text("problem"),
  mainIndustry: text("main_industry"),
  subIndustry: text("sub_industry"),
  activityTag: text("activity_tag"),
  valueChainStage: text("value_chain_stage"),
  country: text("country"),
  stateCity: text("state_city"),
  localArea: text("local_area"),
  ventureType: text("venture_type"),
  estimatedDuration: text("estimated_duration"),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  collaboratorsNeeded: text("collaborators_needed").array(),
  resourcesNeeded: text("resources_needed").array(),
  equipmentNeeded: text("equipment_needed").array(),
  fundingRequired: text("funding_required"),
  expectedOutput: text("expected_output"),
  milestones: jsonb("milestones").$type<Array<{ title: string; description?: string }>>(),
  visibility: text("visibility").notNull().default("public"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progressEntriesTable = pgTable("progress_entries", {
  id: serial("id").primaryKey(),
  ventureId: integer("venture_id").notNull(),
  dayNumber: integer("day_number").notNull(),
  content: text("content").notNull(),
  contentType: contentTypeEnum("content_type").notNull().default("text"),
  milestone: text("milestone"),
  mediaUrl: text("media_url"),
  authorId: integer("author_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVentureSchema = createInsertSchema(venturesTable).omit({ id: true, createdAt: true });
export const insertProgressEntrySchema = createInsertSchema(progressEntriesTable).omit({ id: true, createdAt: true });
export type InsertVenture = z.infer<typeof insertVentureSchema>;
export type InsertProgressEntry = z.infer<typeof insertProgressEntrySchema>;
export type Venture = typeof venturesTable.$inferSelect;
export type ProgressEntry = typeof progressEntriesTable.$inferSelect;
