import { Router, type IRouter } from "express";
import { db, venturesTable, progressEntriesTable, ventureTemplatesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListVenturesResponse,
  GetVentureParams,
  GetVentureResponse,
  GetVentureProgressParams,
  GetVentureProgressResponse,
  AddProgressEntryParams,
  AddProgressEntryBody,
  ListPublicVenturesQueryParams,
  ListPublicVenturesResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function enrichVenture(venture: typeof venturesTable.$inferSelect) {
  if (venture.templateId) {
    const [template] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, venture.templateId));
    return { ...venture, template: template ?? null };
  }
  return { ...venture, template: null };
}

router.get("/ventures/public", async (req, res): Promise<void> => {
  const params = ListPublicVenturesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db.select().from(venturesTable).orderBy(desc(venturesTable.createdAt));
  const enriched = await Promise.all(rows.map(async (venture: any) => {
    const [template] = venture.templateId
      ? await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, venture.templateId))
      : [null];
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, venture.userId));
    return {
      ...venture,
      template: template ?? null,
      owner: owner ? { id: owner.id, name: owner.name, role: owner.role, verificationStatus: owner.verificationStatus, avatarUrl: owner.avatarUrl ?? null } : null,
    };
  }));

  res.json(ListPublicVenturesResponse.parse(enriched));
});

router.get("/ventures", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db.select().from(venturesTable).where(eq(venturesTable.userId, userId));
  const enriched = await Promise.all(rows.map(enrichVenture));
  res.json(ListVenturesResponse.parse(enriched));
});

router.post("/ventures", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    title, templateId, description, problem, mainIndustry, subIndustry, activityTag,
    valueChainStage, country, stateCity, localArea, ventureType, estimatedDuration,
    fundingRequired, expectedOutput, visibility, milestones, collaboratorsNeeded,
    resourcesNeeded, equipmentNeeded,
  } = req.body;

  if (!title) { res.status(400).json({ error: "title is required" }); return; }

  let template = null;
  if (templateId) {
    const [t] = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, templateId));
    template = t ?? null;
  }

  const [venture] = await db.insert(venturesTable).values({
    title,
    templateId: templateId ?? null,
    userId,
    status: "active",
    currentDay: 1,
    progressPercent: 0,
    description: description ?? null,
    problem: problem ?? null,
    mainIndustry: mainIndustry ?? null,
    subIndustry: subIndustry ?? null,
    activityTag: activityTag ?? null,
    valueChainStage: valueChainStage ?? null,
    country: country ?? null,
    stateCity: stateCity ?? null,
    localArea: localArea ?? null,
    ventureType: ventureType ?? null,
    estimatedDuration: estimatedDuration ?? null,
    fundingRequired: fundingRequired ?? null,
    expectedOutput: expectedOutput ?? null,
    visibility: visibility ?? "public",
    milestones: milestones ?? [],
    collaboratorsNeeded: collaboratorsNeeded ?? [],
    resourcesNeeded: resourcesNeeded ?? [],
    equipmentNeeded: equipmentNeeded ?? [],
  }).returning();

  res.status(201).json(GetVentureResponse.parse({ ...venture, template }));
});

router.get("/ventures/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetVentureParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [venture] = await db.select().from(venturesTable).where(eq(venturesTable.id, params.data.id));
  if (!venture) { res.status(404).json({ error: "Venture not found" }); return; }

  const enriched = await enrichVenture(venture);
  res.json(GetVentureResponse.parse(enriched));
});

router.get("/ventures/:id/progress", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetVentureProgressParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const entries = await db.select().from(progressEntriesTable)
    .where(eq(progressEntriesTable.ventureId, params.data.id))
    .orderBy(progressEntriesTable.dayNumber);

  const enriched = await Promise.all(entries.map(async (entry: any) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, entry.authorId));
    return {
      ...entry,
      author: author ? { id: author.id, name: author.name, role: author.role, verificationStatus: author.verificationStatus, avatarUrl: author.avatarUrl ?? null } : null,
    };
  }));

  res.json(GetVentureProgressResponse.parse(enriched));
});

router.post("/ventures/:id/progress", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddProgressEntryParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = AddProgressEntryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [venture] = await db.select().from(venturesTable).where(eq(venturesTable.id, params.data.id));
  if (!venture) { res.status(404).json({ error: "Venture not found" }); return; }

  const [entry] = await db.insert(progressEntriesTable).values({
    ventureId: params.data.id,
    dayNumber: parsed.data.dayNumber,
    content: parsed.data.content,
    contentType: (parsed.data.contentType as "text" | "photo" | "video" | "document" | "voice" | "livestream") ?? "text",
    milestone: parsed.data.milestone ?? null,
    mediaUrl: parsed.data.mediaUrl ?? null,
    authorId: userId,
  }).returning();

  const template = venture.templateId
    ? (await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.id, venture.templateId)))[0]
    : null;
  const totalDays = template?.durationDays ?? 60;
  const entryCount = await db.select().from(progressEntriesTable).where(eq(progressEntriesTable.ventureId, params.data.id));
  const newProgress = Math.min(100, (entryCount.length / totalDays) * 100);

  await db.update(venturesTable).set({ currentDay: parsed.data.dayNumber, progressPercent: newProgress }).where(eq(venturesTable.id, params.data.id));

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    ...entry,
    author: author ? { id: author.id, name: author.name, role: author.role, verificationStatus: author.verificationStatus, avatarUrl: author.avatarUrl ?? null } : null,
  });
});

export default router;
