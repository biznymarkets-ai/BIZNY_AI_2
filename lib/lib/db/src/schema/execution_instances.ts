import { pgTable, serial, text, timestamp, integer, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// instance_type values: venture | project | experiment | community_initiative | research | operational_run | custom
// status values: planning | active | paused | completed | abandoned

export const executionInstancesTable = pgTable("execution_instances", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id"),
  ownerId: integer("owner_id").notNull(),
  title: text("title").notNull(),
  instanceType: text("instance_type").notNull().default("venture"),
  status: text("status").notNull().default("planning"),
  description: text("description"),
  problem: text("problem"),
  mainIndustry: text("main_industry"),
  subIndustry: text("sub_industry"),
  country: text("country"),
  stateCity: text("state_city"),
  localArea: text("local_area"),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  milestones: jsonb("milestones").$type<Array<{
    title: string;
    description?: string;
    completed?: boolean;
    completedAt?: string;
    day?: number;
    evidenceRequired?: boolean;
    evidenceTypes?: string[];
    evidenceNote?: string;
    evidenceUrls?: string[];
    evidenceText?: string;
  }>>().default([]),
  evidence: text("evidence").array().notNull().default([]),
  results: text("results"),
  lessonsLearned: text("lessons_learned"),
  progressPercent: real("progress_percent").notNull().default(0),
  visibility: text("visibility").notNull().default("public"),
  // Timeline / Daily Coaching Engine
  // timelineMode values: strict | flexible | adaptive
  timelineMode: text("timeline_mode").notNull().default("flexible"),
  durationDays: integer("duration_days"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastCheckInDate: date("last_check_in_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertExecutionInstanceSchema = createInsertSchema(executionInstancesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExecutionInstance = z.infer<typeof insertExecutionInstanceSchema>;
export type ExecutionInstance = typeof executionInstancesTable.$inferSelect;
