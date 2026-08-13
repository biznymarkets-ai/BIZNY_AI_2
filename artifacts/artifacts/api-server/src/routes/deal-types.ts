import { Router, type IRouter } from "express";
import { db, dealTypesTable, dealFieldSchemasTable, dealFieldValuesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

// GET /api/deal-types — list all active deal types
router.get("/deal-types", async (_req, res): Promise<void> => {
  const types = await db
    .select()
    .from(dealTypesTable)
    .where(eq(dealTypesTable.isActive, true))
    .orderBy(asc(dealTypesTable.displayOrder));
  res.json(types);
});

// GET /api/deal-types/:slug/fields — get field schemas for a deal type
router.get("/deal-types/:slug/fields", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [type] = await db
    .select()
    .from(dealTypesTable)
    .where(eq(dealTypesTable.slug, slug));
  if (!type) { res.status(404).json({ error: "Deal type not found" }); return; }

  const fields = await db
    .select()
    .from(dealFieldSchemasTable)
    .where(eq(dealFieldSchemasTable.dealTypeId, type.id))
    .orderBy(asc(dealFieldSchemasTable.displayOrder));

  res.json({ dealType: type, fields });
});

// POST /api/deal-field-values — save dynamic field values for a deal
router.post("/deal-field-values", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { dealId, values } = req.body as {
    dealId: number;
    values: Array<{ fieldKey: string; fieldLabel: string; fieldType: string; value?: string; valueJson?: unknown }>;
  };

  if (!dealId || !Array.isArray(values)) {
    res.status(400).json({ error: "dealId and values required" }); return;
  }

  // Delete existing values for this deal and re-insert
  await db.delete(dealFieldValuesTable).where(eq(dealFieldValuesTable.dealId, dealId));

  if (values.length > 0) {
    await db.insert(dealFieldValuesTable).values(
      values.map(v => ({
        dealId,
        fieldKey: v.fieldKey,
        fieldLabel: v.fieldLabel,
        fieldType: v.fieldType,
        value: v.value ?? null,
        valueJson: (v.valueJson as Record<string, unknown>) ?? null,
      }))
    );
  }

  res.json({ ok: true, saved: values.length });
});

// GET /api/deal-field-values/:dealId — get all field values for a deal
router.get("/deal-field-values/:dealId", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const dealId = parseInt(Array.isArray(req.params.dealId) ? req.params.dealId[0] : req.params.dealId);
  const values = await db
    .select()
    .from(dealFieldValuesTable)
    .where(eq(dealFieldValuesTable.dealId, dealId));
  res.json(values);
});

export default router;
