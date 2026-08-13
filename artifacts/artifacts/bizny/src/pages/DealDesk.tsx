import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useListDeals, getListDealsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Handshake, ArrowRight, Clock, CheckCircle2, AlertCircle,
  FileText, Users, TrendingUp, Zap, MapPin, ShieldCheck,
  Lock, Info, MessageSquare, Eye, Ban, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Status config (12 statuses) ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; pill: string; icon: React.ReactNode; dot: string }> = {
  draft:                    { label: "Draft",                    pill: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",             icon: <FileText className="h-3 w-3" />,       dot: "bg-slate-400" },
  negotiating:              { label: "Negotiating",              pill: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",                       icon: <MessageSquare className="h-3 w-3" />,   dot: "bg-sky-500" },
  agreement_draft:          { label: "Agreement Draft",          pill: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",                 icon: <FileText className="h-3 w-3" />,        dot: "bg-blue-500" },
  awaiting_party:           { label: "Awaiting Parties",         pill: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800",     icon: <Users className="h-3 w-3" />,           dot: "bg-violet-500" },
  awaiting_witness:         { label: "Awaiting Witness",         pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",           icon: <Eye className="h-3 w-3" />,             dot: "bg-amber-500" },
  awaiting_field_agent:     { label: "Field Agent Review",       pill: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",     icon: <ShieldCheck className="h-3 w-3" />,     dot: "bg-orange-500" },
  open:                     { label: "Open",                     pill: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",                 icon: <Clock className="h-3 w-3" />,           dot: "bg-teal-500" },
  agreed:                   { label: "Agreed",                   pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: <CheckCircle2 className="h-3 w-3" />,   dot: "bg-emerald-500" },
  active:                   { label: "Active",                   pill: "bg-primary/10 text-primary dark:bg-primary/20 border-primary/30",                                                       icon: <Zap className="h-3 w-3" />,             dot: "bg-primary" },
  milestone_in_progress:    { label: "Milestone In Progress",    pill: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",                 icon: <TrendingUp className="h-3 w-3" />,       dot: "bg-cyan-500" },
  completed:                { label: "Completed",                pill: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800",           icon: <CheckCircle2 className="h-3 w-3" />,    dot: "bg-green-500" },
  disputed:                 { label: "Disputed",                 pill: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800",                       icon: <AlertTriangle className="h-3 w-3" />,   dot: "bg-red-500" },
  cancelled:                { label: "Cancelled",                pill: "bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-500 border-slate-200 dark:border-slate-800",               icon: <Ban className="h-3 w-3" />,             dot: "bg-slate-400" },
};

// Pipeline — ordered active stages (no cancelled/disputed)
const PIPELINE_STAGES = [
  "draft", "negotiating", "agreement_draft", "awaiting_party",
  "awaiting_witness", "awaiting_field_agent", "active", "milestone_in_progress", "completed",
];

const DEAL_TYPE_COLORS: Record<string, string> = {
  supply:        "text-teal-600 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800",
  partnership:   "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  licensing:     "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  service:       "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  distribution:  "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  joint_venture: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
  other:         "text-slate-600 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800",
};

function getDealTypeColor(type?: string) {
  return DEAL_TYPE_COLORS[type ?? "other"] ?? DEAL_TYPE_COLORS["other"];
}

// ─── Pipeline progress bar ────────────────────────────────────────────────────

function PipelineBar({ currentStatus, counts }: { currentStatus: string; counts: Record<string, number> }) {
  const activeIdx = PIPELINE_STAGES.indexOf(currentStatus);
  return (
    <div className="flex items-stretch rounded-xl overflow-hidden border border-border/60 bg-card">
      {PIPELINE_STAGES.map((stage, i) => {
        const cfg = STATUS_CONFIG[stage];
        const count = counts[stage] ?? 0;
        const isActive = stage === currentStatus;
        const isPast = i < activeIdx;
        return (
          <div
            key={stage}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 px-0.5 gap-0.5 border-r border-border/40 last:border-r-0 transition-colors ${
              isActive ? "bg-primary/8 border-b-2 border-b-primary" : ""
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : isPast ? "bg-muted-foreground/30" : "bg-muted-foreground/15"}`} />
            <span className={`text-[8px] font-bold leading-none text-center ${isActive ? "text-primary" : "text-muted-foreground/60"}`}>
              {cfg.label.split(" ")[0]}
            </span>
            {count > 0 && (
              <span className={`text-[8px] font-bold ${isActive ? "text-primary" : "text-muted-foreground/50"}`}>{count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Escrow placeholder ───────────────────────────────────────────────────────

function EscrowPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-sm text-primary">Trust Escrow</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 uppercase tracking-wide">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Milestone-based escrow will allow deal funds to be held securely and released only after
            milestone completion, buyer confirmation, or Field Agent verification. Disputed milestones
            will pause release automatically.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Milestone-gated release", ready: false },
              { label: "Buyer confirmation required", ready: false },
              { label: "Field Agent verification", ready: false },
              { label: "Dispute resolution hold", ready: false },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="h-2.5 w-2.5 text-primary/40 shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-3 italic">
            Bizny will integrate with a licensed escrow partner. No wallets or payments yet.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function DealDisclaimer() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-start gap-2.5 w-full text-left"
      >
        <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-0.5">
            Platform Disclaimer — Please Read
          </p>
          {!expanded && (
            <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70 line-clamp-1">
              Bizny provides a coordination interface to help users structure, document, verify, and track deals…
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
          {expanded ? "Less" : "More"}
        </span>
      </button>
      {expanded && (
        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-2.5 leading-relaxed">
          Bizny provides a coordination interface to help users structure, document, verify, and track
          deals. Bizny is not a bank, escrow provider, legal representative, guarantor, investment advisor,
          or law enforcement body.
          <br /><br />
          Users are responsible for performing their own due diligence, verifying identities, reviewing
          documents, confirming business registration, inspecting locations, and seeking independent legal,
          financial, or professional advice before entering any agreement.
          <br /><br />
          Bizny encourages milestone-based execution, field agent verification, witness confirmation, and
          careful review before proceeding with any deal.
        </p>
      )}
    </div>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onClick }: { deal: any; onClick: () => void }) {
  const sc = STATUS_CONFIG[deal.status] ?? STATUS_CONFIG.draft;
  return (
    <button onClick={onClick} className="w-full text-left group">
      <Card className="transition-all hover:border-primary/40 hover:shadow-md border-border/70 group-hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
              <div className="w-px flex-1 bg-border/50 min-h-[20px]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.pill}`}>
                  {sc.icon} {sc.label}
                </span>
                {deal.dealType && (
                  <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getDealTypeColor(deal.dealType)}`}>
                    {deal.dealType.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-sm leading-snug mb-1.5 group-hover:text-primary transition-colors">
                {deal.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {deal.parties?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {deal.parties.length} {deal.parties.length === 1 ? "party" : "parties"}
                  </span>
                )}
                {deal.industry && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {deal.industry}
                  </span>
                )}
                {deal.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {deal.country}
                  </span>
                )}
                {deal.financialValue && (
                  <span className="font-bold text-foreground ml-auto">{deal.financialValue}</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(deal.updatedAt ?? deal.createdAt))} ago
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

// ─── DealDesk page ────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "all",                  label: "All" },
  { key: "draft",                label: "Draft" },
  { key: "negotiating",          label: "Negotiating" },
  { key: "agreement_draft",      label: "Agreement" },
  { key: "awaiting_party",       label: "Awaiting Parties" },
  { key: "awaiting_witness",     label: "Awaiting Witness" },
  { key: "awaiting_field_agent", label: "Field Agent" },
  { key: "open",                 label: "Open" },
  { key: "agreed",               label: "Agreed" },
  { key: "active",               label: "Active" },
  { key: "milestone_in_progress","label": "Milestone" },
  { key: "completed",            label: "Done" },
  { key: "disputed",             label: "Disputed" },
  { key: "cancelled",            label: "Cancelled" },
];

export default function DealDesk() {
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: deals, isLoading } = useListDeals(undefined, {
    query: { enabled: !!token, queryKey: getListDealsQueryKey() },
  });

  const dealList = (deals ?? []) as any[];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dealList.length };
    for (const d of dealList) counts[d.status] = (counts[d.status] ?? 0) + 1;
    return counts;
  }, [dealList]);

  const filtered = useMemo(() =>
    statusFilter === "all" ? dealList : dealList.filter(d => d.status === statusFilter),
    [dealList, statusFilter]
  );

  const needsAttention = dealList.filter(d =>
    ["negotiating", "agreement_draft", "awaiting_party", "awaiting_witness", "awaiting_field_agent"].includes(d.status)
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold font-display tracking-tight">Deal Desk</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Coordinate agreements, partnerships, and supply deals — with milestone proof and witness verification.
          </p>
        </div>
        <Button onClick={() => navigate("/deal-desk/new")} className="h-9 gap-1.5 text-xs shrink-0">
          <Plus className="h-3.5 w-3.5" /> New Deal
        </Button>
      </div>

      {/* Disclaimer */}
      <DealDisclaimer />

      {/* Stats strip */}
      {!isLoading && dealList.length > 0 && (
        <div className="flex gap-5 text-sm text-muted-foreground border-b border-border/50 pb-4">
          <span><strong className="text-foreground font-bold">{dealList.length}</strong> total</span>
          {(statusCounts.active ?? 0) > 0 && (
            <span><strong className="text-primary font-bold">{statusCounts.active}</strong> active</span>
          )}
          {needsAttention.length > 0 && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <strong className="text-amber-600 font-bold">{needsAttention.length}</strong> need action
            </span>
          )}
          {(statusCounts.disputed ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <strong className="text-red-600 font-bold">{statusCounts.disputed}</strong> disputed
            </span>
          )}
          {(statusCounts.completed ?? 0) > 0 && (
            <span><strong className="text-green-600 font-bold">{statusCounts.completed}</strong> done</span>
          )}
        </div>
      )}

      {/* Pipeline bar */}
      {!isLoading && dealList.length > 0 && (
        <PipelineBar currentStatus={statusFilter === "all" ? "" : statusFilter} counts={statusCounts} />
      )}

      {/* Status filter tabs */}
      {!isLoading && dealList.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map(f => {
            const count = statusCounts[f.key] ?? 0;
            if (f.key !== "all" && count === 0) return null;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {f.label} {f.key !== "all" && `(${count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4 h-28 space-y-2">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1.5">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded-full" />
                  </div>
                  <div className="h-4 bg-muted animate-pulse rounded-full w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded-full w-1/2" />
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-card/40">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Handshake className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display font-bold text-lg mb-2">
            {statusFilter !== "all" ? `No ${STATUS_CONFIG[statusFilter]?.label ?? statusFilter} deals` : "No deals yet"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            {statusFilter !== "all"
              ? "Try a different filter to see other deals."
              : "Create your first deal to coordinate a collaboration, supply arrangement, or partnership agreement."}
          </p>
          <div className="flex gap-2">
            {statusFilter !== "all" && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")}>Show All</Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/deal-desk/new")}>
              <Plus className="h-3.5 w-3.5" /> New Deal
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deal => (
            <DealCard key={deal.id} deal={deal} onClick={() => navigate(`/deal-desk/${deal.id}`)} />
          ))}
        </div>
      )}

      {/* Escrow placeholder */}
      <EscrowPlaceholder />
    </div>
  );
}
