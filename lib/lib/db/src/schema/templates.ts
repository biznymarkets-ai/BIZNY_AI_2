import { pgTable, serial, text, timestamp, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// template_type values: business_model | project | engineering_design | manufacturing_process |
// agricultural_system | research_framework | community_solution | operational_procedure |
// playbook | experiment | innovation_concept | sop | guide | blueprint | initiative
// difficulty values: beginner | intermediate | advanced

export const ventureTemplatesTable = pgTable("venture_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  industry: text("industry").notNull(),
  subIndustry: text("sub_industry"),
  productCategory: text("product_category"),
  specificProduct: text("specific_product"),
  description: text("description").notNull(),
  problemSolved: text("problem_solved"),
  durationDays: integer("duration_days").notNull(),
  requiredSkills: text("required_skills").array().notNull().default([]),
  requiredTools: text("required_tools").array().notNull().default([]),
  requiredResources: text("required_resources").array().notNull().default([]),
  estimatedTimeline: text("estimated_timeline").notNull(),
  estimatedStartupCost: real("estimated_startup_cost"),
  milestones: jsonb("milestones").$type<Array<{
    title: string;
    description?: string;
    day?: number;
    evidenceRequired?: boolean;
    evidenceTypes?: string[];
    evidenceNote?: string;
  }>>().notNull().default([]),
  dailyStructure: jsonb("daily_structure").notNull().default([]),
  riskFactors: text("risk_factors").array().notNull().default([]),
  expectedOutputs: text("expected_outputs").array().notNull().default([]),
  coverImageUrl: text("cover_image_url"),
  attachments: text("attachments").array().notNull().default([]),
  audioDescription: text("audio_description"),
  aiTranscript: text("ai_transcript"),
  visibility: text("visibility").notNull().default("public"),
  creatorId: integer("creator_id"),
  cloneCount: integer("clone_count").notNull().default(0),
  useCount: integer("use_count").notNull().default(0),
  // Template-first architecture fields
  templateType: text("template_type").notNull().default("business_model"),
  difficulty: text("difficulty").notNull().default("beginner"),
  tags: text("tags").array().notNull().default([]),
  followCount: integer("follow_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  adoptionCount: integer("adoption_count").notNull().default(0),
  forkCount: integer("fork_count").notNull().default(0),
  forkedFromId: integer("forked_from_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVentureTemplateSchema = createInsertSchema(ventureTemplatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVentureTemplate = z.infer<typeof insertVentureTemplateSchema>;
export type VentureTemplate = typeof ventureTemplatesTable.$inferSelect;
