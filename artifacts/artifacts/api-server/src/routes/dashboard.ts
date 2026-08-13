import { Router, type IRouter } from "express";
import { db, usersTable, venturesTable, opportunitiesTable, listingsTable, industriesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  GetDashboardStatsResponse,
  ListIndustriesResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [ventureCount] = await db.select({ count: sql<number>`count(*)` }).from(venturesTable).where(eq(venturesTable.status, "active"));
  const [opportunityCount] = await db.select({ count: sql<number>`count(*)` }).from(opportunitiesTable);
  const [listingCount] = await db.select({ count: sql<number>`count(*)` }).from(listingsTable);
  const [industryCount] = await db.select({ count: sql<number>`count(*)` }).from(industriesTable);
  const [verifiedCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.verificationStatus, "verified"));

  let myActiveVentures = 0;
  let myProgressUpdates = 0;

  if (userId) {
    const [mv] = await db.select({ count: sql<number>`count(*)` }).from(venturesTable)
      .where(and(eq(venturesTable.userId, userId), eq(venturesTable.status, "active")));
    myActiveVentures = Number(mv?.count ?? 0);
  }

  res.json(GetDashboardStatsResponse.parse({
    totalUsers: Number(userCount?.count ?? 0),
    activeVentures: Number(ventureCount?.count ?? 0),
    opportunitiesPosted: Number(opportunityCount?.count ?? 0),
    industriesActive: Number(industryCount?.count ?? 0),
    marketplaceListings: Number(listingCount?.count ?? 0),
    verifiedFieldAgents: Number(verifiedCount?.count ?? 0),
    myActiveVentures,
    myProgressUpdates,
  }));
});

router.get("/industries", async (_req, res): Promise<void> => {
  const rows = await db.select().from(industriesTable);
  res.json(ListIndustriesResponse.parse(rows));
});

export default router;
