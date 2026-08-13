import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BiznyLogo } from "@/components/BiznyLogo";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Send,
  Building2,
  Lightbulb,
  Briefcase,
  Sprout,
  Wrench,
  GraduationCap,
  Users,
  Brain,
  Globe,
  ArrowRight,
  Database,
  Search,
  BookOpen,
  ShoppingBag,
  Target,
  ShieldCheck,
  ShieldAlert,
  Bot,
  HelpCircle,
  Award,
  CheckCircle2,
  Lock,
  ExternalLink,
  Flame,
  Zap,
} from "lucide-react";

// List of African countries + top global destinations
const AFRICAN_COUNTRIES = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Rwanda", "Egypt", "Ethiopia",
  "Tanzania", "Uganda", "Côte d'Ivoire", "Senegal", "Cameroon", "Zambia",
  "Zimbabwe", "Morocco", "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso",
  "Burundi", "Cape Verde", "Central African Republic", "Chad", "Comoros", "DR Congo",
  "Republic of Congo", "Djibouti", "Equatorial Guinea", "Eritrea", "Eswatini",
  "Gabon", "Gambia", "Guinea", "Guinea-Bissau", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Mozambique", "Namibia",
  "Niger", "Sao Tome & Principe", "Seychelles", "Sierra Leone", "Somalia",
  "South Sudan", "Sudan", "Togo", "Tunisia", "United Kingdom", "United States", "Canada", "Other Global Location"
];

const ROLES = [
  { id: "business_owner", label: "I run an operating business", icon: Building2 },
  { id: "starting_business", label: "I'm trying to start a business", icon: Briefcase },
  { id: "idea_stage", label: "I have an idea but haven't started yet", icon: Lightbulb },
  { id: "farmer", label: "I'm a farmer or agricultural producer", icon: Sprout },
  { id: "artisan", label: "I'm an artisan or skilled technical worker", icon: Wrench },
  { id: "manufacturer", label: "I make or manufacture products", icon: Building2 },
  { id: "student", label: "I'm a student", icon: GraduationCap },
  { id: "researcher", label: "I'm a researcher or academic", icon: Search },
  { id: "developer", label: "I'm a developer or technology builder", icon: Bot },
  { id: "professional", label: "I'm a working professional", icon: Award },
  { id: "community", label: "I work on community or social projects", icon: Users },
  { id: "opportunities", label: "I'm actively looking for productive opportunities", icon: Target },
];

const STAGES = [
  "Exploring", "Learning", "Planning", "Starting", "Operating", "Growing", "Scaling", "Rebuilding"
];

const GOALS = [
  "Start something new", "Build a business", "Produce/manufacture something",
  "Improve an existing operation", "Farm / Agricultural production", "Build technology or software",
  "Learn a practical skill", "Find employment / Work", "Find reliable customers", "Find reliable suppliers",
  "Find funding / Investment", "Conduct research", "Build a community project", "Develop an invention", "Find co-founders or collaborators"
];

const EXISTING_RESOURCES = [
  "Money / Capital", "Land / Physical space", "Equipment / Machinery", "Raw materials",
  "Technical skills", "Business skills", "Agricultural knowledge", "Production knowledge",
  "Professional expertise", "Existing customers", "Reliable suppliers", "Community trust & relationships",
  "Team members", "Smartphone / Internet", "Dedicated time", "Nothing significant yet"
];

const OBSTACLES = [
  "Lack of capital / funding", "Lack of practical information", "Difficulty finding reliable suppliers",
  "Difficulty finding customers", "Lack of technical skills", "Lack of equipment / machines",
  "Lack of trustworthy partners / team", "Transportation & logistics", "Regulations & compliance",
  "Lack of market access", "Difficulty executing consistently", "Fear of failure", "Unsure which opportunity to pursue"
];

const FEATURE_CARDS = [
  {
    id: "copilot",
    title: "AI Copilot",
    desc: "Helps understand your goal, research markets, create execution plans, and guide step-by-step progress.",
    icon: Bot,
  },
  {
    id: "repository",
    title: "Knowledge Repository",
    desc: "A structured library of practical processes, production methods, business models, and reusable blueprints.",
    icon: BookOpen,
  },
  {
    id: "directory",
    title: "Verified Directory",
    desc: "Discover real businesses, producers, machine owners, professionals, and suppliers across Africa.",
    icon: Building2,
  },
  {
    id: "marketplace",
    title: "Resource Marketplace",
    desc: "Discover products, idle equipment, spare raw materials, tools, and services.",
    icon: ShoppingBag,
  },
  {
    id: "project_center",
    title: "Project Development Center",
    desc: "Turn raw ideas into structured projects, milestones, tasks, and team action boards.",
    icon: Target,
  },
  {
    id: "community_knowledge",
    title: "Community Intelligence",
    desc: "Learn directly from people who have practical hands-on experience in your specific field and location.",
    icon: Users,
  },
  {
    id: "opportunities",
    title: "Opportunities Board",
    desc: "Discover contracts, grants, partnerships, procurement requests, and jobs.",
    icon: Sparkles,
  },
  {
    id: "trust",
    title: "Trust & Verification Engine",
    desc: "Systems for verifying people, businesses, equipment, claims, and project track records.",
    icon: ShieldCheck,
  },
];

export default function ResearchPortal() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<number>(0); // 0 = Intro Landing, 1-9 = Survey steps, 10 = Done
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Survey Form State
  const [formData, setFormData] = useState({
    roles: [] as string[],
    country: "Nigeria",
    stage: "Starting",
    goals: [] as string[],
    goalDetail: "",
    successVision: "",
    resources: [] as string[],
    biggestWishResource: "",
    obstacles: [] as string[],
    biggestObstacle: "",
    obstacleDetail: "",
    neededOnlineInfo: "",
    hasOnlineInfoGap: "Yes",
    practicalKnowledgeSources: [] as string[],
    peerLearningRating: 5,
    aiComfort: 4,
    aiTrustedTasks: [] as string[],
    aiTrustFactor: "",
    topFeatures: [] as string[],
    singleProblemToSolve: "",
    usageFrequency: "Several times a week",
    pricingInterest: "Yes",
    pricingRange: "$5 - $20 / month",
    whatMakesPaidWorthwhile: [] as string[],
    communityInterest: "Yes",
    name: "",
    email: "",
    whatsapp: "",
    communityContribution: [] as string[],
  });

  // Local Storage Draft Recovery
  useEffect(() => {
    const saved = localStorage.getItem("bizny_research_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (step > 0 && step < 10) {
      localStorage.setItem("bizny_research_draft", JSON.stringify(formData));
    }
  }, [formData, step]);

  const toggleArrayItem = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/research/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.submissionId) {
        setSubmittedId(data.submissionId);
        localStorage.removeItem("bizny_research_draft");
        setStep(10); // Completion screen
      } else {
        alert(data.error || "Submission failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TOTAL_STEPS = 9;

  return (
    <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans antialiased pb-20">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#072833]/80 backdrop-blur-md border-b border-[#CBE5EE]/50 dark:border-[#0F3B4A] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="cursor-pointer hover:opacity-90 transition-opacity">
            <BiznyLogo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-[#033B4C]/10 text-[#033B4C] dark:bg-[#79A7B7]/20 dark:text-[#98CBD9]">
              Founding Research Portal
            </span>
            <Link
              href="/"
              className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#033B4C] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Main Web App <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Step Progress Bar (when inside questionnaire) */}
        {step >= 1 && step <= TOTAL_STEPS && (
          <div className="mb-8 bg-white dark:bg-[#072833] rounded-2xl p-4 shadow-sm border border-[#CBE5EE]/60 dark:border-[#0F3B4A]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                Step 0{step} of 0{TOTAL_STEPS}
              </span>
              <span>{Math.round((step / TOTAL_STEPS) * 100)}% Completed</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#033B4C] dark:bg-[#79A7B7] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
              <span>Auto-saved locally</span>
              <span>Est. time remaining: {Math.max(1, Math.round((TOTAL_STEPS - step) * 0.7))} min</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 0: INTRO LANDING SCREEN                             */}
        {/* ========================================================= */}
        {step === 0 && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Card */}
            <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-10 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#033B4C]/10 dark:bg-[#79A7B7]/20 text-[#033B4C] dark:text-[#98CBD9] text-xs font-semibold">
                <Flame className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
                BIZNY FOUNDING RESEARCH
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#033B4C] dark:text-white font-display leading-tight">
                Imagine What Could Happen If We Connected What Africa Already Has.
              </h1>

              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                Imagine you are building something. You know what you want to create, but you need a particular machine, material, supplier, expert, or piece of information to move faster.
                Instead of spending weeks searching blindly, <strong>Bizny helps you find it.</strong>
              </p>

              {/* The Core Thesis Box */}
              <div className="bg-[#F4F8FA] dark:bg-[#041B23] rounded-2xl p-5 border border-[#CBE5EE]/80 dark:border-[#0F3B4A] space-y-3">
                <p className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                  The Founder's Thesis
                </p>
                <p className="text-xs sm:text-sm italic text-gray-700 dark:text-gray-300 leading-relaxed">
                  "Somewhere else, someone already has exactly what you need — but neither of you knows the other exists.
                  That is the problem we want to solve. Bizny is being built as a coordination and productivity platform for people building Africa’s real economy."
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-[#033B4C]" />
                  <span>Darryl Akpamba — Founder, Bizny</span>
                </div>
              </div>

              {/* Visual Flow Explanation */}
              <div className="py-2">
                <p className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-3">
                  How Bizny Coordinates Outcomes
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
                  <div className="bg-[#033B4C]/5 dark:bg-[#79A7B7]/10 p-3 rounded-xl border border-[#CBE5EE]">
                    <Lightbulb className="w-5 h-5 mx-auto mb-1 text-[#033B4C] dark:text-[#79A7B7]" />
                    <span>IDEA</span>
                  </div>
                  <div className="bg-[#033B4C]/5 dark:bg-[#79A7B7]/10 p-3 rounded-xl border border-[#CBE5EE]">
                    <Database className="w-5 h-5 mx-auto mb-1 text-[#033B4C] dark:text-[#79A7B7]" />
                    <span>KNOWLEDGE</span>
                  </div>
                  <div className="bg-[#033B4C]/5 dark:bg-[#79A7B7]/10 p-3 rounded-xl border border-[#CBE5EE]">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-[#033B4C] dark:text-[#79A7B7]" />
                    <span>COORDINATION</span>
                  </div>
                  <div className="bg-[#033B4C]/5 dark:bg-[#79A7B7]/10 p-3 rounded-xl border border-[#CBE5EE]">
                    <Send className="w-5 h-5 mx-auto mb-1 text-[#033B4C] dark:text-[#79A7B7]" />
                    <span>ACTION</span>
                  </div>
                  <div className="bg-[#033B4C] text-white p-3 rounded-xl col-span-2 sm:col-span-1 flex flex-col justify-center items-center">
                    <CheckCircle2 className="w-5 h-5 mb-1" />
                    <span>OUTCOME</span>
                  </div>
                </div>
              </div>

              {/* $3M Gemini AI Competition Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Participating in the $3 Million AI Competition:</strong> We are testing this thesis with Google Gemini AI technology to give African builders real execution tools. Your responses directly shape what we submit and build.
                </div>
              </div>

              {/* Call to Action */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-4 px-8 rounded-2xl bg-[#033B4C] hover:bg-[#054a5f] text-white font-semibold text-base sm:text-lg shadow-lg shadow-[#033B4C]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>START THE RESEARCH</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>Takes ~5–7 minutes</span>
                  <span>100% Confidential</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: SECTION ONE — YOU                                 */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                01 / ABOUT YOU
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                Which best describes you?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Select all roles that apply to your current situation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const selected = formData.roles.includes(r.label);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleArrayItem("roles", r.label)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      selected
                        ? "bg-[#033B4C] text-white border-[#033B4C] shadow-md"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200 hover:border-[#033B4C]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${selected ? "text-white" : "text-[#033B4C] dark:text-[#79A7B7]"}`} />
                    <span className="text-xs sm:text-sm font-medium">{r.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  Where are you currently based?
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#033B4C] outline-none"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  What stage are you currently in?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STAGES.map((s) => {
                    const selected = formData.stage === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, stage: s }))}
                        className={`p-3 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-700 dark:text-gray-300 hover:border-[#033B4C]"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: SECTION TWO — WHAT ARE YOU TRYING TO DO?          */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                02 / YOUR GOALS & OBJECTIVES
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                What are you currently trying to accomplish?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Select all primary goals that apply.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GOALS.map((g) => {
                const selected = formData.goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleArrayItem("goals", g)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200 hover:border-[#033B4C]"
                    }`}
                  >
                    <span>{g}</span>
                    {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                  Tell us more about what you're trying to accomplish:
                </label>
                <textarea
                  rows={3}
                  value={formData.goalDetail}
                  onChange={(e) => setFormData((p) => ({ ...p, goalDetail: e.target.value }))}
                  placeholder="Don't worry about getting the wording perfect. Tell us what you would like to make happen..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                  What would success look like for you in the next 12 months?
                </label>
                <textarea
                  rows={3}
                  value={formData.successVision}
                  onChange={(e) => setFormData((p) => ({ ...p, successVision: e.target.value }))}
                  placeholder="e.g. Having 100 paying customers, installing a cassava processing machine, securing a reliable vendor..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: SECTION THREE — WHAT DO YOU ALREADY HAVE?         */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                03 / EXISTING RESOURCES
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                What resources do you currently have access to?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                People often have more assets than they realize. Select all that apply.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXISTING_RESOURCES.map((res) => {
                const selected = formData.resources.includes(res);
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => toggleArrayItem("resources", res)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200 hover:border-[#033B4C]"
                    }`}
                  >
                    <span>{res}</span>
                    {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                What is the SINGLE biggest resource you wish you had access to right now?
              </label>
              <select
                value={formData.biggestWishResource}
                onChange={(e) => setFormData((p) => ({ ...p, biggestWishResource: e.target.value }))}
                className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#033B4C]"
              >
                <option value="">-- Select single most critical missing resource --</option>                {EXISTING_RESOURCES.filter((r) => r !== "Nothing significant yet").map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: SECTION FOUR — WHAT IS GETTING IN THE WAY?        */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                04 / CHALLENGES & CONSTRAINTS
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                What are the biggest things preventing you from making progress?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Select up to 5 main bottlenecks.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OBSTACLES.map((obs) => {
                const selected = formData.obstacles.includes(obs);
                return (
                  <button
                    key={obs}
                    type="button"
                    onClick={() => toggleArrayItem("obstacles", obs)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                      selected
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200 hover:border-[#033B4C]"
                    }`}
                  >
                    <span>{obs}</span>
                    {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  Which ONE causes you the MOST difficulty?
                </label>
                <select
                  value={formData.biggestObstacle}
                  onChange={(e) => setFormData((p) => ({ ...p, biggestObstacle: e.target.value }))}
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-[#033B4C]"
                >
                  <option value="">-- Select single biggest challenge --</option>                  {OBSTACLES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                  Tell us more about why this is difficult:
                </label>
                <textarea
                  rows={3}
                  value={formData.obstacleDetail}
                  onChange={(e) => setFormData((p) => ({ ...p, obstacleDetail: e.target.value }))}
                  placeholder="Give a brief example of a situation where you felt stuck..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: SECTION FIVE — KNOWLEDGE + COMMUNITY              */}
        {/* ========================================================= */}
        {step === 5 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                05 / KNOWLEDGE & COMMUNITY INTELLIGENCE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                Practical Knowledge & Community Experience
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                "Some of the most valuable knowledge isn't on websites — it lives inside farms, workshops, local trade groups, and experienced practitioners."
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  Have you ever needed practical information that was hard to find online?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, hasOnlineInfoGap: opt }))}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold cursor-pointer ${
                        formData.hasOnlineInfoGap === opt
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                  What kind of practical information were you looking for?
                </label>
                <textarea
                  rows={3}
                  value={formData.neededOnlineInfo}
                  onChange={(e) => setFormData((p) => ({ ...p, neededOnlineInfo: e.target.value }))}
                  placeholder="e.g. Real local prices for welding machines in Kano, how to preserve chili peppers without electricity, exact import custom procedures..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  How valuable would it be to learn directly from experienced peers in your field?
                </label>
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A]">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, peerLearningRating: rating }))}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        formData.peerLearningRating === rating
                          ? "bg-[#033B4C] text-white shadow-md"
                          : "bg-white dark:bg-[#072833] text-gray-700 dark:text-gray-300 border border-[#CBE5EE]"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 px-1">
                  <span>1 = Not valuable</span>
                  <span>5 = Extremely valuable</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: SECTION SIX — AI ASSISTANCE                      */}
        {/* ========================================================= */}
        {step === 6 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                06 / AI CO-PILOT ASSISTANCE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                How would you use AI to achieve your goals?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                AI gives us the power to turn raw ideas into concrete execution steps.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  How comfortable are you using an AI assistant for important business goals?
                </label>
                <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A]">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, aiComfort: rating }))}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        formData.aiComfort === rating
                          ? "bg-[#033B4C] text-white shadow-md"
                          : "bg-white dark:bg-[#072833] text-gray-700 dark:text-gray-300 border border-[#CBE5EE]"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1 px-1">
                  <span>1 = Very uncomfortable</span>
                  <span>5 = Highly enthusiastic</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  What tasks would you trust an AI assistant to help you with?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Market research & feasibility", "Creating execution plans & steps",
                    "Cost calculations & financial planning", "Finding reliable suppliers & vendors",
                    "Finding customers or buyers", "Drafting contracts & agreements",
                    "Recommending next action steps", "Project management & reminders"
                  ].map((task) => {
                    const selected = formData.aiTrustedTasks.includes(task);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => toggleArrayItem("aiTrustedTasks", task)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium cursor-pointer flex items-center justify-between ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span>{task}</span>
                        {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                  What would make you trust an AI assistant more?
                </label>
                <textarea
                  rows={2}
                  value={formData.aiTrustFactor}
                  onChange={(e) => setFormData((p) => ({ ...p, aiTrustFactor: e.target.value }))}
                  placeholder="e.g. Grounding answers in verified local data, showing sources, human verification..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(7)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 7: SECTION SEVEN — THE BIZNY CONCEPT                 */}
        {/* ========================================================= */}
        {step === 7 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                07 / THE BIZNY SYSTEM CONCEPT
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                Which Bizny features would be most valuable to you?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Select the modules you would use most frequently.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURE_CARDS.map((feat) => {
                const Icon = feat.icon;
                const selected = formData.topFeatures.includes(feat.title);
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => toggleArrayItem("topFeatures", feat.title)}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer ${
                      selected
                        ? "bg-[#033B4C] text-white border-[#033B4C] shadow-md"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200 hover:border-[#033B4C]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selected ? "bg-white/20 text-white" : "bg-[#033B4C]/10 text-[#033B4C] dark:text-[#79A7B7]"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="text-xs sm:text-sm font-bold">{feat.title}</p>
                    <p className={`text-[11px] sm:text-xs leading-relaxed ${selected ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                      {feat.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1.5">
                If Bizny could solve ONE problem for you extremely well, what should it solve?
              </label>
              <textarea
                rows={3}
                value={formData.singleProblemToSolve}
                onChange={(e) => setFormData((p) => ({ ...p, singleProblemToSolve: e.target.value }))}
                placeholder="Be specific! What single barrier holding you back would transform your work if solved?"
                className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(6)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(8)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 8: SECTION EIGHT — ADOPTION & PRICING                 */}
        {/* ========================================================= */}
        {step === 8 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                08 / ADOPTION & SUSTAINABILITY
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                How would you adopt and value Bizny?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                We want to build a sustainable platform that provides immense real-world value.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  If Bizny genuinely helped you accomplish important goals, how often would you use it?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Once in a while", "Monthly", "Weekly", "Several times a week", "Almost every day"].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, usageFrequency: freq }))}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold cursor-pointer ${
                        formData.usageFrequency === freq
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  Would you consider paying for a premium version that consistently helped you achieve goals?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Yes", "Maybe", "No", "Depends on value"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, pricingInterest: opt }))}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold cursor-pointer ${
                        formData.pricingInterest === opt
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  What monthly price range would you consider reasonable for a business tool like Bizny?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Free version only",
                    "$2 - $5 / month (~₦3,000 - ₦8,000)",
                    "$5 - $20 / month (~₦8,000 - ₦32,000)",
                    "$20 - $50 / month (~₦32,000 - ₦80,000)",
                    "$50+ / month (Enterprise & Pro)",
                    "Not sure yet"
                  ].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, pricingRange: range }))}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer flex items-center justify-between ${
                        formData.pricingRange === range
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span>{range}</span>
                      {formData.pricingRange === range && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(7)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(9)}
                className="px-7 py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 9: SECTION NINE — FOUNDING COMMUNITY & SUBMIT       */}
        {/* ========================================================= */}
        {step === 9 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-6 animate-fade-in">
            <div>
              <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider">
                09 / JOIN THE BIZNY FOUNDING COMMUNITY
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white mt-1">
                Would you like to help shape Bizny before launch?
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Join our founding group of African builders and early testers.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["Yes", "Maybe", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, communityInterest: opt }))}
                  className={`p-3.5 rounded-xl border text-center text-xs font-semibold cursor-pointer ${
                    formData.communityInterest === opt
                      ? "bg-[#033B4C] text-white border-[#033B4C]"
                      : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Darryl Akpamba"
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-1">
                  WhatsApp Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+234 800 000 0000"
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] uppercase tracking-wider mb-2">
                  How would you most like to contribute?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Test early software versions", "Provide research feedback",
                    "Contribute practical industry knowledge", "Join founding WhatsApp community",
                    "Explore partnership / co-building", "Stay updated on launch"
                  ].map((contrib) => {
                    const selected = formData.communityContribution.includes(contrib);
                    return (
                      <button
                        key={contrib}
                        type="button"
                        onClick={() => toggleArrayItem("communityContribution", contrib)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium cursor-pointer flex items-center justify-between ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] border-[#CBE5EE] dark:border-[#0F3B4A] text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span>{contrib}</span>
                        {selected && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep(8)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-8 py-4 rounded-2xl bg-[#033B4C] hover:bg-[#054a5f] text-white font-bold text-base transition-all shadow-lg shadow-[#033B4C]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving Submission...</span>
                ) : (
                  <>
                    <span>SUBMIT RESEARCH</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 10: FINAL COMPLETION SCREEN                          */}
        {/* ========================================================= */}
        {step === 10 && (
          <div className="bg-white dark:bg-[#072833] rounded-3xl p-8 sm:p-12 shadow-sm border border-[#CBE5EE] dark:border-[#0F3B4A] text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-[#033B4C] dark:text-white font-display">
              THANK YOU!
            </h1>

            <p className="text-gray-600 dark:text-gray-300 text-base max-w-xl mx-auto leading-relaxed">
              Your real-world experience will help us build Bizny around real people, real challenges, and real productive opportunities across Africa.
            </p>

            <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] text-xs text-gray-600 dark:text-gray-400 space-y-1 inline-block">
              <p>Submission ID: <code className="font-mono text-[#033B4C] dark:text-[#79A7B7] font-bold">{submittedId || "sub_recorded"}</code></p>
              <p>Saved securely to Bizny Founding Database</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>EXPLORE BIZNY WEB APP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/admin/research"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>Founder Research Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
