import { Router, type IRouter } from "express";
import { db, knowledgeArticlesTable, executionJournalEntriesTable, executionInstancesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "article";
  let attempt = 0;
  while (true) {
    const [existing] = await db.select().from(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.slug, slug));
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

// ─── List knowledge articles ────────────────────────────────────────────────
// GET /knowledge-articles?industry=&category=&sourceType=&search=
router.get("/knowledge-articles", async (req, res): Promise<void> => {
  const { industry, category, sourceType, search } = req.query as Record<string, string | undefined>;

  let rows = await db
    .select()
    .from(knowledgeArticlesTable)
    .where(eq(knowledgeArticlesTable.published, true))
    .orderBy(desc(knowledgeArticlesTable.createdAt));

  if (industry) rows = rows.filter((r: any) => r.industry === industry);
  if (category) rows = rows.filter((r: any) => r.category === category);
  if (sourceType) rows = rows.filter((r: any) => r.sourceType === sourceType);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((r: any) =>
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      r.tags.some((t: any) => t.toLowerCase().includes(q))
    );
  }

  res.json(rows);
});

// ─── Get a single article by slug ───────────────────────────────────────────
router.get("/knowledge-articles/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

  const [article] = await db.select().from(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.slug, slug));
  if (!article) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db
    .update(knowledgeArticlesTable)
    .set({ viewCount: article.viewCount + 1 })
    .where(eq(knowledgeArticlesTable.id, article.id))
    .returning();

  res.json(updated);
});

// ─── Create an editorial article ────────────────────────────────────────────
// POST /knowledge-articles
// Body: { title, industry?, category?, content, tags? }
router.post("/knowledge-articles", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title, industry, category, content, tags } = req.body as {
    title?: string;
    industry?: string;
    category?: string;
    content?: string;
    tags?: string[];
  };

  if (!title || !content) { res.status(400).json({ error: "title and content are required" }); return; }

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const slug = await uniqueSlug(slugify(title));

  const [created] = await db
    .insert(knowledgeArticlesTable)
    .values({
      title,
      slug,
      industry: industry || null,
      category: category || "guide",
      content,
      tags: Array.isArray(tags) ? tags : [],
      sourceType: "editorial",
      authorId: userId,
      authorName: author?.name ?? null,
    })
    .returning();

  res.status(201).json(created);
});

// ─── Promote a journal entry into a community knowledge article ────────────
// POST /knowledge-articles/from-journal/:journalEntryId
// Body: { title?, category?, tags? }
router.post("/knowledge-articles/from-journal/:journalEntryId", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.journalEntryId) ? req.params.journalEntryId[0] : req.params.journalEntryId;
  const journalEntryId = parseInt(raw, 10);
  if (isNaN(journalEntryId)) { res.status(400).json({ error: "Invalid journal entry id" }); return; }

  const [entry] = await db.select().from(executionJournalEntriesTable).where(eq(executionJournalEntriesTable.id, journalEntryId));
  if (!entry) { res.status(404).json({ error: "Journal entry not found" }); return; }
  if (!entry.notes || !entry.notes.trim()) {
    res.status(400).json({ error: "Journal entry has no notes to share" });
    return;
  }

  const [instance] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, entry.executionInstanceId), eq(executionInstancesTable.ownerId, userId)));
  if (!instance) { res.status(403).json({ error: "Forbidden" }); return; }

  const { title, category, tags } = req.body as { title?: string; category?: string; tags?: string[] };
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const finalTitle = title || `Day ${entry.day}: ${entry.title}`;
  const slug = await uniqueSlug(slugify(finalTitle));

  const [created] = await db
    .insert(knowledgeArticlesTable)
    .values({
      title: finalTitle,
      slug,
      industry: instance.mainIndustry ?? null,
      category: category || (entry.entryType === "milestone_complete" ? "lesson" : "note"),
      content: entry.notes,
      tags: Array.isArray(tags) ? tags : [],
      sourceType: "community",
      authorId: userId,
      authorName: author?.name ?? null,
      sourceExecutionInstanceId: instance.id,
      sourceJournalEntryId: entry.id,
    })
    .returning();

  res.status(201).json(created);
});

// ─── Mark an article as helpful ─────────────────────────────────────────────
router.post("/knowledge-articles/:id/helpful", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [article] = await db.select().from(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.id, id));
  if (!article) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db
    .update(knowledgeArticlesTable)
    .set({ helpfulCount: article.helpfulCount + 1 })
    .where(eq(knowledgeArticlesTable.id, id))
    .returning();

  res.json(updated);
});

// ─── Delete an article (author only) ────────────────────────────────────────
router.delete("/knowledge-articles/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(knowledgeArticlesTable)
    .where(and(eq(knowledgeArticlesTable.id, id), eq(knowledgeArticlesTable.authorId, userId)));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(knowledgeArticlesTable).where(eq(knowledgeArticlesTable.id, id));
  res.status(204).send();
});

export default router;
