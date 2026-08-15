import React, { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { BiznyLogo } from "@/components/BiznyLogo";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Brain,
  Layers,
  Sparkles,
  Users,
  Building2,
  Globe,
  RefreshCw,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  Compass,
  FileCheck,
  Star,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  MessageSquare,
  Cpu,
  Target,
  Box,
  ShoppingCart,
  Zap,
} from "lucide-react";

// Image Assets
import introEcosystemImg from "@/assets/images/african_ecosystem_intro_1786767886299.jpg";
import builderPortraitImg from "@/assets/images/african_builder_portrait_1786767900966.jpg";
import coordinationImg from "@/assets/images/coordination_challenge_1786767914934.jpg";
import productionLandscapeImg from "@/assets/images/african_production_landscape_1786767926436.jpg";
import discoveryMethodsImg from "@/assets/images/current_discovery_methods_1786767939258.jpg";
import trustFacilityImg from "@/assets/images/trust_verification_facility_1786767952414.jpg";
import creatorExecutionImg from "@/assets/images/creator_adopter_execution_1786767964941.jpg";
import panAfricanHubImg from "@/assets/images/pan_african_commerce_hub_1786767978304.jpg";

// Comprehensive Country Directory (All 54 African nations + key global regions)
const ALL_COUNTRIES = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Egypt", "Rwanda", "Ethiopia",
  "Tanzania", "Uganda", "Côte d'Ivoire", "Senegal", "Morocco", "Algeria",
  "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde",
  "Cameroon", "Central African Republic", "Chad", "Comoros",
  "Congo (Democratic Republic)", "Congo (Republic)", "Djibouti", "Equatorial Guinea",
  "Eritrea", "Eswatini", "Gabon", "Gambia", "Guinea", "Guinea-Bissau",
  "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Mozambique", "Namibia", "Niger",
  "São Tomé and Príncipe", "Seychelles", "Sierra Leone", "Somalia",
  "South Sudan", "Sudan", "Togo", "Tunisia", "Zambia", "Zimbabwe",
  "United Kingdom", "United States", "Canada", "France", "Germany",
  "United Arab Emirates", "China", "India", "Brazil", "Other (Global)",
];

const AUTOSAVE_STORAGE_KEY = "bizny_founding_research_draft_v2";

export default function ResearchPortal() {
  // Survey step state
  // Step 0 = Intro
  // Steps 1+ = Dynamic Questions
  // Final Step = Thank You
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // Survey Data State
  const [formData, setFormData] = useState({
    // Q1: Who are you & where are you based
    roles: [] as string[],
    roleOther: "",
    country: "",
    cityRegion: "",

    // Q2: What are you trying to accomplish
    objectiveDescription: "",
    objectiveCategories: [] as string[],
    objectiveOther: "",

    // Q3: Last time you got stuck
    stuckDescription: "",
    stuckOutcome: [] as string[],
    stuckOutcomeOther: "",
    stuckFrustration: "",

    // Q4: Current discovery methods
    discoveryChannels: [] as string[],
    discoveryOther: "",
    discoveryMissing: "",

    // Q5: Trust
    trustFactors: [] as string[],
    trustFactorsOther: "",
    trustDealBreaker: "",

    // Q6: What do you have (resources)
    resourcesHave: [] as string[],
    resourcesOther: "",
    hasShareableResource: "" as "Yes" | "Maybe" | "No" | "",
    shareableResourceDescription: "",

    // Q7: What do you need most
    biggestNeed: "",
    biggestNeedDetails: "",

    // Adaptive Module A: Creator
    isCreatorExperienced: "" as "Yes" | "No" | "Not sure" | "",
    creatorSolutionDescription: "",
    creatorMonetizationPrefs: [] as string[],
    creatorMonetizationOther: "",
    creatorConcerns: [] as string[],
    creatorConcernsOther: "",
    creatorComfortConditions: "",

    // Adaptive Module B: Adopter
    isAdopterExperienced: "" as "Yes" | "No" | "Not sure" | "",
    adopterReplicationDescription: "",
    adopterBarriers: [] as string[],
    adopterBarriersOther: "",
    adopterMonitoringUtility: null as number | null,
    adopterMonitoringNeeds: "",

    // Adaptive Module C: Marketplace & Future Demand
    hasPreOrderExperience: "" as "Yes" | "No" | "Not sure" | "",
    preOrderDescription: "",
    preOrderTimeframe: "",
    futureDemandUtility: null as number | null,
    futureDemandTrustRequirements: "",
    marketplaceDiscoveryInterests: [] as string[],
    marketplaceDiscoveryOther: "",

    // Adaptive Module D: Cross-Border
    crossBorderTrustRequirements: [] as string[],
    crossBorderTrustOther: "",
    crossBorderBiggestObstacle: "",

    // Q8: AI
    aiObstacleToRemove: "",
    aiTrustedTasks: [] as string[],
    aiTrustedTasksOther: "",
    aiUntrustedDecisions: "",

    // Q9: The One Problem (Unbiased expectation)
    theOneExpectation: "",

    // Q10: Structured Marketplace Signals
    marketplaceSignals: {
      iNeed: { active: false, category: "", description: "", location: "", timeframe: "" },
      iCanProvide: { active: false, category: "", description: "", location: "", capacity: "" },
      iHaveSolution: { active: false, category: "", description: "", targetAudience: "", stage: "" },
      iWantToSource: { active: false, category: "", description: "", destination: "", quantity: "" },
    },

    // Optional Final Open Question
    unaskedInsights: "",

    // Optional Follow-up
    willingForInterview: "" as "Yes" | "No" | "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactTopic: "",
  });

  // Check and restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
          if (parsed.currentStep && parsed.currentStep > 0) {
            setDraftRestored(true);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore draft:", e);
    }
  }, []);

  // Autosave to localStorage on changes
  useEffect(() => {
    if (currentStep > 0 && !isCompleted) {
      try {
        localStorage.setItem(
          AUTOSAVE_STORAGE_KEY,
          JSON.stringify({
            currentStep,
            formData,
            lastSaved: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn("Autosave failed:", e);
      }
    }
  }, [formData, currentStep, isCompleted]);

  // Determine Branch Conditions
  const isCreatorBranch = useMemo(() => {
    return (
      formData.roles.includes("I create solutions, processes, designs or methods") ||
      formData.resourcesHave.includes("Designs/processes") ||
      formData.resourcesHave.includes("Intellectual property") ||
      formData.hasShareableResource === "Yes"
    );
  }, [formData.roles, formData.resourcesHave, formData.hasShareableResource]);

  const isAdopterBranch = useMemo(() => {
    return (
      formData.roles.includes("I am building a business") ||
      formData.roles.includes("I am exploring what I could build") ||
      formData.objectiveCategories.includes("Start something new") ||
      formData.objectiveCategories.includes("Implement an existing solution")
    );
  }, [formData.roles, formData.objectiveCategories]);

  const isMarketplaceBranch = useMemo(() => {
    return (
      formData.roles.includes("I run a business") ||
      formData.roles.includes("I am a farmer or producer") ||
      formData.roles.includes("I manufacture or process products") ||
      formData.roles.includes("I buy products or services") ||
      formData.objectiveCategories.includes("Find suppliers") ||
      formData.objectiveCategories.includes("Find raw materials") ||
      formData.objectiveCategories.includes("Buy something") ||
      formData.objectiveCategories.includes("Sell something")
    );
  }, [formData.roles, formData.objectiveCategories]);

  const isCrossBorderBranch = useMemo(() => {
    return (
      formData.objectiveCategories.includes("Enter a new market") ||
      isMarketplaceBranch ||
      formData.roles.includes("I am looking for business opportunities")
    );
  }, [formData.objectiveCategories, isMarketplaceBranch, formData.roles]);

  // Dynamically assemble active survey step identifiers
  const activeSteps = useMemo(() => {
    const steps: { id: string; title: string; category: string }[] = [];

    // Core Step 1
    steps.push({ id: "q1_who", title: "Who You Are", category: "Background" });
    // Core Step 2
    steps.push({ id: "q2_accomplish", title: "Current Objectives", category: "Objectives" });
    // Core Step 3
    steps.push({ id: "q3_stuck", title: "When Progress Stalls", category: "Friction & Behavior" });
    // Core Step 4
    steps.push({ id: "q4_discovery", title: "Current Search Methods", category: "Discovery" });
    // Core Step 5
    steps.push({ id: "q5_trust", title: "Establishing Commercial Trust", category: "Trust" });
    // Core Step 6
    steps.push({ id: "q6_resources_have", title: "Capabilities & Resources You Have", category: "Supply" });
    // Core Step 7
    steps.push({ id: "q7_need_most", title: "Your Most Critical Need", category: "Demand" });

    // Adaptive Module A: Creator
    if (isCreatorBranch) {
      steps.push({ id: "mod_creator", title: "Solution Creation & Protection", category: "Creator Economy" });
    }

    // Adaptive Module B: Adopter & Execution
    if (isAdopterBranch) {
      steps.push({ id: "mod_adopter", title: "Adoption & Execution Support", category: "Execution" });
    }

    // Adaptive Module C: Marketplace & Future Demand
    if (isMarketplaceBranch) {
      steps.push({ id: "mod_marketplace", title: "Marketplace & Future Demand", category: "Commerce" });
    }

    // Adaptive Module D: Cross-Border
    if (isCrossBorderBranch) {
      steps.push({ id: "mod_crossborder", title: "Cross-Border Trade & Trust", category: "Pan-African" });
    }

    // Core Step 8: AI
    steps.push({ id: "q8_ai", title: "Intelligent Systems & Execution", category: "Technology" });
    // Core Step 9: The One Problem
    steps.push({ id: "q9_one_thing", title: "The Primary Expectation", category: "Priority" });
    // Core Step 10: Marketplace Seed Signals
    steps.push({ id: "q10_signals", title: "Marketplace Signals (Optional)", category: "Marketplace Seed" });
    // Optional Final Step: Perspective & Follow-up
    steps.push({ id: "q_followup", title: "Final Insights & Follow-up", category: "Wrap-up" });

    return steps;
  }, [isCreatorBranch, isAdopterBranch, isMarketplaceBranch, isCrossBorderBranch]);

  const totalQuestions = activeSteps.length;
  const currentStepInfo = currentStep > 0 && currentStep <= totalQuestions ? activeSteps[currentStep - 1] : null;
  const progressPercent = currentStep === 0 ? 0 : Math.min(100, Math.round((currentStep / totalQuestions) * 100));

  // Multi-select toggle helper
  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (currentStep < totalQuestions) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmitSurvey();
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  // Submit survey payload to API and Firestore
  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      ...formData,
      completedAt: new Date().toISOString(),
      activeBranches: {
        isCreatorBranch,
        isAdopterBranch,
        isMarketplaceBranch,
        isCrossBorderBranch,
      },
      // Summary mappings for standard reporting
      country: formData.country,
      cityRegion: formData.cityRegion,
      roles: formData.roles,
      goals: formData.objectiveDescription,
      obstacles: formData.stuckOutcome.join(", "),
      biggestObstacle: formData.stuckFrustration,
      resources: formData.resourcesHave.join(", "),
      biggestNeed: formData.biggestNeed,
      aiComfort: formData.adopterMonitoringUtility || 3,
      aiTrustedTasks: formData.aiTrustedTasks.join(", "),
      respondentName: formData.contactName,
      respondentEmail: formData.contactEmail,
      respondentPhone: formData.contactPhone,
    };

    try {
      const res = await fetch("/api/research/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionId(data.submissionId || "SUB-" + Date.now().toString().slice(-6));
        setIsCompleted(true);
        try {
          localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
        } catch {}
      } else {
        setSubmitError(data.error || "Failed to record survey response. Please try again.");
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      // Fallback save in localStorage if network failed
      setSubmissionId("OFFLINE-" + Date.now().toString().slice(-6));
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: SCREEN 0 - INTRODUCTION
  // -------------------------------------------------------------
  if (currentStep === 0 && !isCompleted) {
    return (
      <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#072833]/90 backdrop-blur-md border-b border-[#CBE5EE] dark:border-[#0F3B4A] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BiznyLogo size="md" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7] hidden sm:inline">
              Founding Research
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#033B4C] dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#033B4C] dark:text-[#79A7B7]" /> Admin Console
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#033B4C] dark:hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              &larr; Return to Bizny
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          {/* Draft Resume Banner if exists */}
          {draftRestored && (
            <div className="p-4 rounded-2xl bg-[#CBE5EE]/40 dark:bg-[#072833] border border-[#033B4C]/20 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-[#033B4C] dark:text-[#98CBD9]">
                <Clock className="w-4 h-4" />
                <span>You have a saved in-progress research session.</span>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 bg-[#033B4C] text-white rounded-lg font-bold text-xs hover:bg-[#054a5f] transition-all cursor-pointer"
              >
                Resume Where You Left Off &rarr;
              </button>
            </div>
          )}

          {/* Main Visual Header */}
          <div className="bg-white dark:bg-[#072833] rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] overflow-hidden shadow-sm">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-900">
              <img
                src={introEcosystemImg}
                alt="African Economic Ecosystem in Motion"
                className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 sm:p-8">
                <div className="space-y-2 text-white max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide">
                    <Compass className="w-3.5 h-3.5 text-amber-300" /> Empirical Economic Research
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold font-display leading-tight">
                    How Do We Make It Easier to Build, Buy, Sell and Solve?
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-serif">
                We're researching how people actually find resources, businesses, suppliers, solutions and opportunities — and what prevents good ideas from becoming successful ventures across African markets and globally.
              </p>

              {/* Research Protocol Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/50 dark:border-[#0F3B4A]/50 flex items-center gap-3 text-xs">
                  <Clock className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7] shrink-0" />
                  <div>
                    <strong className="block text-gray-900 dark:text-white">4–7 Minutes</strong>
                    <span className="text-gray-500">Adaptive question path</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/50 dark:border-[#0F3B4A]/50 flex items-center gap-3 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block text-gray-900 dark:text-white">Anonymous & Unbiased</strong>
                    <span className="text-gray-500">No leading product pitches</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/50 dark:border-[#0F3B4A]/50 flex items-center gap-3 text-xs">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <strong className="block text-gray-900 dark:text-white">Pan-African & Global</strong>
                    <span className="text-gray-500">54 nations + diaspora</span>
                  </div>
                </div>
              </div>

              {/* $2M Competition Context Note */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Participating in the $2 Million Gemini AI Competition:</strong> We are examining how emerging market founders navigate discovery, trust, and execution friction. Your ground-level observations directly shape the empirical data model and tools submitted.
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#033B4C] hover:bg-[#054a5f] text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Research</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 text-center sm:text-left">
                  Your responses are used strictly for economic research and system design.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: THANK YOU / COMPLETION SCREEN
  // -------------------------------------------------------------
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white dark:bg-[#072833] rounded-3xl p-8 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#033B4C] dark:text-white font-display">
              Thank You for Your Contribution
            </h2>
            <p className="text-xs text-gray-400 font-mono">Reference: {submissionId}</p>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Your response provides critical empirical evidence on how people actually build, buy, sell, solve problems, and navigate economic friction across markets.
          </p>

          <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/60 dark:border-[#0F3B4A] text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#033B4C] dark:text-[#79A7B7] font-bold">
              <FileCheck className="w-4 h-4" /> Next Steps in the Research Process
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Submissions are aggregated into the Founding Research Dataset to quantify coordination failure frequencies, trust barriers, and underutilized productive resources.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#033B4C] text-white font-bold text-xs hover:bg-[#054a5f] transition-all"
            >
              Explore Bizny Platform
            </Link>
            <Link
              href="/admin"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#033B4C] dark:text-[#79A7B7]" /> View Admin Records
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE SURVEY SCREEN HELPER
  // -------------------------------------------------------------
  const currentStepObj = currentStepInfo;
  const stepId = currentStepObj ? currentStepObj.id : "";

  return (
    <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans flex flex-col justify-between">
      {/* Top Sticky Header with Dynamic Progress */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#072833]/95 backdrop-blur-md border-b border-[#CBE5EE] dark:border-[#0F3B4A] px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BiznyLogo size="sm" />
            <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7] hidden sm:inline">
              Founding Research Survey
            </span>
          </div>

          {/* Dynamic Question Counter */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-[#033B4C] dark:text-white">
                Question {currentStep} of {totalQuestions}
              </span>
              <span className="block text-[10px] text-gray-400 font-medium">
                {currentStepObj?.category || "Research"}
              </span>
            </div>
            <div className="w-24 sm:w-36 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#033B4C] dark:bg-[#79A7B7] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Question Body Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 sm:p-10 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm space-y-6 animate-fade-in">
          {/* -------------------------------------------------------------
              QUESTION 1: WHO ARE YOU?
          ------------------------------------------------------------- */}
          {stepId === "q1_who" && (
            <div className="space-y-6">
              {/* Optional contextual illustration */}
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={builderPortraitImg}
                  alt="African Builder and Entrepreneur"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Understanding the builders, producers, and problem solvers across the continent
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Behavioral Profile
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Which best describes you?
                </h2>
                <p className="text-xs text-gray-500">Select all that apply to your current activities.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "I run a business",
                  "I am building a business",
                  "I am a farmer or producer",
                  "I manufacture or process products",
                  "I provide professional or technical services",
                  "I create solutions, processes, designs or methods",
                  "I work for an organization",
                  "I am looking for business opportunities",
                  "I buy products or services",
                  "I am an investor or funder",
                  "I am a student or researcher",
                  "I am exploring what I could build",
                  "Other",
                ].map((role) => {
                  const selected = formData.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, roles: toggleArrayItem(p.roles, role) }))
                      }
                      className={`p-3.5 rounded-2xl text-xs font-semibold text-left transition-all flex items-center justify-between border cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-800 dark:text-gray-200 border-[#CBE5EE]/60 dark:border-[#0F3B4A] hover:border-[#033B4C]"
                      }`}
                    >
                      <span>{role}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          selected ? "bg-white border-white text-[#033B4C]" : "border-gray-400"
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.roles.includes("Other") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Please specify your role:
                  </label>
                  <input
                    type="text"
                    value={formData.roleOther}
                    onChange={(e) => setFormData((p) => ({ ...p, roleOther: e.target.value }))}
                    placeholder="e.g. Cooperative leader, Logistics broker..."
                    className="w-full p-3 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs outline-none focus:ring-2 focus:ring-[#033B4C]"
                  />
                </div>
              )}

              {/* Location Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                    Where are you currently based? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                  >
                    <option value="">Select country...</option>
                    {ALL_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={formData.cityRegion}
                    onChange={(e) => setFormData((p) => ({ ...p, cityRegion: e.target.value }))}
                    placeholder="e.g. Lagos, Nairobi, Accra, London..."
                    className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 2: WHAT ARE YOU TRYING TO ACCOMPLISH?
          ------------------------------------------------------------- */}
          {stepId === "q2_accomplish" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Objectives & Intent
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  What are you currently trying to build, produce, buy, sell, improve or accomplish?
                </h2>
                <p className="text-xs text-gray-500">
                  Be as candid and specific as possible about your present practical goal.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={formData.objectiveDescription}
                  onChange={(e) => setFormData((p) => ({ ...p, objectiveDescription: e.target.value }))}
                  placeholder="e.g. We are expanding our grain milling facility and need to procure a 5-tonne/day destoner and find trustworthy organic cassava suppliers..."
                  className="w-full p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Optional Categories (Select all relevant):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Start something new",
                    "Grow a business",
                    "Find customers",
                    "Find suppliers",
                    "Find equipment",
                    "Find raw materials",
                    "Find land or physical space",
                    "Find skilled people",
                    "Find funding",
                    "Enter a new market",
                    "Buy something",
                    "Sell something",
                    "Solve a technical problem",
                    "Implement an existing solution",
                    "Find a business partner",
                    "Other",
                  ].map((cat) => {
                    const selected = formData.objectiveCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            objectiveCategories: toggleArrayItem(p.objectiveCategories, cat),
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/70 dark:border-[#0F3B4A] hover:border-[#033B4C]"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 3: THE LAST TIME YOU GOT STUCK
          ------------------------------------------------------------- */}
          {stepId === "q3_stuck" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={coordinationImg}
                  alt="Coordination Challenge in African Commerce"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Everything exists somewhere, but discovering and coordinating it is difficult.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Friction & Coordination Failure
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Think about the last time you needed something important to make progress.
                </h2>
                <p className="text-xs text-gray-500">
                  What did you need, and how did you try to find it? (e.g. A supplier, machine, person, material, buyer, technical answer, partner, land, or funding).
                </p>
              </div>

              <textarea
                rows={3}
                value={formData.stuckDescription}
                onChange={(e) => setFormData((p) => ({ ...p, stuckDescription: e.target.value }))}
                placeholder="Describe what you needed and what steps you took..."
                className="w-full p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
              />

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  What happened? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "I found exactly what I needed quickly",
                    "I eventually found it, but it took too long",
                    "I found options but couldn't determine who to trust",
                    "Information was incomplete",
                    "Prices were difficult to compare",
                    "The provider was too far away",
                    "The quantity I needed wasn't available",
                    "The solution existed but I couldn't find it",
                    "I couldn't find anyone",
                    "I relied on someone I already knew",
                    "I used WhatsApp/social media/community groups",
                    "I gave up",
                    "I solved it another way",
                    "Other",
                  ].map((opt) => {
                    const selected = formData.stuckOutcome.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, stuckOutcome: toggleArrayItem(p.stuckOutcome, opt) }))
                        }
                        className={`p-3 rounded-xl text-xs text-left font-medium border transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                        }`}
                      >
                        <span>{opt}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  What was the most frustrating part of that process?
                </label>
                <input
                  type="text"
                  value={formData.stuckFrustration}
                  onChange={(e) => setFormData((p) => ({ ...p, stuckFrustration: e.target.value }))}
                  placeholder="e.g. Unverified middlemen claiming to have stock, lack of pricing transparency..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 4: HOW DO YOU CURRENTLY SOLVE PROBLEMS?
          ------------------------------------------------------------- */}
          {stepId === "q4_discovery" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={discoveryMethodsImg}
                  alt="Current Discovery Methods in Commerce"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Informal channels work, but fragmentation creates significant search costs.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Discovery Behavior
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  When you need a person, business, product, service, supplier or solution, where do you usually look first?
                </h2>
                <p className="text-xs text-gray-500">
                  Select your primary go-to search channels (Choose up to 3).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  "People I know",
                  "Friends/family",
                  "WhatsApp",
                  "Facebook",
                  "Google/Search",
                  "Physical markets",
                  "Professional associations",
                  "Community networks",
                  "Existing suppliers",
                  "Government directories",
                  "Online marketplaces",
                  "LinkedIn",
                  "Industry contacts",
                  "Other",
                ].map((channel) => {
                  const selected = formData.discoveryChannels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          discoveryChannels: toggleArrayItem(p.discoveryChannels, channel),
                        }))
                      }
                      className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      <span>{channel}</span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  What is missing from the way you currently search?
                </label>
                <textarea
                  rows={3}
                  value={formData.discoveryMissing}
                  onChange={(e) => setFormData((p) => ({ ...p, discoveryMissing: e.target.value }))}
                  placeholder="e.g. Reliable verified ratings, knowing if the person can actually deliver before calling..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 5: TRUST
          ------------------------------------------------------------- */}
          {stepId === "q5_trust" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={trustFacilityImg}
                  alt="Real-world Trust Verification at Facility"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Real trust comes from verifiable physical proof and community accountability.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Trust Infrastructure
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Imagine you find someone online who claims they can provide exactly what you need.
                </h2>
                <p className="text-xs text-gray-500">
                  What would make you comfortable doing business with them? (Select up to 5).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Government/business registration",
                  "Identity verification",
                  "Local verification / field rep",
                  "Physical business address",
                  "Proof of previous work",
                  "Customer reviews",
                  "References",
                  "Certifications",
                  "Photos/videos of operations",
                  "Transaction history",
                  "Platform reputation",
                  "Escrow/payment protection",
                  "Ability to speak directly with them",
                  "Community recommendation",
                  "Professional association membership",
                  "Other",
                ].map((factor) => {
                  const selected = formData.trustFactors.includes(factor);
                  return (
                    <button
                      key={factor}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          trustFactors: toggleArrayItem(p.trustFactors, factor),
                        }))
                      }
                      className={`p-3.5 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-800 dark:text-gray-200 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      <span>{factor}</span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  What would make you refuse to deal with them even if their price was attractive?
                </label>
                <input
                  type="text"
                  value={formData.trustDealBreaker}
                  onChange={(e) => setFormData((p) => ({ ...p, trustDealBreaker: e.target.value }))}
                  placeholder="e.g. Demanding full payment upfront without escrow, no physical location, evasive on video call..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 6: WHAT DO YOU HAVE?
          ------------------------------------------------------------- */}
          {stepId === "q6_resources_have" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={productionLandscapeImg}
                  alt="African Resources and Production Landscape"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Resources exist in diverse forms across regions — from farmland and machinery to specialized engineering.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Underutilized Capacity
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  What resources or capabilities do you currently have access to?
                </h2>
                <p className="text-xs text-gray-500">
                  Select all assets, skills, capacity, or tools you possess or manage.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "Land",
                  "Water",
                  "Agricultural resources",
                  "Machinery",
                  "Tools/equipment",
                  "Workshop",
                  "Production space",
                  "Laboratory/research facilities",
                  "Raw materials",
                  "Vehicles/logistics",
                  "Skilled labour",
                  "Professional skills",
                  "Technical knowledge",
                  "Business knowledge",
                  "Existing customers",
                  "Distribution network",
                  "Capital",
                  "Existing business",
                  "Intellectual property",
                  "Designs/processes",
                  "Production capacity",
                  "Community/network",
                  "Other",
                ].map((res) => {
                  const selected = formData.resourcesHave.includes(res);
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          resourcesHave: toggleArrayItem(p.resourcesHave, res),
                        }))
                      }
                      className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      <span>{res}</span>
                      {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Is there something you have access to that could be useful to another person or business?
                </label>
                <div className="flex gap-3">
                  {(["Yes", "Maybe", "No"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, hasShareableResource: opt }))}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.hasShareableResource === opt
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {(formData.hasShareableResource === "Yes" || formData.hasShareableResource === "Maybe") && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      What is it?
                    </label>
                    <input
                      type="text"
                      value={formData.shareableResourceDescription}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, shareableResourceDescription: e.target.value }))
                      }
                      placeholder="e.g. 50 hectares of irrigated farmland in Oyo state, precision CNC milling capacity, export packaging facility..."
                      className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 7: WHAT DO YOU NEED MOST?
          ------------------------------------------------------------- */}
          {stepId === "q7_need_most" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  The Core Gap
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  What is the SINGLE biggest resource, capability, connection or solution you wish you had right now?
                </h2>
                <p className="text-xs text-gray-500">Pick the primary bottleneck holding you back.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  "Supplier",
                  "Buyer/customer",
                  "Equipment",
                  "Raw material",
                  "Land/space",
                  "Skilled person",
                  "Technical expertise",
                  "Capital",
                  "Business partner",
                  "Distribution",
                  "Information",
                  "Proven business model",
                  "Production process",
                  "Technology",
                  "Market access",
                  "Other",
                ].map((item) => {
                  const selected = formData.biggestNeed === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, biggestNeed: item }))}
                      className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A] hover:border-[#033B4C]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Tell us more about what you need:
                </label>
                <textarea
                  rows={3}
                  value={formData.biggestNeedDetails}
                  onChange={(e) => setFormData((p) => ({ ...p, biggestNeedDetails: e.target.value }))}
                  placeholder="e.g. Reliable cold-chain transportation from Eldoret to Nairobi with temperature logs..."
                  className="w-full p-3.5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ADAPTIVE MODULE A: CREATOR ECONOMY
          ------------------------------------------------------------- */}
          {stepId === "mod_creator" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Adaptive Research: Creator & Solution Economy
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Have you developed or discovered a process, method, design, business model, technical solution or practical idea that another person could replicate?
                </h2>
              </div>

              <div className="flex gap-3">
                {(["Yes", "No", "Not sure"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isCreatorExperienced: opt }))}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.isCreatorExperienced === opt
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {formData.isCreatorExperienced === "Yes" && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                      What was the solution, process, or design?
                    </label>
                    <input
                      type="text"
                      value={formData.creatorSolutionDescription}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, creatorSolutionDescription: e.target.value }))
                      }
                      placeholder="e.g. A low-cost solar grain drying methodology that cuts post-harvest spoilage by 60%..."
                      className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      If another person wanted to use your solution, how would you prefer to benefit? (Select all)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        "Sell the complete solution",
                        "License it",
                        "Charge for access",
                        "Charge for training",
                        "Provide implementation",
                        "Consulting",
                        "Subscription",
                        "Revenue share",
                        "Hire me to execute it",
                        "Free/open access",
                        "Case-by-case",
                        "Other",
                      ].map((item) => {
                        const selected = formData.creatorMonetizationPrefs.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                creatorMonetizationPrefs: toggleArrayItem(
                                  p.creatorMonetizationPrefs,
                                  item
                                ),
                              }))
                            }
                            className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                              selected
                                ? "bg-[#033B4C] text-white border-[#033B4C]"
                                : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                            }`}
                          >
                            <span>{item}</span>
                            {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                      What would concern you about allowing another person to use your solution? (Select all)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "They could copy it without permission",
                        "They could modify it incorrectly",
                        "They could damage my reputation",
                        "They could claim it as their own",
                        "They could compete directly with me",
                        "I could lose my competitive advantage",
                        "They might not execute it properly",
                        "I don't have these concerns",
                        "Other",
                      ].map((concern) => {
                        const selected = formData.creatorConcerns.includes(concern);
                        return (
                          <button
                            key={concern}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                creatorConcerns: toggleArrayItem(p.creatorConcerns, concern),
                              }))
                            }
                            className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                              selected
                                ? "bg-[#033B4C] text-white border-[#033B4C]"
                                : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                            }`}
                          >
                            <span>{concern}</span>
                            {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                      What would make you comfortable allowing someone else to use it?
                    </label>
                    <input
                      type="text"
                      value={formData.creatorComfortConditions}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, creatorComfortConditions: e.target.value }))
                      }
                      placeholder="e.g. Clear legal licensing terms, guaranteed attribution, upfront milestone fees..."
                      className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              ADAPTIVE MODULE B: ADOPTER & EXECUTION
          ------------------------------------------------------------- */}
          {stepId === "mod_adopter" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={creatorExecutionImg}
                  alt="Creator Adopter Execution"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Finding a solution is half the challenge — successful execution and quality control is the other half.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Adaptive Research: Adopter & Execution Layer
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Have you ever tried to reproduce or implement something that someone else had already figured out?
                </h2>
              </div>

              <div className="flex gap-3">
                {(["Yes", "No", "Not sure"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isAdopterExperienced: opt }))}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.isAdopterExperienced === opt
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  What usually prevents people from successfully implementing a solution they already know about? (Select all)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Lack of money",
                    "Lack of equipment",
                    "Lack of skills",
                    "Lack of labour",
                    "Lack of information",
                    "Difficulty understanding instructions",
                    "Poor quality materials",
                    "Lack of local adaptation",
                    "No expert available to ask questions",
                    "Lack of accountability",
                    "Poor project management",
                    "Unexpected problems",
                    "Difficulty finding suppliers",
                    "Lack of regulatory knowledge",
                    "Other",
                  ].map((barr) => {
                    const selected = formData.adopterBarriers.includes(barr);
                    return (
                      <button
                        key={barr}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            adopterBarriers: toggleArrayItem(p.adopterBarriers, barr),
                          }))
                        }
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                        }`}
                      >
                        <span>{barr}</span>
                        {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution Scale */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                  Imagine the creator of a solution could remotely monitor your implementation while AI helped you follow the process, identify problems and maintain quality.
                  <span className="block font-normal text-gray-500 mt-1">
                    How useful would this be? (1 = Not useful, 5 = Extremely useful)
                  </span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, adopterMonitoringUtility: score }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        formData.adopterMonitoringUtility === score
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A] hover:border-[#033B4C]"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    What would you want the system to help monitor or troubleshoot?
                  </label>
                  <input
                    type="text"
                    value={formData.adopterMonitoringNeeds}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, adopterMonitoringNeeds: e.target.value }))
                    }
                    placeholder="e.g. Calibration of equipment, diagnosing crop disease symptoms, verifying raw material grades..."
                    className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ADAPTIVE MODULE C: MARKETPLACE & FUTURE DEMAND
          ------------------------------------------------------------- */}
          {stepId === "mod_marketplace" && (
            <div className="space-y-6">
              <div className="h-44 sm:h-56 rounded-2xl overflow-hidden relative mb-2">
                <img
                  src={panAfricanHubImg}
                  alt="Pan-African Commerce Hub"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Connecting demand and supply across borders through genuine market requirements.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Adaptive Research: Marketplace & Future Demand
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Have you ever needed something that wasn't available immediately, but you would have been willing to order in advance?
                </h2>
              </div>

              <div className="flex gap-3">
                {(["Yes", "No", "Not sure"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, hasPreOrderExperience: opt }))}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.hasPreOrderExperience === opt
                        ? "bg-[#033B4C] text-white border-[#033B4C]"
                        : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {formData.hasPreOrderExperience === "Yes" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      What was it?
                    </label>
                    <input
                      type="text"
                      value={formData.preOrderDescription}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, preOrderDescription: e.target.value }))
                      }
                      placeholder="e.g. 500 solar inverters, harvest grain..."
                      className="w-full p-3 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      What timeframe would you have waited?
                    </label>
                    <select
                      value={formData.preOrderTimeframe}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, preOrderTimeframe: e.target.value }))
                      }
                      className="w-full p-3 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs font-semibold outline-none"
                    >
                      <option value="">Select timeframe...</option>
                      <option value="A few days">A few days</option>
                      <option value="A few weeks">A few weeks</option>
                      <option value="1–3 months">1–3 months</option>
                      <option value="3–6 months">3–6 months</option>
                      <option value="More than 6 months">More than 6 months</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Demand-pull hypothesis question */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                  Imagine you could publish a genuine future requirement such as:
                  <span className="block p-2.5 my-2 rounded-xl bg-[#F4F8FA] dark:bg-[#041B23] font-mono text-[11px] text-[#033B4C] dark:text-[#79A7B7]">
                    "I need 2 metric tonnes of cassava during the next production cycle."
                  </span>
                  and verified businesses capable of meeting that requirement could indicate interest.
                  <span className="block font-normal text-gray-500 mt-1">
                    How useful would this be to you? (1 = Not useful, 5 = Extremely useful)
                  </span>
                </label>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, futureDemandUtility: score }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        formData.futureDemandUtility === score
                          ? "bg-[#033B4C] text-white border-[#033B4C] shadow-sm"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A] hover:border-[#033B4C]"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    What would need to be true before you would trust and use such a system?
                  </label>
                  <input
                    type="text"
                    value={formData.futureDemandTrustRequirements}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, futureDemandTrustRequirements: e.target.value }))
                    }
                    placeholder="e.g. Verifiable deposits held in escrow, inspected farm location..."
                    className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                  />
                </div>
              </div>

              {/* Pan-African discovery interests */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  If you could discover businesses and products across all 54 African countries in one place, what would you most want to find?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Agricultural products",
                    "Raw materials",
                    "Manufactured products",
                    "Machinery",
                    "Services",
                    "Technology",
                    "Skilled professionals",
                    "Suppliers",
                    "Investment opportunities",
                    "Distribution partners",
                    "Business partners",
                    "Export opportunities",
                    "Production capacity",
                    "Land/resources",
                    "Solutions/templates",
                    "Other",
                  ].map((item) => {
                    const selected = formData.marketplaceDiscoveryInterests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceDiscoveryInterests: toggleArrayItem(
                              p.marketplaceDiscoveryInterests,
                              item
                            ),
                          }))
                        }
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                        }`}
                      >
                        <span>{item}</span>
                        {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              ADAPTIVE MODULE D: CROSS-BORDER
          ------------------------------------------------------------- */}
          {stepId === "mod_crossborder" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Adaptive Research: Cross-Border African Commerce
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  If you were considering buying from or working with a business in another African country, what would you need before trusting the transaction?
                </h2>
                <p className="text-xs text-gray-500">Select up to 5 essential trust requirements.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  "Business verification",
                  "Local verification / physical visit",
                  "Product certification",
                  "Customer reviews",
                  "Transaction history",
                  "Escrow/payment protection",
                  "Physical inspection",
                  "Samples prior to shipment",
                  "References from known partners",
                  "Clear legal contract",
                  "Logistics & customs support",
                  "Dispute resolution mechanism",
                  "Other",
                ].map((item) => {
                  const selected = formData.crossBorderTrustRequirements.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          crossBorderTrustRequirements: toggleArrayItem(
                            p.crossBorderTrustRequirements,
                            item
                          ),
                        }))
                      }
                      className={`p-3.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between cursor-pointer ${
                        selected
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-800 dark:text-gray-200 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      <span>{item}</span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  What is the biggest single obstacle to doing more business across African countries?
                </label>
                <textarea
                  rows={3}
                  value={formData.crossBorderBiggestObstacle}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, crossBorderBiggestObstacle: e.target.value }))
                  }
                  placeholder="e.g. Cross-border payments and currency conversion, tariffs, cargo logistics unreliability..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 8: AI IN ECONOMIC EXECUTION
          ------------------------------------------------------------- */}
          {stepId === "q8_ai" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Applied Artificial Intelligence
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  If an intelligent system could remove ONE recurring obstacle from what you are trying to accomplish, what would you want it to do?
                </h2>
              </div>

              <textarea
                rows={3}
                value={formData.aiObstacleToRemove}
                onChange={(e) => setFormData((p) => ({ ...p, aiObstacleToRemove: e.target.value }))}
                placeholder="e.g. Automatically matching my farm harvest volume with verified industrial buyers before planting season..."
                className="w-full p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
              />

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  Which of these would you trust an AI system to help you with? (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Finding suppliers",
                    "Finding buyers",
                    "Finding businesses",
                    "Finding skilled people",
                    "Finding solutions",
                    "Comparing options",
                    "Checking information",
                    "Creating an implementation plan",
                    "Monitoring project progress",
                    "Identifying problems",
                    "Finding missing resources",
                    "Connecting me to relevant people",
                    "Helping negotiate",
                    "Helping understand regulations",
                    "Making recommendations",
                    "None of these",
                    "Other",
                  ].map((task) => {
                    const selected = formData.aiTrustedTasks.includes(task);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            aiTrustedTasks: toggleArrayItem(p.aiTrustedTasks, task),
                          }))
                        }
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                          selected
                            ? "bg-[#033B4C] text-white border-[#033B4C]"
                            : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                        }`}
                      >
                        <span>{task}</span>
                        {selected && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Which decisions would you NOT trust AI to make for you?
                </label>
                <input
                  type="text"
                  value={formData.aiUntrustedDecisions}
                  onChange={(e) => setFormData((p) => ({ ...p, aiUntrustedDecisions: e.target.value }))}
                  placeholder="e.g. Final fund disbursement, signing legal contracts, judging personal integrity..."
                  className="w-full p-3.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 9: THE ONE PROBLEM
          ------------------------------------------------------------- */}
          {stepId === "q9_one_thing" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Core Hypothesis Benchmark
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display leading-snug">
                  If infrastructure existed to help people find what they need, find people who need what they provide, discover proven solutions, establish trust, and successfully execute projects:
                </h2>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  What is the ONE thing you would expect it to do exceptionally well?
                </p>
              </div>

              <textarea
                rows={5}
                value={formData.theOneExpectation}
                onChange={(e) => setFormData((p) => ({ ...p, theOneExpectation: e.target.value }))}
                placeholder="Give your unfiltered perspective on what must work flawlessly above everything else..."
                className="w-full p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C] font-sans"
              />
            </div>
          )}

          {/* -------------------------------------------------------------
              QUESTION 10: STRUCTURED MARKETPLACE RESEARCH SIGNALS
          ------------------------------------------------------------- */}
          {stepId === "q10_signals" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Direct Economic Signals (Optional)
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  Structured Marketplace Research Signals
                </h2>
                <p className="text-xs text-gray-500">
                  You can optionally submit concrete requirements, capabilities, or solutions. These are stored as structured research signals.
                </p>
              </div>

              {/* 4 Interactive Signal Cards */}
              <div className="space-y-4">
                {/* 1: I NEED */}
                <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>I NEED</span>
                      <span className="text-[11px] font-normal text-gray-500">— Something you are looking for</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.marketplaceSignals.iNeed.active}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          marketplaceSignals: {
                            ...p.marketplaceSignals,
                            iNeed: { ...p.marketplaceSignals.iNeed, active: e.target.checked },
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#033B4C]"
                    />
                  </div>

                  {formData.marketplaceSignals.iNeed.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="What do you need? (e.g. 10 tonnes soybeans)"
                        value={formData.marketplaceSignals.iNeed.description}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iNeed: { ...p.marketplaceSignals.iNeed, description: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Location / Delivery point"
                        value={formData.marketplaceSignals.iNeed.location}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iNeed: { ...p.marketplaceSignals.iNeed, location: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 2: I CAN PROVIDE */}
                <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
                      <Box className="w-4 h-4 text-blue-600" />
                      <span>I CAN PROVIDE</span>
                      <span className="text-[11px] font-normal text-gray-500">— A resource or capability you have</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.marketplaceSignals.iCanProvide.active}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          marketplaceSignals: {
                            ...p.marketplaceSignals,
                            iCanProvide: { ...p.marketplaceSignals.iCanProvide, active: e.target.checked },
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#033B4C]"
                    />
                  </div>

                  {formData.marketplaceSignals.iCanProvide.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="What can you provide? (e.g. CNC fabrication, cold storage)"
                        value={formData.marketplaceSignals.iCanProvide.description}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iCanProvide: { ...p.marketplaceSignals.iCanProvide, description: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Capacity / Quantity available"
                        value={formData.marketplaceSignals.iCanProvide.capacity}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iCanProvide: { ...p.marketplaceSignals.iCanProvide, capacity: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 3: I HAVE A SOLUTION */}
                <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span>I HAVE A SOLUTION</span>
                      <span className="text-[11px] font-normal text-gray-500">— A proven method or model</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.marketplaceSignals.iHaveSolution.active}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          marketplaceSignals: {
                            ...p.marketplaceSignals,
                            iHaveSolution: { ...p.marketplaceSignals.iHaveSolution, active: e.target.checked },
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#033B4C]"
                    />
                  </div>

                  {formData.marketplaceSignals.iHaveSolution.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Solution title / process description"
                        value={formData.marketplaceSignals.iHaveSolution.description}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iHaveSolution: { ...p.marketplaceSignals.iHaveSolution, description: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Target audience / who should replicate it"
                        value={formData.marketplaceSignals.iHaveSolution.targetAudience}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iHaveSolution: { ...p.marketplaceSignals.iHaveSolution, targetAudience: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 4: I WANT TO SOURCE */}
                <div className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE] dark:border-[#0F3B4A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-gray-900 dark:text-white">
                      <ShoppingCart className="w-4 h-4 text-amber-600" />
                      <span>I WANT TO SOURCE</span>
                      <span className="text-[11px] font-normal text-gray-500">— Buy or import from African producers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.marketplaceSignals.iWantToSource.active}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          marketplaceSignals: {
                            ...p.marketplaceSignals,
                            iWantToSource: { ...p.marketplaceSignals.iWantToSource, active: e.target.checked },
                          },
                        }))
                      }
                      className="w-4 h-4 accent-[#033B4C]"
                    />
                  </div>

                  {formData.marketplaceSignals.iWantToSource.active && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Commodity or product you want to source"
                        value={formData.marketplaceSignals.iWantToSource.description}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iWantToSource: { ...p.marketplaceSignals.iWantToSource, description: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Target quantity / Destination country"
                        value={formData.marketplaceSignals.iWantToSource.destination}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            marketplaceSignals: {
                              ...p.marketplaceSignals,
                              iWantToSource: { ...p.marketplaceSignals.iWantToSource, destination: e.target.value },
                            },
                          }))
                        }
                        className="p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              OPTIONAL FINAL STEP: PERSPECTIVE & FOLLOW-UP
          ------------------------------------------------------------- */}
          {stepId === "q_followup" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#033B4C] dark:text-[#79A7B7]">
                  Final Perspectives & Optional Interview
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#033B4C] dark:text-white font-display">
                  What have we not asked that you think is important?
                </h2>
                <p className="text-xs text-gray-500">
                  Share any insight on how people in your industry, community, or country find opportunities, solve problems, or trade.
                </p>
              </div>

              <textarea
                rows={3}
                value={formData.unaskedInsights}
                onChange={(e) => setFormData((p) => ({ ...p, unaskedInsights: e.target.value }))}
                placeholder="Any additional thoughts or real experiences you'd like to share..."
                className="w-full p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-[#F4F8FA] dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
              />

              {/* Research Interview Follow-up */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    Would you be willing to participate in a deeper 20–30 minute research conversation?
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Completely optional. You may also submit anonymously.
                  </p>
                </div>

                <div className="flex gap-3">
                  {(["Yes", "No"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, willingForInterview: opt }))}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.willingForInterview === opt
                          ? "bg-[#033B4C] text-white border-[#033B4C]"
                          : "bg-[#F4F8FA] dark:bg-[#041B23] text-gray-700 dark:text-gray-300 border-[#CBE5EE]/60 dark:border-[#0F3B4A]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {formData.willingForInterview === "Yes" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/60 dark:border-[#0F3B4A] animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                        placeholder="e.g. Esther Akin"
                        className="w-full p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                        placeholder="e.g. esther@example.com"
                        className="w-full p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData((p) => ({ ...p, contactPhone: e.target.value }))}
                        placeholder="e.g. +234 801 234 5678"
                        className="w-full p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Primary Topic of Interest
                      </label>
                      <input
                        type="text"
                        value={formData.contactTopic}
                        onChange={(e) => setFormData((p) => ({ ...p, contactTopic: e.target.value }))}
                        placeholder="e.g. Export agricultural supply chains, creator licensing..."
                        className="w-full p-3 rounded-xl border bg-white dark:bg-[#072833] text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#072833] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStep === 1 ? "Overview" : "Back"}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleNext}
            className="px-8 py-3.5 rounded-2xl bg-[#033B4C] hover:bg-[#054a5f] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recording Survey...</span>
              </>
            ) : currentStep === totalQuestions ? (
              <>
                <span>Submit Research Response</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#CBE5EE]/60 dark:border-[#0F3B4A] py-4 text-center text-xs text-gray-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Bizny Empirical Founding Research &copy; {new Date().getFullYear()}</span>
          <span className="text-[11px] text-gray-400">
            Participant responses are preserved in original format for scientific modeling.
          </span>
        </div>
      </footer>
    </div>
  );
}
