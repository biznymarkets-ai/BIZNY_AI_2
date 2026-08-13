import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock, Share2, Check, ChevronRight } from "lucide-react";

const READING_TIME = "6 min read";

const MESSAGE_SECTIONS = [
  {
    heading: null,
    paragraphs: [
      "To every farmer waiting to find a processor. To every artisan struggling to reach a wider market. To every student looking for a venture worth joining. To every engineer whose skills have never been connected to the right opportunity. To every investor searching for trusted ventures worth backing. To every community that has been left out of the systems that could unlock its growth.",
      "This message is for you.",
    ],
  },
  {
    heading: "Where This Began",
    paragraphs: [
      "I did not build Bizny because I saw a market gap. I built it because I saw a human gap — a gap between the talent that exists across Africa and the systems needed to translate that talent into productive outcomes.",
      "Africa is not poor in potential. Africa is rich in people, ideas, land, resources, creativity, and ambition. What has often been missing is not the raw material. What has been missing is the connective tissue — the infrastructure of coordination, verification, trust, and replication that allows individual effort to compound into shared prosperity.",
      "Everywhere I looked, I saw the same pattern. A farmer growing cassava who couldn't find a processor. A processor who couldn't find a reliable supplier. An investor who had capital but couldn't identify a trusted venture. A professional whose skills were never connected to a venture that needed exactly what they offered. A young engineer in a small town who had no visibility into what was happening three states away — and no way to participate.",
      "Bizny was created to help change that.",
    ],
  },
  {
    heading: "The Belief Behind The Platform",
    paragraphs: [
      "I believe every person is an economic node.",
      "Every farmer. Every artisan. Every student. Every engineer. Every trader. Every researcher. Every manufacturer. Every community. Every machine. Every productive asset — each one is a node. Each carries knowledge, capability, and potential that is only fully realised when it is properly connected to other nodes.",
      "The problem has never been a lack of effort or talent. The problem has been a lack of coordination. Nodes operating in isolation, unable to find each other, unable to verify each other, unable to build together.",
      "Bizny is our attempt to build the coordination layer. The platform where nodes connect, verify, discover each other, and build ventures together.",
    ],
  },
  {
    heading: "What Bizny Is Built To Do",
    paragraphs: [
      "Bizny is not a social network. It is not a chat app. It is not a marketplace in the traditional sense. It is a productivity coordination platform — built specifically for the African context.",
      "It is built on the belief that the biggest problems in African productivity are not technical. They are structural. Fragmentation. Isolation. Lack of trust. Difficulty replicating what works. Inability to coordinate across sectors, geographies, and networks.",
      "Every feature in Bizny addresses one of these structural problems directly.",
      "The Template Repository exists because too many people are starting from scratch when proven models already exist. If someone has figured out how to build a profitable cassava processing plant in Ogun State, someone else in Zambia should be able to follow that blueprint without reinventing the wheel.",
      "The Verification System exists because trust is infrastructure. Before you coordinate with someone, you need to know they are real. Before you invest, you need to know the opportunity is genuine. Field agents physically verify businesses, locations, and actors. Evidence is collected. Trust is earned, not assumed.",
      "The Opportunities Module exists because discovery should not depend on who you happen to know. Every funding opportunity, partnership request, supply contract, and job opening should be findable by the right person, regardless of where they are.",
      "The Ventures System exists because tracking real progress requires more than a conversation. Ventures need milestones, updates, evidence of progress, and a way to keep collaborators aligned over time.",
    ],
  },
  {
    heading: "The Africa I Am Building Towards",
    paragraphs: [
      "I am not building Bizny to create another app. I am building it to contribute to a future where productive collaboration is the default — not the exception.",
      "A future where a young engineer in Port Harcourt can easily find and join a venture being led by an entrepreneur in Nairobi. Where a diaspora investor in London can identify and fund a verified opportunity in Kampala. Where a cluster of farmers in rural Ghana can connect with processors, aggregators, and buyers across the continent. Where the knowledge embedded in the experience of one generation can be captured, replicated, and scaled by the next.",
      "That is the Africa I am working toward. Not a utopia. A practical, productive, coordinated continent.",
    ],
  },
  {
    heading: "To The People Who Will Build With Us",
    paragraphs: [
      "If you are a farmer, an artisan, a trader, a manufacturer, a logistics provider, a researcher, a student, an investor, a field agent, a professional — Bizny was built for you.",
      "If you have ever felt that the systems around you were not built with your reality in mind — Bizny is our attempt to build something different.",
      "This is not a finished product. It is a beginning. And a beginning only becomes something meaningful when the right people commit to it together.",
      "I am grateful you are here. I am grateful for every person who has believed in this before it became easy to believe in. And I am deeply committed to building something that deserves your trust.",
      "Let's build Africa together.",
    ],
  },
  {
    heading: null,
    paragraphs: [
      "— Darrin Akpambang",
      "Founder, Bizny",
    ],
  },
];

export default function FounderMessage() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#071210] text-white">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#071210]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <img src="/logo.jpg" alt="Bizny" className="w-5 h-5 rounded-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
            <span className="font-display font-bold text-base tracking-tight">Bizny</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> About
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg px-3 py-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">

        {/* ── Top meta ──────────────────────────────────────────────────── */}
        <section className="pt-16 pb-10 bg-gradient-to-b from-[#0a1a14] to-[#071210]">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/50">Founder Message</span>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Founder's Letter
              </div>

              <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight">
                A Message From<br />The Founder
              </h1>
              <p className="text-xl text-primary/80 font-medium">Why Bizny Exists</p>

              <div className="flex items-center gap-5">
                {/* Founder avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-[#0a1a14] border border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src="/founder.jpg"
                    alt="Darrin Akpambang"
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.currentTarget.style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                    }}
                  />
                  <div className="hidden w-full h-full items-center justify-center">
                    <span className="text-xl font-bold text-primary font-display">DA</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white">Darrin Akpambang</p>
                  <p className="text-sm text-white/40">Founder, Bizny</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-white/30">
                    <Clock className="w-3 h-3" />
                    {READING_TIME}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Opening quote pull ────────────────────────────────────────── */}
        <section className="py-10 bg-[#071210]">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <blockquote className="border-l-4 border-primary pl-6 py-1">
              <p className="text-xl md:text-2xl text-white/80 italic leading-relaxed font-light">
                "I believe every person is an economic node. Bizny was built to help people discover opportunities, coordinate productive ventures, and participate meaningfully in building Africa's future. The goal is simple: make it easier for people to create real value together."
              </p>
            </blockquote>
          </div>
        </section>

        {/* ── Full message body ─────────────────────────────────────────── */}
        <article className="py-10 pb-24 bg-[#071210]">
          <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-12">
            {MESSAGE_SECTIONS.map((section, i) => (
              <div key={i} className="space-y-5">
                {section.heading && (
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">{section.heading}</h2>
                )}
                {section.paragraphs.map((para, j) => (
                  <p
                    key={j}
                    className={
                      i === MESSAGE_SECTIONS.length - 1
                        ? "text-white font-semibold text-lg"
                        : "text-white/65 text-lg leading-[1.85]"
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>
            ))}

            {/* Bottom actions */}
            <div className="pt-10 border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to About Bizny
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 h-10 px-4 text-sm border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Link copied!" : "Share this message"}
                </button>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 h-10 px-5 bg-[#E8B84B] text-[#071210] text-sm font-bold rounded-lg hover:bg-[#d4a43c] transition-colors"
                >
                  Join Bizny
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      <footer className="bg-[#071210] border-t border-white/5 py-6">
        <div className="max-w-3xl mx-auto px-4 md:px-8 flex items-center justify-between text-sm text-white/30">
          <span>© 2024 Bizny Africa. Built for Africa. Built by Africa.</span>
          <Link href="/" className="hover:text-white transition-colors">bizny.africa</Link>
        </div>
      </footer>
    </div>
  );
}
