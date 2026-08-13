/**
 * Bizny Demo User Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates 10 persistent bot personas that demonstrate every major feature of the
 * platform.  Safe to re-run: existing emails are skipped, not duplicated.
 *
 * Run: pnpm --filter @workspace/scripts run seed-demo
 */

const BASE = "http://localhost:80/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeToken(id: number): string {
  return `bizny_token_${id}_${Date.now()}`;
}

// ─── persona definitions ──────────────────────────────────────────────────────

const PERSONAS = [
  // 1 ─ Farmer / Producer
  {
    name: "Adeola Fashola",
    email: "adeola.fashola@bizny.demo",
    whatsapp: "+2348012340001",
    country: "Nigeria",
    stateCity: "Oyo State",
    industry: "Agriculture",
    role: "Producer",
    skills: ["Cassava farming", "Crop management", "Irrigation"],
    interests: ["Agro-processing", "Export markets"],
    bio: "Cassava and yam farmer in Oyo State with 8 years experience. Looking for verified processors and export buyers.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Adopt poultry template (closest to agriculture) and do check-ins
      const adopt = await api("POST", `/templates/${ctx.templateIds.poultry}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Day 1: Completed site survey for new cassava field. Soil pH is 6.2 — optimal for cassava. Local cooperative agreed to share equipment.",
        }, token);
        await sleep(200);
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Day 2: Purchased 500kg of TMS cassava stems from certified nursery. Transport was smoother than expected — found a reliable local driver through the Directory.",
        }, token);
        ctx.instanceIds.adeola = instanceId;
      }
      // Post to feed
      await api("POST", "/feed", {
        content: "Just completed my first soil assessment using the Bizny template framework. The structured approach helped me identify 3 things I would have missed doing it alone. If you're in Agriculture — the templates are worth it.",
        postType: "share",
        mainIndustry: "Agriculture",
      }, token);
      await api("POST", "/feed", {
        content: "Looking for verified cassava processors in Oyo and Ogun states. Have 40 tonnes ready post-harvest. Contact info on my profile. #Agriculture #Cassava",
        postType: "request",
        requestCategory: "buyer",
        mainIndustry: "Agriculture",
      }, token);
      // Marketplace listing
      await api("POST", "/marketplace", {
        businessName: "Fashola Farms",
        product: "Fresh Cassava & Cassava Stems",
        description: "Premium quality cassava and certified planting stems. Field-verified production. Bulk supply available. Located in Ibadan, Oyo State.",
        location: "Ibadan, Oyo State",
        country: "Nigeria",
        industry: "Agriculture",
        whatsapp: "+2348012340001",
      }, token);
      // Knowledge article
      await api("POST", "/knowledge-articles", {
        title: "How to test soil pH before planting cassava",
        industry: "Agriculture",
        category: "guide",
        content: "Cassava thrives in soil with pH between 5.5 and 6.5. Use a cheap digital pH meter (under ₦3,000 at any agro shop). Take 5 readings from different spots in your field and average them. If pH is above 6.5, mix in sulphur. If below 5.5, add agricultural lime 4 weeks before planting. Never guess — wrong pH causes stunted tubers and 30–50% yield loss.",
        tags: ["cassava", "soil", "agriculture", "preparation"],
      }, token);
    },
  },

  // 2 ─ Diaspora investor
  {
    name: "Chidinma Okonkwo",
    email: "chidinma.okonkwo@bizny.demo",
    whatsapp: "+447700900002",
    country: "United Kingdom",
    stateCity: "London",
    industry: "Finance",
    role: "Investor",
    skills: ["Due diligence", "Financial modelling", "Portfolio management"],
    interests: ["Agro-processing", "Renewable energy", "SME lending"],
    bio: "Diaspora investor based in London. I invest in verified African ventures through Bizny — specifically agro-processing and clean energy. I believe in seeing real evidence before committing capital.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Follow templates
      await api("POST", `/templates/${ctx.templateIds.poultry}/follow`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.palmOil}/follow`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.solar}/save`, {}, token);
      // Posts
      await api("POST", "/feed", {
        content: "I sent £15,000 home last year. Some went to a rice processor in Enugu. Thanks to Bizny's verification system I could track milestones before each tranche. For the first time, my investment felt like an investment — not a prayer.",
        postType: "share",
        mainIndustry: "Agriculture",
      }, token);
      await api("POST", "/feed", {
        content: "Tip for other diaspora investors: always ask for the Field Agent verification report before you commit capital. The GPS-verified photos alone told me more than a 40-slide pitch deck.",
        postType: "industry_insight",
        mainIndustry: "Finance",
      }, token);
      // Opportunity: seeking ventures to invest in
      await api("POST", "/opportunities", {
        title: "Seeking verified agro-processing ventures — ₦2M–₦10M investment range",
        type: "funding",
        industry: "Agriculture",
        country: "Nigeria",
        description: "UK-based investor seeking verified agro-processing ventures for equity or revenue-sharing arrangements. Must have at least one Field Agent verification completed. Preference for post-harvest processing (cassava, palm oil, groundnut). Respond via Deal Desk.",
        investmentSize: "₦2M–₦10M",
        deadline: "2026-09-30",
      }, token);
      // Knowledge article
      await api("POST", "/knowledge-articles", {
        title: "What diaspora investors should verify before sending capital home",
        industry: "Finance",
        category: "guide",
        content: "Before wiring any money: 1) Request a Field Agent verification report — not just photos, but GPS coordinates and the agent's signed report. 2) Use Deal Desk to structure the agreement with milestone-based tranches, not a single transfer. 3) Ask for the venture's Bizny execution record — how many days have they checked in? Consistent check-ins signal serious operators. 4) Speak to at least one of their existing suppliers or buyers, not just the founder. 5) Start small — ₦200K first, then scale if milestones are met.",
        tags: ["diaspora", "investment", "due-diligence", "verification"],
      }, token);
    },
  },

  // 3 ─ Agro-processor / manufacturer
  {
    name: "Taiwo Adeyemi",
    email: "taiwo.adeyemi@bizny.demo",
    whatsapp: "+2348099990003",
    country: "Nigeria",
    stateCity: "Lagos State",
    industry: "Agriculture",
    role: "Manufacturer",
    skills: ["Palm oil processing", "Quality control", "Supply chain management"],
    interests: ["Export markets", "Factory automation", "Cold chain"],
    bio: "Running a palm oil processing plant in Lagos. Capacity: 5 tonnes/day. Looking for certified smallholder suppliers and export buyers in Europe and the Middle East.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Adopt palm oil template
      const adopt = await api("POST", `/templates/${ctx.templateIds.palmOil}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Commissioned the new 3-tonne press today. Engineer confirmed installation. First test run tomorrow morning. This is the largest single equipment investment we've made.",
        }, token);
        await sleep(200);
        // Complete first milestone
        await api("POST", `/execution-instances/${instanceId}/milestones/0/complete`, {
          notes: "Site fully operational. All permits renewed. New sterilisation drum installed.",
        }, token);
        ctx.instanceIds.taiwo = instanceId;
      }
      // Posts
      await api("POST", "/feed", {
        content: "Palm oil processing is not glamorous — it's early mornings, maintenance headaches, and quality disputes. But it feeds families and earns real forex. Proud to be building in this space.",
        postType: "share",
        mainIndustry: "Agriculture",
      }, token);
      await api("POST", "/feed", {
        content: "Sourcing crude palm oil from smallholders? Three things I've learned: (1) Always weigh at their farm, not yours. (2) Pay same-day. (3) Never mix suppliers' batches until you know their extraction rate. Saves enormous headaches downstream.",
        postType: "industry_insight",
        mainIndustry: "Agriculture",
      }, token);
      // Marketplace listing
      await api("POST", "/marketplace", {
        businessName: "Adeyemi Palm Products",
        product: "Refined Palm Oil (RBD) & Palm Kernel Oil",
        description: "NAFDAC-registered palm oil processor. 5 tonnes/day capacity. Supply certified RBD palm oil and PKO to food manufacturers, exporters, and distributors. Located in Ikorodu, Lagos.",
        location: "Ikorodu, Lagos",
        country: "Nigeria",
        industry: "Agriculture",
        whatsapp: "+2348099990003",
        email: "taiwo.adeyemi@bizny.demo",
      }, token);
      // Opportunity posted
      await api("POST", "/opportunities", {
        title: "Reliable fresh fruit bunch (FFB) suppliers needed — Lagos and Ogun corridors",
        type: "partnership",
        industry: "Agriculture",
        country: "Nigeria",
        description: "Looking for certified smallholder palm farmers to supply fresh fruit bunches on weekly contracts. Minimum 500 bunches/week. We provide transport. Fair price, same-day payment. Must be within 120km of Ikorodu.",
      }, token);
    },
  },

  // 4 ─ Logistics / transport
  {
    name: "Kwabena Asante",
    email: "kwabena.asante@bizny.demo",
    whatsapp: "+233550004444",
    country: "Ghana",
    stateCity: "Greater Accra",
    industry: "Logistics",
    role: "Service Provider",
    skills: ["Fleet management", "Cold chain", "Cross-border customs"],
    interests: ["West Africa trade corridors", "Refrigerated transport", "Last-mile delivery"],
    bio: "Fleet operator based in Tema, Ghana. 12 trucks — ambient and refrigerated. Specialise in agricultural cargo across the Ghana-Nigeria-Ivory Coast corridor.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Adopt transport template
      const adopt = await api("POST", `/templates/${ctx.templateIds.transport}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Completed fleet safety inspection. 10 of 12 trucks cleared. 2 held for brake lining replacement — scheduled for Friday. GPS trackers renewed on all vehicles.",
        }, token);
        ctx.instanceIds.kwabena = instanceId;
      }
      await api("POST", "/marketplace", {
        businessName: "Asante Freight & Logistics",
        product: "Agricultural & industrial cargo transport",
        description: "12-truck fleet covering Ghana, Nigeria, and Côte d'Ivoire corridors. Ambient and refrigerated options. Cross-border expertise. Certified drivers. GPS-tracked. Serving agro-processors, manufacturers, and exporters.",
        location: "Tema, Greater Accra",
        country: "Ghana",
        industry: "Logistics",
        whatsapp: "+233550004444",
      }, token);
      await api("POST", "/feed", {
        content: "The Ghana-Nigeria corridor is one of the most underserved trade routes in West Africa. Demand for agricultural cargo is growing 20% per year — but reliable fleet operators are still scarce. Building capacity to serve this market.",
        postType: "industry_insight",
        mainIndustry: "Logistics",
      }, token);
      await api("POST", "/feed", {
        content: "Three things that kill agricultural cargo before it reaches buyers: (1) Delays at borders because documents are incomplete. (2) Temperature breaks in the cold chain. (3) Weighbridge queues nobody planned for. If your logistics provider doesn't account for all three, your cargo is at risk.",
        postType: "share",
        mainIndustry: "Logistics",
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "How to survive the Ghana-Nigeria border crossing with agricultural cargo",
        industry: "Logistics",
        category: "guide",
        content: "The Aflao-Lomé and Seme crossings are the main bottlenecks. What I've learned after 200+ crossings: (1) Have your phytosanitary certificate, form M or equivalent, and proof of origin printed — not just digital. Border officials still use physical stamps. (2) Budget 4–12 hours at Seme on a bad day. Build this into your delivery promise. (3) ECOWAS protocols are on paper only — each country's customs will apply their own interpretation. Know the local rules. (4) Refrigerated cargo gets priority inspection if you know the right officer to approach. (5) Never arrive on a Friday afternoon.",
        tags: ["logistics", "cross-border", "ghana", "nigeria", "agriculture"],
      }, token);
    },
  },

  // 5 ─ Young entrepreneur / graduate starter
  {
    name: "Zainab Musa",
    email: "zainab.musa@bizny.demo",
    whatsapp: "+2348055550005",
    country: "Nigeria",
    stateCity: "Kano State",
    industry: "Technology",
    role: "Entrepreneur",
    skills: ["Social media marketing", "Digital tools", "Community building"],
    interests: ["Agritech", "Women entrepreneurship", "Rural connectivity"],
    bio: "Fresh graduate from BUK, Computer Science. I want to build something that matters in Northern Nigeria. Starting with a solar-powered community market platform. Learning as I go.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Save and follow templates for learning
      await api("POST", `/templates/${ctx.templateIds.solar}/follow`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.software}/save`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.poultry}/save`, {}, token);
      // Adopt solar template
      const adopt = await api("POST", `/templates/${ctx.templateIds.solar}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Day 1: Spent 3 hours going through the template milestones. This is much more structured than I expected. Found a solar supplier in Kano through the Marketplace — going to verify them this week.",
        }, token);
        ctx.instanceIds.zainab = instanceId;
      }
      await api("POST", "/feed", {
        content: "Week 1 update: I've started the Solar Installation Business template. I thought I knew what I was doing — the milestone structure showed me 6 things I hadn't considered. The best part? Other entrepreneurs who did this before left notes I can learn from.",
        postType: "venture_progress",
        mainIndustry: "Technology",
      }, token);
      await api("POST", "/feed", {
        content: "Question: has anyone sourced solar panels locally in Kano? Looking for verified suppliers with NAFDAC/standards certification. Don't want to waste money on substandard panels. DM or comment.",
        postType: "question",
        mainIndustry: "Technology",
      }, token);
      await api("POST", "/opportunities", {
        title: "Female co-founder wanted — solar-powered community marketplace, Kano",
        type: "partnership",
        industry: "Technology",
        country: "Nigeria",
        description: "Building a community marketplace powered by solar microgrids in rural Kano communities. Looking for a female co-founder with business development or rural community experience. Equity-based partnership. Grant funding being pursued through Herfund and TEF.",
        role: "Co-founder / Business Development",
      }, token);
    },
  },

  // 6 ─ Field agent / verifier
  {
    name: "Samuel Osei",
    email: "samuel.osei@bizny.demo",
    whatsapp: "+233240006666",
    country: "Ghana",
    stateCity: "Ashanti Region",
    industry: "Agriculture",
    role: "Field Agent",
    skills: ["GPS verification", "Business documentation", "Due diligence reporting", "Photography"],
    interests: ["Verification standards", "SME development", "Rural enterprise"],
    bio: "Certified Bizny Field Agent based in Kumasi. I verify businesses, farms, and ventures across Ashanti and Brong-Ahafo regions. 200+ verifications completed. Trusted by investors and buyers.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      await api("POST", "/feed", {
        content: "Completed 3 farm verifications this week in Ashanti. Two were exactly as described — solid operations ready for investor attention. One was... not. The seller claimed 50 acres under cultivation. On the ground: 12 acres, with 3 being fallow. This is why field verification exists. Protect your capital.",
        postType: "verification_update",
        mainIndustry: "Agriculture",
      }, token);
      await api("POST", "/feed", {
        content: "What I look for in a farm verification: (1) Land title or customary documentation. (2) Crop health — not just edge rows. (3) Water source and irrigation capacity. (4) Labour availability. (5) Proximity and access to major roads. A beautiful WhatsApp video tells you nothing about any of these.",
        postType: "industry_insight",
        mainIndustry: "Agriculture",
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "What a field verification actually involves — and why sellers fear it",
        industry: "Agriculture",
        category: "guide",
        content: "A proper field verification is not a friendly visit. Here's what I do: (1) GPS boundary walk — I trace the actual perimeter of the property, not the claimed one. Discrepancies are common. (2) Crop sampling — I take samples from at least 5 random points, not the edges sellers tend to groom. (3) Document check — land title, permits, tax clearance, NAFDAC registration where relevant. I photograph every page. (4) Supplier/buyer interviews — I call 2–3 of their claimed business relationships without the seller present. (5) Infrastructure — water, power, storage, access roads. The verification report takes 4–6 hours minimum on-site. Anyone offering a verification in under 2 hours is doing a photo tour, not due diligence.",
        tags: ["verification", "field-agent", "due-diligence", "agriculture"],
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "Red flags I've learned to spot before visiting a business",
        industry: "Agriculture",
        category: "pitfall",
        content: "After 200+ verifications, these pre-visit signals nearly always predict problems: (1) Seller can't name 3 current buyers. (2) Business registered less than 6 months ago but claims 3 years of operations. (3) No fixed phone number, only WhatsApp. (4) Photos are all from the same angle or same lighting. (5) They're 'urgently' looking for an investor. Genuine businesses don't need to rush anyone. (6) They can't tell you last month's production volume without consulting notes. Good operators know their numbers.",
        tags: ["verification", "red-flags", "due-diligence"],
      }, token);
    },
  },

  // 7 ─ Furniture manufacturer (uses Manufacturing template)
  {
    name: "Blessing Nwosu",
    email: "blessing.nwosu@bizny.demo",
    whatsapp: "+2348077770007",
    country: "Nigeria",
    stateCity: "Anambra State",
    industry: "Manufacturing",
    role: "Manufacturer",
    skills: ["Woodworking", "CNC operation", "Furniture design", "Export packaging"],
    interests: ["Export markets", "Interior design sector", "Vocational training"],
    bio: "Owner of Nwosu Furniture Works in Nnewi. We produce custom and contract furniture for hotels, offices, and the export market. 14 staff. ISO processes in implementation.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      const adopt = await api("POST", `/templates/${ctx.templateIds.furniture}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Started the ISO documentation process. QA manual first draft done. Realised we had 4 undocumented processes — catching them now is much better than during an audit.",
        }, token);
        await sleep(200);
        await api("POST", `/execution-instances/${instanceId}/milestones/0/complete`, {
          notes: "Workshop layout redesigned. Workflow efficiency up 25% just from moving machines to follow the production sequence.",
        }, token);
        ctx.instanceIds.blessing = instanceId;
      }
      await api("POST", "/marketplace", {
        businessName: "Nwosu Furniture Works",
        product: "Custom & contract furniture — office, hospitality, residential",
        description: "Nnewi-based furniture manufacturer. 14 skilled craftsmen. CNC-assisted production. Hotel room packs, office suites, and bespoke residential. Export packaging available. Samples on request.",
        location: "Nnewi, Anambra State",
        country: "Nigeria",
        industry: "Manufacturing",
        whatsapp: "+2348077770007",
        email: "blessing.nwosu@bizny.demo",
      }, token);
      await api("POST", "/feed", {
        content: "Nigerian furniture can compete with any import — if you control quality and delivery. The problem isn't our craftsmanship. It's documentation, QA systems, and packing standards. Working through the Bizny template is making us do the unsexy parts properly.",
        postType: "share",
        mainIndustry: "Manufacturing",
      }, token);
      await api("POST", "/opportunities", {
        title: "Contract furniture supply — hotels & serviced apartments, Southeast Nigeria",
        type: "partnership",
        industry: "Manufacturing",
        country: "Nigeria",
        description: "Seeking hotel and serviced apartment operators looking for a reliable local furniture supplier. We supply full room packs (bed, wardrobe, desk, chair, side tables) at 60% below import cost. Installed and warranted. Reference sites available in Nnewi and Onitsha.",
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "How to price contract furniture without losing money",
        industry: "Manufacturing",
        category: "pitfall",
        content: "The mistake every furniture maker makes: pricing based on materials + margin, forgetting hidden costs. What you must include: (1) Rework rate — budget 8–12% of labour cost for corrections and client change requests. (2) Delivery and installation — this alone can eat 15% of a contract value if you don't quote it separately. (3) Payment terms reality — if a hotel pays 60 days after delivery, that's 60 days of cash tied up. Price in the financing cost. (4) Design time — custom design is 6–10 hours minimum per room type. Charge for it. (5) Warranty callbacks — a 1-year warranty sounds simple until a hinge fails on 200 beds.",
        tags: ["manufacturing", "furniture", "pricing", "contracts"],
      }, token);
    },
  },

  // 8 ─ Energy / Solar installer
  {
    name: "Obinna Eze",
    email: "obinna.eze@bizny.demo",
    whatsapp: "+2347060008888",
    country: "Nigeria",
    stateCity: "Enugu State",
    industry: "Energy",
    role: "Service Provider",
    skills: ["Solar PV installation", "Electrical engineering", "Project management", "Battery systems"],
    interests: ["Rural electrification", "Agri-solar", "Off-grid systems"],
    bio: "Solar installation engineer and contractor based in Enugu. 120+ residential and commercial installations. Now scaling to agri-solar — powering farms, cold rooms, and processing plants off-grid.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      const adopt = await api("POST", `/templates/${ctx.templateIds.solar}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Completed site assessment for 15kW agri-solar project at a poultry farm in Awka. Roof load-bearing capacity confirmed. Shadow analysis done. Battery bank sizing: 40kWh for 18-hour autonomy. Quote submitted.",
        }, token);
        await sleep(200);
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "Client signed off. Panel procurement order placed with verified supplier in Lagos. Import documentation in process. Installation crew of 4 booked for next week.",
        }, token);
        ctx.instanceIds.obinna = instanceId;
      }
      await api("POST", "/marketplace", {
        businessName: "Eze Solar & Power Systems",
        product: "Solar PV installation & off-grid power systems",
        description: "NEMSA-certified solar contractor. Residential (3kW–10kW), commercial (10kW–100kW), agri-solar (cold rooms, irrigation, processing). 120+ completed installations. 2-year system warranty. Serving Southeast Nigeria.",
        location: "Enugu, Enugu State",
        country: "Nigeria",
        industry: "Energy",
        whatsapp: "+2347060008888",
      }, token);
      await api("POST", "/feed", {
        content: "Installed a 15kW solar system at a poultry farm this week. The farmer's fuel bill was ₦85,000/month for generator. New electricity cost: ₦4,200/month in amortised panel cost. Payback period: 14 months. After that, it's pure savings for 20+ years.",
        postType: "industry_insight",
        mainIndustry: "Energy",
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "How to size a solar system for a small agro-processing plant",
        industry: "Energy",
        category: "guide",
        content: "Step 1: List every piece of equipment and its wattage. Don't guess — check the nameplate. Step 2: Estimate daily run hours per machine. Step 3: Multiply wattage × daily hours = daily Wh per machine. Sum everything. Step 4: Add 20% inefficiency buffer. This is your daily load. Step 5: Divide by 5 (peak sun hours in most of Nigeria) = minimum panel wattage. Step 6: For autonomy (battery): daily load ÷ 0.8 (DOD factor) = battery bank Wh. Divide by battery voltage for Ah. Example: a small palm oil mill running a 3kW press 4h/day + lighting + office = roughly 14kWh/day load. You need ~3.5kW panels and 20kWh battery bank minimum. Always oversize panels by 30% — they degrade over time.",
        tags: ["solar", "energy", "agro-processing", "sizing"],
      }, token);
    },
  },

  // 9 ─ Tech entrepreneur / software founder
  {
    name: "Kofi Boateng",
    email: "kofi.boateng@bizny.demo",
    whatsapp: "+233200009999",
    country: "Ghana",
    stateCity: "Greater Accra",
    industry: "Technology",
    role: "Entrepreneur",
    skills: ["Product management", "Mobile development", "API integration", "Growth hacking"],
    interests: ["Fintech infrastructure", "AgriTech", "Developer tools", "B2B SaaS"],
    bio: "Building AgriData — a mobile data collection tool for field agents and agro-processors in Ghana and Nigeria. Previously at Vodafone Ghana. YC application in progress.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      const adopt = await api("POST", `/templates/${ctx.templateIds.software}/adopt`, {}, token) as any;
      const instanceId = adopt?.id;
      if (instanceId) {
        await api("POST", `/execution-instances/${instanceId}/checkin`, {
          notes: "MVP shipped to first 3 beta users — all field agents. Early feedback: the offline sync is the most valued feature. One agent said 'finally a tool that works without internet'. That's the validation I needed.",
        }, token);
        await sleep(200);
        await api("POST", `/execution-instances/${instanceId}/milestones/0/complete`, {
          notes: "Technical architecture validated. Backend deployed on AWS Lagos region for latency. Offline-first sync working reliably across 3G and 2G conditions.",
        }, token);
        ctx.instanceIds.kofi = instanceId;
      }
      await api("POST", "/feed", {
        content: "3 months into building AgriData. What surprised me most: our users don't care about beautiful UI. They care about: (1) Works offline. (2) Syncs when back online. (3) Doesn't eat their data bundle. That's it. Build for the actual constraint, not the ideal environment.",
        postType: "venture_progress",
        mainIndustry: "Technology",
      }, token);
      await api("POST", "/feed", {
        content: "The African tech opportunity is not 'Uber for X' or 'Airbnb for Y'. It's fixing broken infrastructure that everyone has just accepted as normal. That's where the real value and the real defensibility lives.",
        postType: "share",
        mainIndustry: "Technology",
      }, token);
      await api("POST", "/opportunities", {
        title: "Beta testers wanted — offline-first data collection app for field agents",
        type: "research",
        industry: "Technology",
        country: "Nigeria",
        description: "AgriData is seeking 20 field agents or agro-business operators to beta test our offline-first data collection mobile app. Works on any Android phone. No data charges during collection. Syncs when WiFi available. 30-day free trial. Feedback welcome. Contact via WhatsApp.",
        role: "Beta tester",
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "Why offline-first is not optional when building for African markets",
        industry: "Technology",
        category: "guide",
        content: "If your app requires a stable internet connection to function, you've just excluded a majority of your potential African users. The reality: 4G penetration outside capital cities is below 40% in most of West Africa. 2G is still common in rural areas. Data is expensive relative to income. What this means for builders: (1) Store data locally first, sync when connected — never the reverse. (2) Compress everything aggressively. A 500KB image is a problem, not acceptable. (3) Test your app on a 2G connection before shipping. If it's unusable, your users won't tell you — they'll just stop using it. (4) Avoid CDN-dependent assets. Fonts, icons, and images should be bundled, not fetched. (5) Your biggest competitor in Africa is WhatsApp — because it works everywhere, at low cost. Beat it on function, not design.",
        tags: ["technology", "offline-first", "mobile", "africa"],
      }, token);
    },
  },

  // 10 ─ Industrial enthusiast / connector / mentor
  {
    name: "Ngozi Obi-Anosike",
    email: "ngozi.obi@bizny.demo",
    whatsapp: "+2348088880010",
    country: "Nigeria",
    stateCity: "Abuja",
    industry: "Consulting",
    role: "Industrial Enthusiast",
    skills: ["Business development", "Mentorship", "Market research", "Policy advocacy"],
    interests: ["Industrial policy", "SME ecosystems", "Cross-sector collaboration", "Africa trade"],
    bio: "Former NEPC trade analyst. Now an independent industrial ecosystem builder. I connect sectors, mentor emerging entrepreneurs, and advocate for better SME policy. Based in Abuja.",
    actions: async (token: string, id: number, ctx: SeedContext) => {
      // Follow multiple templates
      await api("POST", `/templates/${ctx.templateIds.poultry}/follow`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.palmOil}/follow`, {}, token);
      await api("POST", `/templates/${ctx.templateIds.furniture}/follow`, {}, token);
      // Rich posts
      await api("POST", "/feed", {
        content: "Africa doesn't have a resource problem. We have the land, the minerals, the agricultural base, the young population. What we have is a coordination problem. Every entrepreneur is rediscovering the same lessons in isolation. That's what Bizny is solving — and it's more important than most people realise.",
        postType: "share",
        mainIndustry: "Consulting",
      }, token);
      await api("POST", "/feed", {
        content: "Policy idea I keep pushing: mandatory 30-day payment terms for large buyers purchasing from SMEs. Late payment is one of the top 3 killers of small manufacturers in Nigeria. A ₦2M order paid 90 days late can destroy a business that lacks working capital. We have the Consumer Protection Act but no teeth on B2B payment terms.",
        postType: "industry_insight",
        mainIndustry: "Consulting",
      }, token);
      await api("POST", "/feed", {
        content: "If you're a young entrepreneur: stop waiting for the perfect idea. The perfect idea is the one you're close enough to to understand the real problem. Start with a problem you've personally experienced — then find 10 other people with the same problem. That's your market research. Everything else follows.",
        postType: "share",
        mainIndustry: "Consulting",
      }, token);
      // Knowledge articles — high-value mentor content
      await api("POST", "/knowledge-articles", {
        title: "The difference between a venture and a business — and why it matters",
        industry: "Consulting",
        category: "guide",
        content: "A venture is a bet. A business is a system. Most entrepreneurs treat their ventures like businesses before they've earned the right to. A venture requires: high uncertainty tolerance, rapid learning cycles, and willingness to be wrong publicly. A business requires: consistent execution, documented processes, and predictable outcomes. The danger is confusing the two. Trying to run a venture like a business leads to premature scaling and rigid thinking. Running a business like a venture leads to chaos and inconsistency. Know which stage you're in — and manage it accordingly.",
        tags: ["entrepreneurship", "strategy", "venture", "business"],
      }, token);
      await api("POST", "/knowledge-articles", {
        title: "How to find your first 10 real customers in any African market",
        industry: "Consulting",
        category: "guide",
        content: "Real customers — not family, not friends, not people who said 'interesting' at a pitch. Here's how: (1) Go to where your customer currently buys what you're replacing. A market stall, a trade fair, a WhatsApp group. Don't invite them to you. (2) Ask about their current experience — not about your product. What's frustrating? What's expensive? What breaks? (3) Make an offer with a real price. 'Would you use it for free?' is not validation. (4) Deliver once for free or at cost if needed — but get payment commitment upfront for the second time. (5) Ask each customer to refer one person they know with the same problem. Your 10th customer comes from your 1st. The ones who refer are your real customers. The others were just curious.",
        tags: ["entrepreneurship", "customers", "sales", "africa"],
      }, token);
      // Opportunity — mentorship
      await api("POST", "/opportunities", {
        title: "Free mentorship — 3 slots open for industrial entrepreneurs in Nigeria",
        type: "training",
        industry: "Consulting",
        country: "Nigeria",
        description: "Offering 3 free 90-day mentorship slots for founders building in the agricultural value chain, manufacturing, or logistics sectors in Nigeria. Former NEPC analyst. 15 years ecosystem experience. Apply via Bizny message. Will review applications weekly. No fees, no equity asks — pure knowledge sharing.",
        role: "Mentee",
      }, token);
    },
  },
] as const;

// ─── context passed between steps ────────────────────────────────────────────

type SeedContext = {
  templateIds: {
    poultry: number;
    palmOil: number;
    solar: number;
    software: number;
    transport: number;
    furniture: number;
  };
  instanceIds: Record<string, number>;
  userIds: Record<string, number>;
  tokens: Record<string, string>;
};

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌍  Bizny demo user seeder starting…\n");

  // 1. Fetch templates
  console.log("📋  Loading venture templates…");
  const templates = await api("GET", "/templates") as any[];
  const find = (keyword: string) => templates.find((t: any) =>
    t.title.toLowerCase().includes(keyword.toLowerCase())
  );

  const ctx: SeedContext = {
    templateIds: {
      poultry: find("Poultry")?.id ?? 1,
      palmOil: find("Palm Oil")?.id ?? 2,
      solar: find("Solar")?.id ?? 4,
      software: find("Software")?.id ?? 3,
      transport: find("Transport")?.id ?? 6,
      furniture: find("Furniture Workshop")?.id ?? (find("Furniture")?.id ?? 5),
    },
    instanceIds: {},
    userIds: {},
    tokens: {},
  };
  console.log("  Templates found:", ctx.templateIds, "\n");

  // 2. Register or login each persona, then run their actions
  for (const persona of PERSONAS) {
    console.log(`👤  Processing: ${persona.name} (${persona.email})`);

    // Try to register; if 409 (already exists) fall back to login
    const registerRes = await api("POST", "/auth/register", {
      name: persona.name,
      email: persona.email,
      whatsapp: persona.whatsapp,
      country: persona.country,
      stateCity: persona.stateCity,
      industry: persona.industry,
      role: persona.role,
      skills: persona.skills,
      interests: persona.interests,
    }) as any;

    let userId: number;
    let token: string;

    if (registerRes?.token && registerRes?.user) {
      userId = registerRes.user.id;
      token = registerRes.token;
      console.log(`    ✅ Registered — id ${userId}`);
    } else {
      // Already exists — login
      const loginRes = await api("POST", "/auth/login", { email: persona.email }) as any;
      if (!loginRes?.token) {
        console.log(`    ⚠️  Could not register or login. Skipping.`);
        continue;
      }
      userId = loginRes.user.id;
      token = loginRes.token;
      console.log(`    ↩️  Already registered — id ${userId}, logged in`);
    }

    // Update bio if user was just registered or bio may be missing
    try {
      await api("PATCH", `/users/${userId}`, { bio: (persona as any).bio }, token);
    } catch {
      // bio update is best-effort
    }

    ctx.userIds[persona.email] = userId;
    ctx.tokens[persona.email] = token;

    // Run persona actions
    try {
      await (persona.actions as Function)(token, userId, ctx);
      console.log(`    🎬  Actions complete\n`);
    } catch (err) {
      console.error(`    ❌  Actions failed:`, err, "\n");
    }

    await sleep(300);
  }

  // 3. Cross-user interactions — follow each other, react to posts
  console.log("🤝  Creating cross-user follows and reactions…");
  const users = Object.values(ctx.userIds);
  const allTokens = Object.values(ctx.tokens);

  // Each user follows 3–5 others
  const follows: [string, string][] = [
    ["adeola.fashola@bizny.demo", "chidinma.okonkwo@bizny.demo"],
    ["adeola.fashola@bizny.demo", "samuel.osei@bizny.demo"],
    ["adeola.fashola@bizny.demo", "ngozi.obi@bizny.demo"],
    ["chidinma.okonkwo@bizny.demo", "taiwo.adeyemi@bizny.demo"],
    ["chidinma.okonkwo@bizny.demo", "obinna.eze@bizny.demo"],
    ["chidinma.okonkwo@bizny.demo", "ngozi.obi@bizny.demo"],
    ["taiwo.adeyemi@bizny.demo", "kwabena.asante@bizny.demo"],
    ["taiwo.adeyemi@bizny.demo", "adeola.fashola@bizny.demo"],
    ["kwabena.asante@bizny.demo", "taiwo.adeyemi@bizny.demo"],
    ["kwabena.asante@bizny.demo", "ngozi.obi@bizny.demo"],
    ["zainab.musa@bizny.demo", "kofi.boateng@bizny.demo"],
    ["zainab.musa@bizny.demo", "ngozi.obi@bizny.demo"],
    ["zainab.musa@bizny.demo", "obinna.eze@bizny.demo"],
    ["samuel.osei@bizny.demo", "adeola.fashola@bizny.demo"],
    ["samuel.osei@bizny.demo", "chidinma.okonkwo@bizny.demo"],
    ["blessing.nwosu@bizny.demo", "ngozi.obi@bizny.demo"],
    ["blessing.nwosu@bizny.demo", "chidinma.okonkwo@bizny.demo"],
    ["obinna.eze@bizny.demo", "zainab.musa@bizny.demo"],
    ["obinna.eze@bizny.demo", "kwabena.asante@bizny.demo"],
    ["kofi.boateng@bizny.demo", "zainab.musa@bizny.demo"],
    ["kofi.boateng@bizny.demo", "ngozi.obi@bizny.demo"],
    ["ngozi.obi@bizny.demo", "samuel.osei@bizny.demo"],
    ["ngozi.obi@bizny.demo", "chidinma.okonkwo@bizny.demo"],
    ["ngozi.obi@bizny.demo", "zainab.musa@bizny.demo"],
  ];

  for (const [followerEmail, followedEmail] of follows) {
    const followerToken = ctx.tokens[followerEmail];
    const followedId = ctx.userIds[followedEmail];
    if (followerToken && followedId) {
      await api("POST", `/users/${followedId}/follow`, {}, followerToken);
      await sleep(50);
    }
  }
  console.log(`  ✅  ${follows.length} follow relationships created\n`);

  // 4. React to a few knowledge articles with "helpful"
  console.log("👍  Marking knowledge articles as helpful…");
  const articles = await api("GET", "/knowledge-articles") as any[];
  for (const article of articles.slice(0, 6)) {
    // Two random users mark each helpful
    const randomToken = allTokens[Math.floor(Math.random() * allTokens.length)];
    await api("POST", `/knowledge-articles/${article.id}/helpful`);
    if (randomToken) await api("POST", `/knowledge-articles/${article.id}/helpful`);
    await sleep(50);
  }
  console.log(`  ✅  Helpful votes added\n`);

  // 5. Summary
  console.log("═══════════════════════════════════════════════════");
  console.log("✅  Seeding complete!\n");
  console.log("Demo accounts (all can log in at /login with just email):\n");
  for (const p of PERSONAS) {
    const id = ctx.userIds[p.email];
    console.log(`  • ${p.name.padEnd(25)} ${p.email.padEnd(35)} id=${id ?? "?"} — ${p.role}, ${p.country}`);
  }
  console.log("\nAll accounts use email-only login (no password).");
  console.log("═══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
