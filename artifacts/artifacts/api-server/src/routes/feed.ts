import { Router, type IRouter } from "express";
import { db, postsTable, usersTable, postCommentsTable, postReactionsTable, postSavesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  ListFeedQueryParams,
  ListFeedResponse,
  CreatePostBody,
  ReactToPostParams,
  ReactToPostBody,
  ReactToPostResponse,
  ListPostCommentsParams,
  CreatePostCommentParams,
  CreatePostCommentBody,
  RepostPostParams,
  RepostPostBody,
  SavePostParams,
  UnsavePostParams,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichPost(post: typeof postsTable.$inferSelect, userId?: number): Promise<Record<string, unknown>> {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.authorId));

  let userReaction: string | null = null;
  let isSaved = false;
  if (userId) {
    const [reaction] = await db.select().from(postReactionsTable)
      .where(and(eq(postReactionsTable.postId, post.id), eq(postReactionsTable.userId, userId)));
    userReaction = reaction?.reactionType ?? null;

    const [saved] = await db.select().from(postSavesTable)
      .where(and(eq(postSavesTable.postId, post.id), eq(postSavesTable.userId, userId)));
    isSaved = !!saved;
  }

  let originalPost: Record<string, unknown> | null = null;
  if (post.repostOf) {
    const [orig] = await db.select().from(postsTable).where(eq(postsTable.id, post.repostOf));
    if (orig) {
      const [origAuthor] = await db.select().from(usersTable).where(eq(usersTable.id, orig.authorId));
      originalPost = {
        ...orig,
        author: origAuthor ? {
          id: origAuthor.id,
          name: origAuthor.name,
          role: origAuthor.role,
          verificationStatus: origAuthor.verificationStatus,
          avatarUrl: origAuthor.avatarUrl ?? null,
        } : null,
        isSaved: false,
      };
    }
  }

  return {
    ...post,
    postType: post.postType,
    loves: post.loves,
    unsures: post.unsures,
    reposts: post.reposts ?? 0,
    isSaved,
    userReaction,
    originalPost,
    author: author ? {
      id: author.id,
      name: author.name,
      role: author.role,
      verificationStatus: author.verificationStatus,
      avatarUrl: author.avatarUrl ?? null,
    } : null,
  };
}

router.get("/feed", async (req, res): Promise<void> => {
  const params = ListFeedQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = await getUserFromToken(req.headers.authorization);

  const rows = params.data.postType
    ? await db.select().from(postsTable).where(eq(postsTable.postType, params.data.postType as "share")).orderBy(desc(postsTable.createdAt))
    : await db.select().from(postsTable).orderBy(desc(postsTable.createdAt));

  const enriched = await Promise.all(rows.map((p: any) => enrichPost(p, userId ?? undefined)));
  res.json(ListFeedResponse.parse(enriched));
});

router.post("/feed", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db.insert(postsTable).values({
    content: parsed.data.content,
    authorId: userId,
    postType: (parsed.data.postType as "share") ?? "share",
    ventureId: parsed.data.ventureId ?? null,
    templateId: parsed.data.templateId ?? null,
    mediaUrl: parsed.data.mediaUrl ?? null,
    mediaUrls: (parsed.data as any).mediaUrls ?? null,
    linkUrl: (parsed.data as any).linkUrl ?? null,
    milestoneTag: parsed.data.milestoneTag ?? null,
    requestCategory: parsed.data.requestCategory ?? null,
    progressPercent: parsed.data.progressPercent ?? null,
    locationName: parsed.data.locationName ?? null,
    locationCoords: parsed.data.locationCoords ?? null,
    stateCity: (parsed.data as any).stateCity ?? null,
    localArea: (parsed.data as any).localArea ?? null,
    mainIndustry: (parsed.data as any).mainIndustry ?? null,
    subIndustry: (parsed.data as any).subIndustry ?? null,
    activityTag: (parsed.data as any).activityTag ?? null,
    valueChainStage: (parsed.data as any).valueChainStage ?? null,
  }).returning();

  const enriched = await enrichPost(post, userId);
  res.status(201).json(enriched);
});

router.post("/feed/:id/react", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReactToPostParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ReactToPostBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [existingReaction] = await db.select().from(postReactionsTable)
    .where(and(eq(postReactionsTable.postId, params.data.id), eq(postReactionsTable.userId, userId)));

  if (existingReaction) {
    if (existingReaction.reactionType === body.data.type) {
      // Toggle off — remove reaction
      await db.delete(postReactionsTable)
        .where(and(eq(postReactionsTable.postId, params.data.id), eq(postReactionsTable.userId, userId)));
      const field = body.data.type === "love" ? postsTable.loves : postsTable.unsures;
      await db.update(postsTable)
        .set({ [field.name]: sql`GREATEST(0, ${field} - 1)` })
        .where(eq(postsTable.id, params.data.id));
    } else {
      // Switch reaction type
      const oldField = existingReaction.reactionType === "love" ? postsTable.loves : postsTable.unsures;
      const newField = body.data.type === "love" ? postsTable.loves : postsTable.unsures;
      await db.update(postReactionsTable)
        .set({ reactionType: body.data.type })
        .where(and(eq(postReactionsTable.postId, params.data.id), eq(postReactionsTable.userId, userId)));
      await db.update(postsTable)
        .set({
          [oldField.name]: sql`GREATEST(0, ${oldField} - 1)`,
          [newField.name]: sql`${newField} + 1`,
        })
        .where(eq(postsTable.id, params.data.id));
    }
  } else {
    await db.insert(postReactionsTable).values({
      postId: params.data.id,
      userId,
      reactionType: body.data.type,
    });
    const field = body.data.type === "love" ? postsTable.loves : postsTable.unsures;
    await db.update(postsTable)
      .set({ [field.name]: sql`${field} + 1` })
      .where(eq(postsTable.id, params.data.id));
  }

  const [updated] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  const enriched = await enrichPost(updated, userId);
  res.json(ReactToPostResponse.parse(enriched));
});

router.get("/feed/:id/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListPostCommentsParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select()
    .from(postCommentsTable)
    .where(eq(postCommentsTable.postId, params.data.id))
    .orderBy(postCommentsTable.createdAt);

  const enriched = await Promise.all(
    rows.map(async (c: any) => {
      const [author] = await db.select().from(usersTable).where(eq(usersTable.id, c.authorId));
      return {
        ...c,
        author: author
          ? { id: author.id, name: author.name, role: author.role, verificationStatus: author.verificationStatus, avatarUrl: author.avatarUrl ?? null }
          : null,
      };
    })
  );

  res.json(enriched);
});

router.post("/feed/:id/comments", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreatePostCommentParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreatePostCommentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const [comment] = await db
    .insert(postCommentsTable)
    .values({ postId: params.data.id, authorId: userId, content: body.data.content })
    .returning();

  await db
    .update(postsTable)
    .set({ comments: sql`${postsTable.comments} + 1` })
    .where(eq(postsTable.id, params.data.id));

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.status(201).json({
    ...comment,
    author: author
      ? { id: author.id, name: author.name, role: author.role, verificationStatus: author.verificationStatus, avatarUrl: author.avatarUrl ?? null }
      : null,
  });
});

router.post("/feed/:id/repost", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RepostPostParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = RepostPostBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [orig] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!orig) { res.status(404).json({ error: "Post not found" }); return; }

  const [repost] = await db.insert(postsTable).values({
    content: body.data.comment ?? "",
    authorId: userId,
    postType: "share",
    repostOf: params.data.id,
    repostComment: body.data.comment ?? null,
  }).returning();

  await db.update(postsTable)
    .set({ reposts: sql`${postsTable.reposts} + 1` })
    .where(eq(postsTable.id, params.data.id));

  const enriched = await enrichPost(repost, userId);
  res.status(201).json(enriched);
});

router.post("/feed/:id/save", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SavePostParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.insert(postSavesTable).values({ postId: params.data.id, userId }).onConflictDoNothing();
  res.json({ saved: true });
});

router.delete("/feed/:id/save", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnsavePostParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(postSavesTable)
    .where(and(eq(postSavesTable.postId, params.data.id), eq(postSavesTable.userId, userId)));
  res.json({ saved: false });
});

export default router;
