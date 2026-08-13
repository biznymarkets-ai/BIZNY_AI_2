import { Router, type IRouter } from "express";
import { db, industryTargetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListIndustryTargetsQueryParams,
  ListIndustryTargetsResponse,
  GetIndustryTargetParams,
  GetIndustryTargetResponse,
  CreateIndustryTargetBody,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

router.get("/industry-targets", async (req, res): Promise<void> => {
  const params = ListIndustryTargetsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let rows = await db.select().from(industryTargetsTable);

  if (params.data.industry) {
    rows = rows.filter((r: any) => r.industry === params.data.industry);
  }
  if (params.data.subIndustry) {
    rows = rows.filter((r: any) => r.subIndustry === params.data.subIndustry);
  }

  res.json(ListIndustryTargetsResponse.parse(rows));
});

router.post("/industry-targets", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateIndustryTargetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [target] = await db.insert(industryTargetsTable).values({
    industry: parsed.data.industry,
    subIndustry: parsed.data.subIndustry ?? null,
    productCategory: parsed.data.productCategory ?? null,
    specificProduct: parsed.data.specificProduct ?? null,
    currentRevenue: parsed.data.currentRevenue ?? null,
    currentProductionVolume: parsed.data.currentProductionVolume ?? null,
    currentMarketSize: parsed.data.currentMarketSize ?? null,
    targetRevenue: parsed.data.targetRevenue ?? null,
    targetYear: parsed.data.targetYear ?? null,
    growthTargetPercent: parsed.data.growthTargetPercent ?? null,
    progressPercent: parsed.data.progressPercent ?? 0,
    requiredContributions: parsed.data.requiredContributions ?? {},
  }).returning();

  res.status(201).json(target);
});

router.get("/industry-targets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetIndustryTargetParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [target] = await db.select().from(industryTargetsTable).where(eq(industryTargetsTable.id, params.data.id));
  if (!target) {
    res.status(404).json({ error: "Industry target not found" });
    return;
  }

  res.json(GetIndustryTargetResponse.parse(target));
});

export default router;
