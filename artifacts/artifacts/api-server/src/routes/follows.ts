import { Router, type IRouter } from "express";
import { db, userFollowsTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  FollowUserParams,
  UnfollowUserParams,
  GetFollowStatusParams,
  ListFollowersParams,
  ListFollowingParams,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

async function getFollowCounts(userId: number) {
  const [{ followers }] = await db
    .select({ followers: count() })
    .from(userFollowsTable)
    .where(eq(userFollowsTable.followingId, userId));
  const [{ following }] = await db
    .select({ following: count() })
    .from(userFollowsTable)
    .where(eq(userFollowsTable.followerId, userId));
  return { followersCount: Number(followers), followingCount: Number(following) };
}

router.post("/users/:id/follow", async (req, res): Promise<void> => {
  const myId = await getUserFromToken(req.headers.authorization);
  if (!myId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = FollowUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;
  if (targetId === myId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  // Upsert — ignore if already following
  await db
    .insert(userFollowsTable)
    .values({ followerId: myId, followingId: targetId })
    .onConflictDoNothing();

  const counts = await getFollowCounts(targetId);
  res.json({ following: true, ...counts });
});

router.delete("/users/:id/follow", async (req, res): Promise<void> => {
  const myId = await getUserFromToken(req.headers.authorization);
  if (!myId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnfollowUserParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;
  await db
    .delete(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, myId), eq(userFollowsTable.followingId, targetId)));

  const counts = await getFollowCounts(targetId);
  res.json({ following: false, ...counts });
});

router.get("/users/:id/follow-status", async (req, res): Promise<void> => {
  const myId = await getUserFromToken(req.headers.authorization);
  if (!myId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFollowStatusParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const targetId = params.data.id;
  const [existing] = await db
    .select()
    .from(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, myId), eq(userFollowsTable.followingId, targetId)));

  const counts = await getFollowCounts(targetId);
  res.json({ following: !!existing, ...counts });
});

router.get("/users/:id/followers", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListFollowersParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select({ user: usersTable })
    .from(userFollowsTable)
    .innerJoin(usersTable, eq(usersTable.id, userFollowsTable.followerId))
    .where(eq(userFollowsTable.followingId, params.data.id));

  res.json(rows.map((r: any) => ({
    id: r.user.id,
    name: r.user.name,
    role: r.user.role,
    verificationStatus: r.user.verificationStatus,
    avatarUrl: r.user.avatarUrl ?? null,
  })));
});

router.get("/users/:id/following", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListFollowingParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select({ user: usersTable })
    .from(userFollowsTable)
    .innerJoin(usersTable, eq(usersTable.id, userFollowsTable.followingId))
    .where(eq(userFollowsTable.followerId, params.data.id));

  res.json(rows.map((r: any) => ({
    id: r.user.id,
    name: r.user.name,
    role: r.user.role,
    verificationStatus: r.user.verificationStatus,
    avatarUrl: r.user.avatarUrl ?? null,
  })));
});

export default router;
