import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  industry: text("industry").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  role: text("role"),
  investmentSize: text("investment_size"),
  deadline: text("deadline"),
  postedById: integer("posted_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true, createdAt: true });
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
