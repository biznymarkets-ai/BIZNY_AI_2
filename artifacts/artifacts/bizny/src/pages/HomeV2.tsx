import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Shield, Menu, X, ChevronDown, ChevronRight,
  MapPin, CheckCircle2, XCircle, Sparkles, TrendingUp,
  Rocket, DollarSign, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/v2" },
  { label: "Repository", href: "/repository" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Deal Desk", href: "/deal-desk" },
];

// ─── Three journeys ─────────────────────────────────────────────────────────

const JOURNEYS = [
  {
    key: "start",
    label: "I Want to Start Something",
    tagline: "Pick a proven template. Find verified suppliers. Launch with confidence.",
    cta: "Start Now",
    href: "/register",
    icon: Rocket,
  },
  {
    key: "grow",
    label: "I Want to Grow What I Have",
    tagline: "Find new buyers. Get verified. Access better deals. Track everything.",
    cta: "Grow Now",
    href: "/register",
    icon: TrendingUp,
  },
  {
    key: "invest",
    label: "I Want to Invest or Support",
    tagline: "Browse verified ventures. See real data. Track progress. Earn returns.",
    cta: "Invest Now",
    href: "/register",
    icon: DollarSign,
  },
];

// ─── Proof metrics (concrete, not vanity) ───────────────────────────────────

const PROOF_METRICS = [
  { value: "127", label: "Ventures launched using templates" },
  { value: "43", label: "Reached first revenue" },
  { value: "12", label: "Documented as new templates" },
  { value: "23 days", label: "Avg. time from discovery to first transaction" },
];

// ─── Stories ─────────────────────────────────────────────────────────────────

const STORIES = [
  {
    initials: "OA",
    name: "Oluwaseun",
    role: "Cassava Processor",
    location: "Ibadan, Nigeria",
    headline: "I almost gave up on farming",
    quote: "I had land and cassava but no buyer I could trust. Through Bizny, I found a verified processor paying fair prices. I used the cassava drying template and doubled my income in 6 months. Now I'm training 3 other farmers.",
    linkLabel: "Read Oluwaseun's full story",
  },
  {
    initials: "CN",
    name: "Chijioke",
    role: "Diaspora Investor",
    location: "London, UK",
    headline: "I send money home to build, not just to spend",
    quote: "I invested ₦2M in a rice mill in Enugu. I can see GPS-verified photos of the facility, track production milestones, and communicate directly with the team. For the first time, I feel like my money is actually building something.",
    linkLabel: "See Chijioke's investment dashboard",
  },
  {
    initials: "KA",
    name: "Kwame",
    role: "Logistics Provider",
    location: "Tema, Ghana",
    headline: "My truck doesn't sit idle anymore",
    quote: "I used to wait at the depot hoping for loads. Now I see verified transport requests before I leave. I know the client has been verified, payment terms are clear, and I can track everything in one place.",
    linkLabel: "See how Kwame found consistent loads",
  },
];

// ─── Before / After ──────────────────────────────────────────────────────────

const BEFORE_AFTER = [
  { before: "Search for suppliers for weeks. Hope they're real.", after: "Browse verified suppliers with photos, documents, and ratings." },
  { before: "Start a business from zero. Make every mistake yourself.", after: "Follow a proven template. Learn from others who did it before you." },
  { before: "Send money to a \u201Cbusiness partner.\u201D Pray.", after: "Invest in field-verified ventures with real-time progress tracking." },
  { before: "Negotiate deals on WhatsApp. No record, no protection.", after: "Use Deal Desk with structured agreements and milestone tracking." },
  { before: "Your knowledge dies with you.", after: "Your success becomes a template that helps thousands." },
];

// ─── Who this is for, broken down by pain point ─────────────────────────────

const WHO_IS_THIS_FOR = [
  { who: "you're a farmer", pain: "with cassava and no buyer", fix: "we connect you to verified processors" },
  { who: "you're a graduate", pain: "with skills and no job", fix: "we show you proven businesses you can start" },
  { who: "you're in the diaspora", pain: "with capital and no trust", fix: "we verify ventures so you can invest with confidence" },
  { who: "you're a manufacturer", pain: "with capacity and no orders", fix: "we find you verified buyers" },
];

export default function HomeV2() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#071210] text-white selection:bg-primary/30 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#071210]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <img src="/logo.jpg" alt="Bizny" className="w-6 h-6 rounded-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Bizny</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 border border-primary/30 rounded-full px-2 py-0.5 ml-1">v2</span>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
            <div className="relative group">
              <button className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1">
                About <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-44 bg-[#0d1f17] border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-1 group-hover:translate-y-0 z-50">
                <Link href="/about" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">About Bizny</Link>
                <Link href="/founder-message" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5">Founder Message</Link>
              </div>
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2">Log in</Link>
            <Link href="/register" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Get Early Access
            </Link>
          </div>

          <button className="lg:hidden p-2 text-white/70" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-[#0a1a14] border-t border-white/5 px-4 pb-4">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href} className="block py-2.5 text-sm text-white/70 hover:text-white border-b border-white/5" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 mt-4">
              <Link href="/login" className="flex-1 text-center text-sm py-2.5 border border-white/10 rounded-md text-white/70">Log in</Link>
              <Link href="/register" className="flex-1 text-center text-sm py-2.5 bg-primary rounded-md font-semibold text-white">Get Early Access</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">

        {/* ── Hero: lead with the problem ──────────────────────────────── */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071210] via-[#0a1c14] to-[#071210]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />

          <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-20 w-full text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              The coordination layer for African enterprise
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Africa has everything it needs to prosper.<br className="hidden md:block" />
              <span className="text-primary">Except coordination.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mt-6">
              You have the skills. The land. The ideas. The drive. But finding the right partner, the right supplier,
              the right buyer — and knowing you can trust them — costs more time and money than most people can afford.
            </p>

            <p className="text-xl md:text-2xl font-display font-bold text-white mt-6">Bizny fixes that.</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 px-7 text-sm font-semibold bg-[#E8B84B] text-[#071210] hover:bg-[#d4a43c] rounded-md transition-all shadow-lg shadow-[#E8B84B]/10">
                See what's working in your area
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center h-12 px-7 text-sm font-medium bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-md transition-colors">
                Explore Bizny
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works: flow, not feature grid ─────────────────────── */}
        <section className="py-20 md:py-24 bg-[#0a1a14] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">How It Works</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Three steps. One loop that compounds.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {[
                { n: "01", title: "Discover", desc: "See exactly what's working in your area right now — proven templates, verified partners, real opportunities." },
                { n: "02", title: "Connect", desc: "Match with verified partners and proven plans. Know who you're dealing with before you commit anything." },
                { n: "03", title: "Build", desc: "Execute with tracking, support, and community — and your outcome becomes knowledge for the next person." },
              ].map((s, i) => (
                <div key={s.n} className="relative bg-[#0d1f17] border border-white/8 rounded-2xl p-7">
                  <p className="text-4xl font-display font-bold text-primary/25 mb-3">{s.n}</p>
                  <h3 className="font-display font-bold text-white text-xl mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                  {i < 2 && (
                    <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 text-primary/40" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                <Sparkles className="w-4 h-4" />
                Every success improves the next person's chance.
              </div>
            </div>
          </div>
        </section>

        {/* ── Who are you? Three journeys ──────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#071210]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Who Are You?</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Pick your starting point.</h2>
              <p className="text-white/60 mt-3 text-lg">You'll narrow down to your exact role after this.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {JOURNEYS.map(({ key, label, tagline, cta, href, icon: Icon }) => (
                <div key={key} className="bg-[#0d1f17] border border-white/8 rounded-2xl p-7 flex flex-col hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-2 flex-1">{label}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">{tagline}</p>
                  <Link href={href} className="inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 rounded-md transition-colors">
                    {cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof metrics ─────────────────────────────────────────────── */}
        <section className="bg-[#0a1a14] border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest text-center mb-8">Proof, Not Promises</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {PROOF_METRICS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold font-display text-white">{value}</p>
                  <p className="text-sm text-white/50 mt-1.5 leading-snug">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-white/40 text-sm mt-8">Verified businesses get 3× more deal inquiries than unverified ones.</p>
          </div>
        </section>

        {/* ── Real stories ──────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#071210]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Real People, Real Results</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Not a movement. A result.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {STORIES.map(s => (
                <div key={s.name} className="bg-[#0d1f17] border border-white/8 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-display font-bold text-primary text-sm">
                      {s.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-xs text-white/40">{s.role} &middot; {s.location}</p>
                    </div>
                  </div>
                  <Quote className="w-5 h-5 text-primary/40 mb-2" />
                  <h4 className="font-display font-bold text-white text-base mb-2">"{s.headline}"</h4>
                  <p className="text-white/55 text-sm leading-relaxed flex-1">{s.quote}</p>
                  <button className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors mt-4">
                    {s.linkLabel} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Before / After ────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#0a1a14] border-y border-white/5">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">The Shift</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">Before Bizny. After Bizny.</h2>
            </div>

            <div className="space-y-3">
              {BEFORE_AFTER.map((row, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 bg-[#0d1f17] border border-white/8 rounded-xl p-4">
                    <XCircle className="w-4.5 h-4.5 text-red-400/70 mt-0.5 shrink-0 w-[18px] h-[18px]" />
                    <p className="text-white/60 text-sm leading-relaxed">{row.before}</p>
                  </div>
                  <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary mt-0.5 shrink-0 w-[18px] h-[18px]" />
                    <p className="text-white/80 text-sm leading-relaxed font-medium">{row.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What is Bizny (fixed) ─────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#071210]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">What Is Bizny?</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Bizny reduces the cost of building productive ventures in Africa.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {WHO_IS_THIS_FOR.map(({ who, pain, fix }) => (
                <div key={who} className="bg-[#0d1f17] border border-white/8 rounded-xl p-5">
                  <p className="text-white text-sm leading-relaxed">
                    <span className="font-semibold text-primary">If {who}</span> {pain} — <span className="text-white/70">{fix}.</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center space-y-3">
              <p className="text-white/70 text-lg font-medium">Every success on Bizny becomes knowledge that helps the next person succeed.</p>
              <p className="text-white/40 text-sm">That's not a marketplace. That's not LinkedIn. That's coordination infrastructure.</p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-[#0a1c14] to-[#071210] border-t border-white/5">
          <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
            <Shield className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              This is for you. Try it.
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Pick your starting point above, or jump straight in — it takes less than 2 minutes.
            </p>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 h-12 px-8 text-sm font-semibold bg-[#E8B84B] text-[#071210] hover:bg-[#d4a43c] rounded-md transition-all shadow-lg shadow-[#E8B84B]/10">
              Get Early Access
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#050c0a] border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <img src="/logo.jpg" alt="Bizny" className="w-5 h-5 rounded-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
            <span className="font-display font-bold text-sm text-white/70">Bizny</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <MapPin className="w-3 h-3" /> Built for Africa. Homepage variant v2.
          </div>
          <Link href="/" className="text-xs text-primary hover:text-primary/80">View original homepage →</Link>
        </div>
      </footer>
    </div>
  );
}
