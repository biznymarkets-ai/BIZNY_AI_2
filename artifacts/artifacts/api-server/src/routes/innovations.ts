import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  innovationsTable,
  innovationSolutionsTable,
  innovationFollowsTable,
} from "@workspace/db/schema";
import { usersTable } from "@workspace/db/schema";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function enrichInnovation(innovation: any, userId: number | null) {
  const author = await db
    .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.id, innovation.authorId))
    .then((r: any) => r[0] ?? null);

  let isFollowing = false;
  let hasLoved = false;
  if (userId) {
    const follow = await db.select().from(innovationFollowsTable)
      .where(and(eq(innovationFollowsTable.innovationId, innovation.id), eq(innovationFollowsTable.userId, userId)))
      .then((r: any) => r[0] ?? null);
    isFollowing = !!follow;
  }

  return { ...innovation, author, isFollowing, hasLoved };
}

router.get("/innovations", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  const { type, industry, search, status, mine } = req.query as Record<string, string>;

  let query = db.select().from(innovationsTable).orderBy(desc(innovationsTable.createdAt));

  const conditions = [];
  if (type) conditions.push(eq(innovationsTable.innovationType, type));
  if (industry) conditions.push(eq(innovationsTable.industry, industry));
  if (status) conditions.push(eq(innovationsTable.status, status));
  if (mine && userId) conditions.push(eq(innovationsTable.authorId, userId));
  if (search) {
    conditions.push(
      or(
        ilike(innovationsTable.title, `%${search}%`),
        ilike(innovationsTable.description, `%${search}%`)
      )!
    );
  }

  const rows = conditions.length > 0
    ? await db.select().from(innovationsTable).where(and(...conditions)).orderBy(desc(innovationsTable.createdAt))
    : await db.select().from(innovationsTable).orderBy(desc(innovationsTable.createdAt));

  const enriched = await Promise.all(rows.map((r: any) => enrichInnovation(r, userId)));
  res.json(enriched);
});

router.post("/innovations", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    title, description, innovationType, industry, subIndustry, activityTag,
    country, stateCity, expectedOutcome, reward, deadline, requiredSkills,
    requiredCollaborators, tags, mediaUrls, status,
  } = req.body;

  const [row] = await db.insert(innovationsTable).values({
    title, description,
    innovationType: innovationType ?? "idea",
    authorId: userId,
    industry: industry ?? null,
    subIndustry: subIndustry ?? null,
    activityTag: activityTag ?? null,
    country: country ?? null,
    stateCity: stateCity ?? null,
    expectedOutcome: expectedOutcome ?? null,
    reward: reward ?? null,
    deadline: deadline ?? null,
    requiredSkills: requiredSkills ?? null,
    requiredCollaborators: requiredCollaborators ?? null,
    tags: tags ?? null,
    mediaUrls: mediaUrls ?? null,
    status: status ?? "open",
  }).returning();

  res.status(201).json(await enrichInnovation(row, userId));
});

router.get("/innovations/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const [row] = await db.select().from(innovationsTable).where(eq(innovationsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json(await enrichInnovation(row, userId));
});

router.put("/innovations/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const [existing] = await db.select().from(innovationsTable).where(eq(innovationsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.authorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const updates: any = { updatedAt: new Date() };
  const fields = ["title","description","innovationType","industry","subIndustry","activityTag","country","stateCity","expectedOutcome","reward","deadline","requiredSkills","requiredCollaborators","tags","mediaUrls","status"];
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const [updated] = await db.update(innovationsTable).set(updates).where(eq(innovationsTable.id, id)).returning();
  res.json(await enrichInnovation(updated, userId));
});

router.delete("/innovations/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const [existing] = await db.select().from(innovationsTable).where(eq(innovationsTable.id, id));
  if (!existing || existing.authorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(innovationsTable).where(eq(innovationsTable.id, id));
  res.status(204).end();
});

router.get("/innovations/:id/solutions", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const solutions = await db.select().from(innovationSolutionsTable)
    .where(eq(innovationSolutionsTable.innovationId, id))
    .orderBy(desc(innovationSolutionsTable.createdAt));

  const enriched = await Promise.all(solutions.map(async (s: any) => {
    const author = await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, avatarUrl: usersTable.avatarUrl })
      .from(usersTable).where(eq(usersTable.id, s.authorId)).then((r: any) => r[0] ?? null);
    return { ...s, author };
  }));

  res.json(enriched);
});

router.post("/innovations/:id/solutions", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const { title, content } = req.body;
  const [solution] = await db.insert(innovationSolutionsTable).values({
    innovationId: id, authorId: userId, title, content,
  }).returning();

  await db.update(innovationsTable)
    .set({ solutionsCount: sql`${innovationsTable.solutionsCount} + 1` })
    .where(eq(innovationsTable.id, id));

  const author = await db.select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, avatarUrl: usersTable.avatarUrl })
    .from(usersTable).where(eq(usersTable.id, userId)).then((r: any) => r[0] ?? null);

  res.status(201).json({ ...solution, author });
});

router.post("/innovations/:id/react", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  await db.update(innovationsTable)
    .set({ loves: sql`${innovationsTable.loves} + 1` })
    .where(eq(innovationsTable.id, id));

  res.json({ ok: true });
});

router.post("/innovations/:id/follow", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  await db.insert(innovationFollowsTable).values({ innovationId: id, userId })
    .onConflictDoNothing();

  res.json({ following: true });
});

router.delete("/innovations/:id/follow", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  await db.delete(innovationFollowsTable)
    .where(and(eq(innovationFollowsTable.innovationId, id), eq(innovationFollowsTable.userId, userId)));

  res.json({ following: false });
});

export default router;
