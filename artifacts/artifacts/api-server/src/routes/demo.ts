import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SYNTHETIC_CHARACTERS, seedSyntheticUniverse } from "../lib/synthetic-universe";

const router: IRouter = Router();

const TOKEN_PREFIX = "bizny_token_";

function makeToken(userId: number): string {
  return `${TOKEN_PREFIX}${userId}_${Date.now()}`;
}

// 1. Get all 5 personas in the Synthetic Universe
router.get("/demo/personas", async (_req, res): Promise<void> => {
  try {
    const liveUsers = await db.select().from(usersTable);
    const enriched = SYNTHETIC_CHARACTERS.map((char) => {
      const liveUser = liveUsers.find((u) => u.email === char.email);
      return {
        ...char,
        dbId: liveUser?.id || null,
        isSeeded: Boolean(liveUser),
      };
    });
    res.json({
      success: true,
      universeName: "Bizny Synthetic Economic Universe",
      description: "An interconnected 5-node African productive network demonstrating equipment fabrication, agro-processing, laboratory certification, freight haulage, and consumer retail off-take.",
      characters: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Switch into a synthetic persona with 1-click auth token
router.post("/demo/switch-persona/:idOrEmail", async (req, res): Promise<void> => {
  try {
    const { idOrEmail } = req.params;
    
    // Find matching character
    const char = SYNTHETIC_CHARACTERS.find(
      (c) => c.email.toLowerCase() === idOrEmail.toLowerCase() || c.idKey.toLowerCase() === idOrEmail.toLowerCase()
    );

    if (!char) {
      res.status(404).json({ error: `Synthetic persona '${idOrEmail}' not found.` });
      return;
    }

    // Lookup user in DB
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, char.email));

    if (!user) {
      const allUsers = await db.select().from(usersTable);
      user = allUsers.find(
        (u) =>
          u.email?.toLowerCase() === char.email.toLowerCase() ||
          u.publicSlug?.toLowerCase() === char.idKey.toLowerCase() ||
          u.name?.toLowerCase() === char.name.toLowerCase()
      );
    }

    // If not yet in DB, trigger seed
    if (!user) {
      await seedSyntheticUniverse();
      let [seeded] = await db.select().from(usersTable).where(eq(usersTable.email, char.email));
      if (!seeded) {
        const allUsers = await db.select().from(usersTable);
        seeded = allUsers.find(
          (u) =>
            u.email?.toLowerCase() === char.email.toLowerCase() ||
            u.publicSlug?.toLowerCase() === char.idKey.toLowerCase() ||
            u.name?.toLowerCase() === char.name.toLowerCase()
        );
      }
      user = seeded;
    }

    if (!user) {
      res.status(500).json({ error: "Failed to load synthetic user account." });
      return;
    }

    const token = makeToken(user.id);

    res.json({
      success: true,
      token,
      user,
      characterMeta: {
        idKey: char.idKey,
        tagline: char.tagline,
        roleInNetwork: char.roleInNetwork,
        testPrompts: char.testPrompts,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Trigger manual re-seed
router.post("/demo/seed", async (_req, res): Promise<void> => {
  try {
    const result = await seedSyntheticUniverse();
    res.json({
      success: true,
      message: "Bizny Synthetic Economic Universe seeded successfully.",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
