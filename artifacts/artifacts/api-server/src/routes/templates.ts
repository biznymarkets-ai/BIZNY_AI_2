import { Router, type IRouter } from "express";
import {
  db,
  ventureTemplatesTable,
  templateFollowsTable,
  templateSavesTable,
  executionInstancesTable,
} from "@workspace/db";
import { eq, or, isNull, and, ilike, sql } from "drizzle-orm";
import {
  ListTemplatesQueryParams,
  ListTemplatesResponse,
  GetTemplateParams,
  GetTemplateResponse,
  CreateTemplateBody,
  UpdateTemplateParams,
  UpdateTemplateBody,
  DeleteTemplateParams,
  CloneTemplateParams,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

// ─── List templates ───────────────────────────────────────────────────────────

router.get("/templates", async (req, res): Promise<void> => {
  const { industry, creatorId, templateType, search } = req.query as Record<string, string | undefined>;

  let rows = await db.select().from(ventureTemplatesTable)
    .where(or(eq(ventureTemplatesTable.visibility, "public"), isNull(ventureTemplatesTable.creatorId)));

  if (industry) rows = rows.filter((r: any) => r.industry === industry);
  if (templateType) rows = rows.filter((r: any) => r.templateType === templateType);
  if (creatorId) {
    const cid = parseInt(creatorId, 10);
    if (!isNaN(cid)) rows = rows.filter((r: any) => r.creatorId === cid);
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((r: any) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.industry.toLowerCase().includes(q) ||
      (r.tags ?? []).some((t: any) => t.toLowerCase().includes(q))
    );
  }

  res.json(rows);
});

// ─── Create template ──────────────────────────────────────────────────────────

router.post("/templates", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [template] = await db.insert(ventureTemplatesTable).values({
    title: parsed.data.title,
    industry: parsed.data.industry,
    subIndustry: parsed.data.subIndustry ?? null,
    productCategory: parsed.data.productCategory ?? null,
    specificProduct: parsed.data.specificProduct ?? null,
    description: parsed.data.description,
    problemSolved: parsed.data.problemSolved ?? null,
    durationDays: parsed.data.durationDays,
    requiredSkills: parsed.data.requiredSkills ?? [],
    requiredTools: parsed.data.requiredTools ?? [],
    requiredResources: parsed.data.requiredResources ?? [],
    estimatedTimeline: parsed.data.estimatedTimeline,
    estimatedStartupCost: parsed.data.estimatedStartupCost ?? null,
    milestones: parsed.data.milestones ?? [],
    dailyStructure: parsed.data.dailyStructure ?? [],
    riskFactors: parsed.data.riskFactors ?? [],
    expectedOutputs: parsed.data.expectedOutputs ?? [],
    coverImageUrl: parsed.data.coverImageUrl ?? null,
    attachments: parsed.data.attachments ?? [],
    visibility: (parsed.data.visibility as "draft" | "public" | "private") ?? "draft",
    templateType: (req.body.templateType as string) ?? "business_model",
    difficulty: (req.body.difficulty as string) ?? "beginner",
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    creatorId: userId,
  }).returning();

  res.status(201).json(template);
});

// ─── Get template by id ───────────────────────────────────────────────────────

router.get("/templates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [template] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!template) { res.status(404).json({ error: "Template not found" }); return; }

  res.json(template);
});

// ─── Update template ──────────────────────────────────────────────────────────

router.put("/templates/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Template not found" }); return; }
  if (existing.creatorId && existing.creatorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = UpdateTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [updated] = await db.update(ventureTemplatesTable)
    .set({
      ...parsed.data,
      templateType: (req.body.templateType as string) ?? existing.templateType,
      difficulty: (req.body.difficulty as string) ?? existing.difficulty,
      tags: Array.isArray(req.body.tags) ? req.body.tags : existing.tags,
      visibility: (parsed.data.visibility as "draft" | "public" | "private" | undefined) ?? existing.visibility,
      updatedAt: new Date(),
    })
    .where(eq(ventureTemplatesTable.id, id))
    .returning();

  res.json(updated);
});

// ─── Delete template ──────────────────────────────────────────────────────────

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Template not found" }); return; }
  if (existing.creatorId && existing.creatorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  res.status(204).end();
});

// ─── Clone / Fork ─────────────────────────────────────────────────────────────

router.post("/templates/:id/clone", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!source) { res.status(404).json({ error: "Template not found" }); return; }

  const { id: _id, createdAt, updatedAt, cloneCount, useCount, creatorId, followCount, saveCount, adoptionCount, forkCount, ...rest } = source;

  const [cloned] = await db.insert(ventureTemplatesTable).values({
    ...rest,
    title: `${source.title} (Copy)`,
    visibility: "draft",
    creatorId: userId,
    cloneCount: 0,
    useCount: 0,
    followCount: 0,
    saveCount: 0,
    adoptionCount: 0,
    forkCount: 0,
  }).returning();

  await db.update(ventureTemplatesTable)
    .set({ cloneCount: sql`${ventureTemplatesTable.cloneCount} + 1` })
    .where(eq(ventureTemplatesTable.id, id));

  res.status(201).json(cloned);
});

router.post("/templates/:id/fork", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [source] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!source) { res.status(404).json({ error: "Template not found" }); return; }

  const { id: _id, createdAt, updatedAt, cloneCount, useCount, creatorId, followCount, saveCount, adoptionCount, forkCount, ...rest } = source;

  const [forked] = await db.insert(ventureTemplatesTable).values({
    ...rest,
    title: req.body.title ?? `${source.title} (Fork)`,
    visibility: "draft",
    creatorId: userId,
    forkedFromId: id,
    cloneCount: 0,
    useCount: 0,
    followCount: 0,
    saveCount: 0,
    adoptionCount: 0,
    forkCount: 0,
  }).returning();

  await db.update(ventureTemplatesTable)
    .set({ forkCount: sql`${ventureTemplatesTable.forkCount} + 1` })
    .where(eq(ventureTemplatesTable.id, id));

  res.status(201).json(forked);
});

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

router.post("/templates/:id/follow", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    await db.insert(templateFollowsTable).values({ userId, templateId: id });
    await db.update(ventureTemplatesTable)
      .set({ followCount: sql`${ventureTemplatesTable.followCount} + 1` })
      .where(eq(ventureTemplatesTable.id, id));
  } catch {
    // already following — ignore unique constraint error
  }

  res.json({ ok: true });
});

router.delete("/templates/:id/follow", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(templateFollowsTable)
    .where(and(eq(templateFollowsTable.userId, userId), eq(templateFollowsTable.templateId, id)))
    .returning();

  if (deleted) {
    await db.update(ventureTemplatesTable)
      .set({ followCount: sql`GREATEST(${ventureTemplatesTable.followCount} - 1, 0)` })
      .where(eq(ventureTemplatesTable.id, id));
  }

  res.json({ ok: true });
});

// ─── Save / Unsave ────────────────────────────────────────────────────────────

router.post("/templates/:id/save", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    await db.insert(templateSavesTable).values({ userId, templateId: id });
    await db.update(ventureTemplatesTable)
      .set({ saveCount: sql`${ventureTemplatesTable.saveCount} + 1` })
      .where(eq(ventureTemplatesTable.id, id));
  } catch {
    // already saved
  }

  res.json({ ok: true });
});

router.delete("/templates/:id/save", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [deleted] = await db.delete(templateSavesTable)
    .where(and(eq(templateSavesTable.userId, userId), eq(templateSavesTable.templateId, id)))
    .returning();

  if (deleted) {
    await db.update(ventureTemplatesTable)
      .set({ saveCount: sql`GREATEST(${ventureTemplatesTable.saveCount} - 1, 0)` })
      .where(eq(ventureTemplatesTable.id, id));
  }

  res.json({ ok: true });
});

// ─── Adopt (creates execution instance) ──────────────────────────────────────

router.post("/templates/:id/adopt", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [template] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, id));
  if (!template) { res.status(404).json({ error: "Template not found" }); return; }

  const { title, instanceType, country, stateCity, localArea, startDate, targetDate, timelineMode } = req.body;

  const [instance] = await db.insert(executionInstancesTable).values({
    templateId: id,
    ownerId: userId,
    title: title ?? template.title,
    instanceType: instanceType ?? "venture",
    mainIndustry: template.industry,
    subIndustry: template.subIndustry ?? null,
    country: country ?? null,
    stateCity: stateCity ?? null,
    localArea: localArea ?? null,
    startDate: startDate ?? new Date().toISOString().slice(0, 10),
    targetDate: targetDate ?? null,
    milestones: (template.milestones as Array<{ title: string; description?: string; day?: number }>) ?? [],
    visibility: "public",
    durationDays: template.durationDays ?? null,
    timelineMode: ["strict", "flexible", "adaptive"].includes(timelineMode) ? timelineMode : "flexible",
  }).returning();

  await db.update(ventureTemplatesTable)
    .set({ adoptionCount: sql`${ventureTemplatesTable.adoptionCount} + 1`, useCount: sql`${ventureTemplatesTable.useCount} + 1` })
    .where(eq(ventureTemplatesTable.id, id));

  res.status(201).json(instance);
});

// ─── Get interaction status ───────────────────────────────────────────────────

router.get("/templates/:id/status", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  if (!userId) {
    res.json({ isFollowing: false, isSaved: false });
    return;
  }

  const [follow] = await db.select().from(templateFollowsTable)
    .where(and(eq(templateFollowsTable.userId, userId), eq(templateFollowsTable.templateId, id)));
  const [save] = await db.select().from(templateSavesTable)
    .where(and(eq(templateSavesTable.userId, userId), eq(templateSavesTable.templateId, id)));

  res.json({ isFollowing: !!follow, isSaved: !!save });
});

// ─── Get execution instances for a template ───────────────────────────────────

router.get("/templates/:id/executions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.templateId, id), eq(executionInstancesTable.visibility, "public")));

  res.json(rows);
});

export default router;
