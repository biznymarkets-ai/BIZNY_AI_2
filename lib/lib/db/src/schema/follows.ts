import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique("user_follows_unique").on(t.followerId, t.followingId)]);

export const insertUserFollowSchema = createInsertSchema(userFollowsTable).omit({ id: true, createdAt: true });
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type UserFollow = typeof userFollowsTable.$inferSelect;
