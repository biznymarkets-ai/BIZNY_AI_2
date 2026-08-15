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
      stage: data.stage || (data.cityRegion ? `City: ${data.cityRegion}` : ""),
      goals: data.objectiveDescription || (Array.isArray(data.goals) ? data.goals.join(", ") : (data.goals || "")),
      resources: Array.isArray(data.resourcesHave) ? data.resourcesHave.join(", ") : (Array.isArray(data.resources) ? data.resources.join(", ") : (data.resources || "")),
      obstacles: Array.isArray(data.stuckOutcome) ? data.stuckOutcome.join(", ") : (Array.isArray(data.obstacles) ? data.obstacles.join(", ") : (data.obstacles || "")),
      biggestObstacle: data.stuckFrustration || data.biggestObstacle || "",
      knowledgeGap: data.theOneExpectation || data.knowledgeGap || "",
      aiComfort: typeof data.adopterMonitoringUtility === "number" ? data.adopterMonitoringUtility : (typeof data.aiComfort === "number" ? data.aiComfort : 3),
      aiTrustedTasks: Array.isArray(data.aiTrustedTasks) ? data.aiTrustedTasks.join(", ") : (data.aiTrustedTasks || ""),
      topFeatures: Array.isArray(data.marketplaceDiscoveryInterests) ? data.marketplaceDiscoveryInterests.join(", ") : (Array.isArray(data.topFeatures) ? data.topFeatures.join(", ") : ""),
      usageFrequency: data.preOrderTimeframe || data.usageFrequency || "",
      pricingInterest: data.willingForInterview || data.pricingInterest || "",
      pricingRange: data.biggestNeed || data.pricingRange || "",
      communityInterest: data.willingForInterview === "Yes" ? "Yes - Interview" : (data.communityInterest || ""),
      respondentName: data.contactName || data.respondentName || data.name || "",
      respondentEmail: data.contactEmail || data.respondentEmail || data.email || "",
      respondentPhone: data.contactPhone || data.respondentPhone || data.whatsapp || "",
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

// GET /api/research/stats - Aggregated stats for research dashboard
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const all = await fetchAllSubmissions();
    const total = all.length;

    const countryCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    const coordinationFailures: Record<string, number> = {};
    const discoveryChannels: Record<string, number> = {};
    const trustDrivers: Record<string, number> = {};
    const biggestNeeds: Record<string, number> = {};
    const resourcesOwned: Record<string, number> = {};
    const aiTrustedList: Record<string, number> = {};

    let creatorCount = 0;
    let adopterCount = 0;
    let marketplaceCount = 0;
    let interviewWillingCount = 0;
    let futureDemandUtilitySum = 0;
    let futureDemandVotes = 0;
    let adopterUtilitySum = 0;
    let adopterUtilityVotes = 0;

    all.forEach((s: any) => {
      const data = typeof s.fullData === "string" ? JSON.parse(s.fullData) : (s.fullData || {});

      // Country
      const c = s.country || data.country;
      if (c) countryCounts[c] = (countryCounts[c] || 0) + 1;

      // Roles
      const roles = Array.isArray(data.roles) ? data.roles : (s.role ? s.role.split(", ") : []);
      roles.forEach((r: string) => {
        if (r) roleCounts[r] = (roleCounts[r] || 0) + 1;
      });

      // Coordination Failures
      const outcomes = Array.isArray(data.stuckOutcome) ? data.stuckOutcome : (s.obstacles ? s.obstacles.split(", ") : []);
      outcomes.forEach((o: string) => {
        if (o) coordinationFailures[o] = (coordinationFailures[o] || 0) + 1;
      });

      // Discovery Channels
      if (Array.isArray(data.discoveryChannels)) {
        data.discoveryChannels.forEach((dc: string) => {
          if (dc) discoveryChannels[dc] = (discoveryChannels[dc] || 0) + 1;
        });
      }

      // Trust Drivers
      if (Array.isArray(data.trustFactors)) {
        data.trustFactors.forEach((tf: string) => {
          if (tf) trustDrivers[tf] = (trustDrivers[tf] || 0) + 1;
        });
      }

      // Biggest Need
      const need = data.biggestNeed || s.pricingRange;
      if (need) biggestNeeds[need] = (biggestNeeds[need] || 0) + 1;

      // Resources
      const resList = Array.isArray(data.resourcesHave) ? data.resourcesHave : (s.resources ? s.resources.split(", ") : []);
      resList.forEach((r: string) => {
        if (r) resourcesOwned[r] = (resourcesOwned[r] || 0) + 1;
      });

      // AI Tasks
      const aiTasks = Array.isArray(data.aiTrustedTasks) ? data.aiTrustedTasks : (s.aiTrustedTasks ? s.aiTrustedTasks.split(", ") : []);
      aiTasks.forEach((t: string) => {
        if (t) aiTrustedList[t] = (aiTrustedList[t] || 0) + 1;
      });

      // Creator / Adopter flags
      if (data.isCreatorExperienced === "Yes" || (data.activeBranches && data.activeBranches.isCreatorBranch)) {
        creatorCount++;
      }
      if (data.isAdopterExperienced === "Yes" || (data.activeBranches && data.activeBranches.isAdopterBranch)) {
        adopterCount++;
      }
      if (data.hasPreOrderExperience === "Yes" || (data.activeBranches && data.activeBranches.isMarketplaceBranch)) {
        marketplaceCount++;
      }

      if (data.willingForInterview === "Yes" || (s.communityInterest && s.communityInterest.includes("Yes"))) {
        interviewWillingCount++;
      }

      if (typeof data.futureDemandUtility === "number") {
        futureDemandUtilitySum += data.futureDemandUtility;
        futureDemandVotes++;
      }
      if (typeof data.adopterMonitoringUtility === "number") {
        adopterUtilitySum += data.adopterMonitoringUtility;
        adopterUtilityVotes++;
      }
    });

    return res.json({
      totalResponses: total,
      creatorCount,
      adopterCount,
      marketplaceCount,
      interviewWillingCount,
      avgFutureDemandUtility: futureDemandVotes > 0 ? (futureDemandUtilitySum / futureDemandVotes).toFixed(1) : "0",
      avgAdopterMonitoringUtility: adopterUtilityVotes > 0 ? (adopterUtilitySum / adopterUtilityVotes).toFixed(1) : "0",
      countryBreakdown: countryCounts,
      topRoles: roleCounts,
      coordinationFailures,
      discoveryChannels,
      trustDrivers,
      biggestNeeds,
      resourcesOwned,
      aiTrustedList,
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
      "City/Region",
      "Roles",
      "Objectives (Free-text)",
      "Objective Categories",
      "Stuck Description (Free-text)",
      "Coordination Friction Outcomes",
      "Most Frustrating Part (Free-text)",
      "Current Discovery Channels",
      "What is Missing in Discovery",
      "Trust Requirements",
      "Deal Breakers",
      "Resources Owned",
      "Shareable Resource Description",
      "Biggest Need",
      "Need Details",
      "Creator Solution (Free-text)",
      "Creator Monetization Prefs",
      "Creator Concerns",
      "Creator Comfort Conditions",
      "Adopter Barriers",
      "Adopter Remote Monitoring Score (1-5)",
      "Future Demand Utility (1-5)",
      "Future Demand Trust Conditions",
      "Cross-Border Trust Factors",
      "Cross-Border Biggest Obstacle",
      "AI Obstacle to Remove (Free-text)",
      "AI Trusted Tasks",
      "AI Untrusted Decisions",
      "The ONE Problem Expectation (Free-text)",
      "Marketplace Signal: I NEED",
      "Marketplace Signal: I CAN PROVIDE",
      "Marketplace Signal: I HAVE SOLUTION",
      "Marketplace Signal: I WANT TO SOURCE",
      "Unasked Insights",
      "Interview Willing",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = all.map((s: any) => {
      const d = typeof s.fullData === "string" ? JSON.parse(s.fullData) : (s.fullData || {});
      const sig = d.marketplaceSignals || {};

      return [
        escapeCsv(s.submissionId),
        escapeCsv(s.createdAt ? new Date(s.createdAt).toISOString() : ""),
        escapeCsv(d.contactName || s.respondentName),
        escapeCsv(d.contactEmail || s.respondentEmail),
        escapeCsv(d.contactPhone || s.respondentPhone),
        escapeCsv(d.country || s.country),
        escapeCsv(d.cityRegion || s.stage),
        escapeCsv(Array.isArray(d.roles) ? d.roles.join(", ") : s.role),
        escapeCsv(d.objectiveDescription || s.goals),
        escapeCsv(Array.isArray(d.objectiveCategories) ? d.objectiveCategories.join(", ") : ""),
        escapeCsv(d.stuckDescription),
        escapeCsv(Array.isArray(d.stuckOutcome) ? d.stuckOutcome.join(", ") : s.obstacles),
        escapeCsv(d.stuckFrustration || s.biggestObstacle),
        escapeCsv(Array.isArray(d.discoveryChannels) ? d.discoveryChannels.join(", ") : ""),
        escapeCsv(d.discoveryMissing),
        escapeCsv(Array.isArray(d.trustFactors) ? d.trustFactors.join(", ") : ""),
        escapeCsv(d.trustDealBreaker),
        escapeCsv(Array.isArray(d.resourcesHave) ? d.resourcesHave.join(", ") : s.resources),
        escapeCsv(d.shareableResourceDescription),
        escapeCsv(d.biggestNeed || s.pricingRange),
        escapeCsv(d.biggestNeedDetails),
        escapeCsv(d.creatorSolutionDescription),
        escapeCsv(Array.isArray(d.creatorMonetizationPrefs) ? d.creatorMonetizationPrefs.join(", ") : ""),
        escapeCsv(Array.isArray(d.creatorConcerns) ? d.creatorConcerns.join(", ") : ""),
        escapeCsv(d.creatorComfortConditions),
        escapeCsv(Array.isArray(d.adopterBarriers) ? d.adopterBarriers.join(", ") : ""),
        escapeCsv(d.adopterMonitoringUtility),
        escapeCsv(d.futureDemandUtility),
        escapeCsv(d.futureDemandTrustRequirements),
        escapeCsv(Array.isArray(d.crossBorderTrustRequirements) ? d.crossBorderTrustRequirements.join(", ") : ""),
        escapeCsv(d.crossBorderBiggestObstacle),
        escapeCsv(d.aiObstacleToRemove),
        escapeCsv(Array.isArray(d.aiTrustedTasks) ? d.aiTrustedTasks.join(", ") : s.aiTrustedTasks),
        escapeCsv(d.aiUntrustedDecisions),
        escapeCsv(d.theOneExpectation || s.knowledgeGap),
        escapeCsv(sig.iNeed?.active ? `${sig.iNeed.description} (${sig.iNeed.location})` : ""),
        escapeCsv(sig.iCanProvide?.active ? `${sig.iCanProvide.description} (${sig.iCanProvide.capacity})` : ""),
        escapeCsv(sig.iHaveSolution?.active ? `${sig.iHaveSolution.description}` : ""),
        escapeCsv(sig.iWantToSource?.active ? `${sig.iWantToSource.description} -> ${sig.iWantToSource.destination}` : ""),
        escapeCsv(d.unaskedInsights),
        escapeCsv(d.willingForInterview || s.pricingInterest),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_founding_research_dataset.csv"');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Error exporting research CSV:", error);
    return res.status(500).json({ error: "Failed to generate CSV export" });
  }
});

// GET /api/research/export.json - Download complete JSON payload dump
router.get("/export.json", async (_req: Request, res: Response) => {
  try {
    const all = await fetchAllSubmissions();
    const parsed = all.map((s: any) => ({
      ...s,
      fullData: typeof s.fullData === "string" ? JSON.parse(s.fullData) : s.fullData,
    }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", 'attachment; filename="bizny_founding_research_dataset.json"');
    return res.status(200).send(JSON.stringify(parsed, null, 2));
  } catch (error: any) {
    console.error("Error exporting research JSON:", error);
    return res.status(500).json({ error: "Failed to generate JSON export" });
  }
});

export default router;
