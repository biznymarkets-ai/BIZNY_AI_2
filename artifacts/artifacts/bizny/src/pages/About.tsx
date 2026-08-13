import { Link } from "wouter";
import {
  ArrowRight, ChevronRight, BookOpen, Shield, Map,
  Globe, Zap, Target, Factory, Users, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIFF_CARDS = [
  { icon: BookOpen, title: "Template-Based Development", desc: "Follow proven blueprints for productive ventures — not guesswork." },
  { icon: Shield, title: "Trust Infrastructure", desc: "Verification through field agents and evidence collection builds real confidence." },
  { icon: Map, title: "Location Intelligence", desc: "Understand where opportunities and ventures are emerging across Africa." },
  { icon: Globe, title: "Open Productivity Network", desc: "Connect people, businesses, projects, and opportunities across every border." },
  { icon: Factory, title: "Industrial Coordination", desc: "Help industries coordinate rather than operate in isolation from one another." },
  { icon: Target, title: "Real World Execution", desc: "Focus on practical outcomes, not just conversations or plans." },
];

const NODES = [
  "Every farmer.",
  "Every artisan.",
  "Every student.",
  "Every engineer.",
  "Every trader.",
  "Every researcher.",
  "Every manufacturer.",
  "Every community.",
  "Every machine.",
  "Every productive asset.",
];

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-[#071210] text-white">

      {/* ── Minimal Header ────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#071210]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <img src="/logo.jpg" alt="Bizny" className="w-6 h-6 rounded-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Bizny</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">← Home</Link>
            <Link href="/register" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Get Early Access
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative py-28 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071210] via-[#0a1c14] to-[#071210]" />
          {/* Network grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #0D7F7A 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Open Productivity Ecosystem for Africa
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Building Africa's<br />
              <span className="text-primary">Productivity Ecosystem</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Bizny is an open industrial coordination platform designed to help people discover opportunities, follow proven templates, verify actors, coordinate productive ventures, and build stronger industries across Africa.
            </p>
          </div>
        </section>

        {/* ── Why Bizny Exists ──────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#0a1a14]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">Our Story</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">Why Bizny Exists</h2>
              </div>
              <div className="lg:col-span-3 space-y-5 text-white/70 text-lg leading-relaxed">
                <p>
                  Africa is rich in talent, resources, ideas, and ambition. Yet many opportunities remain disconnected from the people, knowledge, trust, and systems needed to transform them into productive outcomes.
                </p>
                <div className="space-y-3 border-l-2 border-primary/20 pl-5">
                  {[
                    "Farmers struggle to find processors.",
                    "Processors struggle to find suppliers.",
                    "Investors struggle to find trusted opportunities.",
                    "Professionals struggle to find productive ventures.",
                    "Communities struggle to access the networks that can unlock growth.",
                  ].map(line => (
                    <p key={line} className="text-white/60 italic">{line}</p>
                  ))}
                </div>
                <p>
                  Bizny was created to help bridge these gaps — making productive relationships easier to discover, verify, coordinate, and scale.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission + Vision ──────────────────────────────────────────── */}
        <section className="py-20 md:py-24 bg-[#071210]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-6">
            <div className="bg-[#0d1f17] border border-white/8 rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest">Our Mission</p>
              <h3 className="font-display text-2xl font-bold text-white">To Make Productivity Accessible</h3>
              <p className="text-white/60 leading-relaxed">
                To make African productivity easier to discover, coordinate, verify, replicate, and scale.
              </p>
            </div>
            <div className="bg-[#0d1f17] border border-white/8 rounded-2xl p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#E8B84B]/10 border border-[#E8B84B]/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#E8B84B]" />
              </div>
              <p className="text-xs font-semibold text-[#E8B84B] uppercase tracking-widest">Our Vision</p>
              <h3 className="font-display text-2xl font-bold text-white">A Connected Continent</h3>
              <p className="text-white/60 leading-relaxed">
                A future where every person, community, business, and productive asset can participate meaningfully in building prosperity through trusted collaboration and coordinated execution.
              </p>
            </div>
          </div>
        </section>

        {/* ── Philosophy ────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#0a1a14] overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #0D7F7A 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Our Philosophy</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                Every Person Is<br />An Economic Node
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-3">
                {NODES.map(node => (
                  <div key={node} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-white/70 text-lg">{node}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-5 text-white/60 text-lg leading-relaxed">
                <p className="text-white/80">Each has value. Each has knowledge. Each has the potential to contribute to a larger productive system.</p>
                <p>
                  Bizny exists to help connect these nodes into networks capable of creating opportunities, enterprises, industries, and prosperity.
                </p>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
                  <p className="text-primary font-medium text-sm leading-relaxed">
                    "When properly connected, individuals become industries. Communities become ecosystems. Africa becomes unstoppable."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What Makes Bizny Different ────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#071210]">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Differentiation</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">What Makes Bizny Different</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {DIFF_CARDS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-[#0d1f17] border border-white/8 rounded-2xl p-6 space-y-3 hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder Section ───────────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[#0a1a14]">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="bg-[#071210] border border-white/8 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-10 items-center">
                {/* Founder image */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-primary/30 to-[#0a1a14] border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-xl">
                    <img
                      src="/founder.jpg"
                      alt="Darrin Akpambang"
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.currentTarget.style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center flex-col gap-1">
                      <span className="text-4xl font-bold text-primary font-display">DA</span>
                      <span className="text-xs text-white/30">Founder</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white">Darrin Akpambang</p>
                    <p className="text-xs text-primary mt-0.5">Founder, Bizny</p>
                  </div>
                </div>

                {/* Quote */}
                <div className="md:col-span-2 space-y-6">
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest">A Message From The Founder</p>
                  <blockquote className="text-xl md:text-2xl text-white/80 leading-relaxed font-light italic">
                    "I believe every person is an economic node. Bizny was built to help people discover opportunities, coordinate productive ventures, and participate meaningfully in building Africa's future. The goal is simple: make it easier for people to create real value together."
                  </blockquote>
                  <p className="text-white/40 text-sm">— Darrin Akpambang, Founder, Bizny</p>
                  <Link
                    href="/founder-message"
                    className="inline-flex items-center gap-2 h-11 px-6 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Read Full Founder Message
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Minimal Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#071210] border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white">Bizny</span>
            <span className="text-white/30 text-sm">· Open Productivity Ecosystem</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/founder-message" className="hover:text-white transition-colors">Founder Message</Link>
            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">Get Early Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
