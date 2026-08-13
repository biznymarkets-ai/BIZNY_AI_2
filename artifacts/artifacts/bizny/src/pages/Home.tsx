import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Globe, Shield, Factory, Briefcase, Rocket,
  BookOpen, Cpu, Zap, HardHat, Activity, Menu, X,
  ChevronRight, Target, Handshake, Package, Truck,
  GraduationCap, Lightbulb, DollarSign, Building2,
  UserCheck, FileText, Store, CheckCircle2, TrendingUp,
  Users, BarChart3, MapPin, Layers, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data ──────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Founding Survey", href: "/research" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Ventures", href: "/ventures" },
  { label: "Directory", href: "/directory" },
  { label: "Templates", href: "/templates" },
  { label: "Deal Desk", href: "/deal-desk" },
];

const SOLUTION_CARDS = [
  {
    icon: Search,
    title: "Discover",
    desc: "Explore businesses, industries, suppliers, opportunities, investments, venture templates, and productive communities.",
  },
  {
    icon: Shield,
    title: "Verify",
    desc: "Build relationships with greater confidence using verification, documentation, transparent profiles, and trusted networks.",
  },
  {
    icon: Rocket,
    title: "Build",
    desc: "Coordinate ventures, projects, partnerships, logistics, procurement, investments, and long-term business relationships.",
  },
];

const FEATURES = [
  { icon: Store,      title: "Business Marketplace",    desc: "Buy and sell through an organized marketplace built around trust." },
  { icon: UserCheck,  title: "Verified Businesses",      desc: "Discover businesses with transparent information and stronger credibility." },
  { icon: Target,     title: "Opportunity Network",      desc: "Explore business requests, partnerships, investment opportunities, and collaborations." },
  { icon: BookOpen,   title: "Business Templates",       desc: "Learn from documented ventures instead of starting from zero." },
  { icon: Handshake,  title: "Deal Desk",                desc: "Coordinate partnerships and agreements professionally." },
  { icon: Building2,  title: "Business Directory",       desc: "Find suppliers, manufacturers, professionals, logistics providers, and service companies." },
  { icon: HardHat,    title: "Field Verification",       desc: "Bridge digital information with real-world verification." },
  { icon: Cpu,        title: "Business Co-pilot",        desc: "Access intelligent assistance throughout your entrepreneurial journey." },
];

const HOW_STEPS = [
  { step: "01", title: "Discover", desc: "Browse opportunities, businesses, and proven templates across your industry." },
  { step: "02", title: "Verify", desc: "Confirm partners, suppliers, and opportunities with documented evidence and field agents." },
  { step: "03", title: "Build", desc: "Launch ventures, coordinate deals, and track progress milestone by milestone." },
  { step: "04", title: "Grow", desc: "Share knowledge, expand your network, and strengthen the productive economy." },
];

const TESTIMONIALS = [
  {
    quote: "I stopped guessing where to start. The venture templates and verified suppliers helped me focus on execution instead of uncertainty.",
    name: "Chidi O.",
    role: "Agribusiness Entrepreneur",
  },
  {
    quote: "I needed industrial equipment for my workshop. Within a short time I found a reliable supplier, communicated directly, and received exactly what I ordered. The process felt organized and trustworthy.",
    name: "Amara K.",
    role: "Marketplace User",
  },
  {
    quote: "We found new customers and stronger partnerships through businesses already aligned with our industry.",
    name: "Sunrise Manufacturing",
    role: "Manufacturing Company",
  },
  {
    quote: "As a consultant, I can now connect with businesses that genuinely need my expertise instead of relying only on referrals.",
    name: "Fatima N.",
    role: "Business Consultant",
  },
  {
    quote: "I wanted visibility before committing capital. The documentation and transparency gave me much greater confidence.",
    name: "Emmanuel B.",
    role: "Private Investor",
  },
];

const FOOTER_SECTIONS = [
  { title: "Platform",  links: [{ label: "Marketplace", href: "/marketplace" }, { label: "Ventures", href: "/ventures" }, { label: "Business Directory", href: "/directory" }, { label: "Templates", href: "/templates" }, { label: "Opportunities", href: "/opportunities" }] },
  { title: "About",     links: [{ label: "Vision", href: "/about" }, { label: "Trust & Verification", href: "/about" }, { label: "Careers", href: "/about" }, { label: "Contact", href: "/about" }] },
  { title: "Legal",     links: [{ label: "Privacy", href: "/about" }, { label: "Terms", href: "/about" }] },
];

/* ─── Animation helpers ─────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" as const } }),
};

/* ─── Africa network SVG ────────────────────────────────────────────────── */

function AfricaNetwork() {
  const nodes = [
    { x: 52, y: 18 }, { x: 62, y: 24 }, { x: 70, y: 32 }, { x: 65, y: 40 },
    { x: 58, y: 50 }, { x: 50, y: 60 }, { x: 55, y: 70 }, { x: 48, y: 78 },
    { x: 60, y: 68 }, { x: 68, y: 58 }, { x: 72, y: 46 }, { x: 76, y: 36 },
    { x: 44, y: 30 }, { x: 40, y: 42 }, { x: 42, y: 54 }, { x: 38, y: 65 },
    { x: 46, y: 72 }, { x: 54, y: 84 }, { x: 62, y: 80 }, { x: 66, y: 72 },
    { x: 74, y: 62 }, { x: 78, y: 50 }, { x: 80, y: 40 }, { x: 56, y: 28 },
  ];
  const edges = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],
    [10,11],[11,2],[3,10],[4,9],[5,14],[13,14],[12,13],[0,23],[23,1],
    [12,0],[13,5],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,11],
    [6,19],[8,19],[9,20],[4,13],
  ];
  return (
    <svg viewBox="0 0 120 100" className="w-full h-full opacity-20" fill="none">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="#79A7B7"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: i * 0.04, ease: "easeOut" }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r="1.2"
          fill="#79A7B7"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 + i * 0.03 }}
        />
      ))}
    </svg>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#06090f] text-white selection:bg-[#79A7B7]/30 font-sans">

      {/* ── Top Announcement Banner for Founding Research ────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#033B4C] via-[#054a5f] to-[#79A7B7] text-white py-2.5 px-4 text-center text-xs font-semibold border-b border-white/10 flex items-center justify-center gap-2 flex-wrap z-50">
        <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
          Pre-Launch Research
        </span>
        <span>Participating in the $3M Gemini AI Competition! Help shape Bizny.</span>
        <Link href="/research" className="underline font-bold hover:text-white/80 inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md transition-colors">
          Take Survey (5-7 min) →
        </Link>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#06090f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#79A7B7]/15 border border-[#79A7B7]/30 flex items-center justify-center">
              <img src="/logo.jpg" alt="Bizny" className="w-6 h-6 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Bizny</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-[#79A7B7] text-white px-4 py-2 rounded-lg hover:bg-[#5C8395] transition-colors shadow-lg shadow-[#79A7B7]/20">
              Start Building
            </Link>
          </div>

          <button className="lg:hidden p-2 text-white/60" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-[#0a0f18] border-t border-white/[0.06] px-5 pb-5">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="block py-3 text-sm text-white/60 hover:text-white border-b border-white/[0.05]" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 mt-5">
              <Link href="/login" className="flex-1 text-center text-sm py-2.5 border border-white/10 rounded-lg text-white/60">Log in</Link>
              <Link href="/register" className="flex-1 text-center text-sm py-2.5 bg-[#79A7B7] rounded-lg font-semibold text-white">Start Building</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#06090f] via-[#080d16] to-[#06090f]" />
          {/* Radial glow */}
          <div className="absolute top-0 right-0 w-[55%] h-[70%] bg-[#79A7B7]/[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[50%] bg-[#79A7B7]/[0.03] rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-5 md:px-10 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* Left */}
              <div className="space-y-8">
                <motion.div
                  variants={fadeUp} initial="hidden" animate="visible" custom={0}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#79A7B7]/10 border border-[#79A7B7]/20 text-[11px] font-semibold text-[#79A7B7] uppercase tracking-widest"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#79A7B7] animate-pulse" />
                  Trust & Coordination Infrastructure for African Emerging Economies
                </motion.div>

                <motion.h1
                  variants={fadeUp} initial="hidden" animate="visible" custom={1}
                  className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
                >
                  Build Real Ventures.<br />
                  <span className="text-[#79A7B7]">Together.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp} initial="hidden" animate="visible" custom={2}
                  className="text-lg text-white/55 leading-relaxed max-w-[480px]"
                >
                  Bizny helps entrepreneurs, businesses, investors, professionals, manufacturers, and communities discover opportunities, verify trusted partners, and build productive ventures with greater confidence.
                </motion.p>

                <motion.div
                  variants={fadeUp} initial="hidden" animate="visible" custom={3}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 px-7 text-sm font-semibold bg-[#79A7B7] text-white hover:bg-[#5C8395] rounded-xl transition-all shadow-xl shadow-[#79A7B7]/25">
                    Start Building
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/opportunities" className="inline-flex items-center justify-center h-12 px-7 text-sm font-medium bg-white/[0.05] text-white hover:bg-white/[0.09] border border-white/10 rounded-xl transition-colors">
                    Explore Opportunities
                  </Link>
                </motion.div>

                <motion.p
                  variants={fadeUp} initial="hidden" animate="visible" custom={4}
                  className="text-sm text-white/30 leading-relaxed"
                >
                  A growing network of builders, businesses, and verified opportunities.
                </motion.p>
              </div>

              {/* Right — Africa network visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:block relative"
              >
                <div className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0c1220] to-[#080d16] overflow-hidden aspect-square shadow-2xl shadow-black/50">
                  <AfricaNetwork />
                  {/* Overlaid city labels */}
                  <div className="absolute inset-0 flex items-end p-6">
                    <div className="w-full grid grid-cols-2 gap-2">
                      {[["Lagos", "Nigeria"], ["Nairobi", "Kenya"], ["Accra", "Ghana"], ["Johannesburg", "South Africa"]].map(([city, country]) => (
                        <div key={city} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                          <MapPin className="w-2.5 h-2.5 text-[#79A7B7] shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold text-white">{city}</p>
                            <p className="text-[9px] text-white/40">{country}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Pulse badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#79A7B7]/10 border border-[#79A7B7]/20 rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#79A7B7] animate-pulse" />
                    <span className="text-[10px] font-semibold text-[#79A7B7]">Network Active</span>
                  </div>
                </div>
                {/* Floating stat cards */}
                <div className="absolute -left-6 top-1/3 bg-[#0c1220] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#79A7B7] font-display">54</p>
                  <p className="text-xs text-white/40">African Countries</p>
                </div>
                <div className="absolute -right-4 bottom-1/4 bg-[#0c1220] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#79A7B7] font-display">100+</p>
                  <p className="text-xs text-white/40">Industries Covered</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Trust Section ───────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#0a0f18] border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-5 md:px-10 text-center">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Foundation</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Built for people creating<br className="hidden md:block" /> real economic value.
              </h2>
              <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto">
                Every successful business depends on trust, coordination, reliable information, and productive relationships.
                Bizny brings these together in one platform designed to help Africa build faster, smarter, and with greater confidence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── The Challenge ────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#06090f]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="max-w-2xl mb-14"
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">The Challenge</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                Africa doesn't lack potential.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {[
                { icon: Users,      title: "Talent",    body: "Millions of capable people ready to build." },
                { icon: Lightbulb,  title: "Ideas",     body: "Innovative businesses emerge every day." },
                { icon: Layers,     title: "Resources", body: "Land, industries, products, expertise, and markets already exist." },
              ].map(({ icon: Icon, title, body }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  className="bg-[#0c1220] border border-white/[0.07] rounded-2xl p-7 space-y-4 hover:border-[#79A7B7]/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#79A7B7]/10 border border-[#79A7B7]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#79A7B7]" />
                  </div>
                  <h3 className="font-display font-bold text-white text-xl">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                </motion.div>
              ))}
            </div>

            {/* The missing layer */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-gradient-to-r from-[#0c1220] to-[#0f1628] border border-[#79A7B7]/15 rounded-2xl p-8 md:p-10"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-[#79A7B7] text-xs font-semibold uppercase tracking-widest mb-3">The Missing Layer</p>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-5">The challenge isn't potential.</h3>
                  <p className="text-2xl md:text-3xl font-bold text-[#79A7B7] font-display">It's coordination.</p>
                </div>
                <div className="space-y-3">
                  {["Finding trusted partners.", "Verifying opportunities.", "Coordinating execution.", "Sharing proven knowledge."].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#79A7B7] shrink-0" />
                      <p className="text-white/70 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── The Solution ─────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#0a0f18]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">The Solution</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Coordination made practical.</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {SOLUTION_CARDS.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  className="relative bg-[#0c1220] border border-white/[0.07] rounded-2xl p-8 space-y-5 group hover:border-[#79A7B7]/25 transition-all hover:bg-[#0e1528]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#79A7B7]/10 border border-[#79A7B7]/20 flex items-center justify-center group-hover:bg-[#79A7B7]/15 transition-colors">
                    <Icon className="w-6 h-6 text-[#79A7B7]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#79A7B7] uppercase tracking-widest mb-2">0{i + 1}</p>
                    <h3 className="font-display font-bold text-white text-2xl mb-3">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Bizny ────────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#06090f]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Why Bizny</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight">
                Everything needed to move productive ideas forward.
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                  className="bg-[#0c1220] border border-white/[0.07] rounded-2xl p-5 space-y-3 hover:border-[#79A7B7]/20 hover:bg-[#0e1528] transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#79A7B7]/10 border border-[#79A7B7]/15 flex items-center justify-center group-hover:bg-[#79A7B7]/15 transition-colors">
                    <Icon className="w-4 h-4 text-[#79A7B7]" />
                  </div>
                  <p className="font-semibold text-white text-sm leading-snug">{title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#0a0f18]">
          <div className="max-w-5xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">How It Works</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Simple. Minimal. Elegant.</h2>
            </motion.div>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute left-[calc(50%-0.5px)] top-8 bottom-8 w-px bg-gradient-to-b from-[#79A7B7]/30 via-[#79A7B7]/15 to-transparent" />

              <div className="space-y-6">
                {HOW_STEPS.map(({ step, title, desc }, i) => (
                  <motion.div
                    key={step}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className={cn(
                      "grid md:grid-cols-2 gap-6 items-center",
                      i % 2 === 1 && "md:[&>*:first-child]:order-2"
                    )}
                  >
                    <div className={cn("text-center", i % 2 === 0 ? "md:text-right" : "md:text-left")}>
                      <span className="font-display text-6xl font-black text-white/[0.04]">{step}</span>
                    </div>
                    <div className={cn("bg-[#0c1220] border border-white/[0.07] rounded-2xl p-6 hover:border-[#79A7B7]/20 transition-colors", i % 2 === 0 ? "md:order-1" : "")}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-[#79A7B7]/10 border border-[#79A7B7]/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#79A7B7]">{step}</span>
                        </div>
                        <h3 className="font-display font-bold text-white text-xl">{title}</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#06090f]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Voices</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Buy with confidence.</h2>
              <p className="text-white/50 mt-4 text-lg max-w-xl mx-auto">
                Discover products and services from businesses committed to transparency and professionalism.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Featured testimonial — spans 2 cols on desktop */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
                className="md:col-span-2 bg-gradient-to-br from-[#0c1220] to-[#0e1628] border border-[#79A7B7]/15 rounded-2xl p-8 space-y-5 flex flex-col justify-between"
              >
                <blockquote className="text-white/80 text-lg leading-relaxed font-light italic">
                  "{TESTIMONIALS[1].quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#79A7B7]/20 border border-[#79A7B7]/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#79A7B7]">{TESTIMONIALS[1].name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{TESTIMONIALS[1].name}</p>
                    <p className="text-xs text-white/40">{TESTIMONIALS[1].role}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="bg-[#0c1220] border border-white/[0.07] rounded-2xl p-7 space-y-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
              >
                <blockquote className="text-white/70 text-sm leading-relaxed font-light italic">
                  "{TESTIMONIALS[0].quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-white/60">{TESTIMONIALS[0].name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{TESTIMONIALS[0].name}</p>
                    <p className="text-xs text-white/40">{TESTIMONIALS[0].role}</p>
                  </div>
                </div>
              </motion.div>

              {[2, 3, 4].map((idx, i) => (
                <motion.div
                  key={idx}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 2}
                  className="bg-[#0c1220] border border-white/[0.07] rounded-2xl p-7 space-y-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
                >
                  <blockquote className="text-white/70 text-sm leading-relaxed font-light italic">
                    "{TESTIMONIALS[idx].quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-white/60">{TESTIMONIALS[idx].name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{TESTIMONIALS[idx].name}</p>
                      <p className="text-xs text-white/40">{TESTIMONIALS[idx].role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Community Section ────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#0a0f18]">
          <div className="max-w-4xl mx-auto px-5 md:px-10 text-center">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Community</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  Every successful venture<br className="hidden md:block" /> strengthens the next one.
                </h2>
              </div>

              <div className="space-y-3 text-white/50 text-lg font-light">
                {[
                  "Every documented business.",
                  "Every verified supplier.",
                  "Every completed partnership.",
                  "Every shared lesson.",
                  "Every productive relationship.",
                ].map((line, i) => (
                  <motion.p
                    key={i}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              <motion.p
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={5}
                className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto"
              >
                Adds knowledge that makes the next entrepreneur stronger. The network becomes more valuable every time someone succeeds.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── Africa Section ───────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#06090f]">
          <div className="max-w-5xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-gradient-to-br from-[#0c1220] to-[#0a0f18] border border-[#79A7B7]/12 rounded-3xl p-10 md:p-16 text-center space-y-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#79A7B7]/10 border border-[#79A7B7]/20 flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-[#79A7B7]" />
              </div>

              <div>
                <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Our Purpose</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Building productive<br className="hidden md:block" /> economies together.
                </h2>
                <p className="text-white/55 text-lg leading-relaxed max-w-2xl mx-auto">
                  Africa's future will not be built by one company. It will be built by millions of entrepreneurs, farmers, manufacturers, engineers, professionals, investors, artisans, traders, logistics providers, educators, and communities working together. Bizny exists to make that coordination easier.
                </p>
              </div>

              {/* Roles grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-4">
                {[
                  { icon: Factory,      label: "Producers" },
                  { icon: HardHat,      label: "Manufacturers" },
                  { icon: Package,      label: "Traders" },
                  { icon: Truck,        label: "Logistics" },
                  { icon: Briefcase,    label: "Professionals" },
                  { icon: Shield,       label: "Field Agents" },
                  { icon: DollarSign,   label: "Investors" },
                  { icon: GraduationCap,label: "Students" },
                  { icon: Globe,        label: "Diaspora" },
                  { icon: Lightbulb,    label: "Enthusiasts" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-[#79A7B7]/20 transition-colors">
                    <Icon className="w-4 h-4 text-[#79A7B7]/70" />
                    <span className="text-[10px] font-medium text-white/50">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="py-24 md:py-32 bg-[#0a0f18]">
          <div className="max-w-3xl mx-auto px-5 md:px-10 text-center">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs font-semibold text-[#79A7B7] uppercase tracking-widest mb-4">Get Started</p>
                <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
                  Build with confidence.
                </h2>
                <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto">
                  Join a growing network committed to creating productive businesses, stronger industries, and lasting economic value across Africa.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 h-13 px-8 text-sm font-semibold bg-[#79A7B7] text-white hover:bg-[#5C8395] rounded-xl transition-all shadow-xl shadow-[#79A7B7]/25">
                  Start Building
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center justify-center h-13 px-8 text-sm font-medium bg-white/[0.05] text-white hover:bg-white/[0.09] border border-white/10 rounded-xl transition-colors">
                  Explore the Platform
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Founder Quote ────────────────────────────────────────────────── */}
      <section className="bg-[#06090f] border-t border-white/[0.05] py-14">
        <div className="max-w-3xl mx-auto px-5 md:px-10 text-center space-y-5">
          <blockquote className="text-lg md:text-xl text-white/60 italic font-light leading-relaxed">
            "I believe every person is an economic node. Bizny was built to help people discover opportunities, coordinate productive ventures, and participate meaningfully in building Africa's future."
          </blockquote>
          <div>
            <p className="text-white font-semibold text-sm">— Darrin Akpambang</p>
            <p className="text-white/35 text-xs mt-0.5">Founder, Bizny</p>
          </div>
          <Link href="/founder-message" className="inline-flex items-center gap-1.5 text-xs text-[#79A7B7] hover:text-[#5C8395] font-medium transition-colors">
            Read Founder Message <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#06090f] border-t border-white/[0.05] pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">

            {/* Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#79A7B7]/15 border border-[#79A7B7]/25 flex items-center justify-center">
                  <img src="/logo.jpg" alt="Bizny" className="w-6 h-6 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                </div>
                <span className="font-display font-bold text-base text-white">Bizny</span>
              </div>
              <p className="text-xs text-white/35 leading-relaxed max-w-xs">
                Trust & Coordination Infrastructure for African Emerging Economies.
              </p>
              <div className="flex gap-2.5">
                {[["f","#"], ["𝕏","#"], ["in","#"], ["▶","#"]].map(([s, href]) => (
                  <a key={s} href={href} className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[11px] text-white/35 cursor-pointer hover:bg-white/[0.08] transition-colors">{s}</a>
                ))}
              </div>
            </div>

            {/* Link cols */}
            {FOOTER_SECTIONS.map(({ title, links }) => (
              <div key={title} className="space-y-3">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">{title}</p>
                <div className="space-y-2">
                  {links.map(({ label, href }) => (
                    <Link key={label} href={href} className="block text-xs text-white/35 hover:text-white/65 transition-colors">{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.05] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-5 text-xs text-white/25">
              <span>hello@biznyafrica.com</span>
              <span>Lagos, Nigeria</span>
            </div>
            <p className="text-xs text-white/20">© 2025 Bizny Africa. All rights reserved. · Built for Africa. Built by Africa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
