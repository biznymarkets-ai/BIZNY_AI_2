import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dealType: text("deal_type").notNull(),
  status: text("status").notNull().default("draft"),
  initiatorId: integer("initiator_id").notNull(),
  industry: text("industry"),
  subIndustry: text("sub_industry"),
  activityTag: text("activity_tag"),
  country: text("country"),
  stateCity: text("state_city"),
  description: text("description").notNull().default(""),
  expectedContributions: jsonb("expected_contributions").$type<Record<string, string>>(),
  financialValue: text("financial_value"),
  nonFinancial: text("non_financial"),
  timeline: text("timeline"),
  milestones: jsonb("milestones").$type<Array<{ title: string; description?: string }>>(),
  requiredDocuments: text("required_documents").array(),
  terms: text("terms"),
  risks: text("risks"),
  fieldAgentRequired: boolean("field_agent_required").notNull().default(false),
  originatingType: text("originating_type"),
  originatingId: integer("originating_id"),
  copilotSummary: text("copilot_summary"),
  // Extended deal fields (v2)
  dealCategory: text("deal_category"),
  visibility: text("visibility").notNull().default("public"),
  city: text("city"),
  stateRegion: text("state_region"),
  pricingModel: text("pricing_model"),
  paymentTerms: text("payment_terms"),
  verificationStatus: text("verification_status").notNull().default("not_verified"),
  inspectionNeeded: text("inspection_needed"),
  insuranceAvailable: text("insurance_available"),
  partnerRequirements: jsonb("partner_requirements").$type<string[]>(),
  companySupport: jsonb("company_support").$type<string[]>(),
  requiredDocumentsV2: jsonb("required_documents_v2").$type<string[]>(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dealPartiesTable = pgTable("deal_parties", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("counterparty"),
  agreed: boolean("agreed").notNull().default(false),
  agreedAt: timestamp("agreed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dealWitnessesTable = pgTable("deal_witnesses", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  name: text("name").notNull(),
  witnessRole: text("witness_role"),
  email: text("email"),
  phone: text("phone"),
  relationship: text("relationship"),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDealSchema = createInsertSchema(dealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealPartySchema = createInsertSchema(dealPartiesTable).omit({ id: true, createdAt: true });
export const insertDealWitnessSchema = createInsertSchema(dealWitnessesTable).omit({ id: true, createdAt: true });

export type Deal = typeof dealsTable.$inferSelect;
export type DealParty = typeof dealPartiesTable.$inferSelect;
export type DealWitness = typeof dealWitnessesTable.$inferSelect;
