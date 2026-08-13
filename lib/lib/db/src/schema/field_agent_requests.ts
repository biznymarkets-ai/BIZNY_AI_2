import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationRequestStatusEnum = pgEnum("verification_request_status", [
  "pending",
  "in_review",
  "verified",
  "rejected",
]);

export const fieldAgentRequestsTable = pgTable("field_agent_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  agentId: integer("agent_id"),
  status: verificationRequestStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  evidenceUrls: text("evidence_urls").array().notNull().default([]),
  targetType: text("target_type").notNull().default("profile"), // profile | listing | venture | milestone
  targetId: integer("target_id"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFieldAgentRequestSchema = createInsertSchema(fieldAgentRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFieldAgentRequest = z.infer<typeof insertFieldAgentRequestSchema>;
export type FieldAgentRequest = typeof fieldAgentRequestsTable.$inferSelect;
