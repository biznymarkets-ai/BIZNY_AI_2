import {
  db,
  usersTable,
  venturesTable,
  progressEntriesTable,
  coachPlansTable,
  coachTasksTable,
  listingsTable,
  opportunitiesTable,
  dealsTable,
  dealPartiesTable,
  ventureTemplatesTable,
} from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { saveUserToFirestore } from "./firestore";

export interface SyntheticCharacterDef {
  idKey: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  stateCity: string;
  industry: string;
  role: string;
  bio: string;
  skills: string[];
  interests: string[];
  businessName: string;
  isBusiness: boolean;
  avatarUrl: string;
  tagline: string;
  roleInNetwork: string;
  venture: {
    title: string;
    description: string;
    problem: string;
    mainIndustry: string;
    subIndustry: string;
    valueChainStage: string;
    currentDay: number;
    progressPercent: number;
    resourcesNeeded: string[];
    collaboratorsNeeded: string[];
    equipmentNeeded: string[];
    fundingRequired: string;
    expectedOutput: string;
    milestones: Array<{ title: string; description: string }>;
    progressLog: Array<{ dayNumber: number; content: string; milestone?: string }>;
  };
  coach: {
    goal: string;
    productivityScore: number;
    streakDays: number;
    bottlenecks: string[];
    resources: string[];
    roles: string[];
    tasks: Array<{
      title: string;
      description: string;
      reason: string;
      priority: "high" | "medium" | "low";
      status: "not_started" | "in_progress" | "completed" | "blocked";
      estimatedMinutes: number;
    }>;
  };
  listings: Array<{
    businessName: string;
    product: string;
    description: string;
    location: string;
    country: string;
    industry: string;
    isVerified: boolean;
  }>;
  opportunities?: Array<{
    title: string;
    type: string;
    industry: string;
    country: string;
    description: string;
    role?: string;
    investmentSize?: string;
    deadline?: string;
  }>;
  testPrompts: Array<{
    title: string;
    prompt: string;
    expectedOutcome: string;
  }>;
}

export const SYNTHETIC_CHARACTERS: SyntheticCharacterDef[] = [
  // ── 1. CHIDI OKAFOR (Primary Anchor Character) ──────────────────────────────
  {
    idKey: "chidi",
    name: "Chidi Okafor",
    email: "chidi.okafor@bizny.demo",
    phone: "+2348031110001",
    whatsapp: "+2348031110001",
    country: "Nigeria",
    stateCity: "Nsukka, Enugu State",
    industry: "Agriculture",
    role: "Producer / Agro-Processor",
    businessName: "Nsukka Starch & Agri-Processing Mills",
    isBusiness: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    tagline: "Cassava Agro-Processor & Starch Extraction Entrepreneur",
    roleInNetwork: "Anchor Producer: Extracts raw cassava into high-grade industrial starch. Needs flash dryer unblocking, lab testing, freight transport, and commercial offtakers.",
    bio: "Agro-processor with 15 hectares outgrower network in Enugu. Processing cassava into high-grade industrial starch and flour. Looking for reliable flash drying equipment, quality testing certification, and logistics corridors to scale output.",
    skills: ["Cassava Processing", "Starch Extraction", "Outgrower Management", "Farm Operations", "Quality Grading"],
    interests: ["Industrial Agro-Processing", "Export Grade Starch", "Equipment Sourcing", "Offtake Partnerships"],
    venture: {
      title: "High-Grade Cassava Starch Flash-Drying Facility",
      problem: "Traditional sun-drying of cassava mash results in 35% product loss during the rainy season, environmental contamination, and variable moisture content above the 10-12% industrial threshold.",
      description: "Establishing an automated 500kg/hr flash drying and milling facility in Nsukka to process 40 tons of cassava tubers weekly into premium food-grade starch for commercial bakeries and pharmaceutical off-takers.",
      mainIndustry: "Agriculture",
      subIndustry: "Agro-Processing & Milling",
      valueChainStage: "Processing & Value-Addition",
      currentDay: 18,
      progressPercent: 45,
      resourcesNeeded: [
        "Stainless Steel 304 Flash Dryer (500kg/hr)",
        "Certified food lab moisture & cyanide analysis",
        "Palletized freight transport to Lagos/Ibadan corridor",
      ],
      collaboratorsNeeded: [
        "Certified Agro-Machinery Fabricator (Amara Eze)",
        "Quality Assurance & Lab Auditor (Dr. Fatima Al-Mansoor)",
        "Industrial Freight Carrier (Emeka Nwosu)",
        "Packaged Food Brand Offtaker (Ada Adeleke)",
      ],
      equipmentNeeded: ["500kg/hr Flash Dryer", "Roots Blower", "Cyclone Separator", "Stainless Hammer Mill"],
      fundingRequired: "₦6,500,000",
      expectedOutput: "8 metric tons of food-grade cassava starch per week with <11% moisture content",
      milestones: [
        { title: "Complete Site Civil Works & Foundation for Flash Dryer", description: "Concrete slab and 3-phase electrical drop installed at Nsukka plant." },
        { title: "Contract Fabricator for 500kg/hr Stainless Flash Dryer", description: "Finalize specs and milestone escrow on Deal Desk with Amara Eze." },
        { title: "Standard Quality Testing & Moisture Lab Audit", description: "Sample batch lab testing with Dr. Fatima Al-Mansoor (Sahel Standards)." },
        { title: "Execute 12-Month Offtake Agreement with NutriRoot Foods", description: "Supply 2 MT monthly food-grade starch to Ada Adeleke's consumer brand." },
      ],
      progressLog: [
        { dayNumber: 5, content: "Completed cassava outgrower mapping: 14 smallholder farmers in Nsukka cluster signed supply agreements for 40 tons/month raw tubers.", milestone: "Supply Network" },
        { dayNumber: 12, content: "Finished concrete foundation and water drainage channels in the processing shed. Verified 3-phase power transformer.", milestone: "Civil Works" },
        { dayNumber: 18, content: "Initiated fabrication specs review with Amara Eze (Aba) for custom 500kg/hr cyclone flash dryer. Need Deal Desk terms confirmation.", milestone: "Equipment Sourcing" },
      ],
    },
    coach: {
      goal: "Scale cassava processing to 500kg/hr flash drying capacity and secure 2 guaranteed commercial offtakers in 90 days.",
      productivityScore: 78,
      streakDays: 14,
      bottlenecks: [
        "Flash dryer machinery fabrication unblocking",
        "Food-grade lab test certification (moisture < 12%)",
        "Freight haulage to commercial buyers in Western Nigeria",
      ],
      resources: ["15 hectares outgrower farm network", "50 tons/month cassava supply", "Diesel hammer mill", "Fermentation tanks", "CAC registered business"],
      roles: ["Agro-Processor", "Farm Manager", "Commercial Director"],
      tasks: [
        {
          title: "Review and approve Flash Dryer fabrication milestone contract on Deal Desk with Amara Eze",
          description: "Inspect proposed bill of materials, cyclone blower specs, and milestone payment schedule (30% deposit, 40% inspection, 30% commissioning).",
          reason: "Unblocks mechanical flash drying and eliminates 35% seasonal weather loss in starch production.",
          priority: "high",
          status: "in_progress",
          estimatedMinutes: 45,
        },
        {
          title: "Dispatch 5kg raw cassava starch sample to Dr. Fatima Al-Mansoor for moisture and purity analysis",
          description: "Package sealed dry sample in sterile container and book courier to Sahel Agro-Standards Lab in Lagos.",
          reason: "Required to satisfy NAFDAC standards and qualify for Ada Adeleke's (NutriRoot) 2 MT monthly offtake contract.",
          priority: "high",
          status: "not_started",
          estimatedMinutes: 60,
        },
        {
          title: "Coordinate pallet freight schedule with Emeka Nwosu (Niger-Trans) for Enugu-Lagos transit",
          description: "Verify Onitsha transit depot schedule and lock in per-ton freight rate for 50kg bagged starch.",
          reason: "Guarantees reliable 48-hour delivery timeline to buyers without broker markups.",
          priority: "medium",
          status: "not_started",
          estimatedMinutes: 30,
        },
        {
          title: "Calibrate washing and peeling throughput to 1.2 tons/hour",
          description: "Optimized rotary drum washer water pressure and trained 4 operators on root inspection.",
          reason: "Prevents raw tuber bottlenecks before hammer milling.",
          priority: "medium",
          status: "completed",
          estimatedMinutes: 90,
        },
      ],
    },
    listings: [
      {
        businessName: "Nsukka Starch & Agri-Processing Mills",
        product: "High-Grade Industrial Cassava Starch & Food-Grade Flour (50kg bags)",
        description: "Clean, fine-mesh food and industrial grade cassava starch. 12% moisture target, low ash content. Available in bulk 50kg bags for bakeries, food processors, and textile sizing. Direct from farm-gate processing facility in Nsukka.",
        location: "Nsukka, Enugu State",
        country: "Nigeria",
        industry: "Agriculture",
        isVerified: true,
      },
    ],
    testPrompts: [
      {
        title: "Unblock Flash Dryer Sourcing",
        prompt: "I need to unblock my flash dryer fabrication — who in Bizny can build a 500kg/hr unit for my Nsukka mill, and what deal structure should we use?",
        expectedOutcome: "Copilot searches the marketplace, identifies Amara Eze in Aba, details the fabrication specs, and proposes a 3-tranche Deal Desk contract.",
      },
      {
        title: "Connect with Commercial Starch Buyers",
        prompt: "Are there commercial buyers or food brands on Bizny looking to purchase food-grade cassava starch in bulk?",
        expectedOutcome: "Copilot searches opportunities and finds Ada Adeleke (NutriRoot Foods) seeking 2 MT monthly food-grade starch.",
      },
      {
        title: "Get Quality Certification Plan",
        prompt: "What testing and certification do I need before supplying industrial off-takers, and who can audit my starch?",
        expectedOutcome: "Copilot references Dr. Fatima Al-Mansoor's Sahel Standards lab and creates a Coach task for sample submission.",
      },
    ],
  },

  // ── 2. AMARA EZE (Equipment Fabricator & Industrial Mechanist) ──────────────
  {
    idKey: "amara",
    name: "Amara Eze",
    email: "amara.eze@bizny.demo",
    phone: "+2348022220002",
    whatsapp: "+2348022220002",
    country: "Nigeria",
    stateCity: "Aba, Abia State",
    industry: "Manufacturing",
    role: "Manufacturer / Fabricator",
    businessName: "Eze Precision Metalworks & Agro-Machinery",
    isBusiness: true,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    tagline: "Industrial Equipment Fabricator & Mechanical Engineer",
    roleInNetwork: "Machinery Fabricator: Builds custom agro-processing machines (flash dryers, graters, roasters) for Chidi and regional processors.",
    bio: "Industrial fabricator and mechanical engineer in Aba with 10 years experience building agro-processing machinery. Specialized in flash dryers, cassava graters, hydraulic dewatering presses, and stainless steel food contact systems.",
    skills: ["Metal Fabrication", "Machining", "Agricultural Engineering", "Welding & CAD", "Thermal Airflow Design"],
    interests: ["Agro-Machinery", "Import Substitution", "Industrial Tooling", "Local Manufacturing"],
    venture: {
      title: "Standardized 500kg/hr Agro Flash Dryer Fabrication Line",
      problem: "Imported agro-processing dryers cost 4x more and lack spare parts. Local agro-processors need reliable, food-grade machinery built to local voltage and fuel realities.",
      description: "Standardizing the modular fabrication of high-efficiency flash dryers using certified SS-304 stainless contact parts, diesel-fired heat exchangers, and balanced cyclone separators in Aba.",
      mainIndustry: "Manufacturing",
      subIndustry: "Agro-Machinery & Tooling",
      valueChainStage: "Equipment Manufacturing",
      currentDay: 24,
      progressPercent: 60,
      resourcesNeeded: ["Wholesale SS-304 stainless steel sheet supplier", "Advance milestone payments from verified buyers"],
      collaboratorsNeeded: ["Agro-processors requiring flash dryers (Chidi Okafor)", "Heavy equipment freight haulers (Emeka Nwosu)"],
      equipmentNeeded: ["CNC Plasma Table", "Hydraulic Sheet Bender", "TIG Welder", "Dynamic Balancing Rig"],
      fundingRequired: "₦12,000,000",
      expectedOutput: "2 completed 500kg/hr flash dryer units per month",
      milestones: [
        { title: "Complete Heat Exchanger & Burner Airflow Testing", description: "Thermodynamic validation for 180°C intake air." },
        { title: "Deliver & Commission Chidi Okafor's Nsukka Flash Dryer", description: "Transport via Emeka Nwosu and on-site 3-day commissioning." },
        { title: "Publish Open Agro-Machinery Standard Blueprint", description: "Release SOP and maintenance guide on Bizny Repository." },
      ],
      progressLog: [
        { dayNumber: 10, content: "Finished CAD blueprint for modular flash dryer drying duct and cyclone separator.", milestone: "CAD Engineering" },
        { dayNumber: 18, content: "Sourced 12 sheets of SS-304 food-grade stainless steel from Port Harcourt distributor.", milestone: "Raw Materials" },
        { dayNumber: 24, content: "Completed welding on cyclone cone assembly and tested blower motor alignment.", milestone: "Fabrication" },
      ],
    },
    coach: {
      goal: "Fabricate and deliver 3 turnkey flash dryers to regional processors and standardize our SS-304 quality assurance checklist.",
      productivityScore: 85,
      streakDays: 21,
      bottlenecks: ["Sourcing certified SS-304 food-grade sheet metal at stable pricing", "Securing escrow milestone commitments before cutting steel"],
      resources: ["Aba industrial workshop", "CNC plasma cutter", "TIG/MIG welding units", "6 certified machinists"],
      roles: ["Chief Engineer", "Production Lead"],
      tasks: [
        {
          title: "Finalize engineering bill of materials for Chidi Okafor's 500kg/hr flash dryer unit",
          description: "Review duct diameter (350mm), burner heat rating (250,000 BTU), and cyclone discharge airlock valve.",
          reason: "Required to establish fixed contract cost on Bizny Deal Desk.",
          priority: "high",
          status: "completed",
          estimatedMinutes: 60,
        },
        {
          title: "Order 18 gauge SS-304 stainless steel sheets from verified Aba steel importer",
          description: "Lock in wholesale price for 12 sheets with mill test certificate.",
          reason: "Ensures food-grade compliance so Chidi's starch passes Dr. Fatima's lab audit.",
          priority: "high",
          status: "in_progress",
          estimatedMinutes: 45,
        },
        {
          title: "Draft Deal Desk counterparty terms for Nsukka installation and 12-month warranty",
          description: "Set milestone stages: 30% steel procurement, 40% workshop assembly, 30% on-site commissioning.",
          reason: "Protects both fabricator and buyer with transparent verification.",
          priority: "medium",
          status: "not_started",
          estimatedMinutes: 40,
        },
      ],
    },
    listings: [
      {
        businessName: "Eze Precision Metalworks",
        product: "Custom Agricultural Flash Dryers & Industrial Cassava Graters",
        description: "Heavy-duty, food-grade agro-processing machinery fabricated in Aba. Flash dryers (200kg-1000kg/hr), stainless steel graters, hydraulic dewatering presses. 1-year warranty with on-site installation across Nigeria.",
        location: "Aba, Abia State",
        country: "Nigeria",
        industry: "Manufacturing",
        isVerified: true,
      },
    ],
    testPrompts: [
      {
        title: "Draft Fabrication Milestone Deal",
        prompt: "How should I structure the Deal Desk milestones for fabricating Chidi Okafor's 500kg/hr flash dryer to protect both parties?",
        expectedOutcome: "Copilot suggests a 3-stage milestone agreement with field inspection verification before final payment.",
      },
      {
        title: "Find Food-Grade Steel Suppliers",
        prompt: "Search the marketplace for certified stainless steel suppliers in Eastern Nigeria.",
        expectedOutcome: "Copilot searches marketplace listings for industrial materials and verified vendors.",
      },
    ],
  },

  // ── 3. DR. FATIMA AL-MANSOOR (Quality Assurance Specialist) ────────────────
  {
    idKey: "fatima",
    name: "Dr. Fatima Al-Mansoor",
    email: "fatima.almansoor@bizny.demo",
    phone: "+2348043330003",
    whatsapp: "+2348043330003",
    country: "Nigeria",
    stateCity: "Lagos & Kano",
    industry: "Consulting",
    role: "Field Agent / Quality Auditor",
    businessName: "Sahel Agro-Standards & Testing Laboratory",
    isBusiness: true,
    avatarUrl: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80",
    tagline: "Quality Assurance Specialist & Export Standards Auditor",
    roleInNetwork: "Trust & Verification Node: Performs chemical, moisture, and microbial testing so Chidi's starch can be trusted by Ada and international off-takers.",
    bio: "Food biochemist and certified export compliance auditor. Providing rapid quality analysis, microbial testing, moisture auditing, and NAFDAC/SON export certification for Nigerian agro-processors.",
    skills: ["Chemical Analysis", "Export Compliance", "Food Safety Standards", "Quality Assurance", "Lab Audit"],
    interests: ["Agro-Exports", "NAFDAC Certification", "Standards Harmonization", "Value Chain Integrity"],
    venture: {
      title: "Accredited Rapid Quality Certification for West African Agro-Processors",
      problem: "Small agro-processors fail export and supermarket audits due to lack of local accessible testing for moisture, microbial loads, and chemical residues.",
      description: "Operating a high-throughput mobile and central testing lab network that delivers ISO-aligned certificates of analysis within 48 hours to rural agro-processors.",
      mainIndustry: "Consulting",
      subIndustry: "Testing & Quality Certification",
      valueChainStage: "Quality & Regulatory Compliance",
      currentDay: 30,
      progressPercent: 70,
      resourcesNeeded: ["Partner processing hubs for bulk sampling"],
      collaboratorsNeeded: ["Agro-processors seeking certification (Chidi Okafor)", "Food brand buyers (Ada Adeleke)"],
      equipmentNeeded: ["Spectrophotometer", "Karl Fischer Titrator", "Autoclave", "Microbial Incubator"],
      fundingRequired: "₦15,000,000",
      expectedOutput: "50 certified processor batches audited per month",
      milestones: [
        { title: "Standardize Cassava Starch 48-Hour Rapid Audit Protocol", description: "Moisture, cyanide, pH, ash, and starch content package." },
        { title: "Audit Batch #001 for Nsukka Starch Mills", description: "Issue Certificate of Analysis for Chidi Okafor's pilot run." },
      ],
      progressLog: [
        { dayNumber: 15, content: "Calibrated moisture analyzer and GC-MS equipment against international Codex standards.", milestone: "Lab Calibration" },
        { dayNumber: 30, content: "Published Bizny guide on 'Moisture & Ash Thresholds for Commercial Cassava Starch'.", milestone: "Knowledge Base" },
      ],
    },
    coach: {
      goal: "Certify 20 regional agro-processors for supermarket and export offtake within 90 days.",
      productivityScore: 92,
      streakDays: 28,
      bottlenecks: ["Turnaround time for remote farm-gate sample logistics from rural Southeast"],
      resources: ["Spectroscopy testing lab", "Mobile moisture and purity testing kits", "Certified auditor credentials"],
      roles: ["Lead Scientist", "Standards Auditor"],
      tasks: [
        {
          title: "Process and issue Certificate of Analysis for Chidi Okafor's Nsukka starch sample",
          description: "Test moisture content (Karl Fischer), ash %, pH (5.0-7.0), and microbial plate count.",
          reason: "Enables Chidi to fulfill purchase order requirements for Ada Adeleke's NutriRoot Foods.",
          priority: "high",
          status: "in_progress",
          estimatedMinutes: 90,
        },
        {
          title: "Review NAFDAC Good Manufacturing Practice (GMP) audit checklist for agro-processing mills",
          description: "Update verification criteria for field agent physical inspections.",
          reason: "Standardizes verified badges on Bizny marketplace listings.",
          priority: "medium",
          status: "not_started",
          estimatedMinutes: 60,
        },
      ],
    },
    listings: [
      {
        businessName: "Sahel Agro-Standards Lab",
        product: "Food-Grade Starch & Export Standard Chemical Lab Testing",
        description: "Comprehensive purity, moisture (Karl Fischer), cyanide residue, microbial count, and particle size analysis for cassava, grains, and spice processors. ISO-aligned Certificate of Analysis issued in 48 hours.",
        location: "Lagos & Kano",
        country: "Nigeria",
        industry: "Consulting",
        isVerified: true,
      },
    ],
    opportunities: [
      {
        title: "Calling Agro-Processors: Quality Verification & Export Offtake Pilot",
        type: "partnership",
        industry: "Agriculture",
        country: "Nigeria",
        description: "Sahel Standards is selecting 10 certified starch and grain processors for a subsidized export-readiness audit and direct introduction to international off-takers.",
        deadline: "2026-10-31",
      },
    ],
    testPrompts: [
      {
        title: "Audit Chidi's Starch Sample",
        prompt: "What test parameters should I include on the Certificate of Analysis for Chidi Okafor's cassava starch to satisfy food brand standards?",
        expectedOutcome: "Copilot details moisture (<12%), starch content (>85%), pH, ash content, and cyanide limits for industrial food-grade flour.",
      },
    ],
  },

  // ── 4. EMEKA NWOSU (Logistics & Haulage Coordinator) ────────────────────────
  {
    idKey: "emeka",
    name: "Emeka Nwosu",
    email: "emeka.nwosu@bizny.demo",
    phone: "+2348054440004",
    whatsapp: "+2348054440004",
    country: "Nigeria",
    stateCity: "Onitsha, Anambra State",
    industry: "Logistics",
    role: "Service Provider / Fleet Operator",
    businessName: "Niger-Trans Haulage & Rural Freight Aggregators",
    isBusiness: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    tagline: "Industrial Logistics Coordinator & Freight Fleet Operator",
    roleInNetwork: "Corridor Carrier: Transports flash dryer parts from Amara (Aba) to Chidi (Nsukka), and finished starch from Chidi (Nsukka) to Ada (Ibadan).",
    bio: "Fleet operator and freight aggregator covering the Eastern industrial corridor (Enugu - Aba - Onitsha - Lagos). Connecting rural agro-clusters directly with urban industrial buyers without intermediary delays.",
    skills: ["Freight Logistics", "Fleet Management", "Route Optimization", "Cargo Tracking", "Supply Chain Security"],
    interests: ["Agro-Logistics", "Interstate Trade", "Cold Chain Infrastructure", "Freight Technology"],
    venture: {
      title: "Scheduled Rural-to-Urban Industrial Cargo Consolidation Corridor",
      problem: "Agricultural producers lose 20-30% on transport due to empty backhauls, informal middleman gouging, and lack of insured palletized transport.",
      description: "Operating scheduled twice-weekly consolidated freight runs linking Enugu/Aba agro-processors to Lagos/Ibadan consumer markets with GPS tracking and insured waybills.",
      mainIndustry: "Logistics",
      subIndustry: "Freight & Haulage",
      valueChainStage: "Transport & Distribution",
      currentDay: 20,
      progressPercent: 50,
      resourcesNeeded: ["Fleet maintenance financing", "Depot storage expansion"],
      collaboratorsNeeded: ["Agro-producers with recurring tonnage (Chidi Okafor)", "Retail brands receiving cargo (Ada Adeleke)"],
      equipmentNeeded: ["8 10-ton flatbeds", "2 refrigerated vans", "Hydraulic pallet jacks"],
      fundingRequired: "₦8,000,000",
      expectedOutput: "60 tons of consolidated cargo moved weekly across corridor",
      milestones: [
        { title: "Establish Nsukka - Onitsha - Ibadan Scheduled Freight Route", description: "Lock in fixed weekly pickup for bagged starch and agro produce." },
      ],
      progressLog: [
        { dayNumber: 10, content: "Onboarded 4 new 10-ton trucks with GPS telemetry tracking.", milestone: "Fleet Expansion" },
        { dayNumber: 20, content: "Secured cargo transit insurance policy covering up to ₦20M per trip.", milestone: "Risk Management" },
      ],
    },
    coach: {
      goal: "Maintain 95% on-time delivery across the Enugu-Aba-Ibadan corridor with zero cargo spoilage.",
      productivityScore: 88,
      streakDays: 19,
      bottlenecks: ["Fuel price volatility hedging", "Optimizing return cargo loads from Lagos to Southeast"],
      resources: ["8 10-ton flatbed trucks", "2 refrigerated vans", "Onitsha transit depot", "GPS tracking"],
      roles: ["Logistics Director", "Fleet Dispatcher"],
      tasks: [
        {
          title: "Schedule recurring weekly pickup for Chidi Okafor's 50kg starch pallets in Nsukka",
          description: "Assign 10-ton flatbed for every Tuesday pickup with direct transit to Ada Adeleke's Ibadan warehouse.",
          reason: "Guarantees 48-hour delivery SLA for NutriRoot Foods supply contract.",
          priority: "high",
          status: "in_progress",
          estimatedMinutes: 45,
        },
      ],
    },
    listings: [
      {
        businessName: "Niger-Trans Haulage",
        product: "Enugu-Aba-Lagos Freight Corridor & Farm-Gate Aggregation",
        description: "Scheduled weekly haulage for agricultural produce, processed starch, and machinery parts across Enugu, Aba, Onitsha, Ibadan, and Lagos. Insured cargo and GPS tracking.",
        location: "Onitsha, Anambra State",
        country: "Nigeria",
        industry: "Logistics",
        isVerified: true,
      },
    ],
    testPrompts: [
      {
        title: "Optimize Freight Route",
        prompt: "Calculate the freight schedule and cost for moving 2 metric tons of bagged starch from Chidi in Nsukka to Ada in Ibadan.",
        expectedOutcome: "Copilot computes route mileage, transit timeline (36-48h), and cargo consolidation options.",
      },
    ],
  },

  // ── 5. ADAOBI 'ADA' ADELEKE (Food Packaging & Consumer Brand) ───────────────
  {
    idKey: "ada",
    name: "Adaobi 'Ada' Adeleke",
    email: "ada.adeleke@bizny.demo",
    phone: "+2348065550005",
    whatsapp: "+2348065550005",
    country: "Nigeria",
    stateCity: "Ibadan, Oyo State",
    industry: "Manufacturing",
    role: "Entrepreneur / Brand Formulator",
    businessName: "NutriRoot Foods & Consumer Goods",
    isBusiness: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    tagline: "Food Formulation Entrepreneur & Packaged Consumer Brand Founder",
    roleInNetwork: "Commercial Offtaker: Purchases Chidi's lab-certified starch, packages it into retail flour, and distributes to supermarket chains.",
    bio: "Consumer goods entrepreneur and food formulation specialist. Founder of NutriRoot Foods, producing packaged organic cassava flour, gluten-free baking mixes, and instant fortified starch for modern retail supermarkets.",
    skills: ["Brand Strategy", "Food Formulation", "Retail Distribution", "Packaging Design", "Vendor Management"],
    interests: ["Consumer Packaged Goods", "Gluten-Free Foods", "Direct-to-Consumer", "Agro-Value Addition"],
    venture: {
      title: "Packaged High-Purity Cassava Flour & Instant Starch Retail Brand",
      problem: "Modern urban consumers and bakeries want premium, sand-free, odor-free cassava flour in hygienic packaging, but raw suppliers have erratic quality.",
      description: "Packaging premium certified gluten-free cassava flour in 1kg and 5kg standup retail pouches for 24 supermarkets across Lagos and Ibadan.",
      mainIndustry: "Manufacturing",
      subIndustry: "Food & Beverage Consumer Goods",
      valueChainStage: "Consumer Packaging & Retail",
      currentDay: 28,
      progressPercent: 65,
      resourcesNeeded: ["Reliable monthly supply of 2-5 MT certified food-grade cassava starch with consistent moisture < 12%"],
      collaboratorsNeeded: ["Primary Agro-Processor (Chidi Okafor)", "Quality Testing Auditor (Dr. Fatima Al-Mansoor)"],
      equipmentNeeded: ["Multi-head Pouch Filler", "Continuous Band Sealer", "Date Coding Inkjet"],
      fundingRequired: "₦10,000,000",
      expectedOutput: "10,000 retail pouches (1kg) packaged and distributed monthly",
      milestones: [
        { title: "Secure Long-Term Offtake with Verified Starch Supplier", description: "Execute Deal Desk agreement with Chidi Okafor for 2 MT monthly." },
        { title: "Supermarket Shelf Expansion into 10 New Lagos Outlets", description: "Listing contracts finalized with retail chain." },
      ],
      progressLog: [
        { dayNumber: 14, content: "Received NAFDAC registration certificate for NutriRoot High-Purity Cassava Flour 1kg pack.", milestone: "NAFDAC Approval" },
        { dayNumber: 28, content: "Signed retail distribution agreement with 12 supermarket outlets in Ibadan.", milestone: "Retail Contracts" },
      ],
    },
    coach: {
      goal: "Scale monthly retail packaging to 10,000 pouches by locking in 2 MT/month verified starch supply.",
      productivityScore: 90,
      streakDays: 25,
      bottlenecks: ["Raw material quality inconsistency from unverified spot market sellers"],
      resources: ["Modern automated packaging line", "Distribution contracts with 24 supermarkets", "NAFDAC registration"],
      roles: ["Managing Director", "Brand Formulator"],
      tasks: [
        {
          title: "Sign 12-month supply deal with Chidi Okafor (Nsukka Starch Mills) on Deal Desk",
          description: "Establish monthly order of 2 MT food-grade starch at agreed price, contingent on Dr. Fatima's Certificate of Analysis.",
          reason: "Secures stable input costs and eliminates supply stockouts for retail packaging line.",
          priority: "high",
          status: "in_progress",
          estimatedMinutes: 45,
        },
      ],
    },
    listings: [
      {
        businessName: "NutriRoot Foods",
        product: "NutriRoot Packaged Organic Cassava Flour & Baking Mixes (1kg & 5kg retail packs)",
        description: "Premium sifted, gluten-free cassava flour and instant starch retail packs. Distributed across major retail stores in Southwest Nigeria.",
        location: "Ibadan, Oyo State",
        country: "Nigeria",
        industry: "Manufacturing",
        isVerified: true,
      },
    ],
    opportunities: [
      {
        title: "Seeking Long-Term Supply Contract: 2 MT Monthly Food-Grade Cassava Starch",
        type: "industrial",
        industry: "Agriculture",
        country: "Nigeria",
        description: "NutriRoot Foods is offering a 12-month fixed-price off-take agreement for 2 metric tons/month of food-grade cassava starch. Must pass moisture (<12%) and microbial lab verification. Same-day payment upon delivery.",
        deadline: "2026-12-31",
      },
    ],
    testPrompts: [
      {
        title: "Find Verified Starch Suppliers",
        prompt: "I need to source 2 metric tons of food-grade cassava starch with certified moisture < 12% — who in Bizny can supply this?",
        expectedOutcome: "Copilot searches the marketplace and identifies Chidi Okafor in Nsukka, noting his flash drying capacity and Dr. Fatima's certification.",
      },
    ],
  },
];

/**
 * Idempotently seeds the 5 synthetic characters and their complete interconnected universe.
 */
export async function seedSyntheticUniverse(): Promise<{ count: number; characters: string[] }> {
  console.log("[SyntheticUniverse] Starting idempotent seed of 5 economic participants...");

  const userIds: Record<string, number> = {};

  for (const char of SYNTHETIC_CHARACTERS) {
    // 1. Check if user already exists by email
    const allUsers = await db.select().from(usersTable);
    const existingUser = allUsers.find((u) => u.email?.toLowerCase() === char.email.toLowerCase());

    let userId: number;

    if (!existingUser) {
      const [newUser] = await db
        .insert(usersTable)
        .values({
          name: char.name,
          email: char.email,
          phone: char.phone,
          whatsapp: char.whatsapp,
          country: char.country,
          stateCity: char.stateCity,
          industry: char.industry,
          role: char.role,
          bio: char.bio,
          skills: char.skills,
          interests: char.interests,
          businessName: char.businessName,
          isBusiness: char.isBusiness,
          avatarUrl: char.avatarUrl,
          verificationStatus: "verified",
          publicSlug: char.idKey,
        })
        .returning();

      userId = newUser ? newUser.id : Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
      console.log(`[SyntheticUniverse] Created user ${char.name} (id=${userId})`);
      
      // Save to Firestore in background
      if (newUser) {
        saveUserToFirestore(newUser).catch((e) => console.warn("Firestore sync warning:", e));
      }
    } else {
      userId = existingUser.id;
      // Update fields to ensure fresh rich data
      await db
        .update(usersTable)
        .set({
          name: char.name,
          phone: char.phone,
          whatsapp: char.whatsapp,
          country: char.country,
          stateCity: char.stateCity,
          industry: char.industry,
          role: char.role,
          bio: char.bio,
          skills: char.skills,
          interests: char.interests,
          businessName: char.businessName,
          isBusiness: char.isBusiness,
          avatarUrl: char.avatarUrl,
          verificationStatus: "verified",
          publicSlug: char.idKey,
        })
        .where(eq(usersTable.id, userId));
      console.log(`[SyntheticUniverse] Updated existing user ${char.name} (id=${userId})`);
    }

    userIds[char.idKey] = userId;

    // 2. Venture Setup
    const allVentures = await db.select().from(venturesTable);
    const existingVenture = allVentures.find((v) => Number(v.userId) === Number(userId));

    let ventureId: number;

    if (!existingVenture) {
      const [newVenture] = await db
        .insert(venturesTable)
        .values({
          userId,
          title: char.venture.title,
          problem: char.venture.problem,
          description: char.venture.description,
          mainIndustry: char.venture.mainIndustry,
          subIndustry: char.venture.subIndustry,
          valueChainStage: char.venture.valueChainStage,
          currentDay: char.venture.currentDay,
          progressPercent: char.venture.progressPercent,
          status: "active",
          country: char.country,
          stateCity: char.stateCity,
          resourcesNeeded: char.venture.resourcesNeeded,
          collaboratorsNeeded: char.venture.collaboratorsNeeded,
          equipmentNeeded: char.venture.equipmentNeeded,
          fundingRequired: char.venture.fundingRequired,
          expectedOutput: char.venture.expectedOutput,
          milestones: char.venture.milestones,
          visibility: "public",
        })
        .returning();

      ventureId = newVenture ? newVenture.id : 1;

      // Seed progress log entries
      for (const log of char.venture.progressLog) {
        await db.insert(progressEntriesTable).values({
          ventureId,
          dayNumber: log.dayNumber,
          content: log.content,
          milestone: log.milestone || "Progress Update",
          contentType: "text",
          authorId: userId,
        });
      }
    } else {
      ventureId = existingVenture.id;
      await db
        .update(venturesTable)
        .set({
          title: char.venture.title,
          problem: char.venture.problem,
          description: char.venture.description,
          mainIndustry: char.venture.mainIndustry,
          subIndustry: char.venture.subIndustry,
          valueChainStage: char.venture.valueChainStage,
          currentDay: char.venture.currentDay,
          progressPercent: char.venture.progressPercent,
          resourcesNeeded: char.venture.resourcesNeeded,
          collaboratorsNeeded: char.venture.collaboratorsNeeded,
          equipmentNeeded: char.venture.equipmentNeeded,
          fundingRequired: char.venture.fundingRequired,
          expectedOutput: char.venture.expectedOutput,
          milestones: char.venture.milestones,
        })
        .where(eq(venturesTable.id, ventureId));
    }

    // 3. Coach Plan & Tasks Setup
    const allPlans = await db.select().from(coachPlansTable);
    const existingPlan = allPlans.find((p) => Number(p.userId) === Number(userId));

    let planId: number;

    if (!existingPlan) {
      const [newPlan] = await db
        .insert(coachPlansTable)
        .values({
          userId,
          goal: char.coach.goal,
          selfDescription: char.bio,
          productivityScore: char.coach.productivityScore,
          streakDays: char.coach.streakDays,
          bottlenecks: char.coach.bottlenecks,
          resources: char.coach.resources,
          roles: char.coach.roles,
        })
        .returning();

      planId = newPlan ? newPlan.id : 1;
    } else {
      planId = existingPlan.id;
      await db
        .update(coachPlansTable)
        .set({
          goal: char.coach.goal,
          productivityScore: char.coach.productivityScore,
          streakDays: char.coach.streakDays,
          bottlenecks: char.coach.bottlenecks,
          resources: char.coach.resources,
          roles: char.coach.roles,
        })
        .where(eq(coachPlansTable.id, planId));
    }

    // Insert Coach Tasks if not already present
    const allTasks = await db.select().from(coachTasksTable);
    const existingTasks = allTasks.filter((t) => Number(t.userId) === Number(userId));

    if (existingTasks.length === 0) {
      for (const t of char.coach.tasks) {
        await db.insert(coachTasksTable).values({
          planId,
          userId,
          title: t.title,
          description: t.description,
          reason: t.reason,
          priority: t.priority,
          status: t.status,
          estimatedMinutes: t.estimatedMinutes,
        });
      }
    }

    // 4. Marketplace Listings Setup
    const allListings = await db.select().from(listingsTable);
    for (const listing of char.listings) {
      const alreadyExists = allListings.some(
        (l) => Number(l.postedById) === Number(userId) || l.businessName === listing.businessName
      );

      if (!alreadyExists) {
        await db.insert(listingsTable).values({
          postedById: userId,
          businessName: listing.businessName,
          product: listing.product,
          description: listing.description,
          location: listing.location,
          country: listing.country,
          industry: listing.industry,
          isVerified: listing.isVerified,
          phone: char.phone,
          whatsapp: char.whatsapp,
          email: char.email,
        });
      }
    }

    // 5. Opportunities Setup
    if (char.opportunities && char.opportunities.length > 0) {
      const allOpps = await db.select().from(opportunitiesTable);
      for (const opp of char.opportunities) {
        const alreadyExists = allOpps.some(
          (o) => Number(o.postedById) === Number(userId) || o.title === opp.title
        );

        if (!alreadyExists) {
          await db.insert(opportunitiesTable).values({
            postedById: userId,
            title: opp.title,
            type: opp.type,
            industry: opp.industry,
            country: opp.country,
            description: opp.description,
            role: opp.role || null,
            investmentSize: opp.investmentSize || null,
            deadline: opp.deadline || null,
          });
        }
      }
    }
  }

  // 6. Interconnected Deals (Chidi <-> Amara for Flash Dryer, Chidi <-> Ada for Starch Offtake)
  const chidiId = userIds["chidi"];
  const amaraId = userIds["amara"];
  const adaId = userIds["ada"];

  if (chidiId && amaraId) {
    const allDeals = await db.select().from(dealsTable);
    const existingDeals = allDeals.filter((d) => Number(d.initiatorId) === Number(chidiId));

    if (existingDeals.length === 0) {
      const [flashDryerDeal] = await db
        .insert(dealsTable)
        .values({
          initiatorId: chidiId,
          title: "500kg/hr Cyclone Flash Dryer Fabrication & Commissioning Agreement",
          dealType: "Equipment Fabrication",
          dealCategory: "Equipment Procurement & Commissioning",
          status: "proposed",
          industry: "Agriculture / Manufacturing",
          country: "Nigeria",
          stateCity: "Nsukka, Enugu State",
          description: "Turnkey fabrication, delivery, and commissioning of a 500kg/hr cyclone flash dryer with SS-304 food contact parts from Eze Precision Metalworks (Aba) to Nsukka Starch Mills.",
          financialValue: "₦4,800,000",
          paymentTerms: "30% Steel Procurement Deposit, 40% Workshop Inspection, 30% On-site Commissioning",
          terms: "12-month mechanical warranty. On-site operator training included. Final tranche released upon field verification of <12% moisture starch output.",
          verificationStatus: "verified",
          milestones: [
            { title: "Stage 1: SS-304 Raw Material Procurement & Inspection", description: "Deliver steel sheets and mill test certificate to Aba workshop." },
            { title: "Stage 2: Workshop Assembly & Blower Balancing Test", description: "Physical test of airflow and burner heat exchanger in Aba." },
            { title: "Stage 3: On-site Installation & 48h Production Commissioning", description: "Assemble at Nsukka mill and verify 500kg/hr throughput." },
          ],
        })
        .returning();

      if (flashDryerDeal) {
        await db.insert(dealPartiesTable).values({
          dealId: flashDryerDeal.id,
          userId: chidiId,
          role: "buyer",
          agreed: true,
        });
        await db.insert(dealPartiesTable).values({
          dealId: flashDryerDeal.id,
          userId: amaraId,
          role: "fabricator",
          agreed: true,
        });
      }
    }
  }

  // 7. Seed Core Industrial Blueprints / Templates
  const templatesToSeed = [
    {
      title: "Cassava Starch Flash Drying & Industrial Refining SOP",
      industry: "Agriculture",
        subIndustry: "Agro-Processing",
        productCategory: "Industrial Starch",
        specificProduct: "Food-Grade & Industrial Cassava Starch",
        description: "Complete Standard Operating Procedure for establishing and operating a 500kg/hr cassava cyclone flash drying facility. Includes root washing, rasping, dewatering, pneumatic flash drying, and moisture quality assurance.",
        problemSolved: "Eliminates reliance on weather-dependent sun drying, achieving continuous industrial throughput with certified <12% moisture content.",
        durationDays: 30,
        requiredSkills: ["Agro-Processing", "Machine Operation", "Quality Control", "Inventory Management"],
        requiredTools: ["Hydraulic Press", "Flash Dryer", "Hammer Mill", "Moisture Meter", "Bag Stitcher"],
        requiredResources: ["Fresh Cassava Roots", "Clean Water", "Diesel/LPG for Burner", "Food-Grade Packaging (50kg)"],
        estimatedTimeline: "4 to 6 weeks from site setup to first production run",
        estimatedStartupCost: 8500000,
        milestones: [
          { title: "Site & Electrical/Pneumatic Layout Setup", description: "Concrete pad and 3-phase power installation for flash dryer.", day: 5 },
          { title: "Machinery Installation & Cold Air Flow Test", description: "Mount cyclone, blower, and burner ducting.", day: 12 },
          { title: "Trial Wet Cake Drying Run", description: "Process 1 ton of wet cassava mash and calibrate burner temperature.", day: 20 },
          { title: "Lab Certification & Offtaker Dispatch", description: "Send sample to accredited lab for moisture and ash audit.", day: 30 },
        ],
        dailyStructure: [],
        riskFactors: ["Burner temperature fluctuations scorching starch", "Tubers spoiling if delayed >48h after harvest"],
        expectedOutputs: ["500kg/hr dried food-grade starch", "<12% verified moisture content"],
        templateType: "sop",
        difficulty: "intermediate",
        tags: ["cassava", "agro-processing", "flash dryer", "manufacturing", "sop"],
        visibility: "public",
      },
      {
        title: "Agro-Processing Machinery Fabrication & Metallurgy Workshop",
        industry: "Manufacturing",
        subIndustry: "Industrial Equipment",
        productCategory: "Food Processing Machinery",
        specificProduct: "Flash Dryers, Raspers, Hammer Mills, Roasters",
        description: "Execution blueprint for custom fabrication of stainless-steel and carbon-steel agricultural processing machinery with standardized jigs, plasma cutting, and dynamic blower balancing.",
        problemSolved: "Enables local fabrication of durable food-grade machinery at 60% lower cost than imported alternatives.",
        durationDays: 45,
        requiredSkills: ["TIG/MIG Welding", "Lathe Turning", "Sheet Metal Bending", "Blower Balancing"],
        requiredTools: ["TIG Welder", "Hydraulic Guillotine", "Lathe Machine", "Dynamic Balancing Rig"],
        requiredResources: ["SS-304 Food-Grade Stainless Sheets", "Heavy Gauge Carbon Steel Angles", "Electric Motors (15-30 HP)"],
        estimatedTimeline: "6 weeks per production batch",
        estimatedStartupCost: 12000000,
        milestones: [
          { title: "Jig & Template Engineering", description: "Create standardized jigs for cyclone cone and duct flanges.", day: 7 },
          { title: "SS-304 Sheet Cutting & Rolling", description: "Precision rolling of 3mm stainless steel cyclone cylinders.", day: 18 },
          { title: "Blower Impeller Dynamic Balancing", description: "Balance high-speed 2800 RPM impeller to zero vibration.", day: 30 },
          { title: "Shop Floor Factory Acceptance Test", description: "Run motor continuous 4-hour thermal and vibration test.", day: 45 },
        ],
        dailyStructure: [],
        riskFactors: ["Impeller imbalance causing high vibration", "Material distortion during welding"],
        expectedOutputs: ["Complete certified machinery ready for commissioning"],
        templateType: "engineering_design",
        difficulty: "advanced",
        tags: ["fabrication", "machinery", "manufacturing", "engineering", "agro-processing"],
        visibility: "public",
      },
      {
        title: "Agrifood Lab Verification & Quality Assurance Protocol",
        industry: "Quality & Testing",
        subIndustry: "Scientific Verification",
        productCategory: "Laboratory Testing",
        specificProduct: "Moisture, Microbial, and Heavy Metal Assay",
        description: "Field and laboratory testing protocol for auditing industrial agro-commodities (starch, flour, grains, oils) for moisture content, cyanide levels, microbial count, and particle size distribution.",
        problemSolved: "Provides institutional trust and verified certificates of analysis required by FMCG brands and international export buyers.",
        durationDays: 14,
        requiredSkills: ["Chemical Analysis", "Laboratory Assay", "Field Sampling", "Spectroscopy"],
        requiredTools: ["Halogen Moisture Analyzer", "Spectrophotometer", "Incubator & Petri Dishes", "Precision Balance"],
        requiredResources: ["Assay Reagents", "Sterile Sampling Bags", "Standard Calibration Weights"],
        estimatedTimeline: "1 to 2 days per comprehensive sample audit",
        estimatedStartupCost: 4500000,
        milestones: [
          { title: "Representative Field Sampling Protocol", description: "Collect 10 randomized samples per 5-ton production lot.", day: 2 },
          { title: "Moisture & Ash Content Determination", description: "Halogen drying to determine exact water percentage.", day: 5 },
          { title: "Microbial Plating & Incubation", description: "48-hour incubation to count yeast, mould, and coliform colonies.", day: 9 },
          { title: "Official Certificate of Analysis Issuance", description: "Issue cryptographically verified Bizny test report.", day: 14 },
        ],
        dailyStructure: [],
        riskFactors: ["Sample cross-contamination", "Calibration drift in analytical balances"],
        expectedOutputs: ["Certified Certificate of Analysis", "Export Compliance Clearance"],
        templateType: "sop",
        difficulty: "intermediate",
        tags: ["verification", "quality assurance", "lab testing", "compliance", "export"],
        visibility: "public",
      },
      {
        title: "Inter-State Heavy Freight Corridor Logistics Blueprint",
        industry: "Logistics",
        subIndustry: "Freight Transportation",
        productCategory: "Road Haulage",
        specificProduct: "Heavy Cargo & Industrial Commodity Freight",
        description: "Operations playbook for managing 15 to 30-ton inter-state freight transport across major African transport corridors (e.g. Aba-Onitsha-Enugu-Lagos-Ibadan). Includes waypoint monitoring, fuel hedging, and cargo insurance protocols.",
        problemSolved: "Minimizes transit delays, eliminates cargo shrinkage, and optimizes backhaul load matching.",
        durationDays: 21,
        requiredSkills: ["Fleet Routing", "Freight Manifest Management", "Waybill Auditing", "Driver Coordination"],
        requiredTools: ["GPS Tracking Telematics", "Digital Weighbridge Interface", "Tarpaulin Weatherproof Covers"],
        requiredResources: ["30-ton Flatbed / Box Trailer", "Diesel Fuel Allocation", "Goods-in-Transit Insurance Policy"],
        estimatedTimeline: "1 to 3 days per haulage run",
        estimatedStartupCost: 6000000,
        milestones: [
          { title: "Pre-Trip Inspection & Weight Manifest Verification", description: "Inspect tires, brakes, and stamp certified weighbridge ticket.", day: 3 },
          { title: "Corridor Waypoint Telematics Monitoring", description: "Real-time tracking of route checkpoints and speed compliance.", day: 10 },
          { title: "Destination Offloading & Delivery Receipt Signoff", description: "Consignee inspection and digital signature on waybill.", day: 16 },
          { title: "Backhaul Cargo Match & Return Dispatch", description: "Load complementary goods for return journey.", day: 21 },
        ],
        dailyStructure: [],
        riskFactors: ["Corridor highway checkpoints and tolls", "Inclement weather damaging unsealed cargo"],
        expectedOutputs: ["Zero transit cargo loss", "100% on-time delivery rate"],
        templateType: "playbook",
        difficulty: "intermediate",
        tags: ["logistics", "freight", "transportation", "supply chain", "haulage"],
        visibility: "public",
      },
      {
        title: "Packaged Consumer Foods (FMCG) Brand Launch & Distribution Playbook",
        industry: "Consumer Goods",
        subIndustry: "Food Processing & Packaging",
        productCategory: "Packaged Foods",
        specificProduct: "Retail Cassava Flour, Baking Mixes, Packaged Starch",
        description: "Commercialization blueprint for formulating, retail packaging, branding, and distributing consumer food products through supermarket chains, wholesalers, and neighborhood retail networks.",
        problemSolved: "Bridges the gap between bulk industrial ingredients and high-margin retail consumer shelves.",
        durationDays: 60,
        requiredSkills: ["Brand Formulations", "Retail Packaging Design", "FMCG Distribution", "Regulatory Registration"],
        requiredTools: ["Form-Fill-Seal Packaging Machine", "Date Coding Printer", "Display Cartons"],
        requiredResources: ["Food-Grade High-Barrier Pouches", "Barcode Registrations", "Supermarket Vendor Accounts"],
        estimatedTimeline: "8 weeks from product formulation to retail distribution",
        estimatedStartupCost: 7500000,
        milestones: [
          { title: "Product Formulation & Consumer Palatability Tests", description: "Blind taste test and baking quality trials.", day: 14 },
          { title: "Pouch Design & Regulatory Packaging Compliance", description: "Nutrition facts labeling, ingredient statement, and batch code box.", day: 28 },
          { title: "Form-Fill-Seal Packaging Batch Run", description: "Package 5,000 units of 1kg and 5kg retail packs.", day: 42 },
          { title: "Supermarket & Wholesale Distribution Rollout", description: "Secure placement in 20 major retail outlets in target cities.", day: 60 },
        ],
        dailyStructure: [],
        riskFactors: ["Slow retail inventory turn", "Packaging seal failure causing moisture ingress"],
        expectedOutputs: ["Established retail consumer brand", "Positive shelf-level cashflow"],
        templateType: "business_model",
        difficulty: "advanced",
        tags: ["fmcg", "consumer goods", "packaging", "retail", "branding", "distribution"],
        visibility: "public",
      }
    ];

    for (const t of templatesToSeed) {
      const existing = await db.select().from(ventureTemplatesTable).where(eq(ventureTemplatesTable.title, t.title));
      if (existing.length === 0) {
        await db.insert(ventureTemplatesTable).values(t as any);
      }
    }

  console.log("[SyntheticUniverse] ✅ Seeded 5 synthetic characters successfully!");
  return {
    count: SYNTHETIC_CHARACTERS.length,
    characters: SYNTHETIC_CHARACTERS.map((c) => `${c.name} (${c.roleInNetwork})`),
  };
}
