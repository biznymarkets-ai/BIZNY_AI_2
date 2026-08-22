import { Router, type IRouter } from "express";
import { db, coachPlansTable, coachTasksTable, taskEvidenceTable, taskBlockersTable, weeklyReviewsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

// ─── Task generation ──────────────────────────────────────────────────────────

type TaskTemplate = {
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  evidenceRequired: boolean;
};

const TASK_BANK: Record<string, TaskTemplate[]> = {
  capital: [
    {
      title: "Browse Bizny Opportunities for funding",
      description: "Search the Opportunities section for grants, loans, and investment calls relevant to your industry and country.",
      reason: "Knowing what funding exists is the first step to accessing it.",
      priority: "high", estimatedMinutes: 45, evidenceRequired: false,
    },
    {
      title: "Write a one-page business summary",
      description: "Write 1-2 paragraphs describing what you do, what you need funding for, and what the expected outcome is.",
      reason: "Every funding conversation starts with a clear summary of your business.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: true,
    },
    {
      title: "List your business on Bizny Market",
      description: "Create a Market listing to begin attracting customers and demonstrating your business is active.",
      reason: "Generating revenue reduces dependence on external funding.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Identify three local funding organisations",
      description: "Research banks, microfinance institutions, or development agencies active in your area.",
      reason: "Local funders are more accessible and often have sector-specific programmes.",
      priority: "medium", estimatedMinutes: 60, evidenceRequired: true,
    },
  ],
  customers: [
    {
      title: "Visit one local market or trading area",
      description: "Go to the nearest market where your potential customers buy. Observe, ask questions, take notes.",
      reason: "Direct market observation is irreplaceable. You cannot learn this from behind a screen.",
      priority: "high", estimatedMinutes: 120, evidenceRequired: true,
    },
    {
      title: "Interview five potential customers",
      description: "Ask each person: What do you currently buy? From whom? At what price? What frustrates you about current options?",
      reason: "Customer interviews reveal real needs that no questionnaire can uncover.",
      priority: "high", estimatedMinutes: 90, evidenceRequired: true,
    },
    {
      title: "Photograph competing products at market",
      description: "Take clear photos of competing products including packaging, presentation, and price tags.",
      reason: "A visual record of competition helps you identify gaps and improvements.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: true,
    },
    {
      title: "Record average selling prices for your product",
      description: "List the prices charged by at least 5 sellers for the same or similar product.",
      reason: "Pricing correctly starts with knowing what the market accepts.",
      priority: "high", estimatedMinutes: 45, evidenceRequired: true,
    },
    {
      title: "Upload your market research findings",
      description: "Write a short summary of what you observed, learned, and what surprised you.",
      reason: "Writing findings cements what you learned and creates a reference for future decisions.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: true,
    },
  ],
  suppliers: [
    {
      title: "Identify three potential local suppliers",
      description: "Find three businesses or individuals who can supply the inputs, materials, or services you need.",
      reason: "Having multiple supplier options gives you negotiating power and reduces supply risk.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: false,
    },
    {
      title: "Contact each supplier and introduce yourself",
      description: "Call or visit each supplier. Explain what you do, what you need, and ask about their terms.",
      reason: "Building supplier relationships early prevents supply failures when you scale.",
      priority: "high", estimatedMinutes: 90, evidenceRequired: false,
    },
    {
      title: "Compare prices and quality across suppliers",
      description: "Create a simple table comparing price, quality, minimum order, and delivery terms for each supplier.",
      reason: "A comparison gives you clear data for your sourcing decision.",
      priority: "medium", estimatedMinutes: 45, evidenceRequired: true,
    },
    {
      title: "Request a formal quotation from your top supplier",
      description: "Ask for a written quote for the quantity you need. Keep this document safely.",
      reason: "A formal quote is the foundation of a supplier relationship and helps you plan costs.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: true,
    },
    {
      title: "Upload supplier contact details and terms",
      description: "Record names, phone numbers, prices, and key terms for all suppliers you contacted.",
      reason: "Documented supplier information prevents losing track of good contacts.",
      priority: "low", estimatedMinutes: 20, evidenceRequired: true,
    },
  ],
  skills: [
    {
      title: "Write down three skills you need to develop",
      description: "List the specific skills that, if you had them, would most improve your productive output.",
      reason: "Clarity on what to learn is more valuable than generic self-improvement.",
      priority: "high", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Browse Bizny Library for your skill area",
      description: "Search the Template Library for training guides, SOPs, and learning blueprints relevant to your field.",
      reason: "The Library contains structured learning paths designed for your context.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Find one practitioner ahead of you in your field",
      description: "Identify someone who has already achieved what you want to achieve. Arrange to speak with or observe them.",
      reason: "Learning from a practitioner compresses years of trial and error.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: false,
    },
    {
      title: "Practice your target skill for one hour this week",
      description: "Set aside dedicated time to practise, build, or study. Take notes on what you learned.",
      reason: "Consistent deliberate practice is the only proven path to skill development.",
      priority: "medium", estimatedMinutes: 60, evidenceRequired: true,
    },
  ],
  network: [
    {
      title: "Complete your Bizny Market profile",
      description: "Add your full profile including skills, experience, what you offer, and how to contact you.",
      reason: "You cannot be found by the right people if your profile is incomplete.",
      priority: "high", estimatedMinutes: 45, evidenceRequired: false,
    },
    {
      title: "Identify five people worth connecting with in your industry",
      description: "Browse the Bizny Marketplace and Directory for people whose work aligns with yours.",
      reason: "Intentional network building is more effective than passive connection.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Attend one local industry gathering this week",
      description: "Show up at any gathering where people in your industry meet — a market, association meeting, or trade event.",
      reason: "In-person connections form faster and hold stronger than digital introductions.",
      priority: "high", estimatedMinutes: 180, evidenceRequired: true,
    },
    {
      title: "Post one valuable insight on Bizny",
      description: "Share something you know, have observed, or want to understand about your industry.",
      reason: "Contributing to the community attracts people who value your perspective.",
      priority: "low", estimatedMinutes: 20, evidenceRequired: false,
    },
  ],
  systems: [
    {
      title: "Document your core production process",
      description: "Describe step by step what you do from start to finish to produce your product or deliver your service.",
      reason: "A documented process can be taught, improved, and scaled. An undocumented one depends entirely on you.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: true,
    },
    {
      title: "Identify the three steps most likely to fail",
      description: "Review your process and mark the steps where mistakes, delays, or inconsistencies happen most often.",
      reason: "Targeting your highest-risk steps delivers the biggest quality improvement.",
      priority: "high", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Browse SOP templates in the Bizny Library",
      description: "Search for Standard Operating Procedures relevant to your business activity.",
      reason: "Adopting an existing SOP is faster than designing your own from scratch.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Create a daily operations checklist",
      description: "Write a checklist of 5-10 steps you must complete each day to maintain consistent output.",
      reason: "Checklists reduce errors and ensure nothing is forgotten under pressure.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: true,
    },
  ],
  production: [
    {
      title: "Calculate your maximum daily output",
      description: "Measure exactly how much you can produce in one day at full capacity with your current resources.",
      reason: "Knowing your ceiling is essential before you can plan to raise it.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: true,
    },
    {
      title: "Identify your production bottleneck",
      description: "Find the single step that limits your total output — the slowest machine, the scarcest input, or the most time-consuming task.",
      reason: "Improving the bottleneck increases total output more than any other intervention.",
      priority: "high", estimatedMinutes: 45, evidenceRequired: false,
    },
    {
      title: "Research equipment that could expand output",
      description: "Find at least two machines or tools that could increase your production capacity. Note prices, suppliers, and expected output increase.",
      reason: "Equipment investment decisions require structured information, not guesswork.",
      priority: "medium", estimatedMinutes: 60, evidenceRequired: true,
    },
  ],
  location: [
    {
      title: "Map your current distribution path",
      description: "Describe exactly how your product gets from production to your final customer. List every step and who is responsible.",
      reason: "Understanding your current path reveals where delays and costs are hiding.",
      priority: "high", estimatedMinutes: 45, evidenceRequired: true,
    },
    {
      title: "Find two logistics providers in your area",
      description: "Research who moves goods in your region — trucks, motorbikes, aggregators, or co-ops. Get contact details and rates.",
      reason: "Having logistics options prevents being held hostage by a single provider.",
      priority: "medium", estimatedMinutes: 60, evidenceRequired: true,
    },
  ],
  legal: [
    {
      title: "List every licence and registration you need",
      description: "Research what legal requirements apply to your business type and location. Note the issuing body, cost, and time required for each.",
      reason: "Operating without required registrations creates risk that grows as your business grows.",
      priority: "high", estimatedMinutes: 60, evidenceRequired: true,
    },
    {
      title: "Browse compliance templates in the Library",
      description: "Search the Library for registration guides, compliance SOPs, and legal templates relevant to your industry.",
      reason: "Structured guidance makes compliance navigable without a lawyer.",
      priority: "medium", estimatedMinutes: 30, evidenceRequired: false,
    },
    {
      title: "Identify one legal professional or compliance advisor",
      description: "Find a lawyer, accountant, or compliance consultant familiar with your industry who you can consult.",
      reason: "A good advisor is cheaper than a legal problem discovered too late.",
      priority: "medium", estimatedMinutes: 45, evidenceRequired: false,
    },
  ],
  team: [
    {
      title: "Define the role you need to fill",
      description: "Write a clear description of the person you need — what they will do, what skills they need, and how many hours per week.",
      reason: "A clear role definition is the foundation of effective hiring or collaboration.",
      priority: "high", estimatedMinutes: 30, evidenceRequired: true,
    },
    {
      title: "Post a collaboration request on Bizny",
      description: "Use the Opportunities section to post your need for a co-founder, team member, or skilled collaborator.",
      reason: "The Bizny ecosystem includes people actively looking for productive ventures to join.",
      priority: "medium", estimatedMinutes: 20, evidenceRequired: false,
    },
    {
      title: "Interview two potential collaborators",
      description: "Meet, call, or video chat with at least two people who could fill the role. Assess their skills and reliability.",
      reason: "Choosing the right person is more important than finding anyone quickly.",
      priority: "medium", estimatedMinutes: 120, evidenceRequired: false,
    },
  ],
};

// Always-included starter tasks regardless of bottlenecks
const STARTER_TASKS: TaskTemplate[] = [
  {
    title: "Complete your Productivity Clinic consultation",
    description: "If you haven't finished your Productivity Clinic consultation, complete it now so your plan is fully personalised.",
    reason: "A complete diagnosis produces better recommendations and a more accurate Productivity Report.",
    priority: "high", estimatedMinutes: 10, evidenceRequired: false,
  },
];

function generateTasks(bottlenecks: string[], weekNumber: number): TaskTemplate[] {
  const tasks: TaskTemplate[] = [];

  // Add up to 4 tasks per bottleneck (top 3 bottlenecks max = up to 12 tasks)
  for (const b of bottlenecks.slice(0, 3)) {
    const bank = TASK_BANK[b] ?? [];
    tasks.push(...bank.slice(0, 4));
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return tasks.filter(t => {
    if (seen.has(t.title)) return false;
    seen.add(t.title);
    return true;
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /coach/plan — get the current user's plan
router.get("/coach/plan", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [plan] = await db
    .select()
    .from(coachPlansTable)
    .where(eq(coachPlansTable.userId, userId))
    .orderBy(desc(coachPlansTable.createdAt))
    .limit(1);

  if (!plan) { res.status(404).json({ error: "No plan found" }); return; }
  res.json(plan);
});

// POST /coach/plan — create a new plan and auto-generate tasks
router.post("/coach/plan", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { goal, selfDescription, roles, resources, bottlenecks } = req.body as {
    goal: string;
    selfDescription?: string;
    roles?: string[];
    resources?: string[];
    bottlenecks?: string[];
  };

  if (!goal) { res.status(400).json({ error: "goal is required" }); return; }

  // Create the plan
  const [plan] = await db
    .insert(coachPlansTable)
    .values({
      userId,
      goal,
      selfDescription: selfDescription ?? null,
      roles: roles ?? [],
      resources: resources ?? [],
      bottlenecks: bottlenecks ?? [],
    })
    .returning();

  // Auto-generate tasks from bottlenecks
  const taskTemplates = generateTasks(bottlenecks ?? [], 1);

  if (taskTemplates.length > 0) {
    const now = new Date();
    const taskRows = taskTemplates.map((t, i) => {
      const due = new Date(now);
      // Spread tasks across the next 7 days
      due.setDate(due.getDate() + Math.floor(i / 2) + 1);
      return {
        planId: plan.id,
        userId,
        title: t.title,
        description: t.description,
        reason: t.reason,
        priority: t.priority as "high" | "medium" | "low",
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        weekNumber: 1,
        dueDate: due,
      };
    });

    await db.insert(coachTasksTable).values(taskRows);
  }

  const tasks = await db
    .select()
    .from(coachTasksTable)
    .where(eq(coachTasksTable.planId, plan.id))
    .orderBy(coachTasksTable.dueDate);

  res.status(201).json({ plan, tasks });
});

// GET /coach/tasks — list tasks for the current user's active plan
router.get("/coach/tasks", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const allPlans = await db.select().from(coachPlansTable);
  const plan = allPlans.find((p) => Number(p.userId) === Number(userId));

  const allTasks = await db.select().from(coachTasksTable);
  const tasks = allTasks
    .filter((t) => Number(t.userId) === Number(userId) || (plan && Number(t.planId) === Number(plan.id)))
    .sort((a, b) => new Date(a.dueDate || a.createdAt || 0).getTime() - new Date(b.dueDate || b.createdAt || 0).getTime());

  res.json(tasks);
});

// POST /coach/tasks — create a task for the current user's active plan
router.post("/coach/tasks", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title, description, reason, priority = "medium", estimatedMinutes = 60, dueDate } = req.body || {};
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  let planId: number;
  const allPlans = await db.select().from(coachPlansTable);
  const existingPlan = allPlans.find((p) => Number(p.userId) === Number(userId));

  if (existingPlan) {
    planId = existingPlan.id;
  } else {
    const [newPlan] = await db
      .insert(coachPlansTable)
      .values({
        userId,
        goal: "Execution Plan",
        bottlenecks: [],
        resources: [],
        roles: [],
      })
      .returning();
    planId = newPlan ? newPlan.id : 1;
  }

  const validPriority = ["high", "medium", "low"].includes(priority) ? priority : "medium";

  const [task] = await db
    .insert(coachTasksTable)
    .values({
      planId,
      userId,
      title,
      description: description || "",
      reason: reason || "Strategic execution task",
      priority: validPriority as any,
      estimatedMinutes: typeof estimatedMinutes === "number" ? estimatedMinutes : 60,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "not_started",
    })
    .returning();

  res.status(201).json(task);
});

// PATCH /coach/tasks/:id — update task status
router.patch("/coach/tasks/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(coachTasksTable)
    .where(and(eq(coachTasksTable.id, id), eq(coachTasksTable.userId, userId)));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const allowed = ["status", "priority", "dueDate", "estimatedMinutes"];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (req.body.status === "completed" && existing.status !== "completed") {
    updates.completedAt = new Date();
    // Update plan productivity score
    await db
      .update(coachPlansTable)
      .set({
        productivityScore: existing ? Math.min(100, 0) : 0, // updated below
        updatedAt: new Date(),
      })
      .where(eq(coachPlansTable.id, existing.planId));
  }

  const [updated] = await db
    .update(coachTasksTable)
    .set(updates)
    .where(eq(coachTasksTable.id, id))
    .returning();

  // Recalculate productivity score
  const allTasks = await db
    .select()
    .from(coachTasksTable)
    .where(eq(coachTasksTable.planId, existing.planId));

  const total = allTasks.length;
  const completed = allTasks.filter((t: any) => t.status === "completed").length + (req.body.status === "completed" ? 1 : 0);
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  await db
    .update(coachPlansTable)
    .set({ productivityScore: score, updatedAt: new Date() })
    .where(eq(coachPlansTable.id, existing.planId));

  res.json(updated);
});

// POST /coach/tasks/:id/evidence — attach evidence to a task
router.post("/coach/tasks/:id/evidence", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [task] = await db
    .select()
    .from(coachTasksTable)
    .where(and(eq(coachTasksTable.id, id), eq(coachTasksTable.userId, userId)));

  if (!task) { res.status(404).json({ error: "Not found" }); return; }

  const { evidenceType = "text", url, textContent, note } = req.body as {
    evidenceType?: "photo" | "video" | "document" | "receipt" | "text" | "link";
    url?: string;
    textContent?: string;
    note?: string;
  };

  const [evidence] = await db
    .insert(taskEvidenceTable)
    .values({ taskId: id, userId, evidenceType, url: url ?? null, textContent: textContent ?? null, note: note ?? null })
    .returning();

  // Auto-mark task as completed if evidence is uploaded
  if (task.status === "not_started" || task.status === "in_progress") {
    await db
      .update(coachTasksTable)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(coachTasksTable.id, id));
  }

  res.status(201).json(evidence);
});

// GET /coach/tasks/:id/evidence — list evidence for a task
router.get("/coach/tasks/:id/evidence", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const evidence = await db
    .select()
    .from(taskEvidenceTable)
    .where(and(eq(taskEvidenceTable.taskId, id), eq(taskEvidenceTable.userId, userId)))
    .orderBy(desc(taskEvidenceTable.createdAt));

  res.json(evidence);
});

// POST /coach/tasks/:id/blocker — report a blocker
router.post("/coach/tasks/:id/blocker", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [task] = await db
    .select()
    .from(coachTasksTable)
    .where(and(eq(coachTasksTable.id, id), eq(coachTasksTable.userId, userId)));

  if (!task) { res.status(404).json({ error: "Not found" }); return; }

  const { reason, detail } = req.body as { reason: string; detail?: string };
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }

  const [blocker] = await db
    .insert(taskBlockersTable)
    .values({ taskId: id, userId, reason, detail: detail ?? null })
    .returning();

  // Mark task as blocked
  await db
    .update(coachTasksTable)
    .set({ status: "blocked", updatedAt: new Date() })
    .where(eq(coachTasksTable.id, id));

  res.status(201).json(blocker);
});

// GET /coach/dashboard — dashboard stats
router.get("/coach/dashboard", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [plan] = await db
    .select()
    .from(coachPlansTable)
    .where(eq(coachPlansTable.userId, userId))
    .orderBy(desc(coachPlansTable.createdAt))
    .limit(1);

  if (!plan) {
    res.json({
      hasPlan: false,
      totalTasks: 0, completedTasks: 0, inProgressTasks: 0,
      blockedTasks: 0, productivityScore: 0, streakDays: 0,
      weekNumber: 0, evidenceCount: 0, reviewsDue: false,
    });
    return;
  }

  const tasks = await db
    .select()
    .from(coachTasksTable)
    .where(eq(coachTasksTable.planId, plan.id));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
  const blockedTasks = tasks.filter((t: any) => t.status === "blocked").length;

  const evidenceRows = await db
    .select()
    .from(taskEvidenceTable)
    .where(eq(taskEvidenceTable.userId, userId));
  const evidenceCount = evidenceRows.length;

  // Review is due if last review was >7 days ago or never
  const daysSinceReview = plan.lastReviewAt
    ? Math.floor((Date.now() - plan.lastReviewAt.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((Date.now() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const reviewsDue = daysSinceReview >= 7;

  res.json({
    hasPlan: true,
    planId: plan.id,
    goal: plan.goal,
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    productivityScore: plan.productivityScore,
    streakDays: plan.streakDays,
    weekNumber: plan.weekNumber,
    evidenceCount,
    reviewsDue,
  });
});

// POST /coach/reviews — submit a weekly review
router.post("/coach/reviews", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [plan] = await db
    .select()
    .from(coachPlansTable)
    .where(eq(coachPlansTable.userId, userId))
    .orderBy(desc(coachPlansTable.createdAt))
    .limit(1);

  if (!plan) { res.status(404).json({ error: "No plan found" }); return; }

  const tasks = await db
    .select()
    .from(coachTasksTable)
    .where(eq(coachTasksTable.planId, plan.id));

  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const remaining = tasks.filter((t: any) => t.status !== "completed").length;

  const {
    biggestObstacle, learned, whatChanged,
    continueGoal = true, adjustments,
  } = req.body as {
    biggestObstacle?: string;
    learned?: string;
    whatChanged?: string;
    continueGoal?: boolean;
    adjustments?: string;
  };

  const [review] = await db
    .insert(weeklyReviewsTable)
    .values({
      planId: plan.id,
      userId,
      weekNumber: plan.weekNumber,
      completedCount: completed,
      remainingCount: remaining,
      biggestObstacle: biggestObstacle ?? null,
      learned: learned ?? null,
      whatChanged: whatChanged ?? null,
      continueGoal,
      adjustments: adjustments ?? null,
    })
    .returning();

  // Advance to next week and update streak
  const newStreak = plan.streakDays + 7;
  await db
    .update(coachPlansTable)
    .set({
      weekNumber: plan.weekNumber + 1,
      streakDays: newStreak,
      lastReviewAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(coachPlansTable.id, plan.id));

  // Generate next week's tasks if continuing goal
  if (continueGoal && plan.bottlenecks && plan.bottlenecks.length > 0) {
    const nextWeekTemplates = generateTasks(plan.bottlenecks, plan.weekNumber + 1);
    const now = new Date();
    const taskRows = nextWeekTemplates.slice(0, 5).map((t, i) => {
      const due = new Date(now);
      due.setDate(due.getDate() + i + 1);
      return {
        planId: plan.id,
        userId,
        title: t.title,
        description: t.description,
        reason: t.reason,
        priority: t.priority as "high" | "medium" | "low",
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        weekNumber: plan.weekNumber + 1,
        dueDate: due,
      };
    });

    if (taskRows.length > 0) {
      await db.insert(coachTasksTable).values(taskRows);
    }
  }

  res.status(201).json(review);
});

// GET /coach/reviews — list weekly reviews
router.get("/coach/reviews", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const reviews = await db
    .select()
    .from(weeklyReviewsTable)
    .where(eq(weeklyReviewsTable.userId, userId))
    .orderBy(desc(weeklyReviewsTable.createdAt));

  res.json(reviews);
});

export default router;
