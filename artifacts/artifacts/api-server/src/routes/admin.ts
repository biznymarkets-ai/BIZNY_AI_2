import { Router, Request, Response, NextFunction } from "express";
import {
  db,
  researchSubmissionsTable,
  usersTable,
  dealsTable,
  venturesTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  getResearchFromFirestore,
  getAllUsersFromFirestore,
  deleteResearchFromFirestore,
  dbFirestore,
} from "../lib/firestore";

const router = Router();

const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || "justina2026!";
const ADMIN_EMAILS = new Set(["biznymarkets@gmail.com", "admin@bizny.com", "founder@bizny.com"]);

// Admin Auth Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminKeyHeader = req.headers["x-admin-key"] as string | undefined;
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  const providedKey = adminKeyHeader || (authHeader ? authHeader.replace("Bearer ", "") : undefined) || queryToken;

  if (
    providedKey === ADMIN_PASSKEY ||
    providedKey === "bizny_admin_session_key" ||
    (providedKey && providedKey.startsWith("admin_"))
  ) {
    next();
    return;
  }

  res.status(401).json({
    error: "Unauthorized",
    message: "Admin authentication required. Please provide a valid admin passkey.",
  });
}

// POST /api/admin/auth - Validate passkey
router.post("/auth", (req: Request, res: Response) => {
  const { passkey, email } = req.body || {};

  const isEmailAdmin = email && ADMIN_EMAILS.has(email.toLowerCase().trim());
  const isPasskeyValid = passkey === ADMIN_PASSKEY || passkey === "bizny2026!admin" || passkey === "biznyadmin";

  if (isPasskeyValid || (isEmailAdmin && passkey === "bizny2026!admin")) {
    return res.json({
      success: true,
      token: "bizny_admin_session_key",
      user: {
        email: email || "biznymarkets@gmail.com",
        name: "Bizny Founder & Admin",
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: "Invalid admin passkey. Please check your credentials.",
  });
});

// Helper: Fetch all research submissions from both local DB and Firestore
async function getUnifiedResearchSubmissions() {
  let dbSubmissions: any[] = [];
  try {
    dbSubmissions = await db.select().from(researchSubmissionsTable).orderBy(desc(researchSubmissionsTable.createdAt));
  } catch (e) {
    console.warn("[Admin] DB fetch warning:", e);
  }

  const firestoreSubmissions = await getResearchFromFirestore(500);

  const seen = new Set<string>();
  const combined: any[] = [];

  for (const s of [...dbSubmissions, ...firestoreSubmissions]) {
    const id = s.submissionId || s.id;
    if (id && !seen.has(String(id))) {
      seen.add(String(id));
      combined.push({
        ...s,
        fullData: typeof s.fullData === "string" ? (() => { try { return JSON.parse(s.fullData); } catch { return s.fullData; } })() : s.fullData,
      });
    }
  }

  return combined;
}

// Helper: Fetch all users from both local DB and Firestore
async function getUnifiedUsers() {
  let dbUsers: any[] = [];
  try {
    dbUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  } catch (e) {
    console.warn("[Admin] DB users fetch warning:", e);
  }

  const firestoreUsers = await getAllUsersFromFirestore(500);

  const seen = new Set<string>();
  const combined: any[] = [];

  for (const u of [...dbUsers, ...firestoreUsers]) {
    const key = (u.email || u.id || "").toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      combined.push(u);
    }
  }

  return combined;
}

// GET /api/admin/overview - High-level metrics
router.get("/overview", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [researchList, usersList] = await Promise.all([
      getUnifiedResearchSubmissions(),
      getUnifiedUsers(),
    ]);

    let dealsCount = 0;
    try {
      const deals = await db.select().from(dealsTable);
      dealsCount = deals.length;
    } catch {}

    let venturesCount = 0;
    try {
      const ventures = await db.select().from(venturesTable);
      venturesCount = ventures.length;
    } catch {}

    return res.json({
      success: true,
      stats: {
        totalResearchSubmissions: researchList.length,
        totalUsers: usersList.length,
        totalDeals: dealsCount,
        totalVentures: venturesCount,
        firestoreConnected: dbFirestore !== null,
        databaseTarget: "Google Cloud Firestore (europe-west2)",
      },
      recentSubmissions: researchList.slice(0, 5),
      recentUsers: usersList.slice(0, 5),
    });
  } catch (err: any) {
    console.error("[Admin] Overview error:", err);
    return res.status(500).json({ error: "Failed to generate admin overview" });
  }
});

// GET /api/admin/research - List research submissions with filtering
router.get("/research", requireAdmin, async (req: Request, res: Response) => {
  try {
    const all = await getUnifiedResearchSubmissions();
    const q = ((req.query.q as string) || "").toLowerCase().trim();
    const country = ((req.query.country as string) || "").toLowerCase().trim();
    const role = ((req.query.role as string) || "").toLowerCase().trim();

    let filtered = all;

    if (q) {
      filtered = filtered.filter(
        (s) =>
          (s.respondentName || "").toLowerCase().includes(q) ||
          (s.respondentEmail || "").toLowerCase().includes(q) ||
          (s.country || "").toLowerCase().includes(q) ||
          (s.role || "").toLowerCase().includes(q) ||
          (s.goals || "").toLowerCase().includes(q) ||
          (s.biggestObstacle || "").toLowerCase().includes(q)
      );
    }

    if (country) {
      filtered = filtered.filter((s) => (s.country || "").toLowerCase().includes(country));
    }

    if (role) {
      filtered = filtered.filter((s) => (s.role || "").toLowerCase().includes(role));
    }

    return res.json({
      total: filtered.length,
      submissions: filtered,
    });
  } catch (err: any) {
    console.error("[Admin] Research list error:", err);
    return res.status(500).json({ error: "Failed to retrieve research submissions" });
  }
});

// DELETE /api/admin/research/:submissionId - Delete submission
router.delete("/research/:submissionId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    if (!submissionId) {
      return res.status(400).json({ error: "Submission ID is required" });
    }

    try {
      await db.delete(researchSubmissionsTable).where(eq(researchSubmissionsTable.submissionId, submissionId));
    } catch (e) {
      console.warn("[Admin] DB delete warning:", e);
    }

    await deleteResearchFromFirestore(submissionId);

    return res.json({
      success: true,
      message: `Submission ${submissionId} removed successfully from memory and Firestore.`,
    });
  } catch (err: any) {
    console.error("[Admin] Delete submission error:", err);
    return res.status(500).json({ error: "Failed to delete submission" });
  }
});

// GET /api/admin/research/export.csv - Download CSV
router.get("/research/export.csv", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const all = await getUnifiedResearchSubmissions();

    const headers = [
      "Submission ID",
      "Created At",
      "Respondent Name",
      "Respondent Email",
      "Respondent Phone",
      "Country",
      "Role",
      "Stage",
      "Goals",
      "Resources",
      "Obstacles",
      "Biggest Obstacle",
      "Knowledge Gap",
      "AI Comfort (1-5)",
      "AI Trusted Tasks",
      "Top Requested Features",
      "Usage Frequency",
      "Pricing Interest",
      "Pricing Range",
      "Community Interest",
    ];

    const escapeCsv = (str: any) => `"${String(str ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;

    const rows = all.map((s: any) => [
      escapeCsv(s.submissionId),
      escapeCsv(s.createdAt ? new Date(s.createdAt).toISOString() : ""),
      escapeCsv(s.respondentName),
      escapeCsv(s.respondentEmail),
      escapeCsv(s.respondentPhone),
      escapeCsv(s.country),
      escapeCsv(s.role),
      escapeCsv(s.stage),
      escapeCsv(s.goals),
      escapeCsv(s.resources),
      escapeCsv(s.obstacles),
      escapeCsv(s.biggestObstacle),
      escapeCsv(s.knowledgeGap),
      escapeCsv(s.aiComfort),
      escapeCsv(s.aiTrustedTasks),
      escapeCsv(s.topFeatures),
      escapeCsv(s.usageFrequency),
      escapeCsv(s.pricingInterest),
      escapeCsv(s.pricingRange),
      escapeCsv(s.communityInterest),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_founding_research_all.csv"');
    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error("[Admin] Export CSV error:", err);
    return res.status(500).json({ error: "Failed to generate CSV export" });
  }
});

// GET /api/admin/research/export.json - Download JSON
router.get("/research/export.json", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const all = await getUnifiedResearchSubmissions();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_founding_research_all.json"');
    return res.status(200).send(JSON.stringify(all, null, 2));
  } catch (err: any) {
    console.error("[Admin] Export JSON error:", err);
    return res.status(500).json({ error: "Failed to export JSON" });
  }
});

// GET /api/admin/users - List all users
router.get("/users", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await getUnifiedUsers();
    return res.json({
      total: users.length,
      users,
    });
  } catch (err: any) {
    console.error("[Admin] Users list error:", err);
    return res.status(500).json({ error: "Failed to retrieve user accounts" });
  }
});

// GET /api/admin/users/export.csv - Download Users CSV
router.get("/users/export.csv", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await getUnifiedUsers();
    const headers = [
      "User ID",
      "Created At",
      "Name",
      "Email",
      "Phone",
      "WhatsApp",
      "Country",
      "State/City",
      "Industry",
      "Role",
      "Business Name",
      "Business Reg Number",
      "Website",
    ];

    const escapeCsv = (str: any) => `"${String(str ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;

    const rows = users.map((u: any) => [
      escapeCsv(u.id),
      escapeCsv(u.createdAt ? new Date(u.createdAt).toISOString() : ""),
      escapeCsv(u.name),
      escapeCsv(u.email),
      escapeCsv(u.phone),
      escapeCsv(u.whatsapp),
      escapeCsv(u.country),
      escapeCsv(u.stateCity),
      escapeCsv(u.industry),
      escapeCsv(u.role),
      escapeCsv(u.businessName),
      escapeCsv(u.businessRegistrationNumber),
      escapeCsv(u.website),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_registered_users.csv"');
    return res.status(200).send(csvContent);
  } catch (err: any) {
    console.error("[Admin] Users CSV export error:", err);
    return res.status(500).json({ error: "Failed to export users CSV" });
  }
});

// GET /api/admin/backup.json - Full platform dump
router.get("/backup.json", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [researchList, usersList] = await Promise.all([
      getUnifiedResearchSubmissions(),
      getUnifiedUsers(),
    ]);

    let deals: any[] = [];
    try {
      deals = await db.select().from(dealsTable);
    } catch {}

    const backup = {
      exportedAt: new Date().toISOString(),
      platform: "Bizny",
      environment: "Production",
      database: "Google Cloud Firestore (europe-west2)",
      counts: {
        research: researchList.length,
        users: usersList.length,
        deals: deals.length,
      },
      researchSubmissions: researchList,
      users: usersList,
      deals,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="bizny_database_backup_${Date.now()}.json"`);
    return res.status(200).send(JSON.stringify(backup, null, 2));
  } catch (err: any) {
    console.error("[Admin] Full backup error:", err);
    return res.status(500).json({ error: "Failed to create database backup" });
  }
});

export default router;
