import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Target, Users,
  Wrench, MapPin, DollarSign, Network, Package, Brain,
  Sprout, Factory, ShoppingCart, GraduationCap, Rocket,
  Handshake, FlaskConical, Globe, TrendingUp, Activity,
  Star, CheckSquare, ArrowRight, BookOpen, Zap,
  ClipboardList, RefreshCw, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "intro" | "identity_text" | "identity_role" | "goal" | "resources" | "bottlenecks" | "report";

interface Answers {
  selfDescription: string;
  roles: string[];
  goal: string;
  resources: string[];
  bottlenecks: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  { id: "farmer", label: "Farmer / Agribusiness Owner", icon: Sprout },
  { id: "artisan", label: "Artisan / Craftsperson", icon: Wrench },
  { id: "trader", label: "Trader / Merchant", icon: ShoppingCart },
  { id: "producer", label: "Producer / Manufacturer", icon: Factory },
  { id: "engineer", label: "Engineer / Technician", icon: Wrench },
  { id: "professional", label: "Professional / Consultant", icon: Brain },
  { id: "founder", label: "Founder / Entrepreneur", icon: Rocket },
  { id: "investor", label: "Investor / Financier", icon: DollarSign },
  { id: "researcher", label: "Researcher / Analyst", icon: FlaskConical },
  { id: "enthusiast", label: "Industrial Enthusiast", icon: Star },
  { id: "student", label: "Student / Graduate", icon: GraduationCap },
  { id: "other", label: "Something else", icon: Globe },
];

const GOALS = [
  { id: "start_business", label: "Start a new business", icon: Rocket, desc: "Launch a venture from idea to operations" },
  { id: "grow_business", label: "Grow an existing business", icon: TrendingUp, desc: "Scale revenue, customers, or capacity" },
  { id: "build_product", label: "Build a product or invention", icon: Wrench, desc: "Design and manufacture something new" },
  { id: "manufacturing", label: "Develop a production system", icon: Factory, desc: "Build a repeatable manufacturing or processing system" },
  { id: "farm", label: "Improve a farm or agribusiness", icon: Sprout, desc: "Increase yield, reach markets, add value to produce" },
  { id: "find_customers", label: "Find customers or markets", icon: ShoppingCart, desc: "Expand your sales pipeline and market reach" },
  { id: "find_suppliers", label: "Find suppliers or partners", icon: Handshake, desc: "Source inputs, equipment, or collaboration" },
  { id: "learn_skill", label: "Learn a skill or trade", icon: GraduationCap, desc: "Build productive expertise in a specific field" },
  { id: "research", label: "Commercialise research", icon: FlaskConical, desc: "Turn knowledge or invention into a product" },
  { id: "community", label: "Build a community initiative", icon: Users, desc: "Organise people around a shared productive goal" },
];

const RESOURCES = [
  { id: "skills", label: "Skills & Knowledge", icon: Brain, desc: "Trade skills, professional expertise" },
  { id: "land", label: "Land or Space", icon: MapPin, desc: "Farm, workshop, warehouse, or retail space" },
  { id: "machines", label: "Machines or Equipment", icon: Factory, desc: "Tools, machinery, or production equipment" },
  { id: "capital", label: "Capital or Savings", icon: DollarSign, desc: "Cash, credit, or access to investment" },
  { id: "network", label: "Network & Relationships", icon: Network, desc: "Customers, suppliers, mentors, partners" },
  { id: "materials", label: "Raw Materials or Inputs", icon: Package, desc: "Access to production inputs" },
  { id: "customers", label: "Existing Customers", icon: Users, desc: "People who already buy from you" },
  { id: "experience", label: "Industry Experience", icon: Star, desc: "Years of exposure, local market knowledge" },
  { id: "ideas", label: "Ideas or Intellectual Property", icon: Brain, desc: "Innovations, designs, methods, concepts" },
];

const BOTTLENECKS = [
  { id: "capital", label: "Access to Funding", icon: DollarSign, desc: "I need capital to start or grow" },
  { id: "customers", label: "Finding Customers", icon: ShoppingCart, desc: "I struggle to reach paying buyers" },
  { id: "suppliers", label: "Finding Suppliers", icon: Package, desc: "I can't source reliable inputs or materials" },
  { id: "skills", label: "Skills or Knowledge Gap", icon: Brain, desc: "I need training or expertise I don't have" },
  { id: "network", label: "Limited Network", icon: Network, desc: "I lack the right connections and relationships" },
  { id: "systems", label: "Lack of Systems", icon: Activity, desc: "My processes are inconsistent or undocumented" },
  { id: "production", label: "Production Capacity", icon: Factory, desc: "I can't produce enough or at the right quality" },
  { id: "location", label: "Location or Logistics", icon: MapPin, desc: "Geography, transport, or infrastructure limits me" },
  { id: "legal", label: "Regulatory or Legal", icon: CheckSquare, desc: "I face compliance or registration barriers" },
  { id: "team", label: "Building a Team", icon: Users, desc: "I need people but struggle to find or manage them" },
];

// ─── Report generation ────────────────────────────────────────────────────────

const BOTTLENECK_ACTIONS: Record<string, { title: string; desc: string; href: string }[]> = {
  capital: [
    { title: "Browse Funding Opportunities", desc: "Grants, loans, and investment calls matched to your sector.", href: "/opportunities" },
    { title: "List on Market to Generate Revenue", desc: "Activate your sales funnel by making yourself discoverable today.", href: "/market" },
  ],
  customers: [
    { title: "List Your Business on Market", desc: "Get discovered by buyers and customers actively looking in your industry.", href: "/market" },
    { title: "Adopt a Market Entry Template", desc: "Use proven sales and marketing blueprints from the Library.", href: "/templates" },
  ],
  suppliers: [
    { title: "Browse the Marketplace", desc: "Find suppliers, processors, and equipment providers near you.", href: "/marketplace" },
    { title: "Post a Supplier Request", desc: "Let the Bizny ecosystem know what inputs you need.", href: "/opportunities" },
  ],
  skills: [
    { title: "Browse Training Templates", desc: "Find courses, guides, and skill-building blueprints in the Library.", href: "/templates" },
    { title: "Find Skilled Collaborators", desc: "Connect with professionals who can fill your knowledge gaps.", href: "/market" },
  ],
  network: [
    { title: "Join the Marketplace", desc: "Make your business visible to the entire Bizny ecosystem.", href: "/market" },
    { title: "Explore Collaboration Opportunities", desc: "Browse active partnership and collaboration calls.", href: "/opportunities" },
  ],
  systems: [
    { title: "Adopt an SOP Template", desc: "Find Standard Operating Procedures for your specific business activity.", href: "/templates" },
    { title: "Start a Venture Execution", desc: "Milestone-based tracking creates accountability and process clarity.", href: "/ventures" },
  ],
  production: [
    { title: "Find Production Templates", desc: "Capacity planning, quality control, and production system SOPs.", href: "/templates" },
    { title: "Browse Equipment Suppliers", desc: "Connect with machinery and raw material providers.", href: "/marketplace" },
  ],
  location: [
    { title: "Explore Logistics Partners", desc: "Find transport and distribution solutions in your region.", href: "/marketplace" },
    { title: "View Industry Location Targets", desc: "Understand where your industry is most active across Africa.", href: "/industry-targets" },
  ],
  legal: [
    { title: "Find Compliance Guides", desc: "Regulatory and compliance templates for your industry and country.", href: "/templates" },
    { title: "Connect with Legal Professionals", desc: "Find lawyers and compliance consultants on the Marketplace.", href: "/market" },
  ],
  team: [
    { title: "Post Collaboration Opportunities", desc: "Find co-founders, skilled employees, and interns.", href: "/opportunities" },
    { title: "Find Skilled People on Market", desc: "Browse professionals, artisans, and specialists.", href: "/market" },
  ],
};

function buildReport(answers: Answers, name: string) {
  const primaryRole = ROLES.find(r => answers.roles[0] === r.id)?.label ?? "Economic Actor";
  const goalItem = GOALS.find(g => g.id === answers.goal);
  const resourceCount = answers.resources.length;
  const capacityLevel = resourceCount >= 6 ? "Strong" : resourceCount >= 3 ? "Moderate" : "Early-stage";

  const actions = answers.bottlenecks
    .slice(0, 3)
    .flatMap(b => BOTTLENECK_ACTIONS[b] ?? [])
    .slice(0, 5);

  if (actions.length === 0) {
    actions.push(
      { title: "Browse the Template Library", desc: "Explore venture blueprints matched to your goal.", href: "/templates" },
      { title: "View Opportunities", desc: "Discover funding, partnerships, and market openings.", href: "/opportunities" },
    );
  }

  return {
    name,
    primaryRole,
    goalItem,
    capacityLevel,
    resourceCount,
    selfDescription: answers.selfDescription,
    resourceLabels: answers.resources.map(r => RESOURCES.find(res => res.id === r)?.label ?? r),
    primaryBottleneck: BOTTLENECKS.find(b => b.id === answers.bottlenecks[0]),
    allBottlenecks: answers.bottlenecks.map(b => BOTTLENECKS.find(bot => bot.id === b)?.label ?? b),
    actions,
  };
}

// ─── Stage order ──────────────────────────────────────────────────────────────

const STAGE_ORDER: Stage[] = ["intro", "identity_text", "identity_role", "goal", "resources", "bottlenecks", "report"];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Clinic() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers>({
    selfDescription: "",
    roles: [],
    goal: "",
    resources: [],
    bottlenecks: [],
  });
  const [coachingRequested, setCoachingRequested] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const handleStartCoaching = async () => {
    if (!token) return;
    setCreatingPlan(true);
    try {
      await fetch("/api/coach/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          goal: answers.goal,
          selfDescription: answers.selfDescription,
          roles: answers.roles,
          resources: answers.resources,
          bottlenecks: answers.bottlenecks,
        }),
      });
      navigate("/coach");
    } catch {
      setCreatingPlan(false);
    }
  };

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const totalStages = STAGE_ORDER.length - 1;
  const progress = stage === "report" ? 100 : (stageIndex / (totalStages - 1)) * 100;

  const goNext = () => {
    const next = STAGE_ORDER[stageIndex + 1];
    if (next) setStage(next);
  };

  const goBack = () => {
    const prev = STAGE_ORDER[stageIndex - 1];
    if (prev) setStage(prev);
  };

  const toggleRole = (id: string) => {
    setAnswers(prev => ({
      ...prev,
      roles: prev.roles.includes(id)
        ? prev.roles.filter(r => r !== id)
        : prev.roles.length < 3 ? [...prev.roles, id] : prev.roles,
    }));
  };

  const toggleResource = (id: string) => {
    setAnswers(prev => ({
      ...prev,
      resources: prev.resources.includes(id)
        ? prev.resources.filter(r => r !== id)
        : [...prev.resources, id],
    }));
  };

  const toggleBottleneck = (id: string) => {
    setAnswers(prev => ({
      ...prev,
      bottlenecks: prev.bottlenecks.includes(id)
        ? prev.bottlenecks.filter(b => b !== id)
        : prev.bottlenecks.length < 3 ? [...prev.bottlenecks, id] : prev.bottlenecks,
    }));
  };

  const canContinue = () => {
    if (stage === "identity_text") return answers.selfDescription.trim().length >= 10;
    if (stage === "identity_role") return answers.roles.length > 0;
    if (stage === "goal") return !!answers.goal;
    if (stage === "resources") return answers.resources.length > 0;
    if (stage === "bottlenecks") return answers.bottlenecks.length > 0;
    return true;
  };

  const report = stage === "report" ? buildReport(answers, firstName) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">

      {/* ── Progress bar ── */}
      {stage !== "intro" && stage !== "report" && (
        <div className="mb-6 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Productivity Consultation
            </p>
            <p className="text-[11px] text-muted-foreground">
              Stage {stageIndex} of {totalStages - 1}
            </p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full">

        {/* INTRO */}
        {stage === "intro" && (
          <div className="flex-1 flex flex-col justify-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight leading-tight mb-3">
              Welcome to the<br />
              <span className="text-primary">Productivity Clinic.</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-2">
              Hello, {firstName}. Before we explore ventures, templates, or marketplaces — I want to understand <em>you</em>.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-2">
              Every person is an economic node. You possess skills, knowledge, relationships, ideas, or resources. My job is to help you discover your productive capacity and build something meaningful with it.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              This consultation takes about 3 minutes. There are no wrong answers. Speak honestly, and I will give you an honest Productivity Report.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { step: "01", label: "Your Productive Identity", desc: "Who you are and what you bring" },
                { step: "02", label: "Your Goal", desc: "What you're trying to accomplish" },
                { step: "03", label: "Your Productive System", desc: "What you have and what you need" },
                { step: "04", label: "Productivity Report", desc: "A personalised plan for your next step" },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-bold text-primary font-display w-6 shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={goNext}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl text-base font-semibold gap-2 shadow-md"
            >
              Begin Consultation <ChevronRight className="h-5 w-5" />
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-3">
              Your answers are private. This information helps Co-pilot serve you better.
            </p>
          </div>
        )}

        {/* STAGE 1A: Self description */}
        {stage === "identity_text" && (
          <div className="flex-1 flex flex-col py-4">
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Stage 1 · Your Productive Identity</p>
              <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-2">
                Tell me what you do —
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Not your job title. What do you actually <em>build, create, grow, or move</em> in the world? Describe yourself in your own words.
              </p>
            </div>

            <Textarea
              value={answers.selfDescription}
              onChange={e => setAnswers(prev => ({ ...prev, selfDescription: e.target.value }))}
              placeholder="I grow cassava on 2 hectares and process it into flour for local restaurants. I'm also learning how to package it for export..."
              className="flex-1 resize-none text-sm leading-relaxed bg-card border-border rounded-xl p-4 min-h-[180px] focus-visible:ring-primary/30"
              autoFocus
            />

            <p className="text-[11px] text-muted-foreground mt-2">
              {answers.selfDescription.length < 10 ? "Write at least a sentence or two." : `${answers.selfDescription.length} characters — good start.`}
            </p>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={goBack} className="gap-1.5 h-11">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 1B: Role selection */}
        {stage === "identity_role" && (
          <div className="flex-1 flex flex-col py-4">
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Stage 1 · Your Productive Identity</p>
              <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-2">
                Which of these captures<br />your economic role?
              </h2>
              <p className="text-sm text-muted-foreground">Select up to 3. Africa's economy has more actors than just founders.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pb-2">
              {ROLES.map(role => {
                const Icon = role.icon;
                const sel = answers.roles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
                      sel
                        ? "bg-primary/5 border-primary text-primary"
                        : "bg-card border-border hover:border-primary/30 hover:bg-primary/5 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      sel ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">{role.label}</span>
                    {sel && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            {answers.roles.length > 0 && (
              <p className="text-xs text-primary font-semibold mt-2">{answers.roles.length} selected</p>
            )}

            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={goBack} className="gap-1.5 h-11">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 2: Goal */}
        {stage === "goal" && (
          <div className="flex-1 flex flex-col py-4">
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Stage 2 · Your Goal</p>
              <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-2">
                What are you trying<br />to accomplish?
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose the one that best matches where you are right now. This becomes the centre of your Productivity Report.
              </p>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pb-2">
              {GOALS.map(goal => {
                const Icon = goal.icon;
                const sel = answers.goal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setAnswers(prev => ({ ...prev, goal: goal.id }))}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all",
                      sel
                        ? "bg-primary/5 border-primary"
                        : "bg-card border-border hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      sel ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("w-4 h-4", sel ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight", sel ? "text-primary" : "text-foreground")}>
                        {goal.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{goal.desc}</p>
                    </div>
                    {sel && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={goBack} className="gap-1.5 h-11">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 3A: Resources */}
        {stage === "resources" && (
          <div className="flex-1 flex flex-col py-4">
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Stage 3 · Your Productive System</p>
              <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-2">
                What do you already have?
              </h2>
              <p className="text-sm text-muted-foreground">
                Select every resource available to you right now. Be generous — these are your productive inputs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto pb-2">
              {RESOURCES.map(res => {
                const Icon = res.icon;
                const sel = answers.resources.includes(res.id);
                return (
                  <button
                    key={res.id}
                    onClick={() => toggleResource(res.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      sel
                        ? "bg-primary/5 border-primary"
                        : "bg-card border-border hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      sel ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("w-4 h-4", sel ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight", sel ? "text-primary" : "text-foreground")}>
                        {res.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{res.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all",
                      sel ? "border-primary bg-primary" : "border-border"
                    )}>
                      {sel && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            {answers.resources.length > 0 && (
              <p className="text-xs text-primary font-semibold mt-2">{answers.resources.length} selected</p>
            )}

            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={goBack} className="gap-1.5 h-11">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 3B: Bottlenecks */}
        {stage === "bottlenecks" && (
          <div className="flex-1 flex flex-col py-4">
            <div className="mb-6">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Stage 3 · Your Productive System</p>
              <h2 className="text-2xl font-bold font-display tracking-tight leading-tight mb-2">
                What's holding you back?
              </h2>
              <p className="text-sm text-muted-foreground">
                Be honest. Every system has weak components. Identifying them is the first step to fixing them. Select up to 3.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto pb-2">
              {BOTTLENECKS.map(bot => {
                const Icon = bot.icon;
                const sel = answers.bottlenecks.includes(bot.id);
                const maxed = answers.bottlenecks.length >= 3 && !sel;
                return (
                  <button
                    key={bot.id}
                    onClick={() => !maxed && toggleBottleneck(bot.id)}
                    disabled={maxed}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      sel ? "bg-primary/5 border-primary" : "bg-card border-border",
                      maxed ? "opacity-40 cursor-not-allowed" : "hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      sel ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Icon className={cn("w-4 h-4", sel ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight", sel ? "text-primary" : "text-foreground")}>
                        {bot.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{bot.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all",
                      sel ? "border-primary bg-primary" : "border-border"
                    )}>
                      {sel && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>

            {answers.bottlenecks.length > 0 && (
              <p className="text-xs text-primary font-semibold mt-2">{answers.bottlenecks.length} of 3 selected</p>
            )}

            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={goBack} className="gap-1.5 h-11">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-semibold gap-2"
              >
                Generate My Report <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 4: Report */}
        {stage === "report" && report && (
          <div className="flex-1 flex flex-col py-4">

            {/* Header */}
            <div className="mb-6 p-5 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1">Productivity Report</p>
                  <h2 className="text-xl font-bold font-display tracking-tight text-foreground">
                    {report.primaryRole}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{report.goalItem?.label}</p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold shrink-0",
                  report.capacityLevel === "Strong" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                  report.capacityLevel === "Moderate" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                )}>
                  {report.capacityLevel} Capacity
                </div>
              </div>

              {report.selfDescription && (
                <blockquote className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 leading-relaxed">
                  "{report.selfDescription.slice(0, 180)}{report.selfDescription.length > 180 ? "…" : ""}"
                </blockquote>
              )}
            </div>

            {/* Available resources */}
            {report.resourceLabels.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">What You Have</p>
                <div className="flex flex-wrap gap-2">
                  {report.resourceLabels.map(r => (
                    <span key={r} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                      <CheckCircle2 className="w-3 h-3" /> {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Primary bottleneck analysis */}
            {report.primaryBottleneck && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Primary Bottleneck</p>
                <p className="text-sm font-semibold text-foreground">{report.primaryBottleneck.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{report.primaryBottleneck.desc}</p>
                {report.allBottlenecks.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Also flagged: {report.allBottlenecks.slice(1).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Recommended actions */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Recommended Actions</p>
              <div className="space-y-2">
                {report.actions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all group cursor-pointer">
                      <span className="text-[11px] font-bold text-primary font-display w-5 shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                          {action.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Execution coaching CTA */}
            {!coachingRequested ? (
              <div className="mb-5 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5">
                <p className="text-sm font-bold text-foreground mb-1">Would you like Bizny to coach you through this plan?</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  The Productivity Coach converts your recommendations into actionable daily tasks — with evidence collection, blocker tracking, and weekly progress reviews.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleStartCoaching}
                    disabled={creatingPlan}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 rounded-xl text-sm font-semibold gap-2 shadow-md"
                  >
                    {creatingPlan
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating your plan...</>
                      : <><Zap className="w-4 h-4" /> Yes, Build My Execution Plan</>
                    }
                  </Button>
                </div>
                <button
                  onClick={() => setCoachingRequested(true)}
                  className="text-[11px] text-muted-foreground mt-2 w-full text-center hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Productivity Report saved.</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Visit the Productivity Coach to start executing your plan.
                </p>
                <Link href="/coach">
                  <Button className="w-full bg-primary text-white h-10 rounded-xl text-sm gap-2">
                    <Zap className="w-4 h-4" /> Open Productivity Coach
                  </Button>
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Explore Bizny</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: BookOpen, label: "Template Library", href: "/templates" },
                  { icon: Target, label: "Opportunities", href: "/opportunities" },
                  { icon: Activity, label: "My Ventures", href: "/ventures" },
                  { icon: Zap, label: "Co-pilot", href: "/copilot" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold text-foreground">{label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setStage("intro");
                setAnswers({ selfDescription: "", roles: [], goal: "", resources: [], bottlenecks: [] });
                setCoachingRequested(false);
              }}
              className="w-full gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Start a New Consultation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
