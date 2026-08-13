import { Router, type IRouter } from "express";
import { db, usersTable, userFollowsTable, postsTable } from "@workspace/db";
import { eq, desc, or, ilike, and, sql } from "drizzle-orm";
import {
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  ListUsersQueryParams,
  FollowUserParams,
  UnfollowUserParams,
  GetFollowStatusParams,
  ListFollowersParams,
  ListFollowingParams,
  ListUserPostsParams,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

function userMini(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    verificationStatus: u.verificationStatus,
    avatarUrl: u.avatarUrl ?? null,
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const meId = await getUserFromToken(req.headers.authorization);

  let rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const { search, role, industry, country, stateCity, verificationStatus } = params.data as any;

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((u: any) =>
      u.name.toLowerCase().includes(q) ||
      (u.industry ?? "").toLowerCase().includes(q) ||
      (u.role ?? "").toLowerCase().includes(q) ||
      (u.country ?? "").toLowerCase().includes(q)
    );
  }
  if (role) rows = rows.filter((u: any) => u.role === role);
  if (industry) rows = rows.filter((u: any) => u.industry === industry);
  if (country) rows = rows.filter((u: any) => u.country === country);
  if (stateCity) rows = rows.filter((u: any) => (u as any).stateCity === stateCity);
  if (verificationStatus) rows = rows.filter((u: any) => u.verificationStatus === verificationStatus);

  const myFollowing = meId
    ? await db.select().from(userFollowsTable).where(eq(userFollowsTable.followerId, meId))
    : [];
  const myFollowingIds = new Set(myFollowing.map((f: any) => f.followingId));

  const result = await Promise.all(rows.map(async (u: any) => {
    const [{ count: fCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userFollowsTable)
      .where(eq(userFollowsTable.followingId, u.id));
    const [{ count: gCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userFollowsTable)
      .where(eq(userFollowsTable.followerId, u.id));

    return {
      id: u.id,
      name: u.name,
      role: u.role,
      industry: u.industry ?? null,
      country: u.country ?? null,
      stateCity: (u as any).stateCity ?? null,
      bio: u.bio ?? null,
      avatarUrl: u.avatarUrl ?? null,
      verificationStatus: u.verificationStatus,
      followersCount: fCount ?? 0,
      followingCount: gCount ?? 0,
      isFollowing: myFollowingIds.has(u.id),
      createdAt: u.createdAt,
    };
  }));

  res.json(result);
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateUserParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (params.data.id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.bio !== undefined) updateData.bio = body.data.bio;
  if (body.data.whatsapp !== undefined) updateData.whatsapp = body.data.whatsapp;
  if (body.data.country !== undefined) updateData.country = body.data.country;
  if (body.data.industry !== undefined) updateData.industry = body.data.industry;
  if (body.data.role !== undefined) updateData.role = body.data.role;
  if (body.data.skills !== undefined) updateData.skills = body.data.skills;
  if (body.data.interests !== undefined) updateData.interests = body.data.interests;
  if (body.data.avatarUrl !== undefined) updateData.avatarUrl = body.data.avatarUrl;
  const ext = body.data as any;
  if (ext.isBusiness !== undefined) updateData.isBusiness = ext.isBusiness;
  if (ext.businessName !== undefined) updateData.businessName = ext.businessName;
  if (ext.businessRegistrationNumber !== undefined) updateData.businessRegistrationNumber = ext.businessRegistrationNumber;
  if (ext.stateCity !== undefined) updateData.stateCity = ext.stateCity;
  if (ext.phone !== undefined) updateData.phone = ext.phone;
  if (ext.website !== undefined) updateData.website = ext.website;
  if (ext.subIndustries !== undefined) updateData.subIndustries = ext.subIndustries;
  if (ext.primaryProducts !== undefined) updateData.primaryProducts = ext.primaryProducts;
  if (ext.services !== undefined) updateData.services = ext.services;
  if (ext.publicSlug !== undefined) updateData.publicSlug = ext.publicSlug;

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id)).returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(user));
});

router.post("/users/:id/follow", async (req, res): Promise<void> => {
  const meId = await getUserFromToken(req.headers.authorization);
  if (!meId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = FollowUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;
  if (targetId === meId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  await db.insert(userFollowsTable).values({ followerId: meId, followingId: targetId }).onConflictDoNothing();

  const [{ count: fCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followingId, targetId));
  const [{ count: gCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followerId, meId));

  res.json({ following: true, followersCount: fCount ?? 0, followingCount: gCount ?? 0 });
});

router.delete("/users/:id/follow", async (req, res): Promise<void> => {
  const meId = await getUserFromToken(req.headers.authorization);
  if (!meId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnfollowUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;
  await db.delete(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, meId), eq(userFollowsTable.followingId, targetId)));

  const [{ count: fCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followingId, targetId));
  const [{ count: gCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followerId, meId));

  res.json({ following: false, followersCount: fCount ?? 0, followingCount: gCount ?? 0 });
});

router.get("/users/:id/follow-status", async (req, res): Promise<void> => {
  const meId = await getUserFromToken(req.headers.authorization);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFollowStatusParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;

  let following = false;
  if (meId) {
    const [r] = await db.select().from(userFollowsTable)
      .where(and(eq(userFollowsTable.followerId, meId), eq(userFollowsTable.followingId, targetId)));
    following = !!r;
  }

  const [{ count: fCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followingId, targetId));
  const [{ count: gCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userFollowsTable).where(eq(userFollowsTable.followerId, targetId));

  res.json({ following, followersCount: fCount ?? 0, followingCount: gCount ?? 0 });
});

router.get("/users/:id/followers", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListFollowersParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const follows = await db.select().from(userFollowsTable)
    .where(eq(userFollowsTable.followingId, params.data.id));

  const users = await Promise.all(
    follows.map(async (f: any) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, f.followerId));
      return u ? userMini(u) : null;
    })
  );

  res.json(users.filter(Boolean));
});

router.get("/users/:id/following", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListFollowingParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const follows = await db.select().from(userFollowsTable)
    .where(eq(userFollowsTable.followerId, params.data.id));

  const users = await Promise.all(
    follows.map(async (f: any) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, f.followingId));
      return u ? userMini(u) : null;
    })
  );

  res.json(users.filter(Boolean));
});

router.get("/users/:id/posts", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListUserPostsParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const meId = await getUserFromToken(req.headers.authorization);

  const rows = await db.select().from(postsTable)
    .where(eq(postsTable.authorId, params.data.id))
    .orderBy(desc(postsTable.createdAt));

  const enriched = await Promise.all(rows.map(async (post: any) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.authorId));
    return {
      ...post,
      author: author ? userMini(author) : null,
      isSaved: false,
    };
  }));

  res.json(enriched);
});

export default router;
