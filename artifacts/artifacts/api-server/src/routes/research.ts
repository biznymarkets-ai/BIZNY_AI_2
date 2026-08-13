import { Router, Request, Response } from "express";
import { db, researchSubmissionsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { saveResearchToFirestore, getResearchFromFirestore } from "../lib/firestore";

const router = Router();

// POST /api/research/submit
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    const submissionId = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    const record = {
      submissionId,
      country: data.country || (Array.isArray(data.countries) ? data.countries.join(", ") : ""),
      role: Array.isArray(data.roles) ? data.roles.join(", ") : (data.role || ""),
      stage: data.stage || "",
      goals: Array.isArray(data.goals) ? data.goals.join(", ") : (data.goals || ""),
      resources: Array.isArray(data.resources) ? data.resources.join(", ") : (data.resources || ""),
      obstacles: Array.isArray(data.obstacles) ? data.obstacles.join(", ") : (data.obstacles || ""),
      biggestObstacle: data.biggestObstacle || "",
      knowledgeGap: data.knowledgeGap || "",
      aiComfort: typeof data.aiComfort === "number" ? data.aiComfort : 3,
      aiTrustedTasks: Array.isArray(data.aiTrustedTasks) ? data.aiTrustedTasks.join(", ") : (data.aiTrustedTasks || ""),
      topFeatures: Array.isArray(data.topFeatures) ? data.topFeatures.join(", ") : (data.topFeatures || ""),
      usageFrequency: data.usageFrequency || "",
      pricingInterest: data.pricingInterest || "",
      pricingRange: data.pricingRange || "",
      communityInterest: data.communityInterest || "",
      respondentName: data.respondentName || data.name || "",
      respondentEmail: data.respondentEmail || data.email || "",
      respondentPhone: data.respondentPhone || data.whatsapp || "",
      fullData: JSON.stringify(data),
    };

    try {
      await db.insert(researchSubmissionsTable).values(record);
    } catch (dbErr) {
      console.warn("[Research] DB insert warning, relying on Firestore:", dbErr);
    }

    // Save permanently to Firestore cloud database
    await saveResearchToFirestore({ ...record, fullData: data });

    return res.status(201).json({
      success: true,
      submissionId,
      message: "Thank you for contributing to Bizny Founding Research!",
    });
  } catch (error: any) {
    console.error("Error saving research submission:", error);
    return res.status(500).json({ error: "Failed to store research submission" });
  }
});

// Helper to fetch combined submissions from DB & Firestore
async function fetchAllSubmissions() {
  let dbSubmissions: any[] = [];
  try {
    dbSubmissions = await db.select().from(researchSubmissionsTable).orderBy(desc(researchSubmissionsTable.createdAt));
  } catch (e) {
    console.warn("DB fetch error:", e);
  }

  const firestoreSubmissions = await getResearchFromFirestore(500);

  // Deduplicate by submissionId
  const seen = new Set<string>();
  const combined: any[] = [];

  for (const s of [...dbSubmissions, ...firestoreSubmissions]) {
    const id = s.submissionId;
    if (id && !seen.has(id)) {
      seen.add(id);
      combined.push(s);
    }
  }

  return combined;
}

// GET /api/research/submissions - Admin view
router.get("/submissions", async (_req: Request, res: Response) => {
  try {
    const submissions = await fetchAllSubmissions();

    return res.json({
      total: submissions.length,
      submissions: submissions.map((s: any) => ({
        ...s,
        fullData: typeof s.fullData === "string" ? JSON.parse(s.fullData) : s.fullData,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching research submissions:", error);
    return res.status(500).json({ error: "Failed to load research submissions" });
  }
});

// GET /api/research/stats - Aggregated stats for founder dashboard
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const all = await fetchAllSubmissions();
    const total = all.length;

    const countryCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    const obstacleCounts: Record<string, number> = {};
    let aiSum = 0;
    let paidCount = 0;
    let communityCount = 0;

    all.forEach((s: any) => {
      if (s.country) countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
      if (s.role) {
        s.role.split(", ").forEach((r: string) => {
          if (r) roleCounts[r] = (roleCounts[r] || 0) + 1;
        });
      }
      if (s.biggestObstacle) {
        obstacleCounts[s.biggestObstacle] = (obstacleCounts[s.biggestObstacle] || 0) + 1;
      }
      if (typeof s.aiComfort === "number") aiSum += s.aiComfort;
      if (s.pricingInterest && s.pricingInterest.toLowerCase().includes("yes")) paidCount++;
      if (s.communityInterest && s.communityInterest.toLowerCase().includes("yes")) communityCount++;
    });

    return res.json({
      totalResponses: total,
      avgAiComfort: total > 0 ? (aiSum / total).toFixed(1) : "0",
      paidConversionInterest: total > 0 ? Math.round((paidCount / total) * 100) : 0,
      foundingCommunityInterest: communityCount,
      countryBreakdown: countryCounts,
      topRoles: roleCounts,
      topObstacles: obstacleCounts,
    });
  } catch (error: any) {
    console.error("Error generating research stats:", error);
    return res.status(500).json({ error: "Failed to calculate research stats" });
  }
});

// GET /api/research/export.csv - Download CSV
router.get("/export.csv", async (_req: Request, res: Response) => {
  try {
    const all = await fetchAllSubmissions();

    const headers = [
      "Submission ID",
      "Date",
      "Name",
      "Email",
      "Phone/WhatsApp",
      "Country",
      "Role",
      "Stage",
      "Goals",
      "Resources",
      "Biggest Obstacle",
      "AI Comfort (1-5)",
      "Top Features",
      "Usage Frequency",
      "Pricing Interest",
      "Community Interest",
    ];

    const rows = all.map((s: any) => [
      `"${s.submissionId || ""}"`,
      `"${s.createdAt ? new Date(s.createdAt).toISOString() : ""}"`,
      `"${(s.respondentName || "").replace(/"/g, '""')}"`,
      `"${(s.respondentEmail || "").replace(/"/g, '""')}"`,
      `"${(s.respondentPhone || "").replace(/"/g, '""')}"`,
      `"${(s.country || "").replace(/"/g, '""')}"`,
      `"${(s.role || "").replace(/"/g, '""')}"`,
      `"${(s.stage || "").replace(/"/g, '""')}"`,
      `"${(s.goals || "").replace(/"/g, '""')}"`,
      `"${(s.resources || "").replace(/"/g, '""')}"`,
      `"${(s.biggestObstacle || "").replace(/"/g, '""')}"`,
      `"${s.aiComfort || ""}"`,
      `"${(s.topFeatures || "").replace(/"/g, '""')}"`,
      `"${(s.usageFrequency || "").replace(/"/g, '""')}"`,
      `"${(s.pricingInterest || "").replace(/"/g, '""')}"`,
      `"${(s.communityInterest || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_founding_research_submissions.csv"');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Error exporting research CSV:", error);
    return res.status(500).json({ error: "Failed to generate CSV export" });
  }
});

export default router;
