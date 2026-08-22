import {
  db,
  usersTable,
  venturesTable,
  coachPlansTable,
  coachTasksTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

export interface BiznyCopilotContext {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    country: string;
    stateCity: string | null;
    industry: string;
    businessName: string | null;
    skills: string[];
    interests: string[];
  } | null;

  venture: {
    id: number;
    title: string;
    status: string;
    currentDay: number;
    progressPercent: number;
    mainIndustry: string | null;
    subIndustry: string | null;
    valueChainStage: string | null;
    location: string | null;
    problem: string | null;
    description: string | null;
    resourcesNeeded: string[];
    collaboratorsNeeded: string[];
    equipmentNeeded: string[];
    fundingRequired: string | null;
    expectedOutput: string | null;
  } | null;

  coach: {
    activePlanId: number | null;
    goal: string | null;
    bottlenecks: string[];
    resources: string[];
    roles: string[];
    productivityScore: number;
    streakDays: number;
    activeTasks: Array<{
      id: number;
      title: string;
      description: string;
      reason: string;
      priority: string;
      status: string;
      dueDate: string | null;
    }>;
    completedTasksCount: number;
    blockedTasksCount: number;
  } | null;
}

/**
 * Builds clean, server-side verified Bizny context for an authenticated user.
 */
export async function buildBiznyContext(userId: number | null): Promise<BiznyCopilotContext> {
  if (!userId) {
    return { user: null, venture: null, coach: null };
  }

  // 1. User profile lookup
  let userRecord: any = null;
  try {
    const allUsers = await db.select().from(usersTable);
    userRecord = allUsers.find((u) => Number(u.id) === Number(userId)) || null;
  } catch (err) {
    console.warn("[CopilotContext] User lookup warning:", err);
  }

  const userContext = userRecord
    ? {
        id: userRecord.id,
        name: userRecord.name || "Bizny User",
        email: userRecord.email || "",
        role: userRecord.role || "creator",
        country: userRecord.country || "Nigeria",
        stateCity: userRecord.stateCity || null,
        industry: userRecord.industry || "General Industry",
        businessName: userRecord.businessName || null,
        skills: Array.isArray(userRecord.skills) ? userRecord.skills : [],
        interests: Array.isArray(userRecord.interests) ? userRecord.interests : [],
      }
    : null;

  // 2. Venture lookup (most recent active venture)
  let ventureContext: any = null;
  try {
    const allVentures = await db.select().from(venturesTable);
    const userVentures = allVentures
      .filter((v) => Number(v.userId) === Number(userId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (userVentures.length > 0) {
      const v = userVentures[0];
      ventureContext = {
        id: v.id,
        title: v.title,
        status: v.status,
        currentDay: v.currentDay,
        progressPercent: v.progressPercent,
        mainIndustry: v.mainIndustry || null,
        subIndustry: v.subIndustry || null,
        valueChainStage: v.valueChainStage || null,
        location: [v.stateCity, v.country].filter(Boolean).join(", ") || null,
        problem: v.problem || null,
        description: v.description || null,
        resourcesNeeded: Array.isArray(v.resourcesNeeded) ? v.resourcesNeeded : [],
        collaboratorsNeeded: Array.isArray(v.collaboratorsNeeded) ? v.collaboratorsNeeded : [],
        equipmentNeeded: Array.isArray(v.equipmentNeeded) ? v.equipmentNeeded : [],
        fundingRequired: v.fundingRequired || null,
        expectedOutput: v.expectedOutput || null,
      };
    }
  } catch (err) {
    console.warn("[CopilotContext] Venture lookup warning:", err);
  }

  // 3. Coach plan & task state
  let coachContext: any = null;
  try {
    const allPlans = await db.select().from(coachPlansTable);
    const plans = allPlans
      .filter((p) => Number(p.userId) === Number(userId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (plans.length > 0) {
      const plan = plans[0];
      const allTasks = await db.select().from(coachTasksTable);
      const tasks = allTasks
        .filter((t) => Number(t.userId) === Number(userId) || Number(t.planId) === Number(plan.id))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const activeTasks = tasks
        .filter((t) => t.status === "not_started" || t.status === "in_progress")
        .slice(0, 10)
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          reason: t.reason,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
        }));

      const completedCount = tasks.filter((t) => t.status === "completed").length;
      const blockedCount = tasks.filter((t) => t.status === "blocked").length;

      coachContext = {
        activePlanId: plan.id,
        goal: plan.goal,
        bottlenecks: Array.isArray(plan.bottlenecks) ? plan.bottlenecks : [],
        resources: Array.isArray(plan.resources) ? plan.resources : [],
        roles: Array.isArray(plan.roles) ? plan.roles : [],
        productivityScore: plan.productivityScore,
        streakDays: plan.streakDays,
        activeTasks,
        completedTasksCount: completedCount,
        blockedTasksCount: blockedCount,
      };
    }
  } catch (err) {
    console.warn("[CopilotContext] Coach lookup warning:", err);
  }

  return {
    user: userContext,
    venture: ventureContext,
    coach: coachContext,
  };
}

/**
 * Formats context into a clean, system-level grounding block.
 */
export function formatContextPrompt(ctx: BiznyCopilotContext): string {
  if (!ctx.user && !ctx.venture && !ctx.coach) {
    return "\n[AUTHENTICATED BIZNY USER CONTEXT]: Anonymous Guest (No active user profile logged in).";
  }

  const sections: string[] = ["\n[AUTHENTICATED BIZNY APPLICATION CONTEXT]"];

  if (ctx.user) {
    sections.push(`USER PROFILE:
- ID: ${ctx.user.id}
- Name: ${ctx.user.name}
- Email: ${ctx.user.email}
- Role: ${ctx.user.role}
- Location: ${ctx.user.stateCity || "Not specified"}, ${ctx.user.country}
- Primary Industry: ${ctx.user.industry}
- Business Name: ${ctx.user.businessName || "None registered"}
- Skills: ${ctx.user.skills.length > 0 ? ctx.user.skills.join(", ") : "None specified"}
- Interests: ${ctx.user.interests.length > 0 ? ctx.user.interests.join(", ") : "None specified"}`);
  }

  if (ctx.venture) {
    sections.push(`ACTIVE VENTURE:
- Venture ID: ${ctx.venture.id}
- Title: ${ctx.venture.title} (Status: ${ctx.venture.status}, Progress: ${ctx.venture.progressPercent}%, Day ${ctx.venture.currentDay})
- Sector: ${ctx.venture.mainIndustry || "N/A"}${ctx.venture.subIndustry ? ` > ${ctx.venture.subIndustry}` : ""}
- Value Chain Stage: ${ctx.venture.valueChainStage || "N/A"}
- Location: ${ctx.venture.location || "N/A"}
- Problem Solved: ${ctx.venture.problem || "N/A"}
- Description: ${ctx.venture.description || "N/A"}
- Needed Resources: ${ctx.venture.resourcesNeeded.join(", ") || "None listed"}
- Needed Collaborators: ${ctx.venture.collaboratorsNeeded.join(", ") || "None listed"}
- Funding Required: ${ctx.venture.fundingRequired || "None specified"}`);
  } else {
    sections.push("ACTIVE VENTURE: No venture registered yet.");
  }

  if (ctx.coach) {
    sections.push(`COACH EXECUTION STATE:
- Plan Goal: ${ctx.coach.goal || "No specific 90-day goal set"}
- Stated Bottlenecks: ${ctx.coach.bottlenecks.join(", ") || "None"}
- Available Resources: ${ctx.coach.resources.join(", ") || "None"}
- Productivity Score: ${ctx.coach.productivityScore} | Streak: ${ctx.coach.streakDays} days
- Active Coach Tasks (${ctx.coach.activeTasks.length}):
${ctx.coach.activeTasks.map((t) => `  * [${t.priority.toUpperCase()}] ${t.title} (${t.status})`).join("\n") || "  None"}
- Completed Tasks: ${ctx.coach.completedTasksCount} | Blocked Tasks: ${ctx.coach.blockedTasksCount}`);
  } else {
    sections.push("COACH EXECUTION STATE: No active Coach plan initialized yet.");
  }

  sections.push("[END CONTEXT]");
  return sections.join("\n\n");
}
