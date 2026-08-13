import { pgTable, serial, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const industryTargetsTable = pgTable("industry_targets", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  subIndustry: text("sub_industry"),
  productCategory: text("product_category"),
  specificProduct: text("specific_product"),
  currentRevenue: real("current_revenue"),
  currentProductionVolume: text("current_production_volume"),
  currentMarketSize: real("current_market_size"),
  targetRevenue: real("target_revenue"),
  targetYear: integer("target_year"),
  growthTargetPercent: real("growth_target_percent"),
  progressPercent: real("progress_percent").notNull().default(0),
  requiredContributions: jsonb("required_contributions").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIndustryTargetSchema = createInsertSchema(industryTargetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIndustryTarget = z.infer<typeof insertIndustryTargetSchema>;
export type IndustryTarget = typeof industryTargetsTable.$inferSelect;
