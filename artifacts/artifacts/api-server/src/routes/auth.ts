import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import { saveUserToFirestore, getUserFromFirestoreByEmail } from "../lib/firestore.ts";
import { SYNTHETIC_CHARACTERS, seedSyntheticUniverse } from "../lib/synthetic-universe.ts";

const router: IRouter = Router();

const TOKEN_PREFIX = "bizny_token_";

export function makeToken(userId: number): string {
  return `${TOKEN_PREFIX}${userId}_${Date.now()}`;
}

export function parseUserIdFromToken(token: string): number | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  const id = parseInt(rest.split("_")[0], 10);
  return isNaN(id) ? null : id;
}

export async function getUserFromToken(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return parseUserIdFromToken(token);
}

function normalizeUser(user: any): any {
  if (!user) return null;
  return {
    ...user,
    id: Number(user.id),
    name: String(user.name || ""),
    email: String(user.email || ""),
    whatsapp: user.whatsapp ?? null,
    country: String(user.country || "Nigeria"),
    industry: String(user.industry || "General"),
    role: String(user.role || "Member"),
    bio: user.bio ?? null,
    skills: Array.isArray(user.skills) ? user.skills : [],
    interests: Array.isArray(user.interests) ? user.interests : [],
    verificationStatus: user.verificationStatus === "verified" || user.verificationStatus === "pending" ? user.verificationStatus : "unverified",
    avatarUrl: user.avatarUrl ?? null,
    isBusiness: Boolean(user.isBusiness),
    businessName: user.businessName ?? null,
    businessRegistrationNumber: user.businessRegistrationNumber ?? null,
    stateCity: user.stateCity ?? null,
    subIndustries: Array.isArray(user.subIndustries) ? user.subIndustries : [],
    primaryProducts: Array.isArray(user.primaryProducts) ? user.primaryProducts : [],
    services: Array.isArray(user.services) ? user.services : [],
    phone: user.phone ?? null,
    website: user.website ?? null,
    publicSlug: user.publicSlug ?? null,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
  };
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

  const cleanEmail = email.trim().toLowerCase();

  let existing = await db.select().from(usersTable);
  const found = existing.find((u: any) => u.email?.toLowerCase() === cleanEmail);

  if (found) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const fsUser = await getUserFromFirestoreByEmail(cleanEmail);
  if (fsUser) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  let user: any;
  try {
    const [inserted] = await db.insert(usersTable).values({
      name,
      email: cleanEmail,
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
      verificationStatus: "unverified",
      createdAt: new Date(),
    }).returning();
    user = inserted;
  } catch (err) {
    console.warn("DB insert error, generating fallback user ID:", err);
    user = {
      id: Math.floor(Date.now() / 1000),
      name,
      email: cleanEmail,
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
      verificationStatus: "unverified",
      createdAt: new Date(),
    };
  }

  const safeUser = normalizeUser(user);

  // Save user permanently to Firestore in background
  saveUserToFirestore(safeUser).catch((e) => console.warn("Firestore sync warning:", e));

  const token = makeToken(safeUser.id);
  try {
    res.status(201).json(LoginResponse.parse({ token, user: safeUser }));
  } catch {
    res.status(201).json({ token, user: safeUser });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const rawIdentifier = String(req.body?.email || req.body?.identifier || req.body?.username || "").trim();

  if (!rawIdentifier) {
    res.status(400).json({ error: "Email or persona identifier is required" });
    return;
  }

  const cleanQuery = rawIdentifier.toLowerCase();

  // 1. Search in local database
  let allUsers = await db.select().from(usersTable);
  let user = allUsers.find(
    (u: any) =>
      u.email?.toLowerCase() === cleanQuery ||
      u.publicSlug?.toLowerCase() === cleanQuery ||
      u.name?.toLowerCase() === cleanQuery ||
      u.name?.toLowerCase().startsWith(cleanQuery)
  );

  // 2. If not found in DB, check if it is one of the synthetic personas
  if (!user) {
    const isSynthetic = SYNTHETIC_CHARACTERS.some(
      (c) =>
        c.email.toLowerCase() === cleanQuery ||
        c.idKey.toLowerCase() === cleanQuery ||
        c.name.toLowerCase() === cleanQuery ||
        c.name.toLowerCase().startsWith(cleanQuery)
    );

    if (isSynthetic) {
      await seedSyntheticUniverse();
      allUsers = await db.select().from(usersTable);
      user = allUsers.find(
        (u: any) =>
          u.email?.toLowerCase() === cleanQuery ||
          u.publicSlug?.toLowerCase() === cleanQuery ||
          u.name?.toLowerCase() === cleanQuery ||
          u.name?.toLowerCase().startsWith(cleanQuery)
      );
    }
  }

  // 3. If still not found, check Firestore
  if (!user) {
    const fsUser = await getUserFromFirestoreByEmail(cleanQuery);
    if (fsUser) user = fsUser;
  }

  // 4. Return 401 if user not found
  if (!user) {
    res.status(401).json({ error: "No account found with that email or identifier" });
    return;
  }

  const safeUser = normalizeUser(user);
  const token = makeToken(safeUser.id);

  try {
    res.json(LoginResponse.parse({ token, user: safeUser }));
  } catch {
    res.json({ token, user: safeUser });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = await getUserFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const allUsers = await db.select().from(usersTable);
  let user = allUsers.find((u: any) => Number(u.id) === Number(userId));

  if (!user) {
    // If synthetic universe might need seeding
    if (allUsers.length === 0) {
      await seedSyntheticUniverse();
      const refreshedUsers = await db.select().from(usersTable);
      user = refreshedUsers.find((u: any) => Number(u.id) === Number(userId));
    }
  }

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const safeUser = normalizeUser(user);

  try {
    res.json(GetMeResponse.parse(safeUser));
  } catch {
    res.json(safeUser);
  }
});

export default router;
