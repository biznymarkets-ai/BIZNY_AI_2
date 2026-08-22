import { useState, useRef, useEffect, useCallback } from "react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  getGetOpenaiConversationQueryKey,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Loader2, Sparkles, Briefcase, Zap, Globe, Plus,
  ChevronLeft, AlertTriangle, TrendingUp, Users, Target,
  DollarSign, ArrowRight, Rocket, Factory, CheckCircle2,
  Search, BarChart3, Handshake, Lightbulb, Map,
  ClipboardList, RefreshCw, ChevronRight, ShieldCheck,
  Activity, BookOpen, Store, FileText, Mic, Image as ImageIcon,
  Paperclip, Clock,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import IndustryStampSelector from "@/components/IndustryStampSelector";
import { useAuth } from "@/contexts/AuthContext";

interface ActionCardData {
  type: string;
  id?: number;
  title?: string;
  description?: string;
  url?: string;
}

interface StreamMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isFallback?: boolean;
  executingTool?: string;
  actionCards?: ActionCardData[];
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function RenderMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      nodes.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    if (/^#{1,3} /.test(trimmed)) {
      const text = trimmed.replace(/^#+\s/, "");
      nodes.push(
        <p key={i} className="font-bold text-foreground mt-1 mb-0.5 text-sm">
          {renderInline(text)}
        </p>
      );
      i++;
      continue;
    }

    if (/^[•\-\*•] /.test(trimmed)) {
      const bulletLines: string[] = [];
      while (i < lines.length && /^[•\-\*•] /.test(lines[i].trim())) {
        bulletLines.push(lines[i].trim().replace(/^[•\-\*•] /, ""));
        i++;
      }
      nodes.push(
        <ul key={i} className="space-y-0.5 my-1">
          {bulletLines.map((bl, j) => (
            <li key={j} className="flex gap-2 text-sm">
              <span className="text-primary shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{renderInline(bl)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      const olLines: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        olLines.push(lines[i].trim().replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={i} className="space-y-0.5 my-1">
          {olLines.map((ol, j) => (
            <li key={j} className="flex gap-2 text-sm">
              <span className="text-primary font-semibold shrink-0 w-4">{num++ + j}.</span>
              <span className="leading-relaxed">{renderInline(ol)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    nodes.push(
      <p key={i} className="text-sm leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{nodes}</div>;
}

// ─── Action chips ─────────────────────────────────────────────────────────────

function getActionChips(content: string): { label: string; href: string; icon: React.ReactNode }[] {
  const lower = content.toLowerCase();
  if (lower.includes("milestone") || lower.includes("progress") || lower.includes("upload")) {
    return [
      { label: "My Ventures", href: "/ventures", icon: <Rocket className="h-3 w-3" /> },
      { label: "Log Progress", href: "/ventures", icon: <CheckCircle2 className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("template") || lower.includes("blueprint")) {
    return [
      { label: "Browse Templates", href: "/templates", icon: <Briefcase className="h-3 w-3" /> },
      { label: "Start Venture", href: "/ventures/new", icon: <Rocket className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("collaborat") || lower.includes("partner") || lower.includes("supplier") || lower.includes("customer")) {
    return [
      { label: "Marketplace", href: "/market", icon: <Users className="h-3 w-3" /> },
      { label: "Opportunities", href: "/opportunities", icon: <Search className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("deal") || lower.includes("agreement") || lower.includes("witness")) {
    return [
      { label: "Deal Desk", href: "/market", icon: <Handshake className="h-3 w-3" /> },
      { label: "Browse Marketplace", href: "/market", icon: <Factory className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("opportunit") || lower.includes("funding") || lower.includes("grant")) {
    return [
      { label: "View Opportunities", href: "/opportunities", icon: <Target className="h-3 w-3" /> },
      { label: "Browse Marketplace", href: "/market", icon: <Globe className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("revenue") || lower.includes("profit") || lower.includes("margin") || lower.includes("cost")) {
    return [
      { label: "Start Venture", href: "/ventures/new", icon: <Rocket className="h-3 w-3" /> },
      { label: "Browse Templates", href: "/templates", icon: <BarChart3 className="h-3 w-3" /> },
    ];
  }
  if (lower.includes("innovation") || lower.includes("idea") || lower.includes("challenge")) {
    return [
      { label: "Innovation Hub", href: "/innovation", icon: <Lightbulb className="h-3 w-3" /> },
      { label: "Browse Templates", href: "/templates", icon: <Briefcase className="h-3 w-3" /> },
    ];
  }
  return [
    { label: "Browse Templates", href: "/templates", icon: <Briefcase className="h-3 w-3" /> },
    { label: "View Opportunities", href: "/opportunities", icon: <Target className="h-3 w-3" /> },
  ];
}

// ─── Fallback responses ───────────────────────────────────────────────────────

function generateFallbackResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("milestone") || q.includes("progress") || q.includes("stuck") || q.includes("update")) {
    return `Let's audit your progress and find the next productive step.

**Milestone Review Framework:**
• What was the last milestone you completed? What evidence did you upload?
• What is the current milestone? What is blocking it?
• What resource, person, or decision do you need to unblock it?
• What can you accomplish in the next 48 hours specifically?

**Common blockers and solutions:**
• Equipment not sourced → Search Bizny Marketplace for verified suppliers in your region
• Capital gap → Look at Opportunities section for grants, loans, and matching investors
• Skills gap → Post a collaboration request specifying exactly what you need
• No customers yet → Start with 3 warm referrals before cold outreach

What specific milestone are you working on right now? Give me the details and I will help you break it into daily actions.`;
  }

  if (q.includes("customer") || q.includes("market") || q.includes("sell") || q.includes("buyer")) {
    return `Finding your first paying customers is the most important milestone in any venture.

**The First 10 Customer Framework:**

**Step 1 — Warm network (Days 1–7):**
• List 20 people who could benefit from your product or know someone who could
• Contact each personally — WhatsApp is the most effective channel in Africa
• Offer a trial, discount, or demonstration — remove the risk of saying yes

**Step 2 — Community channels (Days 8–21):**
• Industry-specific WhatsApp groups are gold — join 5 relevant ones
• Trade associations have active buyer directories (NACCIMA, KEBS, etc.)
• Local markets and industrial clusters have buyers who are actively sourcing

**Step 3 — Document and replicate (Day 22+):**
• Every sale is a case study — record what worked, what the customer needed, what they paid
• Use Bizny's venture progress tracker to document your customer acquisition process
• This becomes your replicable playbook

What product or service are you selling, and what region are you operating in? I can give you a specific customer acquisition strategy.`;
  }

  if (q.includes("revenue") || q.includes("profit") || q.includes("margin") || q.includes("money") || q.includes("income")) {
    return `Profitability requires clarity on four numbers: Revenue, Cost, Volume, and Margin.

**Profitability Analysis Framework:**

**1. Revenue model — how does money come in?**
• Per unit sale (product)
• Per hour or day (service)
• Per contract (project)
• Recurring (subscription or retainer)
• Commission (brokerage or aggregation)

**2. Cost structure — know your break-even:**
• Fixed costs (rent, salaries, equipment depreciation): ₦____/month
• Variable costs (raw materials, transport, packaging): ₦____/unit
• Break-even volume = Fixed costs ÷ (Price − Variable cost)

**3. Margin improvement levers:**
• Reduce raw material cost by sourcing directly from producers
• Increase price by serving premium segments or adding certification
• Increase volume by replicating your best customer in new locations
• Reduce waste and rework — often 15–30% of costs in early operations

**4. The replication question:**
Once your margin is positive, the question becomes: how do I replicate this profitably in 3 new locations?

What specific product or service are you selling? Give me your current pricing and costs and I will calculate your actual margin.`;
  }

  if (q.includes("adjacent") || q.includes("explore") || q.includes("other industry") || q.includes("expand") || q.includes("opportunity")) {
    return `Expanding your industry awareness is one of the highest-value things you can do.

**The Adjacent Opportunity Matrix — Common high-yield pivots:**

**If you are in agriculture:**
→ Food processing (cassava starch, palm oil refining, pepper grinding, flour milling)
→ Agricultural inputs (seeds, fertilizer distribution, irrigation equipment)
→ Cold chain logistics (cold storage, refrigerated transport)
→ Agricultural documentation and certification services

**If you are in logistics or transport:**
→ Last-mile delivery for e-commerce
→ Cold chain for food and pharmaceutical products
→ Waste collection and recycling logistics
→ Agricultural produce aggregation and offtake

**If you are in construction or fabrication:**
→ Solar panel installation and maintenance
→ Water infrastructure (boreholes, tanks, pipelines)
→ Modular cold storage construction
→ Industrial equipment maintenance contracts

**If you are in technology or media:**
→ Agricultural extension services (reaching farmers via mobile)
→ Industrial documentation and verification
→ Equipment tracking and fleet management
→ E-learning for vocational and industrial skills

What is your current industry or skill set? I will map your most profitable adjacent opportunities.`;
  }

  if (q.includes("collaborat") || q.includes("partner") || q.includes("team") || q.includes("find")) {
    return `Building productive relationships is at the core of how Bizny works.

**Finding the Right Collaborators:**

**On Bizny:**
1. Post a clear "Partnership Request" on your feed — specify the exact skill or role you need
2. Filter Marketplace listings by industry to find active operators
3. Use the Innovation Hub to post challenges and attract skilled solvers
4. Follow verified Field Agents in your area — they have strong local networks

**What makes a collaboration request work:**
• Specific skill needed (not "business partner" — say "certified solar installer" or "cassava starch processor")
• Clear contribution expected (hours per week, deliverable, or percentage)
• Clear benefit offered (revenue share, equity, salary, or in-kind exchange)
• Location and timeline

**Collaboration types to consider:**
• Skill-based partnerships (you have capital, they have expertise)
• Resource-sharing agreements (shared equipment, space, or transport)
• Buyer-supplier relationships structured as a formal deal
• Field Agent validation partnerships for building trust

What specific skill or type of collaborator are you looking for? I can help you write a targeted partnership request.`;
  }

  if (q.includes("poultry") || q.includes("chicken") || q.includes("farm") || q.includes("livestock")) {
    return `Poultry farming is one of Africa's most proven venture paths with strong local demand.

**90-Day Poultry Venture Plan:**

**Phase 1 — Setup (Days 1–30):**
• Secure a pen for 500–1,000 birds (broilers or layers depending on your market)
• Source day-old chicks from a certified hatchery — biosecurity is critical
• Install feeding, watering, and ventilation systems
• Estimated startup: $800–$2,500 depending on scale and region

**Phase 2 — Operations (Days 31–60):**
• Broilers reach market weight (2–2.5kg) in 6–7 weeks
• Track daily feed-conversion ratio — this determines your margin
• Build relationships with local restaurants, hotels, and market traders early

**Phase 3 — Scaling (Days 61–90):**
• Document your feed costs, mortality rate, and revenue per batch
• Use this data to secure financing for your second, larger batch
• Consider processing and packaging to increase your margin

**Adjacent opportunities to explore:**
→ Egg production (layers have longer revenue cycles)
→ Feed production (blend your own feed to reduce input costs)
→ Hatchery services (supply day-old chicks to other farmers)
→ Poultry equipment supply (feeders, drinkers, cages)

**Next action:** Browse Bizny's Poultry Farm template — it includes a day-by-day milestone calendar with supplier contacts. What region are you operating in?`;
  }

  if (q.includes("solar") || q.includes("energy") || q.includes("renewable") || q.includes("power")) {
    return `Solar energy is one of Africa's highest-growth sectors with 600M people lacking reliable electricity.

**High-Profit Solar Niches:**
1. **Solar water pumping** for farms — reliable demand, lower competition
2. **Solar security lighting** for businesses and gated communities
3. **Solar-powered cold storage** — critical for agricultural value chains
4. **Mini-grid development** — government-subsidized in many countries

**90-Day Solar Installation Business Plan:**
• Days 1–15: Complete a certified installer course, register your business
• Days 16–30: Source panels and batteries from verified distributors
• Days 31–60: Land your first 3 installations through warm referrals
• Days 61–90: Build recurring maintenance revenue — this is your moat

**Profitability benchmarks:**
• Installation margin: 20–35% on hardware + labour
• Maintenance contracts: $15–$50/month per system
• 10 systems under maintenance = $150–$500/month recurring

**Adjacent opportunities:**
→ Solar panel cleaning services (high margins, recurring)
→ Battery storage systems for businesses
→ Solar-powered irrigation for agriculture
→ Training and certification for other installers

**Next action:** What region are you in? I can identify the strongest solar demand segments near you.`;
  }

  if (q.includes("roadmap") || q.includes("plan") || q.includes("strategy") || q.includes("start") || q.includes("begin")) {
    return `Here is the Bizny 90-Day Venture Framework used across Africa's most active operators.

**Phase 1 — Foundations (Days 1–30):**
• Define your product or service with extreme specificity — not "food business" but "smoked catfish processing for market traders in Onitsha"
• Identify your first 10 potential customers by name if possible
• Register your business and open a business bank account
• Complete your Bizny profile: industry, skills, WhatsApp contact, location

**Phase 2 — First Revenue (Days 31–60):**
• Land your first paying customer — even at a reduced introductory price
• Document everything: costs, process, what went wrong, what worked
• Post weekly progress updates on Bizny to build your public track record
• Start building your supplier and partner network through the Marketplace

**Phase 3 — Systematise (Days 61–90):**
• Write a simple operations manual — one page is enough to start
• Know your gross margin: (Revenue − Variable Costs) ÷ Revenue
• Plan your path from 1 customer to 10 — what changes? What scales automatically?
• Start your next batch, second location, or first replication

**What Bizny tracks for you:**
→ Milestone calendar → Evidence uploads → Progress timeline → Collaboration record

What industry are you entering and what resources do you already have? I will build you a specific 90-day roadmap.`;
  }

  if (q.includes("template") || q.includes("blueprint") || q.includes("venture")) {
    return `Bizny Venture Templates are pre-built business blueprints based on proven African market operations.

**What each template includes:**
• Day-by-day milestone calendar — know exactly what action to take each day
• Required skills list — identify your team gaps before you start
• Resource and equipment estimates — capital requirements by phase
• Risk register — the 5 most common failure points and how to avoid them
• Industry connections — supplier types, buyer categories, and partnership opportunities

**How to use templates effectively:**
1. Browse Templates and filter by your industry
2. Read the full milestone list before committing — does it match your context?
3. Click "Start Venture" — creates your personal tracked progress copy
4. Log progress updates daily — this builds your verified track record on Bizny
5. Share your progress publicly to attract collaborators and partners

**Replication is the goal:**
Once you complete a template successfully, your documented journey becomes a case study that other users can learn from and replicate. This is how Bizny accelerates industrial growth across Africa.

**Popular templates:** Poultry Farm, Solar Installation, Mobile Car Wash, Fabric Production, Cassava Processing, Logistics Aggregator, Cold Storage Unit.

Which industry are you in? I will recommend the best template match and walk you through the critical first milestones.`;
  }

  return `I am your Bizny Co-pilot — Productivity Advocate and Industrial Success Partner.

My purpose is not conversation — it is to move you closer to productive outcomes: projects started, ventures completed, milestones achieved, collaborations formed, and revenue generated.

**How I can help you right now:**
• **Accountability check** — where are you in your current venture or project?
• **Industry exploration** — what sectors adjacent to yours have untapped opportunity?
• **Business development** — who are your potential customers, suppliers, and partners?
• **Profitability analysis** — what are your margins and how can you improve them?
• **Venture roadmap** — what is your concrete 90-day plan?
• **Collaboration strategy** — what specific skills or partners do you need?

**To give you targeted, actionable advice, tell me:**
1. What industry or business are you currently working on or interested in?
2. What country and region are you operating in?
3. What is your current stage — idea, early operations, or scaling?
4. What is your biggest current obstacle?

I am built for African industrial realities. Ask me something specific and I will give you a concrete, executable answer.`;
}

// ─── Productivity Pathway ─────────────────────────────────────────────────────

const PATHWAY_STEPS = [
  "Awareness", "Opportunity", "Project", "Venture",
  "Collaboration", "Execution", "Profitability", "Replication", "Industry Advancement",
];

function ProductivityPathway() {
  return (
    <div className="mt-5 pt-4 border-t border-border/60">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Productivity Pathway</p>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PATHWAY_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border rounded-full px-2.5 py-1 whitespace-nowrap">
              {step}
            </span>
            {i < PATHWAY_STEPS.length - 1 && (
              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Productivity Diagnosis ───────────────────────────────────────────────────

type Stage = "idea" | "planning" | "early_ops" | "revenue" | "scaling";
type Bottleneck = "capital" | "market_access" | "skills" | "network" | "systems" | "production" | "legal" | "team";

const ECONOMIC_ACTOR_ROLES = [
  "Farmer / Agribusiness Owner",
  "Artisan / Craftsperson",
  "Trader / Merchant / Dealer",
  "Producer / Manufacturer",
  "Processor / Value-Adder",
  "Logistics & Transport Provider",
  "Engineer / Technician / Fabricator",
  "Professional / Consultant",
  "Founder / Entrepreneur",
  "Investor / Financier / Funder",
  "Researcher / Analyst",
  "Field Agent / Inspector / Verifier",
  "Industrial Enthusiast",
  "Student / Intern / Graduate",
  "Government / NGO / Development Worker",
  "Other",
];

interface DiagAnswers {
  userTypes: string[];
  stage: Stage | "";
  industryStamps: string[];
  bottlenecks: Bottleneck[];
  hasRevenue: boolean | null;
  teamSize: string;
  goal: string;
}

interface DiagReport {
  profileLine: string;
  capacityLabel: string;
  mainBottleneck: string;
  bottleneckExplanation: string;
  actions: { title: string; desc: string; href: string; priority: "critical" | "high" | "medium" }[];
  features: { label: string; href: string; icon: React.ReactNode }[];
}


const STAGE_LABELS: Record<Stage, string> = {
  idea: "Idea Stage",
  planning: "Planning & Research",
  early_ops: "Early Operations",
  revenue: "Revenue-Generating",
  scaling: "Scaling",
};

const BOTTLENECK_LABELS: Record<Bottleneck, string> = {
  capital: "Access to Funding / Capital",
  market_access: "Finding Customers / Market Access",
  skills: "Skills Gap in My Team or Myself",
  network: "Limited Business Network / Connections",
  systems: "Lack of Systems, Processes, or Tools",
  production: "Production Capacity or Quality",
  legal: "Legal, Regulatory, or Compliance Issues",
  team: "Building and Managing a Team",
};

function generateDiagReport(a: DiagAnswers): DiagReport {
  const profileLine = `${a.userTypes[0] || "Economic Actor"} — ${STAGE_LABELS[a.stage as Stage] || "Early Stage"}${a.industryStamps.length > 0 ? ` · ${a.industryStamps.slice(0, 2).join(", ")}` : ""}`;
  const capacityLabel = a.hasRevenue ? "Revenue-generating" : "Pre-revenue";

  const mainB = a.bottlenecks[0];
  const bottleneckExplanationMap: Record<Bottleneck, string> = {
    capital: "Capital constraints limit your ability to invest in equipment, inventory, and talent. Prioritize grant opportunities and revenue acceleration before seeking debt.",
    market_access: "Without consistent customers, no other resource investment pays off. Market development is your highest-leverage activity right now.",
    skills: "Skills gaps slow execution and increase quality risk. Targeted training or hiring unlocks every other area of your business.",
    network: "In African markets, relationships are infrastructure. A stronger network unlocks deals, partnerships, clients, and referrals.",
    systems: "Poor systems create bottlenecks, errors, and lost time. One good process can replace three employees. Invest in documentation.",
    production: "Production constraints cap your revenue ceiling. Solving capacity and quality is the direct path to growth.",
    legal: "Regulatory risks create existential threats. Compliance now is cheaper than fines and shutdowns later.",
    team: "Every business challenge is ultimately a people challenge. Building the right team accelerates everything else.",
  };

  const bottleneckExplanation = mainB ? bottleneckExplanationMap[mainB] : "Addressing your core bottleneck is the highest-leverage action you can take right now.";

  const actionPool: Record<Bottleneck, DiagReport["actions"]> = {
    capital: [
      { title: "Browse Funding Opportunities", desc: "Filter grants, loans, and investment calls matched to your industry and stage.", href: "/opportunities", priority: "critical" },
      { title: "Build a Pitch-Ready Business Plan", desc: "Use a Library template to create a fundable plan with clear financials.", href: "/repository", priority: "high" },
      { title: "List on Marketplace to Generate Revenue", desc: "Activate your sales funnel by listing your products or services for free.", href: "/market", priority: "high" },
    ],
    market_access: [
      { title: "List Your Business on the Marketplace", desc: "Get discovered by customers, partners, and buyers actively looking for your services.", href: "/market", priority: "critical" },
      { title: "Adopt a Market Entry Template", desc: "Use proven marketing and sales blueprints from the Library.", href: "/repository", priority: "high" },
      { title: "Find Partnership Opportunities", desc: "Browse collaboration and distribution partnership calls in Opportunities.", href: "/opportunities", priority: "medium" },
    ],
    skills: [
      { title: "Browse Training Programs in Library", desc: "Find courses, guides, and training templates specific to your skill gaps.", href: "/repository", priority: "critical" },
      { title: "Find Skilled Collaborators", desc: "Connect with experienced professionals on the Marketplace who can fill your gaps.", href: "/market", priority: "high" },
      { title: "Start a Skill-Building Execution", desc: "Track your learning as an Execution Instance with measurable milestones.", href: "/executions", priority: "medium" },
    ],
    network: [
      { title: "List on Marketplace to Get Discovered", desc: "Make your business visible to the Bizny ecosystem.", href: "/market", priority: "critical" },
      { title: "Explore Partnership Opportunities", desc: "Browse active partnership and collaboration calls.", href: "/opportunities", priority: "high" },
      { title: "Use the Deal Desk for Formal Connections", desc: "Structure agreements with potential partners using Deal Desk.", href: "/dashboard", priority: "medium" },
    ],
    systems: [
      { title: "Adopt an SOP Template from the Library", desc: "Find Standard Operating Procedures for your specific business activity.", href: "/repository", priority: "critical" },
      { title: "Start an Execution Instance to Track Progress", desc: "Milestone-based tracking creates accountability and process clarity.", href: "/executions", priority: "high" },
      { title: "Document Your Current Process", desc: "Use a Business Blueprint template to capture and improve your operations.", href: "/repository", priority: "medium" },
    ],
    production: [
      { title: "Find Production Templates in Library", desc: "Get capacity planning, quality control, and production SOP templates.", href: "/repository", priority: "critical" },
      { title: "Browse Suppliers and Equipment Providers", desc: "Connect with equipment and raw material suppliers on the Marketplace.", href: "/market", priority: "high" },
      { title: "Explore Manufacturing Partnerships", desc: "Find co-production or subcontracting opportunities.", href: "/opportunities", priority: "medium" },
    ],
    legal: [
      { title: "Find Compliance Guides in the Library", desc: "Browse regulatory and compliance templates for your industry and country.", href: "/repository", priority: "critical" },
      { title: "Connect with Legal Professionals on Marketplace", desc: "Find lawyers and compliance consultants who specialize in your sector.", href: "/market", priority: "high" },
      { title: "Verify Your Business via Field Agent", desc: "Field Agent verification adds credibility and regulatory legitimacy.", href: "/profile", priority: "medium" },
    ],
    team: [
      { title: "Post Collaboration Opportunities", desc: "Use Opportunities to find co-founders, employees, and interns.", href: "/opportunities", priority: "critical" },
      { title: "Find Skilled People on Marketplace", desc: "Browse professionals, artisans, and specialists for your team.", href: "/market", priority: "high" },
      { title: "Use Team Management Templates", desc: "Find HR, onboarding, and team structure templates in the Library.", href: "/repository", priority: "medium" },
    ],
  };

  const actions = mainB ? actionPool[mainB] : actionPool["systems"];

  // Add extra actions from other bottlenecks
  a.bottlenecks.slice(1, 2).forEach(b => {
    if (actionPool[b] && actionPool[b][0]) {
      actions.push({ ...actionPool[b][0], priority: "medium" as const });
    }
  });

  const features = [
    a.bottlenecks.includes("capital") && { label: "Opportunities", href: "/opportunities", icon: <Target className="h-3.5 w-3.5" /> },
    a.bottlenecks.includes("market_access") && { label: "Marketplace", href: "/market", icon: <Store className="h-3.5 w-3.5" /> },
    { label: "Library", href: "/repository", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { label: "Executions", href: "/executions", icon: <Activity className="h-3.5 w-3.5" /> },
  ].filter(Boolean) as DiagReport["features"];

  return { profileLine, capacityLabel, mainBottleneck: mainB ? BOTTLENECK_LABELS[mainB] : "General Growth", bottleneckExplanation, actions: actions.slice(0, 4), features: features.slice(0, 4) };
}

const DIAG_STEPS = ["Your Productive Identity", "Current Stage", "What's Blocking You?", "Your Goal", "Productivity Report"];

function ProductivityDiagnosis() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagAnswers>({
    userTypes: [], stage: "", industryStamps: [], bottlenecks: [], hasRevenue: null, teamSize: "", goal: "",
  });
  const [report, setReport] = useState<DiagReport | null>(null);

  const update = (key: keyof DiagAnswers, val: any) => setAnswers(prev => ({ ...prev, [key]: val }));

  const toggleBottleneck = (b: Bottleneck) => {
    setAnswers(prev => ({
      ...prev,
      bottlenecks: prev.bottlenecks.includes(b)
        ? prev.bottlenecks.filter(x => x !== b)
        : prev.bottlenecks.length < 3 ? [...prev.bottlenecks, b] : prev.bottlenecks,
    }));
  };

  const canContinue = () => {
    if (step === 0) return answers.userTypes.length > 0;
    if (step === 1) return !!answers.stage;
    if (step === 2) return answers.bottlenecks.length > 0;
    if (step === 3) return answers.hasRevenue !== null;
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      setReport(generateDiagReport(answers));
      setStep(4);
    } else {
      setStep(s => s + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({ userTypes: [], stage: "", industryStamps: [], bottlenecks: [], hasRevenue: null, teamSize: "", goal: "" });
    setReport(null);
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight">Productivity Clinic</h1>
          <p className="text-[11px] text-muted-foreground">
            {step < 4 ? `Consultation · Step ${step + 1} of ${DIAG_STEPS.length} — ${DIAG_STEPS[step]}` : "Your Productivity Report"}
          </p>
        </div>
        {report && (
          <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5" /> New Consultation
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {step < 4 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      )}

      <Card className="flex-1 overflow-auto border-primary/10 shadow-lg">
        <div className="p-6 space-y-5">

          {/* Step 0: Productive Identity (multi-select) */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-0.5">What productive capacity do you bring?</p>
                <p className="text-xs text-muted-foreground">Every person is an economic node. Select all that apply — this helps us understand your starting point before anything else.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
                {ECONOMIC_ACTOR_ROLES.map((role) => {
                  const sel = answers.userTypes.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => update("userTypes", sel
                        ? answers.userTypes.filter(r => r !== role)
                        : [...answers.userTypes, role]
                      )}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        sel ? "bg-primary/5 border-primary text-primary" : "bg-muted/30 border-border hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className={cn("h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center", sel ? "border-primary bg-primary" : "border-gray-300")}>
                        {sel && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm font-medium">{role}</span>
                    </button>
                  );
                })}
              </div>
              {answers.userTypes.length > 0 && (
                <p className="text-xs text-primary font-medium">{answers.userTypes.length} selected</p>
              )}
            </div>
          )}

          {/* Step 1: Stage */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-0.5">What is your current stage?</p>
                <p className="text-xs text-muted-foreground">Think about your primary business or project.</p>
              </div>
              <div className="space-y-2">
                {(Object.entries(STAGE_LABELS) as [Stage, string][]).map(([val, label]) => {
                  const descs: Record<Stage, string> = {
                    idea: "You have an idea but haven't started yet",
                    planning: "You're researching and preparing to start",
                    early_ops: "You've started but have limited revenue",
                    revenue: "You have customers and consistent income",
                    scaling: "You're growing and need to expand capacity",
                  };
                  return (
                    <button
                      key={val}
                      onClick={() => update("stage", val)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all",
                        answers.stage === val ? "bg-primary/5 border-primary" : "bg-muted/30 border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center", answers.stage === val ? "border-primary bg-primary" : "border-gray-300")}>
                        {answers.stage === val && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", answers.stage === val ? "text-primary" : "text-foreground")}>{label}</p>
                        <p className="text-xs text-muted-foreground">{descs[val]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Your Industry Stamps (optional)</label>
                <IndustryStampSelector
                  selected={answers.industryStamps}
                  onChange={stamps => update("industryStamps", stamps)}
                  max={3}
                  compact
                />
              </div>
            </div>
          )}

          {/* Step 2: Bottlenecks */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-0.5">What are your biggest obstacles?</p>
                <p className="text-xs text-muted-foreground">Select up to 3 — order matters, put the worst first.</p>
              </div>
              <div className="space-y-2">
                {(Object.entries(BOTTLENECK_LABELS) as [Bottleneck, string][]).map(([val, label]) => {
                  const selected = answers.bottlenecks.includes(val);
                  const rank = answers.bottlenecks.indexOf(val) + 1;
                  const maxed = answers.bottlenecks.length >= 3 && !selected;
                  return (
                    <button
                      key={val}
                      onClick={() => toggleBottleneck(val)}
                      disabled={maxed}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                        selected ? "bg-primary/5 border-primary" : maxed ? "opacity-40 cursor-not-allowed border-border" : "bg-muted/30 border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-bold",
                        selected ? "border-primary bg-primary text-white" : "border-gray-300"
                      )}>
                        {selected ? rank : ""}
                      </div>
                      <span className={cn("text-sm font-medium", selected ? "text-primary" : "text-foreground")}>{label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{answers.bottlenecks.length}/3 selected</p>
            </div>
          )}

          {/* Step 3: Resources & Goal */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="font-semibold text-foreground mb-0.5">Are you currently generating revenue?</p>
                <p className="text-xs text-muted-foreground">This helps calibrate your immediate priorities.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: true, label: "Yes", sub: "Consistent income" },
                  { val: "occasional", label: "Sometimes", sub: "Irregular income" },
                  { val: false, label: "Not yet", sub: "Pre-revenue" },
                ].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => update("hasRevenue", opt.val === "occasional" ? false : opt.val)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      answers.hasRevenue === (opt.val === "occasional" ? false : opt.val) && opt.val !== "occasional"
                        ? "bg-primary/5 border-primary" : "bg-muted/30 border-border hover:border-primary/40"
                    )}
                  >
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Team Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Solo", "2–5", "6–20", "20+"].map(s => (
                    <button
                      key={s}
                      onClick={() => update("teamSize", s)}
                      className={cn(
                        "py-2.5 rounded-xl border text-xs font-semibold transition-all",
                        answers.teamSize === s ? "bg-primary/5 border-primary text-primary" : "bg-muted/30 border-border hover:border-primary/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Your #1 Goal for the Next 90 Days (optional)</label>
                <textarea
                  value={answers.goal}
                  onChange={e => update("goal", e.target.value)}
                  placeholder="e.g. Get 10 paying customers, complete my first order, raise seed funding..."
                  className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
            </div>
          )}

          {/* Step 4: Report */}
          {step === 4 && report && (
            <div className="space-y-6">
              {/* Profile summary */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Productivity Profile</p>
                <p className="text-sm font-semibold text-foreground">{report.profileLine}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{report.capacityLabel}</span>
                  {answers.teamSize && <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Team: {answers.teamSize}</span>}
                </div>
                {answers.goal && (
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <p className="text-[10px] text-primary/70 uppercase tracking-wide font-semibold mb-0.5">90-Day Goal</p>
                    <p className="text-xs text-foreground">{answers.goal}</p>
                  </div>
                )}
              </div>

              {/* Main bottleneck */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary Bottleneck Identified</p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">{report.mainBottleneck}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{report.bottleneckExplanation}</p>
                </div>
              </div>

              {/* Recommended actions */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recommended Actions</p>
                <div className="space-y-2.5">
                  {report.actions.map((action, i) => (
                    <a key={i} href={action.href} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                        action.priority === "critical" ? "bg-red-100 text-red-700" :
                        action.priority === "high" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick-access features */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suggested Bizny Features</p>
                <div className="grid grid-cols-2 gap-2">
                  {report.features.map(f => (
                    <a key={f.href} href={f.href} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all">
                      <span className="text-primary">{f.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{f.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Co-pilot says:</strong> This diagnosis is based on the information you provided. For a deeper analysis, continue the conversation in Chat mode — Co-pilot can build on these findings with personalised, industry-specific guidance.
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between pt-2 border-t border-border">
              {step > 0 ? (
                <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1.5">
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </Button>
              ) : <div />}
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canContinue()}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-white px-6"
              >
                {step === 3 ? "Generate Report" : "Continue"}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Dashboard stats (contextual summary) ─────────────────────────────────────

const STATS = [
  { icon: BookOpen, value: "3", label: "Active Templates", sub: "View all", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", href: "/templates" },
  { icon: CheckCircle2, value: "1", label: "Milestone Due Today", sub: "Due today", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400", href: "/ventures" },
  { icon: Target, value: "2", label: "New Opportunities", sub: "View all", color: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400", href: "/opportunities" },
  { icon: Users, value: "1", label: "Collaborator Update", sub: "View all", color: "bg-primary/10 text-primary", href: "/market" },
];

// ─── Quick action chips ────────────────────────────────────────────────────────

const BASE_QUICK_CHIPS = [
  { icon: ClipboardList, label: "Productivity Clinic", prompt: "I want to start a Productivity Consultation. Help me understand my productive capacity and what I should be building." },
  { icon: Activity, label: "Review My Progress", prompt: "Review my active milestones and tell me what I should focus on today." },
  { icon: Target, label: "Find Opportunities", prompt: "What new opportunities should I be looking at right now in my industry?" },
  { icon: Store, label: "Find Suppliers", prompt: "Help me find reliable suppliers for my venture." },
  { icon: Users, label: "Find Buyers", prompt: "How do I find buyers and customers for my product or service?" },
  { icon: BookOpen, label: "Continue My Template", prompt: "What is the next step in my current venture template? What should I be doing now?" },
  { icon: Globe, label: "Industry Targets", prompt: "What are the key industry targets and growth opportunities I should be tracking?" },
  { icon: Handshake, label: "Deal Desk", prompt: "Help me prepare for a business deal or partnership negotiation." },
];

const PERSONA_PROMPTS: Record<string, { icon: any; label: string; prompt: string }[]> = {
  chidi: [
    { icon: Store, label: "Find Agro-Processors", prompt: "Search the Bizny marketplace for cassava or coconut agro-processors who need equipment like flash dryers or grating machines." },
    { icon: Target, label: "Procure Stainless Steel", prompt: "What is the best way to secure financing or bulk supplier deals for 304 food-grade stainless steel sheet in Aba?" },
    { icon: Zap, label: "Add Coach Task", prompt: "Add a high priority task to my Coach board to contact 3 prospective agro-processors in Akwa Ibom for equipment fabrication." },
  ],
  amara: [
    { icon: ShieldCheck, label: "Lab Certification", prompt: "Help me find a certified quality testing laboratory in Lagos to test and certify our high-grade cassava flour and virgin coconut oil." },
    { icon: Store, label: "Freight Haulage to Lagos", prompt: "Search Bizny for reliable interstate freight logistics operators who can transport 2,000kg weekly from Uyo to Lagos supermarkets." },
    { icon: Handshake, label: "Retail Supply Deals", prompt: "Are there supermarket chains or off-takers in Lagos looking for certified coconut oil and packaged cassava starch?" },
  ],
  fatima: [
    { icon: ShieldCheck, label: "Inspect Sunshine Agro", prompt: "Look up Sunshine Agro Processing in the Bizny database. What standards and lab assays do they need for NAFDAC and retail supermarket approval?" },
    { icon: Target, label: "Certification SOPs", prompt: "What are the key microbiological and moisture thresholds required for packaged cassava flour export from Nigeria?" },
  ],
  emeka: [
    { icon: Store, label: "Find South-East Cargo", prompt: "Search marketplace for agro-processors and manufacturers in Uyo, Aba, or Onitsha needing weekly haulage to Lagos." },
    { icon: Handshake, label: "Formalize Deal Desk Agreement", prompt: "Help me structure a standard haulage contract on Deal Desk for weekly refrigerated freight runs." },
  ],
  ada: [
    { icon: Store, label: "Source Cassava & Coconut Oil", prompt: "Search the Bizny marketplace for verified Nigerian agro-processors supplying certified packaged cassava starch and virgin coconut oil." },
    { icon: Handshake, label: "Supermarket Purchase Contract", prompt: "Structure a formal supply agreement on Deal Desk with Amara Okon (Sunshine Agro Processing) for 2,000kg monthly cassava starch delivery." },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Copilot() {
  const [input, setInput] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "diagnosis">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const userLower = (user?.name || "").toLowerCase();
  const personaKey = userLower.includes("chidi")
    ? "chidi"
    : userLower.includes("amara")
    ? "amara"
    : userLower.includes("fatima")
    ? "fatima"
    : userLower.includes("emeka")
    ? "emeka"
    : userLower.includes("ada")
    ? "ada"
    : null;

  const activeQuickChips = [
    ...(personaKey && PERSONA_PROMPTS[personaKey] ? PERSONA_PROMPTS[personaKey] : []),
    ...BASE_QUICK_CHIPS,
  ];

  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations({
    query: { queryKey: getListOpenaiConversationsQueryKey() }
  });

  const { data: activeConv } = useGetOpenaiConversation(
    activeConversationId ?? 0,
    { query: { enabled: !!activeConversationId, queryKey: getGetOpenaiConversationQueryKey(activeConversationId ?? 0) } }
  );

  const createConvMutation = useCreateOpenaiConversation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamMessages, activeConv?.messages]);

  const ensureConversation = useCallback(async (firstMessage: string): Promise<number | null> => {
    if (activeConversationId) return activeConversationId;
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : "");
    return new Promise((resolve) => {
      createConvMutation.mutate(
        { data: { title } },
        {
          onSuccess: (conv) => {
            setActiveConversationId(conv.id);
            queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
            resolve(conv.id);
          },
          onError: () => resolve(null),
        }
      );
    });
  }, [activeConversationId, createConvMutation, queryClient]);

  const handleSend = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const text = overrideInput ?? input;
    if (!text.trim() || isStreaming) return;
    setInput("");

    setStreamMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    const convId = await ensureConversation(text);

    if (!convId) {
      await simulateFallback(text);
      return;
    }

    try {
      const authToken = localStorage.getItem("bizny_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              setStreamMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? {
                        ...m,
                        streaming: false,
                        executingTool: undefined,
                        actionCards: data.actionCards && data.actionCards.length > 0 ? data.actionCards : m.actionCards,
                      }
                    : m
                )
              );
              queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(convId) });
            } else if (data.toolExecuting) {
              const toolLabel =
                data.toolExecuting.name === "search_marketplace" ? "Searching live Marketplace records..." :
                data.toolExecuting.name === "search_templates" ? "Consulting Repository blueprints..." :
                data.toolExecuting.name === "search_opportunities" ? "Checking open Opportunities..." :
                data.toolExecuting.name === "create_coach_task" ? "Adding task to Coach execution board..." :
                data.toolExecuting.name === "get_verification_status" ? "Checking Field Agent verification..." :
                "Consulting Bizny database...";

              setStreamMessages((prev) =>
                prev.map((m, i) => (i === prev.length - 1 ? { ...m, executingTool: toolLabel } : m))
              );
            } else if (data.content) {
              setStreamMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1
                    ? { ...m, content: m.content + data.content, executingTool: undefined }
                    : m
                )
              );
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch {
            // ignore parse errors on partial lines
          }
        }
      }
    } catch {
      await simulateFallback(text);
    } finally {
      setIsStreaming(false);
    }
  };

  const simulateFallback = async (question: string) => {
    setUsingFallback(true);
    const response = generateFallbackResponse(question);
    const words = response.split(" ");
    let accumulated = "";

    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? "" : " ") + words[i];
      setStreamMessages((prev) =>
        prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: accumulated, isFallback: true } : m)
      );
      await new Promise(r => setTimeout(r, 12));
    }

    setStreamMessages((prev) =>
      prev.map((m, idx) => idx === prev.length - 1 ? { ...m, streaming: false, isFallback: true } : m)
    );
    setIsStreaming(false);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setStreamMessages([]);
    setUsingFallback(false);
  };

  const openConversation = (id: number) => {
    setActiveConversationId(id);
    setStreamMessages([]);
    setUsingFallback(false);
  };

  const displayMessages: StreamMessage[] =
    activeConv && streamMessages.length === 0
      ? activeConv.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : streamMessages;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">

      {/* ── Welcome header ── */}
      <div className="mb-4 flex items-start justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight leading-tight">
            Welcome back, <span className="text-primary">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's what's important today.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {usingFallback && (
            <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="h-3 w-3" /> Offline mode
            </div>
          )}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setActiveView("chat")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeView === "chat" ? "bg-background shadow-sm text-primary border border-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-3 w-3" /> Chat
            </button>
            <button
              onClick={() => setActiveView("diagnosis")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeView === "diagnosis" ? "bg-background shadow-sm text-primary border border-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ClipboardList className="h-3 w-3" /> Clinic
            </button>
          </div>
          {activeView === "chat" && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={startNewConversation}>
              <Plus className="w-3.5 h-3.5" /> New
            </Button>
          )}
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 shrink-0">
        {STATS.map(({ icon: Icon, value, label, sub, color, href }) => (
          <a key={label} href={href} className="bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold font-display text-foreground">{value}</span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
            <p className="text-[11px] text-primary font-medium mt-0.5 group-hover:underline">{sub} ›</p>
          </a>
        ))}
      </div>

      {/* ── Quick action chips ── */}
      {activeView === "chat" && (
        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
          {activeQuickChips.map((chip, idx) => {
            const isPersonaCustom = idx < (personaKey && PERSONA_PROMPTS[personaKey] ? PERSONA_PROMPTS[personaKey].length : 0);
            return (
              <button
                key={chip.label}
                onClick={() => handleSend(undefined, chip.prompt)}
                disabled={isStreaming}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border transition-all disabled:opacity-50",
                  isPersonaCustom
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 font-semibold shadow-xs"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-muted-foreground"
                )}
              >
                <chip.icon className="w-3.5 h-3.5 shrink-0" />
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Clinic view ── */}
      {activeView === "diagnosis" && <ProductivityDiagnosis />}

      {/* ── Chat area (no card — floats on background) ── */}
      {activeView === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">

          {/* "Today" date divider */}
          <div className="flex items-center gap-3 py-2 shrink-0">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground">Today</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ScrollArea className="flex-1 pb-2" ref={scrollRef}>
            <div className="space-y-5 pb-4">

              {/* Initial AI greeting */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                  <img src="/ai-assist-icon.png" alt="AI" className="w-5 h-5 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-muted/50 border border-border/60 px-4 py-3.5 rounded-2xl rounded-tl-sm max-w-[82%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      Hello {firstName}! I'm <strong>Co-pilot</strong>, your Productivity Advocate.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                      Before we explore businesses, ventures, or templates — I want to understand <em>you</em>. Every person is an economic node. My job is to help you discover your productive capacity and build something meaningful with it.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                      Would you like to start a <strong className="text-foreground">Productivity Consultation</strong>? Or tell me what you're working on today.
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1">{format(new Date(), "h:mm a")}</p>
                </div>
              </div>

              {/* Message thread */}
              {displayMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 border border-primary/20 overflow-hidden"
                  )}>
                    {msg.role === "user"
                      ? (firstName[0]?.toUpperCase() || "U")
                      : <img src="/ai-assist-icon.png" alt="AI" className="w-4 h-4 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    }
                  </div>

                  <div className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")} style={{ maxWidth: "82%" }}>
                    <div className={cn(
                      "rounded-2xl",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm px-4 py-3"
                        : "bg-muted/50 border border-border/60 rounded-tl-sm px-4 py-3.5"
                    )}>
                      {msg.executingTool && msg.content === "" ? (
                        <div className="flex items-center gap-2.5 py-1 text-xs text-primary font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{msg.executingTool}</span>
                        </div>
                      ) : msg.streaming && msg.content === "" ? (
                        <div className="flex items-center gap-2 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : msg.role === "user" ? (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      ) : (
                        <>
                          <RenderMarkdown content={msg.content} />
                          {msg.streaming && (
                            <span className="inline-block w-1 h-4 ml-0.5 bg-primary animate-pulse align-middle rounded-sm" />
                          )}
                          {msg.isFallback && !msg.streaming && (
                            <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 border-t border-border/40 pt-2">
                              <AlertTriangle className="h-2.5 w-2.5" /> Generated offline
                            </p>
                          )}

                          {/* Structured Action Cards from Backend Tools */}
                          {msg.actionCards && msg.actionCards.length > 0 && !msg.streaming && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                              {msg.actionCards.map((card, cardIdx) => (
                                <a
                                  key={cardIdx}
                                  href={card.url || "#"}
                                  className="flex items-start justify-between gap-3 p-3 bg-background/80 hover:bg-primary/5 border border-border/80 hover:border-primary/40 rounded-xl transition-all group"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                      {card.type === "coach_task_created" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                                       card.type === "template_recommendation" ? <Briefcase className="w-4 h-4" /> :
                                       card.type === "marketplace_results" ? <Store className="w-4 h-4" /> :
                                       card.type === "opportunity_results" ? <Target className="w-4 h-4" /> :
                                       <Sparkles className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                        {card.title || "Platform Action"}
                                      </p>
                                      {card.description && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                          {card.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                                </a>
                              ))}
                            </div>
                          )}

                          {!msg.streaming && (!msg.actionCards || msg.actionCards.length === 0) && msg.content.length > 20 && i === displayMessages.length - 1 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/40">
                              {getActionChips(msg.content).map((chip) => (
                                <a key={chip.label} href={chip.href}
                                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-background border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                                >
                                  {chip.icon}{chip.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      {format(new Date(), "h:mm a")}{msg.role === "user" && " ✓"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* ── Input bar — elevated, floats on background ── */}
          <div className="pt-3 shrink-0">
            <div className="bg-card rounded-2xl border border-border shadow-lg shadow-black/5 p-3">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <Plus className="w-[18px] h-[18px]" />
                  </button>
                  <button type="button" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                    <Mic className="w-[18px] h-[18px]" />
                  </button>
                  <button type="button" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors hidden sm:block">
                    <ImageIcon className="w-[18px] h-[18px]" />
                  </button>
                  <button type="button" className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors hidden sm:block">
                    <Paperclip className="w-[18px] h-[18px]" />
                  </button>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Co-pilot..."
                  className="resize-none flex-1 min-h-[44px] max-h-[120px] py-2.5 px-3.5 bg-muted/40 border-transparent text-sm rounded-2xl focus-visible:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 shadow-md"
                  disabled={!input.trim() || isStreaming}
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Co-pilot is your Productivity Advocate. Every response is designed to move you toward profitable outcomes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
