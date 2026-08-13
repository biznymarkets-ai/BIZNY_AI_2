import { Router, type IRouter } from "express";
import { db, fieldAgentRequestsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RequestVerificationParams,
  RequestVerificationBody,
  ListVerificationRequestsResponse,
  UpdateVerificationStatusParams,
  UpdateVerificationStatusBody,
  UpdateVerificationStatusResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function enrichRequest(req: typeof fieldAgentRequestsTable.$inferSelect) {
  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, req.requesterId));
  return {
    ...req,
    requester: requester ? {
      id: requester.id,
      name: requester.name,
      role: requester.role,
      verificationStatus: requester.verificationStatus,
      avatarUrl: requester.avatarUrl ?? null,
    } : null,
  };
}

router.post("/users/:id/request-verification", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RequestVerificationParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RequestVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Update user verification status to pending
  await db.update(usersTable)
    .set({ verificationStatus: "pending" })
    .where(eq(usersTable.id, params.data.id));

  const [request] = await db.insert(fieldAgentRequestsTable).values({
    requesterId: params.data.id,
    status: "pending",
    notes: parsed.data.notes ?? null,
    targetType: parsed.data.targetType ?? "profile",
    targetId: parsed.data.targetId ?? null,
  }).returning();

  const enriched = await enrichRequest(request);
  res.status(201).json(enriched);
});

router.get("/verification-requests", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db.select().from(fieldAgentRequestsTable)
    .orderBy(fieldAgentRequestsTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichRequest));
  res.json(ListVerificationRequestsResponse.parse(enriched));
});

router.patch("/verification-requests/:id/status", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateVerificationStatusParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVerificationStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(fieldAgentRequestsTable)
    .where(eq(fieldAgentRequestsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db.update(fieldAgentRequestsTable)
    .set({
      status: parsed.data.status as "pending" | "in_review" | "verified" | "rejected",
      notes: parsed.data.notes ?? existing.notes,
      evidenceUrls: parsed.data.evidenceUrls ?? existing.evidenceUrls,
      rejectionReason: parsed.data.rejectionReason ?? existing.rejectionReason,
      agentId: userId,
      updatedAt: new Date(),
    })
    .where(eq(fieldAgentRequestsTable.id, params.data.id))
    .returning();

  // If verified, update user's verification status
  if (parsed.data.status === "verified") {
    await db.update(usersTable)
      .set({ verificationStatus: "verified" })
      .where(eq(usersTable.id, existing.requesterId));
  } else if (parsed.data.status === "rejected") {
    await db.update(usersTable)
      .set({ verificationStatus: "unverified" })
      .where(eq(usersTable.id, existing.requesterId));
  }

  const enriched = await enrichRequest(updated);
  res.json(UpdateVerificationStatusResponse.parse(enriched));
});

export default router;
