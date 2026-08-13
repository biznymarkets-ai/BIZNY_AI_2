import { pgTable, serial, text, timestamp, integer, date, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const innovationsTable = pgTable("innovations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  innovationType: text("innovation_type").notNull().default("idea"),
  authorId: integer("author_id").notNull(),
  industry: text("industry"),
  subIndustry: text("sub_industry"),
  activityTag: text("activity_tag"),
  country: text("country"),
  stateCity: text("state_city"),
  expectedOutcome: text("expected_outcome"),
  reward: text("reward"),
  deadline: date("deadline"),
  requiredSkills: text("required_skills").array(),
  requiredCollaborators: text("required_collaborators").array(),
  tags: text("tags").array(),
  mediaUrls: text("media_urls").array(),
  status: text("status").notNull().default("open"),
  loves: integer("loves").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  solutionsCount: integer("solutions_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const innovationSolutionsTable = pgTable("innovation_solutions", {
  id: serial("id").primaryKey(),
  innovationId: integer("innovation_id").notNull(),
  authorId: integer("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const innovationFollowsTable = pgTable("innovation_follows", {
  innovationId: integer("innovation_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.innovationId, t.userId] })]);

export const insertInnovationSchema = createInsertSchema(innovationsTable, {
  title: z.string().min(1),
  description: z.string().min(1),
  innovationType: z.string().optional(),
}).omit({ id: true, authorId: true, loves: true, comments: true, solutionsCount: true, createdAt: true, updatedAt: true });

export const insertInnovationSolutionSchema = createInsertSchema(innovationSolutionsTable, {
  title: z.string().min(1),
  content: z.string().min(1),
}).omit({ id: true, innovationId: true, authorId: true, status: true, createdAt: true });
