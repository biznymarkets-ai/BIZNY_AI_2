import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListVentures,
  getListVenturesQueryKey,
  useListPublicVentures,
  getListPublicVenturesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Rocket, Calendar, TrendingUp, Target, Globe, Pause,
  CheckCircle2, XCircle, Clock, ArrowRight, BookOpen,
  Search, Filter, X, MapPin, Factory,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { INDUSTRY_SECTORS, AFRICAN_COUNTRIES } from "@/lib/countries";

const STATUS_CONFIG = {
  active:    { label: "Active",    icon: <Rocket className="h-3 w-3" />,      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  paused:    { label: "Paused",    icon: <Pause className="h-3 w-3" />,       color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  abandoned: { label: "Abandoned", icon: <XCircle className="h-3 w-3" />,     color: "bg-red-500/10 text-red-400 border-red-500/30" },
};

function VentureCard({ venture, showOwner = false }: { venture: any; showOwner?: boolean }) {
  const status = STATUS_CONFIG[venture.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;

  return (
    <Card className="hover:border-primary/40 transition-all group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {venture.title}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {venture.mainIndustry && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 flex items-center gap-1">
                  <Factory className="h-2.5 w-2.5" />{venture.mainIndustry}
                </span>
              )}
              {venture.template && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <BookOpen className="h-2.5 w-2.5" />{venture.template.industry}
                </span>
              )}
              {venture.country && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{[venture.stateCity, venture.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`text-xs shrink-0 flex items-center gap-1 ${status.color}`}>
            {status.icon} {status.label}
          </Badge>
        </div>
        {showOwner && venture.owner && (
          <p className="text-xs text-muted-foreground">by {venture.owner.name}</p>
        )}
        {venture.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{venture.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Progress
            </span>
            <span className="font-semibold text-primary">{Math.round(venture.progressPercent)}%</span>
          </div>
          <Progress value={venture.progressPercent} className="h-1.5" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">Day {venture.currentDay}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current</p>
          </div>
          {venture.template && (
            <div className="text-center border-x border-border/50">
              <p className="text-sm font-bold text-foreground">{venture.template.durationDays}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Days</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-foreground flex items-center justify-center gap-0.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {formatDistanceToNow(new Date(venture.startedAt), { addSuffix: false })}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Running</p>
          </div>
        </div>

        {venture.template?.milestones && Array.isArray(venture.template.milestones) && venture.template.milestones.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Target className="h-3 w-3" /> Next Milestone
            </p>
            <p className="text-xs text-foreground/80 line-clamp-1">
              {(venture.template.milestones as any[]).find((m: any) => m.day > venture.currentDay)?.title ?? "Final milestone"}
            </p>
          </div>
        )}

        <Link href={`/ventures/${venture.id}`}>
          <Button variant="outline" size="sm" className="w-full group-hover:border-primary/50 transition-colors mt-1">
            View Progress <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="text-4xl mb-3 flex justify-center opacity-30">{icon}</div>
      <p className="text-sm">{label}</p>
      <Link href="/ventures/new">
        <Button variant="outline" size="sm" className="mt-4">
          Start a Venture
        </Button>
      </Link>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function Ventures() {
  const { token } = useAuth();

  const [publicSearch, setPublicSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: myVentures, isLoading: myLoading } = useListVentures({
    query: { enabled: !!token, queryKey: getListVenturesQueryKey() },
  });

  const { data: publicVentures, isLoading: publicLoading } = useListPublicVentures(undefined, {
    query: { queryKey: getListPublicVenturesQueryKey() },
  });

  const filteredPublic = useMemo(() => {
    if (!publicVentures) return [];
    return publicVentures.filter((v: any) => {
      const q = publicSearch.toLowerCase();
      const matchSearch = !q || v.title?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q) ||
        v.mainIndustry?.toLowerCase().includes(q) || v.owner?.name?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || v.status === statusFilter;
      const matchIndustry = !industryFilter || v.mainIndustry === industryFilter || v.template?.industry === industryFilter;
      const matchCountry = !countryFilter || v.country === countryFilter;
      return matchSearch && matchStatus && matchIndustry && matchCountry;
    });
  }, [publicVentures, publicSearch, statusFilter, industryFilter, countryFilter]);

  const activeFilterCount = [statusFilter, industryFilter, countryFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("");
    setIndustryFilter("");
    setCountryFilter("");
    setPublicSearch("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-display font-bold tracking-tight">Ventures</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track your active ventures and explore what others are building</p>
        </div>
        <Link href="/ventures/new">
          <Button className="gap-2">
            <Rocket className="h-4 w-4" /> Start New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine" className="gap-2">
            <Rocket className="h-4 w-4" />
            My Ventures
            {myVentures && myVentures.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{myVentures.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="h-4 w-4" />
            Directory
            {publicVentures && publicVentures.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{publicVentures.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          {myLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : !myVentures || myVentures.length === 0 ? (
            <EmptyState label="You haven't started any ventures yet." icon={<Rocket />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myVentures.map(v => <VentureCard key={v.id} venture={v} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="mt-4 space-y-4">
          {/* Search + filter bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={publicSearch}
                onChange={e => setPublicSearch(e.target.value)}
                placeholder="Search ventures, industries, founders…"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(v => !v)}
              className={`gap-2 shrink-0 ${activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : ""}`}
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}` : "Filter"}
            </Button>
            {(activeFilterCount > 0 || publicSearch) && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter chips */}
          {showFilters && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <FilterChip key={key} active={statusFilter === key} onClick={() => setStatusFilter(prev => prev === key ? "" : key)}>
                      {cfg.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Industry</p>
                <div className="flex gap-2 flex-wrap overflow-y-auto max-h-24">
                  {INDUSTRY_SECTORS.slice(0, 18).map(ind => (
                    <FilterChip key={ind} active={industryFilter === ind} onClick={() => setIndustryFilter(prev => prev === ind ? "" : ind)}>
                      {ind}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Country</p>
                <div className="flex gap-2 flex-wrap overflow-y-auto max-h-24">
                  {AFRICAN_COUNTRIES.map(c => (
                    <FilterChip key={c} active={countryFilter === c} onClick={() => setCountryFilter(prev => prev === c ? "" : c)}>
                      {c}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {publicLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : filteredPublic.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No ventures match your filters</p>
              {(activeFilterCount > 0 || publicSearch) && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{filteredPublic.length} venture{filteredPublic.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPublic.map((v: any) => <VentureCard key={v.id} venture={v} showOwner />)}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
