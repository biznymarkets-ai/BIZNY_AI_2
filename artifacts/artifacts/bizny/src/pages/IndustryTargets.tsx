import { useState } from "react";
import {
  useListIndustryTargets,
  getListIndustryTargetsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search, Target, TrendingUp, Users, DollarSign,
  BarChart2, Calendar, Globe, ChevronRight,
  Leaf, Factory, Truck, Zap, ArrowUpRight, Plus,
  ShoppingBag, CheckCircle2,
} from "lucide-react";

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  Agriculture: <Leaf className="h-4 w-4" />,
  Manufacturing: <Factory className="h-4 w-4" />,
  Logistics: <Truck className="h-4 w-4" />,
  Energy: <Zap className="h-4 w-4" />,
  Trade: <ShoppingBag className="h-4 w-4" />,
};

function TargetCard({ target }: { target: any }) {
  const [expanded, setExpanded] = useState(false);

  const currentRev = parseFloat(String(target.currentRevenue ?? 0));
  const targetRev = parseFloat(String(target.targetRevenue ?? 1));
  const progress = Math.min(100, Math.round((currentRev / targetRev) * 100));

  const icon = INDUSTRY_ICONS[target.industry] ?? <Target className="h-4 w-4" />;

  const contributions = target.requiredContributions as Record<string, number> | null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-gray-900 leading-tight">{target.industry}</h3>
              {target.subIndustry && (
                <p className="text-xs text-gray-500 mt-0.5">{target.subIndustry}</p>
              )}
              {target.specificProduct && (
                <p className="text-xs text-primary font-medium mt-0.5">{target.specificProduct}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/5 text-primary border-primary/20">
            <Calendar className="h-2.5 w-2.5 mr-1" /> {target.targetYear}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Progress to target</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Revenue metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg px-2.5 py-2">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Current</p>
            <p className="text-xs font-bold text-gray-900">
              ${currentRev >= 1e9
                ? `${(currentRev / 1e9).toFixed(1)}B`
                : `${(currentRev / 1e6).toFixed(0)}M`}
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg px-2.5 py-2">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Target</p>
            <p className="text-xs font-bold text-primary">
              ${targetRev >= 1e9
                ? `${(targetRev / 1e9).toFixed(1)}B`
                : `${(targetRev / 1e6).toFixed(0)}M`}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg px-2.5 py-2">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Growth</p>
            <p className="text-xs font-bold text-emerald-600">
              {target.growthTargetPercent
                ? `${target.growthTargetPercent}%`
                : currentRev > 0
                ? `${Math.round(((targetRev - currentRev) / currentRev) * 100)}%`
                : "—"}
            </p>
          </div>
        </div>

        {/* Required contributions summary */}
        {contributions && Object.keys(contributions).length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">{Object.keys(contributions).length} types of contributors needed</span>
            </div>
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}

        {expanded && contributions && (
          <div className="pt-2 space-y-1.5 border-t border-gray-50">
            {Object.entries(contributions).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-700">{role}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{Number(count).toLocaleString()}</span>
                  <button className="text-[10px] font-semibold text-primary border border-primary/20 px-2 py-0.5 rounded-full hover:bg-primary/5 transition-colors">
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-50 flex divide-x divide-gray-50">
        <button className="flex-1 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
          Contribute
        </button>
        <button className="flex-1 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
          Details <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function IndustryTargets() {
  const [search, setSearch] = useState("");

  const { data: targets, isLoading } = useListIndustryTargets({}, {
    query: { queryKey: getListIndustryTargetsQueryKey() },
  });

  const filtered = targets?.filter(t =>
    !search ||
    t.industry.toLowerCase().includes(search.toLowerCase()) ||
    (t.subIndustry ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.specificProduct ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalTargetRevenue = targets?.reduce((sum, t) => sum + parseFloat(String(t.targetRevenue ?? 0)), 0) ?? 0;
  const totalCurrentRevenue = targets?.reduce((sum, t) => sum + parseFloat(String(t.currentRevenue ?? 0)), 0) ?? 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Industry Targets</h1>
          <p className="text-sm text-gray-500 mt-1">Economic goals powering Africa's growth</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors font-semibold">
          <Plus className="h-3.5 w-3.5" /> Propose
        </button>
      </div>

      {/* Summary stats */}
      {targets && targets.length > 0 && (
        <div className="bg-gradient-to-r from-primary to-teal-600 rounded-xl p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-3">Platform-Wide Targets</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-display font-bold">
                ${totalCurrentRevenue >= 1e9
                  ? `${(totalCurrentRevenue / 1e9).toFixed(1)}B`
                  : `${(totalCurrentRevenue / 1e6).toFixed(0)}M`}
              </p>
              <p className="text-[10px] opacity-70 mt-0.5">Current value</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold">
                ${totalTargetRevenue >= 1e9
                  ? `${(totalTargetRevenue / 1e9).toFixed(1)}B`
                  : `${(totalTargetRevenue / 1e6).toFixed(0)}M`}
              </p>
              <p className="text-[10px] opacity-70 mt-0.5">Target value</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold">{targets.length}</p>
              <p className="text-[10px] opacity-70 mt-0.5">Industries tracked</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1 opacity-70">
              <span>Overall progress</span>
              <span>
                {totalTargetRevenue > 0
                  ? Math.round((totalCurrentRevenue / totalTargetRevenue) * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${totalTargetRevenue > 0 ? Math.min(100, Math.round((totalCurrentRevenue / totalTargetRevenue) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search industry targets…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-16">
          <Target className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">No industry targets yet</p>
          <p className="text-gray-400 text-xs mt-1">Be the first to propose one</p>
          <button className="mt-4 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors">
            Propose a Target
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      )}

      {/* What is this */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" /> What are Industry Targets?
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Industry Targets are specific, measurable economic goals set for African industries — such as growing the Okra sector from $100M to $300M by 2030. They define the number of farmers, processors, exporters, and logistics partners needed, and track real-time progress as contributors join and report activity.
        </p>
      </div>
    </div>
  );
}
