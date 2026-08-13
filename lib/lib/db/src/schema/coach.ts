import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskStatusEnum = pgEnum("task_status", ["not_started", "in_progress", "completed", "blocked"]);
export const taskPriorityEnum = pgEnum("task_priority", ["high", "medium", "low"]);
export const evidenceTypeEnum = pgEnum("evidence_type", ["photo", "video", "document", "receipt", "text", "link"]);

// One execution plan per user (replaces or extends the Clinic report)
export const coachPlansTable = pgTable("coach_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goal: text("goal").notNull(),
  selfDescription: text("self_description"),
  roles: text("roles").array(),
  resources: text("resources").array(),
  bottlenecks: text("bottlenecks").array(),
  weekNumber: integer("week_number").notNull().default(1),
  streakDays: integer("streak_days").notNull().default(0),
  productivityScore: integer("productivity_score").notNull().default(0),
  lastReviewAt: timestamp("last_review_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual tasks within a plan
export const coachTasksTable = pgTable("coach_tasks", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  status: taskStatusEnum("status").notNull().default("not_started"),
  weekNumber: integer("week_number").notNull().default(1),
  evidenceRequired: boolean("evidence_required").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Evidence attached to tasks
export const taskEvidenceTable = pgTable("task_evidence", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  evidenceType: evidenceTypeEnum("evidence_type").notNull().default("text"),
  url: text("url"),
  textContent: text("text_content"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Blocker reports when a task is marked blocked
export const taskBlockersTable = pgTable("task_blockers", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  reason: text("reason").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Weekly review sessions
export const weeklyReviewsTable = pgTable("weekly_reviews", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  userId: integer("user_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  completedCount: integer("completed_count").notNull().default(0),
  remainingCount: integer("remaining_count").notNull().default(0),
  biggestObstacle: text("biggest_obstacle"),
  learned: text("learned"),
  whatChanged: text("what_changed"),
  continueGoal: boolean("continue_goal").notNull().default(true),
  adjustments: text("adjustments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoachPlanSchema = createInsertSchema(coachPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCoachTaskSchema = createInsertSchema(coachTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskEvidenceSchema = createInsertSchema(taskEvidenceTable).omit({ id: true, createdAt: true });
export const insertTaskBlockerSchema = createInsertSchema(taskBlockersTable).omit({ id: true, createdAt: true });
export const insertWeeklyReviewSchema = createInsertSchema(weeklyReviewsTable).omit({ id: true, createdAt: true });

export type CoachPlan = typeof coachPlansTable.$inferSelect;
export type CoachTask = typeof coachTasksTable.$inferSelect;
export type TaskEvidence = typeof taskEvidenceTable.$inferSelect;
export type TaskBlocker = typeof taskBlockersTable.$inferSelect;
export type WeeklyReview = typeof weeklyReviewsTable.$inferSelect;
export type InsertCoachPlan = z.infer<typeof insertCoachPlanSchema>;
export type InsertCoachTask = z.infer<typeof insertCoachTaskSchema>;
