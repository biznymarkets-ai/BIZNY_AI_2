import { Router, type IRouter } from "express";
import { db, executionInstancesTable, executionJournalEntriesTable, postsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

type MilestoneRecord = {
  title: string;
  description?: string;
  completed?: boolean;
  completedAt?: string;
  day?: number;
  evidenceRequired?: boolean;
  evidenceTypes?: string[];
  evidenceNote?: string;
  evidenceUrls?: string[];
  evidenceText?: string;
};

// ─── Timeline helpers ─────────────────────────────────────────────────────────
// Day 1 is the start date itself. currentDay is clamped to [1, durationDays] when
// a duration is set; otherwise it counts up indefinitely (open-ended execution).

function computeCurrentDay(startDate: string | null, durationDays: number | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate + "T00:00:00Z");
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const diffDays = Math.floor((todayUtc.getTime() - start.getTime()) / 86_400_000);
  const day = diffDays + 1;
  if (day < 1) return 1;
  if (durationDays && day > durationDays) return durationDays;
  return day;
}

function buildTimelineState(instance: typeof executionInstancesTable.$inferSelect) {
  const milestones = (instance.milestones ?? []) as MilestoneRecord[];
  const currentDay = computeCurrentDay(instance.startDate, instance.durationDays);
  const totalDays = instance.durationDays ?? null;

  const tasksToday = milestones
    .map((m, index) => ({ ...m, index }))
    .filter(m => !m.completed && (m.day ?? currentDay) === currentDay);

  const overdueTasks = milestones
    .map((m, index) => ({ ...m, index }))
    .filter(m => !m.completed && typeof m.day === "number" && m.day < currentDay);

  const upcoming = milestones
    .map((m, index) => ({ ...m, index }))
    .filter(m => !m.completed && typeof m.day === "number" && m.day > currentDay)
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))[0] ?? null;

  const completedCount = milestones.filter(m => m.completed).length;

  return {
    day: currentDay,
    totalDays,
    isComplete: instance.status === "completed",
    tasksToday,
    overdueTasks,
    nextMilestone: upcoming,
    completedMilestones: completedCount,
    totalMilestones: milestones.length,
    progressPercent: instance.progressPercent,
    currentStreak: instance.currentStreak,
    longestStreak: instance.longestStreak,
    lastCheckInDate: instance.lastCheckInDate,
    timelineMode: instance.timelineMode,
  };
}

async function addJournalEntry(params: {
  executionInstanceId: number;
  day: number;
  entryType: "milestone_complete" | "checkin" | "note";
  title?: string | null;
  notes?: string | null;
  evidenceUrls?: string[];
}) {
  await db.insert(executionJournalEntriesTable).values({
    executionInstanceId: params.executionInstanceId,
    day: params.day,
    entryType: params.entryType,
    title: params.title ?? null,
    notes: params.notes ?? null,
    evidenceUrls: params.evidenceUrls ?? [],
  });
}

router.get("/execution-instances", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rows = await db
    .select()
    .from(executionInstancesTable)
    .where(eq(executionInstancesTable.ownerId, userId));

  res.json(rows);
});

router.post("/execution-instances", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    templateId, title, instanceType, description, problem,
    mainIndustry, subIndustry, country, stateCity, localArea,
    startDate, targetDate, milestones, visibility,
  } = req.body;

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const [instance] = await db
    .insert(executionInstancesTable)
    .values({
      templateId: templateId ?? null,
      ownerId: userId,
      title,
      instanceType: instanceType ?? "venture",
      description: description ?? null,
      problem: problem ?? null,
      mainIndustry: mainIndustry ?? null,
      subIndustry: subIndustry ?? null,
      country: country ?? null,
      stateCity: stateCity ?? null,
      localArea: localArea ?? null,
      startDate: startDate ?? null,
      targetDate: targetDate ?? null,
      milestones: milestones ?? [],
      visibility: visibility ?? "public",
    })
    .returning();

  res.status(201).json(instance);
});

router.get("/execution-instances/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [instance] = await db
    .select()
    .from(executionInstancesTable)
    .where(eq(executionInstancesTable.id, id));

  if (!instance) { res.status(404).json({ error: "Not found" }); return; }

  if (instance.visibility !== "public" && instance.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(instance);
});

router.put("/execution-instances/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, id), eq(executionInstancesTable.ownerId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const allowed = [
    "title", "instanceType", "status", "description", "problem",
    "mainIndustry", "subIndustry", "country", "stateCity", "localArea",
    "startDate", "targetDate", "milestones", "evidence", "results",
    "lessonsLearned", "progressPercent", "visibility",
  ];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const [updated] = await db
    .update(executionInstancesTable)
    .set(updates)
    .where(eq(executionInstancesTable.id, id))
    .returning();

  res.json(updated);
});

// ─── Complete a milestone with evidence ──────────────────────────────────────
// POST /execution-instances/:id/milestones/:index/complete
// Body: { evidenceUrls?: string[], evidenceText?: string, autoPost?: boolean }

router.post("/execution-instances/:id/milestones/:index/complete", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawIdx = Array.isArray(req.params.index) ? req.params.index[0] : req.params.index;
  const id = parseInt(rawId, 10);
  const idx = parseInt(rawIdx, 10);
  if (isNaN(id) || isNaN(idx)) { res.status(400).json({ error: "Invalid id or index" }); return; }

  const [existing] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, id), eq(executionInstancesTable.ownerId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const milestones = (existing.milestones ?? []) as Array<Record<string, unknown>>;
  if (idx < 0 || idx >= milestones.length) {
    res.status(400).json({ error: "Milestone index out of range" });
    return;
  }

  const { evidenceUrls = [], evidenceText = "", autoPost = true } = req.body as {
    evidenceUrls?: string[];
    evidenceText?: string;
    autoPost?: boolean;
  };

  const updatedMilestones = milestones.map((m, i) => {
    if (i !== idx) return m;
    return {
      ...m,
      completed: true,
      completedAt: new Date().toISOString(),
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
      evidenceText: evidenceText || null,
    };
  }) as typeof executionInstancesTable.$inferSelect.milestones;

  const completed = updatedMilestones!.filter(m => m!.completed).length;
  const total = updatedMilestones!.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const [updated] = await db
    .update(executionInstancesTable)
    .set({
      milestones: updatedMilestones,
      progressPercent,
      status: progressPercent === 100 ? "completed" : existing.status === "planning" ? "active" : existing.status,
      updatedAt: new Date(),
    })
    .where(eq(executionInstancesTable.id, id))
    .returning();

  // Auto-create a feed post when a milestone is completed
  if (autoPost) {
    const milestone = milestones[idx] as Record<string, unknown>;
    const milestoneTitle = String(milestone.title ?? "Milestone");
    const content = [
      `Milestone ${idx + 1} of ${total} completed: ${milestoneTitle}`,
      evidenceText ? `\n${evidenceText}` : "",
      `\nExecution: ${existing.title} | Progress: ${progressPercent}%`,
      existing.stateCity ? ` | ${existing.stateCity}` : "",
      existing.country ? `, ${existing.country}` : "",
    ].join("").trim();

    try {
      await db.insert(postsTable).values({
        content,
        authorId: userId,
        postType: "milestone",
        executionInstanceId: id,
        progressPercent,
        milestoneTag: milestoneTitle,
        mainIndustry: existing.mainIndustry ?? null,
        subIndustry: existing.subIndustry ?? null,
        stateCity: existing.stateCity ?? null,
        localArea: existing.localArea ?? null,
        mediaUrls: evidenceUrls.length > 0 ? evidenceUrls : null,
        visibility: existing.visibility,
      } as any);
    } catch {
      // Non-fatal — feed post failure should not block milestone completion
    }
  }

  // Auto-generate an execution journal entry — one action serves both verification and journaling
  try {
    const milestone = milestones[idx] as Record<string, unknown>;
    await addJournalEntry({
      executionInstanceId: id,
      day: computeCurrentDay(existing.startDate, existing.durationDays),
      entryType: "milestone_complete",
      title: String(milestone.title ?? "Milestone"),
      notes: evidenceText || null,
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
    });
  } catch {
    // Non-fatal — journal failure should not block milestone completion
  }

  res.json(updated);
});

// ─── Uncomplete a milestone ───────────────────────────────────────────────────
router.post("/execution-instances/:id/milestones/:index/uncomplete", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawIdx = Array.isArray(req.params.index) ? req.params.index[0] : req.params.index;
  const id = parseInt(rawId, 10);
  const idx = parseInt(rawIdx, 10);
  if (isNaN(id) || isNaN(idx)) { res.status(400).json({ error: "Invalid id or index" }); return; }

  const [existing] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, id), eq(executionInstancesTable.ownerId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const milestones = (existing.milestones ?? []) as Array<Record<string, unknown>>;
  if (idx < 0 || idx >= milestones.length) {
    res.status(400).json({ error: "Milestone index out of range" });
    return;
  }

  const updatedMilestones = milestones.map((m, i) => {
    if (i !== idx) return m;
    const { completed: _c, completedAt: _ca, evidenceUrls: _eu, evidenceText: _et, ...rest } = m;
    return { ...rest, completed: false };
  }) as typeof executionInstancesTable.$inferSelect.milestones;

  const completed = updatedMilestones!.filter(m => m!.completed).length;
  const total = updatedMilestones!.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const [updated] = await db
    .update(executionInstancesTable)
    .set({ milestones: updatedMilestones, progressPercent, updatedAt: new Date() })
    .where(eq(executionInstancesTable.id, id))
    .returning();

  res.json(updated);
});

// ─── Daily Coaching Engine: today's work ──────────────────────────────────────
// GET /execution-instances/:id/today
router.get("/execution-instances/:id/today", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [instance] = await db
    .select()
    .from(executionInstancesTable)
    .where(eq(executionInstancesTable.id, id));

  if (!instance) { res.status(404).json({ error: "Not found" }); return; }
  if (instance.visibility !== "public" && instance.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(buildTimelineState(instance));
});

// ─── Execution Journal ─────────────────────────────────────────────────────────
// GET /execution-instances/:id/journal
router.get("/execution-instances/:id/journal", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [instance] = await db
    .select()
    .from(executionInstancesTable)
    .where(eq(executionInstancesTable.id, id));

  if (!instance) { res.status(404).json({ error: "Not found" }); return; }
  if (instance.visibility !== "public" && instance.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const entries = await db
    .select()
    .from(executionJournalEntriesTable)
    .where(eq(executionJournalEntriesTable.executionInstanceId, id))
    .orderBy(desc(executionJournalEntriesTable.day), desc(executionJournalEntriesTable.createdAt));

  res.json(entries);
});

// ─── Daily check-in (streak tracking + journal note) ──────────────────────────
// POST /execution-instances/:id/checkin
// Body: { notes?: string, evidenceUrls?: string[] }
router.post("/execution-instances/:id/checkin", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, id), eq(executionInstancesTable.ownerId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const { notes = "", evidenceUrls = [] } = req.body as { notes?: string; evidenceUrls?: string[] };

  const todayStr = new Date().toISOString().slice(0, 10);
  let { currentStreak, longestStreak, lastCheckInDate } = existing;

  if (lastCheckInDate === todayStr) {
    // Already checked in today — no streak change, just append a note
  } else {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    currentStreak = lastCheckInDate === yesterdayStr ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    lastCheckInDate = todayStr;
  }

  const [updated] = await db
    .update(executionInstancesTable)
    .set({ currentStreak, longestStreak, lastCheckInDate, updatedAt: new Date() })
    .where(eq(executionInstancesTable.id, id))
    .returning();

  const currentDay = computeCurrentDay(existing.startDate, existing.durationDays);
  await addJournalEntry({
    executionInstanceId: id,
    day: currentDay,
    entryType: "checkin",
    title: `Day ${currentDay} check-in`,
    notes: notes || null,
    evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
  });

  res.json({ instance: updated, timeline: buildTimelineState(updated) });
});

router.delete("/execution-instances/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(executionInstancesTable)
    .where(and(eq(executionInstancesTable.id, id), eq(executionInstancesTable.ownerId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(executionInstancesTable).where(eq(executionInstancesTable.id, id));
  res.status(204).end();
});

export default router;
