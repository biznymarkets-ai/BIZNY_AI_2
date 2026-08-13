import { pgTable, serial, text, timestamp, integer, real, index, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postTypeEnum = pgEnum("post_type", [
  "share","question","request","opportunity","template","venture_progress",
  "milestone","marketplace_listing","industry_insight","verification_update",
  "innovation_idea","innovation_challenge",
]);

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  postType: postTypeEnum("post_type").notNull().default("share"),
  ventureId: integer("venture_id"),
  templateId: integer("template_id"),
  executionInstanceId: integer("execution_instance_id"),
  mediaUrl: text("media_url"),
  mediaUrls: text("media_urls").array(),
  linkUrl: text("link_url"),
  // legacy
  likes: integer("likes").notNull().default(0),
  // reactions
  loves: integer("loves").notNull().default(0),
  unsures: integer("unsures").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  progressPercent: real("progress_percent"),
  milestoneTag: text("milestone_tag"),
  requestCategory: text("request_category"),
  // industrial stamps
  mainIndustry: text("main_industry"),
  subIndustry: text("sub_industry"),
  activityTag: text("activity_tag"),
  valueChainStage: text("value_chain_stage"),
  // location
  locationName: text("location_name"),
  locationCoords: text("location_coords"),
  stateCity: text("state_city"),
  localArea: text("local_area"),
  // reposts
  repostOf: integer("repost_of"),
  repostComment: text("repost_comment"),
  reposts: integer("reposts").notNull().default(0),
  // visibility
  visibility: text("visibility").notNull().default("public"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postSavesTable = pgTable("post_saves", {
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const postReactionsTable = pgTable("post_reactions", {
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.postId, t.userId] })]);

export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true, createdAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

export const postCommentsTable = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("post_comments_post_id_idx").on(t.postId)]);

export const insertPostCommentSchema = createInsertSchema(postCommentsTable).omit({ id: true, createdAt: true });
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postCommentsTable.$inferSelect;
