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
        description: "Search keyword for product, service, or business name (e.g. 'coconut seedlings', 'cold storage', 'logistics').",
      },
      industry: {
        type: Type.STRING,
        description: "Industry filter (e.g. 'Agriculture', 'Manufacturing', 'Energy', 'Logistics').",
      },
      location: {
        type: Type.STRING,
        description: "Location or region filter (e.g. 'Akwa Ibom', 'Lagos', 'Kano', 'Onitsha').",
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
        description: "Keywords to search templates (e.g. 'nursery', 'solar installation', 'catfish fingerling', 'soap making').",
      },
      industry: {
        type: Type.STRING,
        description: "Industry sector (e.g. 'Agriculture', 'Clean Energy', 'Chemical Processing').",
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

export const COPILOT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  getUserContextTool,
  getVentureContextTool,
  searchMarketplaceTool,
  searchTemplatesTool,
  searchOpportunitiesTool,
  getVerificationStatusTool,
  createCoachTaskTool,
];

// ── 2. SERVER-SIDE EXECUTION HANDLERS ────────────────────────────────────────

export interface ToolExecutionResult {
  toolName: string;
  args: any;
  result: any;
  actionCard?: {
    type: string;
    id?: number;
    title?: string;
    description?: string;
    url?: string;
  };
}

export async function executeCopilotTool(
  toolName: string,
  args: any,
  authUserId: number | null
): Promise<ToolExecutionResult> {
  console.log(`[CopilotTool] Executing ${toolName} for userId=${authUserId}:`, args);

  switch (toolName) {
    case "get_user_context": {
      const ctx = await buildBiznyContext(authUserId);
      return {
        toolName,
        args,
        result: ctx.user || { message: "No authenticated user profile found. User is browsing as guest." },
      };
    }

    case "get_venture_context": {
      if (!authUserId) {
        return { toolName, args, result: { message: "User is not logged in. No venture associated." } };
      }
      const ventureId = args?.ventureId;
      let venture: any = null;

      if (ventureId) {
        const [v] = await db
          .select()
          .from(venturesTable)
          .where(and(eq(venturesTable.id, ventureId), eq(venturesTable.userId, authUserId)));
        venture = v;
      } else {
        const [v] = await db
          .select()
          .from(venturesTable)
          .where(eq(venturesTable.userId, authUserId))
          .orderBy(desc(venturesTable.createdAt))
          .limit(1);
        venture = v;
      }

      if (!venture) {
        return { toolName, args, result: { message: "No active venture registered in Bizny for this user." } };
      }

      return {
        toolName,
        args,
        result: {
          id: venture.id,
          title: venture.title,
          status: venture.status,
          currentDay: venture.currentDay,
          progressPercent: venture.progressPercent,
          mainIndustry: venture.mainIndustry,
          subIndustry: venture.subIndustry,
          problem: venture.problem,
          description: venture.description,
          resourcesNeeded: venture.resourcesNeeded || [],
          collaboratorsNeeded: venture.collaboratorsNeeded || [],
          equipmentNeeded: venture.equipmentNeeded || [],
          fundingRequired: venture.fundingRequired,
        },
      };
    }

    case "search_marketplace": {
      const { query, industry, location, verifiedOnly } = args || {};
      const conditions: any[] = [];

      if (query && query.trim()) {
        const q = `%${query.trim()}%`;
        conditions.push(
          or(
            ilike(listingsTable.product, q),
            ilike(listingsTable.businessName, q),
            ilike(listingsTable.description, q)
          )
        );
      }
      if (industry && industry.trim()) {
        conditions.push(ilike(listingsTable.industry, `%${industry.trim()}%`));
      }
      if (location && location.trim()) {
        conditions.push(
          or(
            ilike(listingsTable.location, `%${location.trim()}%`),
            ilike(listingsTable.country, `%${location.trim()}%`)
          )
        );
      }
      if (verifiedOnly) {
        conditions.push(eq(listingsTable.isVerified, true));
      }

      let listings: any[] = [];
      try {
        const queryBuilder = db
          .select({
            id: listingsTable.id,
            businessName: listingsTable.businessName,
            product: listingsTable.product,
            description: listingsTable.description,
            location: listingsTable.location,
            country: listingsTable.country,
            industry: listingsTable.industry,
            isVerified: listingsTable.isVerified,
            phone: listingsTable.phone,
            whatsapp: listingsTable.whatsapp,
          })
          .from(listingsTable);

        if (conditions.length > 0) {
          listings = await queryBuilder.where(and(...conditions)).limit(8);
        } else {
          listings = await queryBuilder.orderBy(desc(listingsTable.createdAt)).limit(8);
        }
      } catch (err) {
        console.warn("[CopilotTool] search_marketplace db error:", err);
      }

      if (listings.length === 0) {
        return {
          toolName,
          args,
          result: {
            count: 0,
            matches: [],
            message: "No live marketplace listings found matching the specified criteria in Bizny's database.",
          },
        };
      }

      return {
        toolName,
        args,
        result: {
          count: listings.length,
          matches: listings.map((l) => ({
            id: l.id,
            businessName: l.businessName,
            product: l.product,
            description: l.description,
            location: `${l.location}, ${l.country}`,
            industry: l.industry,
            verificationStatus: l.isVerified ? "VERIFIED_BY_FIELD_AGENT" : "COMMUNITY_UNVERIFIED",
            contactAvailable: Boolean(l.phone || l.whatsapp),
          })),
        },
        actionCard: {
          type: "marketplace_results",
          title: `Found ${listings.length} Marketplace Listing(s)`,
          url: `/marketplace?q=${encodeURIComponent(query || "")}`,
        },
      };
    }

    case "search_templates": {
      const { query, industry, templateType } = args || {};
      const conditions: any[] = [];

      if (query && query.trim()) {
        const q = `%${query.trim()}%`;
        conditions.push(
          or(
            ilike(ventureTemplatesTable.title, q),
            ilike(ventureTemplatesTable.description, q),
            ilike(ventureTemplatesTable.specificProduct, q)
          )
        );
      }
      if (industry && industry.trim()) {
        conditions.push(ilike(ventureTemplatesTable.industry, `%${industry.trim()}%`));
      }
      if (templateType && templateType.trim()) {
        conditions.push(eq(ventureTemplatesTable.templateType, templateType.trim()));
      }

      let templates: any[] = [];
      try {
        const qb = db
          .select({
            id: ventureTemplatesTable.id,
            title: ventureTemplatesTable.title,
            industry: ventureTemplatesTable.industry,
            description: ventureTemplatesTable.description,
            durationDays: ventureTemplatesTable.durationDays,
            templateType: ventureTemplatesTable.templateType,
            difficulty: ventureTemplatesTable.difficulty,
            requiredSkills: ventureTemplatesTable.requiredSkills,
            requiredTools: ventureTemplatesTable.requiredTools,
            useCount: ventureTemplatesTable.useCount,
          })
          .from(ventureTemplatesTable);

        if (conditions.length > 0) {
          templates = await qb.where(and(...conditions)).limit(6);
        } else {
          templates = await qb.orderBy(desc(ventureTemplatesTable.useCount)).limit(6);
        }
      } catch (err) {
        console.warn("[CopilotTool] search_templates db error:", err);
      }

      if (templates.length === 0) {
        return {
          toolName,
          args,
          result: {
            count: 0,
            matches: [],
            message: "No Repository templates found matching the specified keywords in Bizny's library.",
          },
        };
      }

      return {
        toolName,
        args,
        result: {
          count: templates.length,
          matches: templates.map((t) => ({
            id: t.id,
            title: t.title,
            industry: t.industry,
            description: t.description,
            durationDays: t.durationDays,
            type: t.templateType,
            difficulty: t.difficulty,
            skillsRequired: t.requiredSkills || [],
            toolsRequired: t.requiredTools || [],
          })),
        },
        actionCard: {
          type: "template_recommendation",
          id: templates[0].id,
          title: templates[0].title,
          description: templates[0].description,
          url: `/templates/${templates[0].id}`,
        },
      };
    }

    case "search_opportunities": {
      const { query, industry, type } = args || {};
      const conditions: any[] = [];

      if (query && query.trim()) {
        const q = `%${query.trim()}%`;
        conditions.push(
          or(
            ilike(opportunitiesTable.title, q),
            ilike(opportunitiesTable.description, q)
          )
        );
      }
      if (industry && industry.trim()) {
        conditions.push(ilike(opportunitiesTable.industry, `%${industry.trim()}%`));
      }
      if (type && type.trim()) {
        conditions.push(ilike(opportunitiesTable.type, `%${type.trim()}%`));
      }

      let opps: any[] = [];
      try {
        const qb = db.select().from(opportunitiesTable);
        if (conditions.length > 0) {
          opps = await qb.where(and(...conditions)).limit(6);
        } else {
          opps = await qb.orderBy(desc(opportunitiesTable.createdAt)).limit(6);
        }
      } catch (err) {
        console.warn("[CopilotTool] search_opportunities error:", err);
      }

      if (opps.length === 0) {
        return {
          toolName,
          args,
          result: {
            count: 0,
            matches: [],
            message: "No live opportunities found matching the specified filters in Bizny.",
          },
        };
      }

      return {
        toolName,
        args,
        result: {
          count: opps.length,
          matches: opps.map((o) => ({
            id: o.id,
            title: o.title,
            type: o.type,
            industry: o.industry,
            location: o.country,
            description: o.description,
            role: o.role,
            deadline: o.deadline,
          })),
        },
        actionCard: {
          type: "opportunity_results",
          title: `Found ${opps.length} Opportunities`,
          url: `/opportunities?q=${encodeURIComponent(query || "")}`,
        },
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

    default:
      return {
        toolName,
        args,
        result: { error: `Tool ${toolName} is not recognized.` },
      };
  }
}
