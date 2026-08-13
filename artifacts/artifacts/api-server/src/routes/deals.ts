import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dealsTable, dealPartiesTable, dealWitnessesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

router.get("/deal-desk", async (req, res): Promise<void> => {
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

router.post("/deal-desk", async (req, res): Promise<void> => {
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

  await db.insert(dealPartiesTable).values({ dealId: deal.id, userId, role: "initiator", agreed: false });

  res.status(201).json(await getDealFull(deal.id));
});

router.get("/deal-desk/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Deal not found" }); return; }
  res.json(deal);
});

router.put("/deal-desk/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!deal) { res.status(404).json({ error: "Not found" }); return; }
  if (deal.initiatorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

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

router.post("/deal-desk/:id/agree", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

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

router.post("/deal-desk/:id/parties", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { userId: targetUserId, role } = req.body;

  const [party] = await db.insert(dealPartiesTable).values({
    dealId: id, userId: targetUserId, role: role ?? "counterparty", agreed: false,
  }).returning();

  await db.update(dealsTable).set({ status: "open", updatedAt: new Date() }).where(eq(dealsTable.id, id));
  res.status(201).json(party);
});

router.post("/deal-desk/:id/witnesses", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { name, witnessRole, email, phone, relationship } = req.body;

  const [witness] = await db.insert(dealWitnessesTable).values({
    dealId: id, name, witnessRole: witnessRole ?? null, email: email ?? null,
    phone: phone ?? null, relationship: relationship ?? null,
  }).returning();

  res.status(201).json(witness);
});

router.post("/deal-desk/:id/copilot", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const deal = await getDealFull(id);
  if (!deal) { res.status(404).json({ error: "Not found" }); return; }

  const ai = getGeminiAI();
  if (!ai) { res.status(503).json({ error: "GEMINI_API_KEY environment variable is missing" }); return; }

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
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const summary = response.text ?? "";
    await db.update(dealsTable).set({ copilotSummary: summary, updatedAt: new Date() }).where(eq(dealsTable.id, id));
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Gemini generation failed" });
  }
});

export default router;
