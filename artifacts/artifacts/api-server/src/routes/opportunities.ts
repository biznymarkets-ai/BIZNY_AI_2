import { Router, type IRouter } from "express";
import { db, opportunitiesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListOpportunitiesQueryParams,
  ListOpportunitiesResponse,
  CreateOpportunityBody,
  GetOpportunityParams,
  GetOpportunityResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function enrichOpportunity(opp: typeof opportunitiesTable.$inferSelect) {
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, opp.postedById));
  return {
    ...opp,
    role: opp.role ?? undefined,
    investmentSize: opp.investmentSize ?? undefined,
    deadline: opp.deadline ?? undefined,
    createdAt: opp.createdAt || new Date(),
    postedBy: poster ? {
      id: poster.id,
      name: poster.name,
      role: poster.role,
      verificationStatus: poster.verificationStatus || "unverified",
      avatarUrl: poster.avatarUrl ?? null,
    } : undefined,
  };
}

router.get("/opportunities", async (req, res): Promise<void> => {
  const params = ListOpportunitiesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.type) conditions.push(eq(opportunitiesTable.type, params.data.type));
  if (params.data.industry) conditions.push(eq(opportunitiesTable.industry, params.data.industry));
  if (params.data.country) conditions.push(eq(opportunitiesTable.country, params.data.country));

  const rows = conditions.length
    ? await db.select().from(opportunitiesTable).where(and(...conditions)).orderBy(opportunitiesTable.createdAt)
    : await db.select().from(opportunitiesTable).orderBy(opportunitiesTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichOpportunity));
  res.json(ListOpportunitiesResponse.parse(enriched));
});

router.post("/opportunities", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateOpportunityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [opp] = await db.insert(opportunitiesTable).values({
    ...parsed.data,
    postedById: userId,
  }).returning();

  const enriched = await enrichOpportunity(opp);
  res.status(201).json(GetOpportunityResponse.parse(enriched));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOpportunityParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [opp] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, params.data.id));
  if (!opp) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  const enriched = await enrichOpportunity(opp);
  res.json(GetOpportunityResponse.parse(enriched));
});

export default router;
