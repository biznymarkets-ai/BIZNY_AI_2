import { pgTable, serial, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "pending", "verified"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  whatsapp: text("whatsapp"),
  country: text("country").notNull(),
  industry: text("industry").notNull(),
  role: text("role").notNull(),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  interests: text("interests").array().notNull().default([]),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  avatarUrl: text("avatar_url"),
  // business fields
  isBusiness: boolean("is_business").notNull().default(false),
  businessName: text("business_name"),
  businessRegistrationNumber: text("business_registration_number"),
  stateCity: text("state_city"),
  subIndustries: text("sub_industries").array().notNull().default([]),
  primaryProducts: text("primary_products").array().notNull().default([]),
  services: text("services").array().notNull().default([]),
  phone: text("phone"),
  website: text("website"),
  publicSlug: text("public_slug").unique(),
  supabaseAuthId: text("supabase_auth_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
