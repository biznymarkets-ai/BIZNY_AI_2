import { Router, type IRouter } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import {
  ListListingsQueryParams,
  ListListingsResponse,
  CreateListingBody,
  GetListingParams,
  GetListingResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function enrichListing(listing: typeof listingsTable.$inferSelect) {
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, listing.postedById));
  return {
    ...listing,
    postedBy: poster ? {
      id: poster.id,
      name: poster.name,
      role: poster.role,
      verificationStatus: poster.verificationStatus,
      avatarUrl: poster.avatarUrl ?? null,
    } : null,
  };
}

router.get("/marketplace", async (req, res): Promise<void> => {
  const params = ListListingsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.industry) conditions.push(eq(listingsTable.industry, params.data.industry));
  if (params.data.country) conditions.push(eq(listingsTable.country, params.data.country));
  if (params.data.search) conditions.push(ilike(listingsTable.businessName, `%${params.data.search}%`));

  const rows = conditions.length
    ? await db.select().from(listingsTable).where(and(...conditions)).orderBy(listingsTable.createdAt)
    : await db.select().from(listingsTable).orderBy(listingsTable.createdAt);

  const enriched = await Promise.all(rows.map(enrichListing));
  res.json(ListListingsResponse.parse(enriched));
});

router.post("/marketplace", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [listing] = await db.insert(listingsTable).values({
    ...parsed.data,
    postedById: userId,
  }).returning();

  const enriched = await enrichListing(listing);
  res.status(201).json(GetListingResponse.parse(enriched));
});

router.get("/marketplace/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetListingParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const enriched = await enrichListing(listing);
  res.json(GetListingResponse.parse(enriched));
});

export default router;
