import { Router, type IRouter } from "express";
import { db, updatesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListUpdatesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/updates", async (_req, res): Promise<void> => {
  const rows = await db.select().from(updatesTable).orderBy(updatesTable.createdAt);

  const enriched = await Promise.all(rows.map(async (update: any) => {
    let author = null;
    if (update.authorId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, update.authorId));
      if (user) {
        author = {
          id: user.id,
          name: user.name,
          role: user.role,
          verificationStatus: user.verificationStatus,
          avatarUrl: user.avatarUrl ?? null,
        };
      }
    }
    return { ...update, author };
  }));

  res.json(ListUpdatesResponse.parse(enriched));
});

export default router;
