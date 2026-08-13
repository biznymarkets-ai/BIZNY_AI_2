import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetDeal, useAgreeToDeal, useGetDealCopilotSummary } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, Handshake, Check, Bot, Loader2, AlertTriangle,
  Users, Eye, MapPin, Factory, Clock, FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  agreed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  witness_pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  active: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function DealDeskDetail() {
  const [, params] = useRoute("/deal-desk/:id");
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dealId = parseInt(params?.id ?? "0");

  const { data: deal, isLoading, refetch } = useGetDeal(dealId, {
    query: { enabled: !!token && dealId > 0, queryKey: ["deal", dealId] },
  });

  const agreeMutation = useAgreeToDeal();
  const copilotMutation = useGetDealCopilotSummary();
  const [copilotSummary, setCopilotSummary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "parties" | "witnesses" | "copilot">("overview");

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  if (!deal) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Deal not found.</p>
      <Button variant="ghost" onClick={() => navigate("/deal-desk")} className="mt-3">Back</Button>
    </div>
  );

  const d = deal as any;
  const myParty = d.parties?.find((p: any) => p.userId === user?.id);
  const hasAgreed = myParty?.agreed;
  const allAgreed = d.parties?.every((p: any) => p.agreed) ?? false;
  const statusColor = STATUS_COLORS[d.status] ?? STATUS_COLORS.draft;

  const handleAgree = () => {
    agreeMutation.mutate({ id: dealId }, {
      onSuccess: () => { toast({ description: "You have agreed to this deal." }); refetch(); },
      onError: () => toast({ variant: "destructive", description: "Failed to register agreement." }),
    });
  };

  const handleCopilot = () => {
    copilotMutation.mutate({ id: dealId }, {
      onSuccess: (data: any) => {
        setCopilotSummary(data.summary);
        setActiveTab("copilot");
        toast({ description: "Co-pilot analysis ready." });
      },
      onError: () => toast({ variant: "destructive", description: "Co-pilot analysis failed." }),
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <button onClick={() => navigate("/deal-desk")} className="p-1.5 rounded-full hover:bg-muted mt-0.5">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
            </span>
            <span className="text-xs text-muted-foreground">{d.dealType}</span>
          </div>
          <h1 className="font-display font-bold text-xl leading-tight">{d.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {formatDistanceToNow(new Date(d.createdAt))} ago
          </p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex gap-2 mb-5">
        {myParty && !hasAgreed && d.status !== "cancelled" && (
          <Button onClick={handleAgree} disabled={agreeMutation.isPending} className="flex-1 gap-2">
            {agreeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Agree to Deal
          </Button>
        )}
        {hasAgreed && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold border border-emerald-200 dark:border-emerald-800">
            <Check className="h-4 w-4" /> You've agreed
          </div>
        )}
        <Button variant="outline" onClick={handleCopilot} disabled={copilotMutation.isPending} className="gap-2">
          {copilotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {copilotMutation.isPending ? "Analysing..." : "Co-pilot"}
        </Button>
      </div>

      {/* Agreement progress */}
      {d.parties && d.parties.length > 0 && (
        <div className="p-3 rounded-xl border border-border bg-muted/30 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Agreement Progress</span>
            <span className="text-xs font-bold text-foreground">
              {d.parties.filter((p: any) => p.agreed).length}/{d.parties.length} agreed
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(d.parties.filter((p: any) => p.agreed).length / d.parties.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-xl">
        {(["overview", "parties", "witnesses", "copilot"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab === "copilot" ? "Co-pilot" : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {d.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-foreground leading-relaxed">{d.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {d.industry && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Industry</span>
                </div>
                <p className="text-sm font-medium">{d.industry}</p>
                {d.activityTag && <p className="text-xs text-muted-foreground mt-0.5">{d.activityTag}</p>}
              </div>
            )}
            {d.country && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Location</span>
                </div>
                <p className="text-sm font-medium">{d.country}</p>
                {d.stateCity && <p className="text-xs text-muted-foreground mt-0.5">{d.stateCity}</p>}
              </div>
            )}
            {d.financialValue && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Financial Value</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{d.financialValue}</p>
              </div>
            )}
            {d.timeline && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Timeline</span>
                </div>
                <p className="text-sm font-medium">{d.timeline}</p>
              </div>
            )}
          </div>
          {d.terms && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Terms & Conditions</p>
              <div className="p-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground leading-relaxed whitespace-pre-wrap">{d.terms}</div>
            </div>
          )}
          {d.risks && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Known Risks</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{d.risks}</div>
            </div>
          )}
          {d.nonFinancial && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Non-Financial Value</p>
              <p className="text-sm text-foreground">{d.nonFinancial}</p>
            </div>
          )}
          {d.fieldAgentRequired && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Field Agent required for physical verification</p>
            </div>
          )}
          {d.milestones && d.milestones.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones</p>
              <div className="space-y-2">
                {d.milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "parties" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Parties must all agree for the deal to progress to Active status.</p>
          {d.parties?.map((party: any) => (
            <div key={party.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div>
                <p className="text-sm font-semibold text-foreground">User #{party.userId}</p>
                <p className="text-xs text-muted-foreground capitalize">{party.role}</p>
              </div>
              {party.agreed ? (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" /> Agreed
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "witnesses" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Witnesses provide external validation for the deal agreement.</p>
          {!d.witnesses || d.witnesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No witnesses added yet.</p>
            </div>
          ) : d.witnesses.map((w: any) => (
            <div key={w.id} className="p-3 rounded-xl border border-border bg-card">
              <p className="text-sm font-semibold text-foreground">{w.name}</p>
              {w.witnessRole && <p className="text-xs text-muted-foreground">{w.witnessRole}</p>}
              {w.relationship && <p className="text-xs text-muted-foreground">{w.relationship}</p>}
              {(w.email || w.phone) && (
                <p className="text-xs text-muted-foreground mt-1">{[w.email, w.phone].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "copilot" && (
        <div>
          {(copilotSummary || d.copilotSummary) ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Co-pilot Analysis</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {copilotSummary || d.copilotSummary}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Analysis generated by Bizny Co-pilot. Not legal or financial advice.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-10 w-10 mx-auto mb-3 text-primary opacity-60" />
              <p className="text-sm font-semibold mb-1">No analysis yet</p>
              <p className="text-xs text-muted-foreground mb-4">Get a risk assessment and strategic summary from Co-pilot.</p>
              <Button onClick={handleCopilot} disabled={copilotMutation.isPending} className="gap-2">
                {copilotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {copilotMutation.isPending ? "Analysing..." : "Generate Analysis"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
