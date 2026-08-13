import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import { saveUserToFirestore, getUserFromFirestoreByEmail } from "../lib/firestore";

const router: IRouter = Router();

const TOKEN_PREFIX = "bizny_token_";

function makeToken(userId: number): string {
  return `${TOKEN_PREFIX}${userId}_${Date.now()}`;
}

function parseUserIdFromToken(token: string): number | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  const id = parseInt(rest.split("_")[0], 10);
  return isNaN(id) ? null : id;
}

export async function getUserFromToken(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  return parseUserIdFromToken(token);
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    name, email, phone, whatsapp, country, stateCity, cityLga,
    industry, role, skills, interests, goals,
    businessName, businessRegistrationNumber, website, yearsExperience,
  } = parsed.data;

  let existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length === 0) {
    const fsUser = await getUserFromFirestoreByEmail(email);
    if (fsUser) existing = [fsUser as any];
  }

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  let user: any;
  try {
    const [inserted] = await db.insert(usersTable).values({
      name,
      email,
      phone: phone ?? null,
      whatsapp: whatsapp ?? null,
      country,
      stateCity: cityLga ? `${stateCity ?? ""} / ${cityLga}`.replace(/^\s*\/\s*/, "") : (stateCity ?? null),
      industry,
      role,
      skills: skills ?? [],
      interests: interests ?? [],
      businessName: businessName ?? null,
      businessRegistrationNumber: businessRegistrationNumber ?? null,
      website: website ?? null,
    }).returning();
    user = inserted;
  } catch (err) {
    console.warn("DB insert error, generating fallback user ID:", err);
    user = {
      id: Math.floor(Date.now() / 1000),
      name,
      email,
      phone: phone ?? null,
      whatsapp: whatsapp ?? null,
      country,
      stateCity: cityLga ? `${stateCity ?? ""} / ${cityLga}`.replace(/^\s*\/\s*/, "") : (stateCity ?? null),
      industry,
      role,
      skills: skills ?? [],
      interests: interests ?? [],
      businessName: businessName ?? null,
      businessRegistrationNumber: businessRegistrationNumber ?? null,
      website: website ?? null,
    };
  }

  // Save user permanently to Firestore
  await saveUserToFirestore(user);

  const token = makeToken(user.id);
  res.status(201).json(LoginResponse.parse({ token, user }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email));
  if (!user) {
    const fsUser = await getUserFromFirestoreByEmail(parsed.data.email);
    if (fsUser) user = fsUser;
  }

  if (!user) {
    res.status(401).json({ error: "No account found with that email" });
    return;
  }

  const token = makeToken(user.id);
  res.json(LoginResponse.parse({ token, user }));
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(user));
});

export default router;
