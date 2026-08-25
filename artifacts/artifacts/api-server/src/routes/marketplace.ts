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
    phone: listing.phone ?? undefined,
    whatsapp: listing.whatsapp ?? undefined,
    email: listing.email ?? undefined,
    isVerified: listing.isVerified ?? false,
    createdAt: listing.createdAt || new Date(),
    postedBy: poster ? {
      id: poster.id,
      name: poster.name,
      role: poster.role,
      verificationStatus: poster.verificationStatus || "unverified",
      avatarUrl: poster.avatarUrl ?? null,
    } : undefined,
  };
}

const handleListingsGet = async (req: any, res: any): Promise<void> => {
  const qParam = req.query.q || req.query.search || req.query.keyword;
  const industryParam = req.query.industry;
  const countryParam = req.query.country;

  let rows = await db.select().from(listingsTable).orderBy(listingsTable.createdAt);

  if (industryParam) {
    const ind = String(industryParam).toLowerCase();
    rows = rows.filter((r: any) => r.industry?.toLowerCase() === ind);
  }
  if (countryParam) {
    const c = String(countryParam).toLowerCase();
    rows = rows.filter((r: any) => r.country?.toLowerCase() === c);
  }
  if (qParam) {
    const q = String(qParam).toLowerCase().trim();
    rows = rows.filter((r: any) =>
      r.businessName?.toLowerCase().includes(q) ||
      r.product?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.industry?.toLowerCase().includes(q)
    );
  }

  const enriched = await Promise.all(rows.map(enrichListing));
  res.json(enriched);
};

router.get("/marketplace", handleListingsGet);
router.get("/marketplace/listings", handleListingsGet);
router.get("/listings", handleListingsGet);

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
