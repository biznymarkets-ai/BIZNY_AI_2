import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  product: text("product").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  industry: text("industry").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  isVerified: boolean("is_verified").notNull().default(false),
  postedById: integer("posted_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
