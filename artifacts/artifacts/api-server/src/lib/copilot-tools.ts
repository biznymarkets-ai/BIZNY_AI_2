import { FunctionDeclaration, Type } from "@google/genai";
import {
  db,
  usersTable,
  venturesTable,
  listingsTable,
  ventureTemplatesTable,
  opportunitiesTable,
  coachPlansTable,
  coachTasksTable,
  taskEvidenceTable,
  fieldAgentRequestsTable,
  dealsTable,
  dealPartiesTable,
  dealWitnessesTable,
} from "@workspace/db";
import { eq, ilike, or, and, desc, sql } from "drizzle-orm";
import { buildBiznyContext } from "./copilot-context.ts";

// ── 1. FUNCTION DECLARATIONS FOR GEMINI ──────────────────────────────────────

export const getUserContextTool: FunctionDeclaration = {
  name: "get_user_context",
  description: "Retrieve the authenticated user's profile, location, role, skills, and industry context.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      includePrivateDetails: {
        type: Type.BOOLEAN,
        description: "Whether to include full profile, skills, and strategic goals.",
      },
    },
  },
};

export const getVentureContextTool: FunctionDeclaration = {
  name: "get_venture_context",
  description: "Retrieve the user's active venture details, stage, needed resources, bottlenecks, and milestones.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ventureId: {
        type: Type.INTEGER,
        description: "Optional specific venture ID to inspect.",
      },
    },
  },
};

export const searchMarketplaceTool: FunctionDeclaration = {
  name: "search_marketplace",
  description: "Search live Bizny marketplace records for real suppliers, buyers, service providers, equipment, and products.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Search keyword for product, service, or business name (e.g. 'coconut seedlings', 'cold storage', 'logistics', 'flash dryer').",
      },
      industry: {
        type: Type.STRING,
        description: "Industry filter (e.g. 'Agriculture', 'Manufacturing', 'Energy', 'Logistics').",
      },
      location: {
        type: Type.STRING,
        description: "Location or region filter (e.g. 'Akwa Ibom', 'Lagos', 'Kano', 'Onitsha', 'Aba').",
      },
      verifiedOnly: {
        type: Type.BOOLEAN,
        description: "Set to true to only return listings verified by Bizny field agents.",
      },
    },
  },
};

export const searchTemplatesTool: FunctionDeclaration = {
  name: "search_templates",
  description: "Search Bizny Repository for venture blueprints, standard operating procedures (SOPs), business models, and execution playbooks.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Keywords to search templates (e.g. 'nursery', 'solar installation', 'catfish fingerling', 'soap making', 'cassava starch').",
      },
      industry: {
        type: Type.STRING,
        description: "Industry sector (e.g. 'Agriculture', 'Clean Energy', 'Chemical Processing', 'Manufacturing').",
      },
      templateType: {
        type: Type.STRING,
        description: "Type of blueprint: 'business_model', 'engineering_design', 'manufacturing_process', 'agricultural_system', 'sop', 'playbook'.",
      },
    },
  },
};

export const searchOpportunitiesTool: FunctionDeclaration = {
  name: "search_opportunities",
  description: "Search live Bizny opportunities for grants, funding programs, off-taker partnership calls, and collaborative projects.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Keywords to search opportunities (e.g. 'grant', 'export off-taker', 'angel investment').",
      },
      industry: {
        type: Type.STRING,
        description: "Industry sector.",
      },
      type: {
        type: Type.STRING,
        description: "Opportunity category (e.g. 'funding', 'partnership', 'procurement', 'training').",
      },
    },
  },
};

export const getVerificationStatusTool: FunctionDeclaration = {
  name: "get_verification_status",
  description: "Check the verification and trust status of a specific Bizny entity (listing, user, or supplier).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      entityType: {
        type: Type.STRING,
        description: "Type of entity: 'listing', 'user', or 'task'.",
      },
      entityId: {
        type: Type.INTEGER,
        description: "The numeric ID of the entity to verify.",
      },
    },
    required: ["entityType", "entityId"],
  },
};

export const createCoachTaskTool: FunctionDeclaration = {
  name: "create_coach_task",
  description: "Create a concrete execution task in the authenticated user's Coach plan.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Clear, actionable task title (e.g., 'Identify 5 bulk palm oil buyers in Aba').",
      },
      description: {
        type: Type.STRING,
        description: "Detailed instructions and steps to complete the task.",
      },
      reason: {
        type: Type.STRING,
        description: "Strategic reason why this task unblocks the user's primary bottleneck.",
      },
      priority: {
        type: Type.STRING,
        description: "Priority level: 'high', 'medium', or 'low'.",
      },
      estimatedMinutes: {
        type: Type.INTEGER,
        description: "Estimated completion time in minutes (default 60).",
      },
    },
    required: ["title", "description", "reason"],
  },
};

// ── ECONOMIC COORDINATION LIFECYCLE TOOLS ───────────────────────────────────

export const createDealTool: FunctionDeclaration = {
  name: "create_deal",
  description: "Initiate or create a commercial transaction, equipment fabrication order, supply contract, or off-take agreement on Bizny Deal Desk.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Clear title for the deal (e.g. '500kg/hr Flash Dryer Fabrication & Commissioning').",
      },
      dealType: {
        type: Type.STRING,
        description: "Deal category: 'supply', 'equipment', 'service', 'partnership', 'offtake', 'distribution', 'licensing'.",
      },
      counterpartyUserId: {
        type: Type.INTEGER,
        description: "Optional user ID of the counterparty.",
      },
      counterpartyName: {
        type: Type.STRING,
        description: "Optional name or business name of the counterparty (e.g. 'Amara Eze', 'Eze Precision Metalworks', 'NutriRoot Foods').",
      },
      description: {
        type: Type.STRING,
        description: "Comprehensive scope of work, specifications, and deliverables.",
      },
      financialValue: {
        type: Type.STRING,
        description: "Monetary value or contract pricing (e.g. '₦4,800,000' or '$12,000').",
      },
      timeline: {
        type: Type.STRING,
        description: "Expected delivery timeline (e.g. '4 weeks', '30 days').",
      },
      terms: {
        type: Type.STRING,
        description: "Payment terms, warranties, delivery conditions, or inspection criteria.",
      },
      milestones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
        },
        description: "Initial execution milestones for this deal.",
      },
    },
    required: ["title", "dealType", "description"],
  },
};

export const getDealTool: FunctionDeclaration = {
  name: "get_deal",
  description: "Retrieve complete details, status, parties, milestones, and submitted evidence for a specific Deal Desk agreement.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dealId: {
        type: Type.INTEGER,
        description: "The numeric ID of the deal to inspect.",
      },
    },
    required: ["dealId"],
  },
};

export const createDealMilestoneTool: FunctionDeclaration = {
  name: "create_deal_milestone",
  description: "Add a concrete milestone with deliverables to an active deal on Deal Desk, optionally syncing it to the Coach execution board.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dealId: {
        type: Type.INTEGER,
        description: "The numeric ID of the deal.",
      },
      title: {
        type: Type.STRING,
        description: "Actionable milestone title (e.g. 'Workshop Assembly & Blower Dynamic Balancing Test').",
      },
      description: {
        type: Type.STRING,
        description: "Details, specs, and required proof for this milestone.",
      },
      assignedToUserId: {
        type: Type.INTEGER,
        description: "Optional user ID of the party responsible for this milestone.",
      },
      dueDate: {
        type: Type.STRING,
        description: "Target completion date (ISO string or formatted date).",
      },
      syncToCoach: {
        type: Type.BOOLEAN,
        description: "Whether to automatically create a linked task in Bizny Coach (defaults to true).",
      },
    },
    required: ["dealId", "title"],
  },
};

export const attachDealEvidenceTool: FunctionDeclaration = {
  name: "attach_deal_evidence",
  description: "Submit and attach verification evidence (inspection certificate, photo, invoice receipt, lab report, delivery note) to a deal milestone.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dealId: {
        type: Type.INTEGER,
        description: "The numeric ID of the deal.",
      },
      milestoneTitle: {
        type: Type.STRING,
        description: "Title or keyword of the milestone (or pass milestoneIndex).",
      },
      milestoneIndex: {
        type: Type.INTEGER,
        description: "0-based index of the milestone.",
      },
      evidenceType: {
        type: Type.STRING,
        description: "Type of evidence: 'document', 'photo', 'receipt', 'test_certificate', 'text', 'link'.",
      },
      evidenceContent: {
        type: Type.STRING,
        description: "Detailed description of evidence, document reference, certificate number, or verification text.",
      },
      note: {
        type: Type.STRING,
        description: "Optional notes regarding the evidence submission.",
      },
    },
    required: ["dealId", "evidenceContent"],
  },
};

export const updateDealStatusTool: FunctionDeclaration = {
  name: "update_deal_status",
  description: "Update the lifecycle status of a deal on Deal Desk (e.g., 'negotiating', 'agreed', 'active', 'milestone_in_progress', 'completed', 'cancelled').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dealId: {
        type: Type.INTEGER,
        description: "The numeric ID of the deal.",
      },
      status: {
        type: Type.STRING,
        description: "New status: 'draft', 'negotiating', 'agreement_draft', 'open', 'agreed', 'active', 'milestone_in_progress', 'completed', 'cancelled'.",
      },
      outcomeNotes: {
        type: Type.STRING,
        description: "Summary of outcome, sign-off details, or reason for transition.",
      },
    },
    required: ["dealId", "status"],
  },
};

export const COPILOT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  getUserContextTool,
  getVentureContextTool,
  searchMarketplaceTool,
  searchTemplatesTool,
  searchOpportunitiesTool,
  getVerificationStatusTool,
  createCoachTaskTool,
  createDealTool,
  getDealTool,
  createDealMilestoneTool,
  attachDealEvidenceTool,
  updateDealStatusTool,
];

// ── 2. SERVER-SIDE EXECUTION HANDLERS ────────────────────────────────────────

export interface ToolExecutionResult {
  toolName: string;
  args: any;
  result: any;
  actionCard?: {
    type: string;
    id?: number;
    title: string;
    description?: string;
    url?: string;
    metadata?: Record<string, any>;
  };
}

export async function executeCopilotTool(
  toolName: string,
  args: any,
  authUserId: number | null
): Promise<ToolExecutionResult> {
  console.log(`[CopilotToolExecution] Executing tool: ${toolName}, AuthUserId: ${authUserId}, Args:`, args);

  switch (toolName) {
    case "get_user_context": {
      const ctx = await buildBiznyContext(authUserId);
      if (!ctx.user) {
        return {
          toolName,
          args,
          result: {
            status: "ANONYMOUS",
            message: "No authenticated user is currently logged in. Profile is guest.",
          },
        };
      }
      return {
        toolName,
        args,
        result: {
          status: "AUTHENTICATED",
          user: ctx.user,
          activeVenture: ctx.venture ? { id: ctx.venture.id, title: ctx.venture.title } : null,
          coachStreakDays: ctx.coach?.streakDays ?? 0,
        },
      };
    }

    case "get_venture_context": {
      const ctx = await buildBiznyContext(authUserId);
      if (!ctx.venture) {
        return {
          toolName,
          args,
          result: {
            status: "NO_VENTURE",
            message: "The authenticated user does not currently have an active registered venture.",
          },
        };
      }
      return {
        toolName,
        args,
        result: {
          status: "ACTIVE_VENTURE_FOUND",
          venture: ctx.venture,
        },
      };
    }

    case "search_marketplace": {
      const { query, industry, location, verifiedOnly } = args || {};
      const allListings = await db.select().from(listingsTable);

      let filtered = allListings;

      if (verifiedOnly === true) {
        filtered = filtered.filter((l) => l.isVerified === true);
      }

      if (industry && typeof industry === "string" && industry.trim() !== "") {
        const indLower = industry.toLowerCase().trim();
        filtered = filtered.filter(
          (l) => l.industry && l.industry.toLowerCase().includes(indLower)
        );
      }

      if (location && typeof location === "string" && location.trim() !== "") {
        const locLower = location.toLowerCase().trim();
        filtered = filtered.filter(
          (l) =>
            (l.location && l.location.toLowerCase().includes(locLower)) ||
            (l.country && l.country.toLowerCase().includes(locLower))
        );
      }

      if (query && typeof query === "string" && query.trim() !== "") {
        const qLower = query.toLowerCase().trim();
        filtered = filtered.filter(
          (l) =>
            (l.product && l.product.toLowerCase().includes(qLower)) ||
            (l.businessName && l.businessName.toLowerCase().includes(qLower)) ||
            (l.description && l.description.toLowerCase().includes(qLower)) ||
            (l.industry && l.industry.toLowerCase().includes(qLower)) ||
            (l.location && l.location.toLowerCase().includes(qLower))
        );
      }

      const results = filtered.slice(0, 8).map((l) => ({
        id: l.id,
        businessName: l.businessName,
        product: l.product,
        description: l.description,
        location: [l.location, l.country].filter(Boolean).join(", "),
        industry: l.industry,
        isVerified: l.isVerified,
        verificationBadge: l.isVerified ? "VERIFIED_BY_FIELD_AGENT" : "COMMUNITY_UNVERIFIED",
        contactInfo: {
          phone: l.phone || null,
          whatsapp: l.whatsapp || null,
          email: l.email || null,
        },
      }));

      return {
        toolName,
        args,
        result: {
          count: results.length,
          totalMatches: filtered.length,
          listings: results,
          queryUsed: query || null,
          message:
            results.length === 0
              ? `No marketplace listings matched query '${query || "all"}'. Bizny anti-fabrication policy applies: do not invent listings.`
              : `Found ${results.length} authentic Bizny marketplace records.`,
        },
        actionCard:
          results.length > 0
            ? {
                type: "marketplace_results",
                title: `Marketplace: ${results[0].businessName}`,
                description: `${results[0].product} (${results[0].location})`,
                url: "/marketplace",
              }
            : undefined,
      };
    }

    case "search_templates": {
      const { query, industry, templateType } = args || {};
      const allTemplates = await db.select().from(ventureTemplatesTable);

      let filtered = allTemplates;

      if (industry && typeof industry === "string" && industry.trim() !== "") {
        const indLower = industry.toLowerCase().trim();
        filtered = filtered.filter(
          (t) => t.industry && t.industry.toLowerCase().includes(indLower)
        );
      }

      if (templateType && typeof templateType === "string" && templateType.trim() !== "") {
        const typeLower = templateType.toLowerCase().trim();
        filtered = filtered.filter(
          (t) => t.templateType && t.templateType.toLowerCase().includes(typeLower)
        );
      }

      if (query && typeof query === "string" && query.trim() !== "") {
        const qLower = query.toLowerCase().trim();
        filtered = filtered.filter(
          (t) =>
            (t.title && t.title.toLowerCase().includes(qLower)) ||
            (t.description && t.description.toLowerCase().includes(qLower)) ||
            (t.specificProduct && t.specificProduct.toLowerCase().includes(qLower)) ||
            (t.problemSolved && t.problemSolved.toLowerCase().includes(qLower)) ||
            (Array.isArray(t.tags) && t.tags.some((tag: string) => tag.toLowerCase().includes(qLower)))
        );
      }

      const results = filtered.slice(0, 6).map((t) => ({
        id: t.id,
        title: t.title,
        industry: t.industry,
        subIndustry: t.subIndustry,
        specificProduct: t.specificProduct,
        description: t.description,
        problemSolved: t.problemSolved,
        durationDays: t.durationDays,
        difficulty: t.difficulty,
        requiredSkills: t.requiredSkills,
        requiredTools: t.requiredTools,
        requiredResources: t.requiredResources,
        estimatedStartupCost: t.estimatedStartupCost,
        milestones: t.milestones,
      }));

      return {
        toolName,
        args,
        result: {
          count: results.length,
          totalMatches: filtered.length,
          templates: results,
          queryUsed: query || null,
          message:
            results.length === 0
              ? `No blueprints/templates matched '${query || "all"}'. Bizny repository contains verified industrial SOPs only.`
              : `Found ${results.length} verified industrial blueprints.`,
        },
        actionCard:
          results.length > 0
            ? {
                type: "template_recommendation",
                id: results[0].id,
                title: results[0].title,
                description: results[0].problemSolved || results[0].description,
                url: `/templates/${results[0].id}`,
              }
            : undefined,
      };
    }

    case "search_opportunities": {
      const { query, industry, type } = args || {};
      const allOpps = await db.select().from(opportunitiesTable);

      let filtered = allOpps;

      if (industry && typeof industry === "string" && industry.trim() !== "") {
        const indLower = industry.toLowerCase().trim();
        filtered = filtered.filter(
          (o) => o.industry && o.industry.toLowerCase().includes(indLower)
        );
      }

      if (type && typeof type === "string" && type.trim() !== "") {
        const typeLower = type.toLowerCase().trim();
        filtered = filtered.filter(
          (o) => o.type && o.type.toLowerCase().includes(typeLower)
        );
      }

      if (query && typeof query === "string" && query.trim() !== "") {
        const qLower = query.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            (o.title && o.title.toLowerCase().includes(qLower)) ||
            (o.description && o.description.toLowerCase().includes(qLower)) ||
            (o.role && o.role.toLowerCase().includes(qLower))
        );
      }

      const results = filtered.slice(0, 6).map((o) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        industry: o.industry,
        country: o.country,
        description: o.description,
        role: o.role,
        investmentSize: o.investmentSize,
        deadline: o.deadline ? new Date(o.deadline).toISOString() : null,
      }));

      return {
        toolName,
        args,
        result: {
          count: results.length,
          opportunities: results,
          message:
            results.length === 0
              ? `No live opportunities matched '${query || "all"}'.`
              : `Found ${results.length} active opportunities.`,
        },
        actionCard:
          results.length > 0
            ? {
                type: "opportunity_results",
                id: results[0].id,
                title: results[0].title,
                description: `${results[0].type.toUpperCase()} | ${results[0].industry}`,
                url: "/opportunities",
              }
            : undefined,
      };
    }

    case "get_verification_status": {
      const { entityType, entityId } = args || {};

      if (!entityId) {
        return { toolName, args, result: { error: "Missing entityId" } };
      }

      if (entityType === "listing") {
        const [l] = await db.select().from(listingsTable).where(eq(listingsTable.id, entityId));
        if (!l) return { toolName, args, result: { status: "NOT_FOUND" } };
        return {
          toolName,
          args,
          result: {
            id: l.id,
            entityType: "listing",
            name: l.businessName,
            isVerified: l.isVerified,
            verificationBadge: l.isVerified ? "VERIFIED_BY_FIELD_AGENT" : "COMMUNITY_UNVERIFIED",
            message: l.isVerified
              ? "This business listing has been physically verified by a Bizny field agent."
              : "This listing is community-submitted and has not yet been physically verified by a field agent.",
          },
        };
      }

      if (entityType === "user") {
        const [u] = await db.select().from(usersTable).where(eq(usersTable.id, entityId));
        if (!u) return { toolName, args, result: { status: "NOT_FOUND" } };
        return {
          toolName,
          args,
          result: {
            id: u.id,
            entityType: "user",
            name: u.name,
            role: u.role,
            country: u.country,
            verificationBadge: u.role === "admin" ? "OFFICIAL_ADMIN" : "REGISTERED_USER",
          },
        };
      }

      return {
        toolName,
        args,
        result: {
          status: "UNKNOWN_ENTITY_TYPE",
          message: `Entity type '${entityType}' verification lookup is not supported. Supported: 'listing', 'user'.`,
        },
      };
    }

    case "create_coach_task": {
      if (!authUserId) {
        return {
          toolName,
          args,
          result: {
            success: false,
            error: "Authentication required to add tasks to Coach. Please log in to create Coach tasks.",
          },
        };
      }

      const { title, description, reason, priority = "medium", estimatedMinutes = 60 } = args || {};
      if (!title || !description || !reason) {
        return {
          toolName,
          args,
          result: { success: false, error: "Title, description, and strategic reason are required." },
        };
      }

      // Ensure user has a coach plan
      let planId: number;
      const [existingPlan] = await db
        .select()
        .from(coachPlansTable)
        .where(eq(coachPlansTable.userId, authUserId))
        .orderBy(desc(coachPlansTable.createdAt))
        .limit(1);

      if (existingPlan) {
        planId = existingPlan.id;
      } else {
        const [newPlan] = await db
          .insert(coachPlansTable)
          .values({
            userId: authUserId,
            goal: "Execution Plan generated by Bizny Co-Pilot",
            bottlenecks: [],
            resources: [],
            roles: [],
          })
          .returning();
        planId = newPlan ? newPlan.id : 1;
      }

      const validPriority = ["high", "medium", "low"].includes(priority) ? priority : "medium";

      const [task] = await db
        .insert(coachTasksTable)
        .values({
          planId,
          userId: authUserId,
          title,
          description,
          reason,
          priority: validPriority as any,
          estimatedMinutes,
          status: "not_started",
        })
        .returning();

      return {
        toolName,
        args,
        result: {
          success: true,
          taskId: task ? task.id : Math.floor(Date.now() / 1000),
          title,
          priority: validPriority,
          status: "not_started",
          message: `Task '${title}' has been successfully added to your Bizny Coach execution board.`,
        },
        actionCard: {
          type: "coach_task_created",
          id: task ? task.id : undefined,
          title,
          description: reason,
          url: "/coach",
        },
      };
    }

    // ── ECONOMIC COORDINATION LIFECYCLE HANDLERS ────────────────────────────

    case "create_deal": {
      if (!authUserId) {
        return {
          toolName,
          args,
          result: {
            success: false,
            error: "Authentication required to initiate deals on Deal Desk.",
          },
        };
      }

      const {
        title,
        dealType,
        counterpartyUserId,
        counterpartyName,
        description,
        financialValue,
        timeline,
        terms,
        milestones: initialMilestones,
      } = args || {};

      if (!title || !dealType || !description) {
        return {
          toolName,
          args,
          result: { success: false, error: "title, dealType, and description are required to create a deal." },
        };
      }

      // Resolve counterparty
      let resolvedCounterpartyId: number | null = counterpartyUserId ? Number(counterpartyUserId) : null;
      let counterpartyDisplayName = counterpartyName || "Counterparty";

      if (!resolvedCounterpartyId && counterpartyName) {
        const nameLower = counterpartyName.toLowerCase().trim();
        const allUsers = await db.select().from(usersTable);
        const matchUser = allUsers.find(
          (u) =>
            u.name.toLowerCase().includes(nameLower) ||
            (u.businessName && u.businessName.toLowerCase().includes(nameLower))
        );
        if (matchUser) {
          resolvedCounterpartyId = matchUser.id;
          counterpartyDisplayName = matchUser.businessName || matchUser.name;
        } else {
          // Check listings
          const allListings = await db.select().from(listingsTable);
          const matchListing = allListings.find(
            (l) =>
              l.businessName.toLowerCase().includes(nameLower) ||
              l.product.toLowerCase().includes(nameLower)
          );
          if (matchListing && matchListing.postedById) {
            resolvedCounterpartyId = matchListing.postedById;
            counterpartyDisplayName = matchListing.businessName;
          }
        }
      }

      // Format initial milestones
      const formattedMilestones: any[] = [];
      if (Array.isArray(initialMilestones)) {
        for (let i = 0; i < initialMilestones.length; i++) {
          const m = initialMilestones[i];
          const mTitle = typeof m === "string" ? m : m.title || `Milestone ${i + 1}`;
          const mDesc = typeof m === "object" ? m.description || "" : "";
          formattedMilestones.push({
            id: `m-${Date.now()}-${i}`,
            title: mTitle,
            description: mDesc,
            status: "pending",
            assignedToUserId: resolvedCounterpartyId || authUserId,
            evidence: [],
            createdAt: new Date().toISOString(),
          });
        }
      }

      const initialStatus = resolvedCounterpartyId ? "negotiating" : "draft";

      const [deal] = await db
        .insert(dealsTable)
        .values({
          initiatorId: authUserId,
          title,
          dealType,
          status: initialStatus,
          description,
          financialValue: financialValue || null,
          timeline: timeline || null,
          terms: terms || null,
          milestones: formattedMilestones as any,
        } as any)
        .returning();

      if (!deal) {
        return { toolName, args, result: { success: false, error: "Failed to persist deal in database." } };
      }

      // Add initiator party
      await db.insert(dealPartiesTable).values({
        dealId: deal.id,
        userId: authUserId,
        role: "initiator",
        agreed: true,
        agreedAt: new Date(),
      });

      // Add counterparty if resolved
      if (resolvedCounterpartyId && Number(resolvedCounterpartyId) !== Number(authUserId)) {
        await db.insert(dealPartiesTable).values({
          dealId: deal.id,
          userId: resolvedCounterpartyId,
          role: "counterparty",
          agreed: false,
        });
      }

      return {
        toolName,
        args,
        result: {
          success: true,
          dealId: deal.id,
          title: deal.title,
          status: deal.status,
          dealType: deal.dealType,
          financialValue: deal.financialValue,
          counterparty: resolvedCounterpartyId ? { id: resolvedCounterpartyId, name: counterpartyDisplayName } : null,
          milestonesCount: formattedMilestones.length,
          message: `Deal #${deal.id} ('${deal.title}') has been initiated on Bizny Deal Desk in '${deal.status}' status.`,
        },
        actionCard: {
          type: "deal_created",
          id: deal.id,
          title: deal.title,
          description: `Deal #${deal.id} (${deal.dealType}) • ${deal.financialValue || 'Draft Terms'} • Status: ${deal.status}`,
          url: `/deal-desk/${deal.id}`,
        },
      };
    }

    case "get_deal": {
      const { dealId } = args || {};
      if (!dealId) {
        return { toolName, args, result: { error: "dealId is required" } };
      }

      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, Number(dealId)));
      if (!deal) {
        return { toolName, args, result: { status: "NOT_FOUND", message: `Deal #${dealId} does not exist in Bizny Deal Desk.` } };
      }

      const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, Number(dealId)));
      const witnesses = await db.select().from(dealWitnessesTable).where(eq(dealWitnessesTable.dealId, Number(dealId)));

      const isInitiator = authUserId && Number(deal.initiatorId) === Number(authUserId);
      const isParty = authUserId && parties.some((p) => Number(p.userId) === Number(authUserId));
      const isPublic = deal.visibility === "public";

      if (authUserId && !isInitiator && !isParty && !isPublic) {
        return { toolName, args, result: { error: "Forbidden: You are not authorized to view private Deal #" + dealId } };
      }

      const milestones = Array.isArray(deal.milestones) ? deal.milestones : [];
      const completedMilestones = milestones.filter((m: any) => m.status === "completed").length;

      return {
        toolName,
        args,
        result: {
          id: deal.id,
          title: deal.title,
          dealType: deal.dealType,
          status: deal.status,
          financialValue: deal.financialValue,
          timeline: deal.timeline,
          description: deal.description,
          terms: deal.terms,
          partiesCount: parties.length,
          parties: parties.map((p) => ({ userId: p.userId, role: p.role, agreed: p.agreed })),
          milestonesCount: milestones.length,
          completedMilestonesCount: completedMilestones,
          milestones: milestones.map((m: any, idx: number) => ({
            index: idx,
            id: m.id,
            title: m.title,
            status: m.status,
            evidenceCount: Array.isArray(m.evidence) ? m.evidence.length : 0,
          })),
        },
        actionCard: {
          type: "deal_status",
          id: deal.id,
          title: deal.title,
          description: `Status: ${deal.status.toUpperCase()} • Milestones: ${completedMilestones}/${milestones.length} Completed`,
          url: `/deal-desk/${deal.id}`,
        },
      };
    }

    case "create_deal_milestone": {
      if (!authUserId) {
        return { toolName, args, result: { success: false, error: "Authentication required to add deal milestones." } };
      }

      const { dealId, title, description, assignedToUserId, dueDate, syncToCoach = true } = args || {};
      if (!dealId || !title) {
        return { toolName, args, result: { success: false, error: "dealId and title are required." } };
      }

      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, Number(dealId)));
      if (!deal) {
        return { toolName, args, result: { success: false, error: `Deal #${dealId} not found.` } };
      }

      const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, Number(dealId)));
      const isInitiator = Number(deal.initiatorId) === Number(authUserId);
      const isParty = parties.some((p) => Number(p.userId) === Number(authUserId));
      if (!isInitiator && !isParty) {
        return { toolName, args, result: { success: false, error: "Forbidden: You are not a party on Deal #" + dealId } };
      }

      const assignee = assignedToUserId ? Number(assignedToUserId) : authUserId;
      let coachTaskId: number | undefined = undefined;

      if (syncToCoach) {
        // Sync to coach task
        let planId: number;
        const [existingPlan] = await db
          .select()
          .from(coachPlansTable)
          .where(eq(coachPlansTable.userId, assignee))
          .orderBy(desc(coachPlansTable.createdAt))
          .limit(1);

        if (existingPlan) {
          planId = existingPlan.id;
        } else {
          const [newPlan] = await db
            .insert(coachPlansTable)
            .values({
              userId: assignee,
              goal: `Execution Plan for Deal: ${deal.title}`,
              bottlenecks: [],
              resources: [],
              roles: [],
            })
            .returning();
          planId = newPlan ? newPlan.id : 1;
        }

        const [task] = await db
          .insert(coachTasksTable)
          .values({
            planId,
            userId: assignee,
            title: `[Deal #${deal.id}] ${title}`,
            description: description || `Deliverable for deal: ${deal.title}`,
            reason: `Required milestone for Deal #${deal.id} (${deal.title})`,
            priority: "high",
            status: "not_started",
            evidenceRequired: true,
            dueDate: dueDate ? new Date(dueDate) : null,
          })
          .returning();

        if (task) coachTaskId = task.id;
      }

      const currentMilestones = Array.isArray(deal.milestones) ? [...deal.milestones] : [];
      const milestoneId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const newMilestone = {
        id: milestoneId,
        title,
        description: description || "",
        status: "pending",
        assignedToUserId: assignee,
        dueDate: dueDate || null,
        coachTaskId,
        evidence: [],
        createdAt: new Date().toISOString(),
      };

      currentMilestones.push(newMilestone as any);

      await db
        .update(dealsTable)
        .set({
          milestones: currentMilestones as any,
          status: deal.status === "draft" || deal.status === "agreed" ? "milestone_in_progress" : deal.status,
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, Number(dealId)));

      return {
        toolName,
        args,
        result: {
          success: true,
          dealId: Number(dealId),
          milestoneId,
          title,
          assignedToUserId: assignee,
          coachTaskId,
          message: `Milestone '${title}' added to Deal #${dealId}${coachTaskId ? ` and synced to Coach Task #${coachTaskId}` : ""}.`,
        },
        actionCard: {
          type: "deal_milestone_created",
          id: Number(dealId),
          title: `Milestone: ${title}`,
          description: `Added to Deal #${dealId} • Assigned to User #${assignee}`,
          url: `/deal-desk/${dealId}`,
        },
      };
    }

    case "attach_deal_evidence": {
      if (!authUserId) {
        return { toolName, args, result: { success: false, error: "Authentication required to submit deal evidence." } };
      }

      const { dealId, milestoneTitle, milestoneIndex, evidenceType = "document", evidenceContent, note } = args || {};
      if (!dealId || !evidenceContent) {
        return { toolName, args, result: { success: false, error: "dealId and evidenceContent are required." } };
      }

      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, Number(dealId)));
      if (!deal) {
        return { toolName, args, result: { success: false, error: `Deal #${dealId} not found.` } };
      }

      const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, Number(dealId)));
      const isInitiator = Number(deal.initiatorId) === Number(authUserId);
      const isParty = parties.some((p) => Number(p.userId) === Number(authUserId));
      if (!isInitiator && !isParty) {
        return { toolName, args, result: { success: false, error: "Forbidden: You are not a party on Deal #" + dealId } };
      }

      const currentMilestones = Array.isArray(deal.milestones) ? [...deal.milestones] : [];
      if (currentMilestones.length === 0) {
        return { toolName, args, result: { success: false, error: "No milestones exist on Deal #" + dealId } };
      }

      let targetIdx = -1;
      if (milestoneTitle) {
        const titleLower = String(milestoneTitle).toLowerCase();
        targetIdx = currentMilestones.findIndex(
          (m: any) => m.title && m.title.toLowerCase().includes(titleLower)
        );
      }
      if (targetIdx === -1 && milestoneIndex !== undefined && typeof milestoneIndex === "number") {
        targetIdx = milestoneIndex;
      }
      if (targetIdx === -1 || targetIdx >= currentMilestones.length) {
        targetIdx = 0; // Default to first available milestone
      }

      const targetMilestone: any = { ...currentMilestones[targetIdx] };
      const evidenceList = Array.isArray(targetMilestone.evidence) ? [...targetMilestone.evidence] : [];

      const evidenceItem = {
        id: `ev-${Date.now()}`,
        type: evidenceType,
        content: evidenceContent,
        note: note || "",
        submittedByUserId: authUserId,
        submittedAt: new Date().toISOString(),
      };

      evidenceList.push(evidenceItem);
      targetMilestone.evidence = evidenceList;
      targetMilestone.status = "completed";
      targetMilestone.completedAt = new Date().toISOString();

      currentMilestones[targetIdx] = targetMilestone;

      // Sync to linked coach task
      if (targetMilestone.coachTaskId) {
        try {
          await db.insert(taskEvidenceTable).values({
            taskId: targetMilestone.coachTaskId,
            userId: authUserId,
            evidenceType: (["photo", "video", "document", "receipt", "text", "link"].includes(evidenceType) ? evidenceType : "document") as any,
            textContent: evidenceContent,
            note: note || `Attached to Deal #${deal.id} Milestone: ${targetMilestone.title}`,
          });

          await db.update(coachTasksTable).set({
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(coachTasksTable.id, targetMilestone.coachTaskId));
        } catch (err) {
          console.warn("[CopilotTools] Coach task sync warning:", err);
        }
      }

      const allCompleted = currentMilestones.every((m: any) => m.status === "completed");

      await db
        .update(dealsTable)
        .set({
          milestones: currentMilestones as any,
          status: allCompleted ? "completed" : "milestone_in_progress",
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, Number(dealId)));

      return {
        toolName,
        args,
        result: {
          success: true,
          dealId: Number(dealId),
          milestoneTitle: targetMilestone.title,
          evidenceId: evidenceItem.id,
          evidenceType,
          status: "completed",
          dealStatus: allCompleted ? "completed" : "milestone_in_progress",
          message: `Evidence successfully submitted for milestone '${targetMilestone.title}'. Milestone marked COMPLETED.${allCompleted ? " All deal milestones completed!" : ""}`,
        },
        actionCard: {
          type: "deal_evidence_submitted",
          id: Number(dealId),
          title: `Evidence Submitted: ${targetMilestone.title}`,
          description: `Deal #${dealId} • ${evidenceType.toUpperCase()} verified • Status: COMPLETED`,
          url: `/deal-desk/${dealId}`,
        },
      };
    }

    case "update_deal_status": {
      if (!authUserId) {
        return { toolName, args, result: { success: false, error: "Authentication required to update deal status." } };
      }

      const { dealId, status, outcomeNotes } = args || {};
      if (!dealId || !status) {
        return { toolName, args, result: { success: false, error: "dealId and status are required." } };
      }

      const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, Number(dealId)));
      if (!deal) {
        return { toolName, args, result: { success: false, error: `Deal #${dealId} not found.` } };
      }

      const parties = await db.select().from(dealPartiesTable).where(eq(dealPartiesTable.dealId, Number(dealId)));
      const isInitiator = Number(deal.initiatorId) === Number(authUserId);
      const isParty = parties.some((p) => Number(p.userId) === Number(authUserId));
      if (!isInitiator && !isParty) {
        return { toolName, args, result: { success: false, error: "Forbidden: You are not authorized to update Deal #" + dealId } };
      }

      await db
        .update(dealsTable)
        .set({
          status,
          updatedAt: new Date(),
          ...(outcomeNotes ? { copilotSummary: outcomeNotes } : {}),
        })
        .where(eq(dealsTable.id, Number(dealId)));

      return {
        toolName,
        args,
        result: {
          success: true,
          dealId: Number(dealId),
          title: deal.title,
          oldStatus: deal.status,
          newStatus: status,
          message: `Deal #${dealId} status successfully transitioned to '${status}'.`,
        },
        actionCard: {
          type: "deal_completed",
          id: Number(dealId),
          title: `Deal #${dealId}: ${deal.title}`,
          description: `Status updated to ${status.toUpperCase()}${outcomeNotes ? ` • ${outcomeNotes}` : ""}`,
          url: `/deal-desk/${dealId}`,
        },
      };
    }

    default:
      return {
        toolName,
        args,
        result: { error: `Tool ${toolName} is not recognized.` },
      };
  }
}
