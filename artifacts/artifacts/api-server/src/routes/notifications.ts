import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import {
  ListNotificationsResponse,
  MarkNotificationsReadBody,
  MarkNotificationsReadResponse,
  GetUnreadNotificationCountResponse,
} from "@workspace/api-zod";
import { getUserFromToken } from "./auth";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.json(ListNotificationsResponse.parse([]));
    return;
  }

  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(notificationsTable.createdAt);

  res.json(ListNotificationsResponse.parse(rows));
});

router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.json(GetUnreadNotificationCountResponse.parse({ count: 0 }));
    return;
  }

  const rows = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  res.json(GetUnreadNotificationCountResponse.parse({ count: rows.length }));
});

router.patch("/notifications", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = MarkNotificationsReadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.ids.length > 0) {
    await db.update(notificationsTable)
      .set({ read: true })
      .where(inArray(notificationsTable.id, parsed.data.ids));
  } else {
    // Mark all as read
    await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, userId));
  }

  res.json(MarkNotificationsReadResponse.parse({ status: "ok" }));
});

export default router;
