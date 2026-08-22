import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  dealsTable,
  dealPartiesTable,
  dealWitnessesTable,
  coachPlansTable,
  coachTasksTable,
  taskEvidenceTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserFromToken } from "./auth";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

async function getDealFull(id: number) {
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!deal) return null;
  const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, id));
  const witnesses = await db.select().from(dealWitnessesTable).where(eq(dealWitnessesTable.dealId, id));
  return { ...deal, parties, witnesses };
}

router.get(["/deal-desk", "/deals"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const myDeals = await db.select().from(dealsTable).where(eq(dealsTable.initiatorId, userId));
  const asParty = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.userId, userId));
  const partyDealIds = asParty.map((p: any) => p.dealId);
  const allIds = [...new Set([...myDeals.map((d: any) => d.id), ...partyDealIds])];
  if (allIds.length === 0) { res.json([]); return; }

  const allDeals = await Promise.all(allIds.map(id => getDealFull(id)));
  const filtered = allDeals.filter(Boolean);

  const status = req.query.status as string | undefined;
  res.json(status ? filtered.filter(d => d!.status === status) : filtered);
});

router.post(["/deal-desk", "/deals"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    title, dealType, industry, subIndustry, activityTag, country, stateCity,
    description, financialValue, nonFinancial, timeline, terms, risks,
    fieldAgentRequired, milestones, originatingType, originatingId,
    // v2 extended fields
    dealCategory, visibility, city, stateRegion, pricingModel, paymentTerms,
    verificationStatus, inspectionNeeded, insuranceAvailable,
    partnerRequirements, companySupport, requiredDocumentsV2, details,
    counterpartyUserId,
  } = req.body;

  if (!title || !dealType) { res.status(400).json({ error: "title and dealType required" }); return; }

  const [deal] = await db.insert(dealsTable).values({
    title, dealType, status: "draft", initiatorId: userId,
    industry: industry ?? null, subIndustry: subIndustry ?? null, activityTag: activityTag ?? null,
    country: country ?? null, stateCity: stateCity ?? null,
    description: description ?? "", financialValue: financialValue ?? null,
    nonFinancial: nonFinancial ?? null, timeline: timeline ?? null,
    terms: terms ?? null, risks: risks ?? null,
    fieldAgentRequired: fieldAgentRequired ?? false,
    milestones: milestones ?? [],
    originatingType: originatingType ?? null, originatingId: originatingId ?? null,
    dealCategory: dealCategory ?? null, visibility: visibility ?? "public",
    city: city ?? null, stateRegion: stateRegion ?? null,
    pricingModel: pricingModel ?? null, paymentTerms: paymentTerms ?? null,
    verificationStatus: verificationStatus ?? "not_verified",
    inspectionNeeded: inspectionNeeded ?? null, insuranceAvailable: insuranceAvailable ?? null,
    partnerRequirements: partnerRequirements ?? null, companySupport: companySupport ?? null,
    requiredDocumentsV2: requiredDocumentsV2 ?? null, details: details ?? null,
  } as any).returning();

  await db.insert(dealPartiesTable).values({ dealId: deal.id, userId, role: "initiator", agreed: true });

  if (counterpartyUserId && Number(counterpartyUserId) !== Number(userId)) {
    await db.insert(dealPartiesTable).values({ dealId: deal.id, userId: Number(counterpartyUserId), role: "counterparty", agreed: false });
  }

  res.status(201).json(await getDealFull(deal.id));
});

router.get(["/deal-desk/:id", "/deals/:id"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

  // Check authorization: must be initiator, party, or public deal
  const isInitiator = deal.initiatorId === userId;
  const isParty = deal.parties?.some((p: any) => p.userId === userId);
  const isPublic = deal.visibility === "public";
  if (!isInitiator && !isParty && !isPublic) {
    res.status(403).json({ error: "Forbidden: You are not a party to this private deal." });
    return;
  }

  res.json(deal);
});

router.put(["/deal-desk/:id", "/deals/:id"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!deal) { res.status(404).json({ error: "Not found" }); return; }
  if (deal.initiatorId !== userId) { res.status(403).json({ error: "Forbidden: Only deal initiator can update details." }); return; }

  const {
    title, dealType, industry, subIndustry, activityTag, country, stateCity,
    description, financialValue, nonFinancial, timeline, terms, risks, fieldAgentRequired, milestones,
  } = req.body;

  const [updated] = await db.update(dealsTable).set({
    title: title ?? deal.title,
    dealType: dealType ?? deal.dealType,
    industry: industry ?? deal.industry,
    subIndustry: subIndustry ?? deal.subIndustry,
    activityTag: activityTag ?? deal.activityTag,
    country: country ?? deal.country,
    stateCity: stateCity ?? deal.stateCity,
    description: description ?? deal.description,
    financialValue: financialValue ?? deal.financialValue,
    nonFinancial: nonFinancial ?? deal.nonFinancial,
    timeline: timeline ?? deal.timeline,
    terms: terms ?? deal.terms,
    risks: risks ?? deal.risks,
    fieldAgentRequired: fieldAgentRequired ?? deal.fieldAgentRequired,
    milestones: milestones ?? deal.milestones,
    updatedAt: new Date(),
  }).where(eq(dealsTable.id, id)).returning();

  res.json(await getDealFull(updated.id));
});

router.post(["/deal-desk/:id/agree", "/deals/:id/agree"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [party] = await db.select().from(dealPartiesTable)
    .where(and(eq(dealPartiesTable.dealId, id), eq(dealPartiesTable.userId, userId)));
  if (!party) { res.status(403).json({ error: "Not a party" }); return; }

  await db.update(dealPartiesTable).set({ agreed: true, agreedAt: new Date() }).where(eq(dealPartiesTable.id, party.id));

  const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, id));
  if (parties.every((p: any) => p.agreed)) {
    await db.update(dealsTable).set({ status: "agreed", updatedAt: new Date() }).where(eq(dealsTable.id, id));
  }

  res.json(await getDealFull(id));
});

router.post(["/deal-desk/:id/status", "/deals/:id/status"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, notes } = req.body;

  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

  const isInitiator = deal.initiatorId === userId;
  const isParty = deal.parties?.some((p: any) => p.userId === userId);
  if (!isInitiator && !isParty) {
    res.status(403).json({ error: "Forbidden: You are not authorized to update this deal's status." });
    return;
  }

  const validStatuses = [
    "draft", "negotiating", "agreement_draft", "awaiting_party",
    "open", "agreed", "active", "milestone_in_progress", "completed", "cancelled", "disputed"
  ];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status '${status}'. Supported: ${validStatuses.join(", ")}` });
    return;
  }

  await db.update(dealsTable).set({
    status,
    updatedAt: new Date(),
    ...(notes ? { copilotSummary: notes } : {})
  }).where(eq(dealsTable.id, id));

  res.json(await getDealFull(id));
});

router.post(["/deal-desk/:id/parties", "/deals/:id/parties"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { userId: targetUserId, role } = req.body;

  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }
  if (deal.initiatorId !== userId) {
    res.status(403).json({ error: "Forbidden: Only deal initiator can add parties." });
    return;
  }

  const [party] = await db.insert(dealPartiesTable).values({
    dealId: id, userId: targetUserId, role: role ?? "counterparty", agreed: false,
  }).returning();

  await db.update(dealsTable).set({ status: "negotiating", updatedAt: new Date() }).where(eq(dealsTable.id, id));
  res.status(201).json(party);
});

router.post(["/deal-desk/:id/witnesses", "/deals/:id/witnesses"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, witnessRole, email, phone, relationship } = req.body;

  const [witness] = await db.insert(dealWitnessesTable).values({
    dealId: id, name, witnessRole: witnessRole ?? null, email: email ?? null,
    phone: phone ?? null, relationship: relationship ?? null,
  }).returning();

  res.status(201).json(witness);
});

// ── Milestone creation with Coach task synchronization ───────────────────────
router.post(["/deal-desk/:id/milestones", "/deals/:id/milestones"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { title, description, assignedToUserId, dueDate, syncToCoach = true } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

  const isInitiator = deal.initiatorId === userId;
  const isParty = deal.parties?.some((p: any) => p.userId === userId);
  if (!isInitiator && !isParty) {
    res.status(403).json({ error: "Forbidden: You are not a party on this deal." });
    return;
  }

  const currentMilestones = Array.isArray(deal.milestones) ? [...deal.milestones] : [];
  const milestoneId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const assignee = assignedToUserId ? Number(assignedToUserId) : userId;

  let coachTaskId: number | undefined = undefined;

  if (syncToCoach) {
    // Check or create coach plan for assignee
    let planId: number;
    const [existingPlan] = await db
      .select()
      .from(coachPlansTable)
      .where(eq(coachPlansTable.userId, assignee))
      .orderBy(desc(coachPlansTable.createdAt))
      .limit(1);

    if (existingPlan) {
      planId = existingPlan.id;
    } else {
      const [newPlan] = await db
        .insert(coachPlansTable)
        .values({
          userId: assignee,
          goal: `Deal Execution: ${deal.title}`,
          bottlenecks: [],
          resources: [],
          roles: [],
        })
        .returning();
      planId = newPlan ? newPlan.id : 1;
    }

    const [task] = await db
      .insert(coachTasksTable)
      .values({
        planId,
        userId: assignee,
        title: `[Deal #${deal.id}] ${title}`,
        description: description || `Execution milestone for deal: ${deal.title}`,
        reason: `Required milestone for Deal #${deal.id} (${deal.title})`,
        priority: "high",
        status: "not_started",
        evidenceRequired: true,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    if (task) {
      coachTaskId = task.id;
    }
  }

  const newMilestone = {
    id: milestoneId,
    title,
    description: description || "",
    status: "pending",
    assignedToUserId: assignee,
    dueDate: dueDate || null,
    coachTaskId,
    evidence: [],
    createdAt: new Date().toISOString(),
  };

  currentMilestones.push(newMilestone as any);

  await db.update(dealsTable).set({
    milestones: currentMilestones as any,
    status: deal.status === "draft" || deal.status === "agreed" ? "milestone_in_progress" : deal.status,
    updatedAt: new Date(),
  }).where(eq(dealsTable.id, id));

  res.status(201).json({ milestone: newMilestone, deal: await getDealFull(id) });
});

// ── Evidence submission for milestone ─────────────────────────────────────────
router.post(["/deal-desk/:id/evidence", "/deals/:id/evidence"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { milestoneId, milestoneIndex, evidenceType = "document", evidenceContent, url, note } = req.body;

  if (!evidenceContent && !url && !note) {
    res.status(400).json({ error: "evidenceContent, url, or note is required" });
    return;
  }

  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }

  const isInitiator = deal.initiatorId === userId;
  const isParty = deal.parties?.some((p: any) => p.userId === userId);
  if (!isInitiator && !isParty) {
    res.status(403).json({ error: "Forbidden: You are not authorized to attach evidence to this deal." });
    return;
  }

  const currentMilestones = Array.isArray(deal.milestones) ? [...deal.milestones] : [];
  if (currentMilestones.length === 0) {
    res.status(400).json({ error: "No milestones exist on this deal." });
    return;
  }

  let targetIdx = -1;
  if (milestoneId !== undefined) {
    targetIdx = currentMilestones.findIndex((m: any) => m.id === milestoneId || m.title === milestoneId);
  }
  if (targetIdx === -1 && milestoneIndex !== undefined && typeof milestoneIndex === "number") {
    targetIdx = milestoneIndex;
  }
  if (targetIdx === -1 || targetIdx >= currentMilestones.length) {
    targetIdx = 0; // Default to first milestone if not found
  }

  const targetMilestone: any = { ...currentMilestones[targetIdx] };
  const evidenceList = Array.isArray(targetMilestone.evidence) ? [...targetMilestone.evidence] : [];

  const evidenceItem = {
    id: `ev-${Date.now()}`,
    type: evidenceType,
    url: url || null,
    content: evidenceContent || note || "Evidence submitted",
    note: note || "",
    submittedByUserId: userId,
    submittedAt: new Date().toISOString(),
  };

  evidenceList.push(evidenceItem);
  targetMilestone.evidence = evidenceList;
  targetMilestone.status = "completed";
  targetMilestone.completedAt = new Date().toISOString();

  currentMilestones[targetIdx] = targetMilestone;

  // Check if linked to coach task and sync evidence
  if (targetMilestone.coachTaskId) {
    try {
      await db.insert(taskEvidenceTable).values({
        taskId: targetMilestone.coachTaskId,
        userId,
        evidenceType: (["photo", "video", "document", "receipt", "text", "link"].includes(evidenceType) ? evidenceType : "document") as any,
        url: url || null,
        textContent: evidenceContent || note || "Deal evidence submitted",
        note: note || `Submitted for Deal #${deal.id} Milestone: ${targetMilestone.title}`,
      });

      await db.update(coachTasksTable).set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(coachTasksTable.id, targetMilestone.coachTaskId));
    } catch (err) {
      console.warn("[DealsRoute] Coach task sync warning:", err);
    }
  }

  const allCompleted = currentMilestones.every((m: any) => m.status === "completed");

  await db.update(dealsTable).set({
    milestones: currentMilestones as any,
    status: allCompleted ? "completed" : "milestone_in_progress",
    updatedAt: new Date(),
  }).where(eq(dealsTable.id, id));

  res.status(200).json({
    evidence: evidenceItem,
    milestone: targetMilestone,
    deal: await getDealFull(id),
  });
});

router.all(["/deal-desk/:id/copilot", "/deal-desk/:id/copilot-summary", "/deals/:id/copilot-summary"], async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Not found" }); return; }

  if (req.method === "GET" && deal.copilotSummary) {
    res.json({ summary: deal.copilotSummary });
    return;
  }

  const ai = getGeminiAI();
  if (!ai) {
    const defaultSummary = `This is a **${deal.dealType || 'commercial'} deal** titled "**${deal.title}**" currently in **${deal.status}** status.`;
    res.json({ summary: defaultSummary });
    return;
  }

  const prompt = `You are Bizny AI-Assist — an industrial business assistant for Bizny, a platform for African entrepreneurs.

Analyse this deal and give a brief, practical risk assessment and strategic summary.

Deal: ${deal.title}
Type: ${deal.dealType}
Industry: ${deal.industry ?? "Unspecified"} > ${deal.subIndustry ?? ""} > ${deal.activityTag ?? ""}
Location: ${deal.country ?? ""}, ${deal.stateCity ?? ""}
Description: ${deal.description}
Financial Value: ${deal.financialValue ?? "Not stated"}
Timeline: ${deal.timeline ?? "Not stated"}
Terms: ${deal.terms ?? "None provided"}
Initiator-noted risks: ${deal.risks ?? "None"}
Parties: ${deal.parties.length}

Give 4-6 concise bullet points: deal type validation, key risks to watch, negotiation tips, and whether a field agent is advisable. Be direct and industrial in tone.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    const summary = response.text ?? `This is a ${deal.dealType} deal titled "${deal.title}".`;
    await db.update(dealsTable).set({ copilotSummary: summary, updatedAt: new Date() }).where(eq(dealsTable.id, id));
    res.json({ summary });
  } catch (err: any) {
    const summary = `This is a **${deal.dealType || 'commercial'} deal** titled "**${deal.title}**" currently in **${deal.status}** status.`;
    res.json({ summary });
  }
});

export default router;

