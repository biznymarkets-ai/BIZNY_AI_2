import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListIndustryTargets,
  getListIndustryTargetsQueryKey,
  useListOpportunities,
  getListOpportunitiesQueryKey,
  useListUsers,
  getListUsersQueryKey,
  useFollowUser,
  useUnfollowUser,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Search, ChevronRight, TrendingUp, Target, Leaf,
  Factory, Truck, Zap, Anchor, ShoppingBag, Beaker,
  Globe, Users, BarChart2, ArrowRight, Star, MapPin,
  Briefcase, Play, ArrowUpRight, CheckCircle2, UserPlus, UserCheck,
} from "lucide-react";

const INDUSTRIES = [
  { name: "Agriculture", icon: Leaf, color: "bg-green-50 text-green-700 border-green-100", sub: ["Grains", "Vegetables", "Livestock", "Aquaculture", "Tree Crops"] },
  { name: "Manufacturing", icon: Factory, color: "bg-blue-50 text-blue-700 border-blue-100", sub: ["Food Processing", "Textiles", "Chemicals", "Metals", "Packaging"] },
  { name: "Logistics & Trade", icon: Truck, color: "bg-amber-50 text-amber-700 border-amber-100", sub: ["Freight", "Cold Chain", "Customs", "Last Mile", "Export"] },
  { name: "Energy", icon: Zap, color: "bg-yellow-50 text-yellow-700 border-yellow-100", sub: ["Solar", "Biogas", "Mini-Grid", "Efficiency", "EV"] },
  { name: "Maritime & Fishing", icon: Anchor, color: "bg-cyan-50 text-cyan-700 border-cyan-100", sub: ["Artisanal Fishing", "Aquaculture", "Fish Processing", "Export"] },
  { name: "Retail & Commerce", icon: ShoppingBag, color: "bg-pink-50 text-pink-700 border-pink-100", sub: ["FMCG", "B2B Wholesale", "E-commerce", "Open Markets"] },
  { name: "Research & Innovation", icon: Beaker, color: "bg-violet-50 text-violet-700 border-violet-100", sub: ["AgriTech", "HealthTech", "EdTech", "CleanTech"] },
];

const PEPPER_VALUE_CHAIN = [
  { stage: "Farming", actors: 12500, icon: Leaf },
  { stage: "Processing", actors: 340, icon: Factory },
  { stage: "Packaging", actors: 120, icon: ShoppingBag },
  { stage: "Distribution", actors: 450, icon: Truck },
  { stage: "Export", actors: 65, icon: Globe },
];

function IndustryCard({ industry }: { industry: typeof INDUSTRIES[0] }) {
  const Icon = industry.icon;
  return (
    <Link href="/industry-targets">
      <div className={`rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all ${industry.color} flex flex-col gap-2`}>
        <Icon className="h-6 w-6" />
        <p className="font-display font-bold text-sm leading-tight">{industry.name}</p>
        <p className="text-[10px] opacity-70">{industry.sub.length} sub-industries</p>
      </div>
    </Link>
  );
}

function UserCard({ user, onFollowChange }: { user: any; onFollowChange: () => void }) {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { user: me } = useAuth();
  const isMe = me?.id === user.id;

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user.isFollowing) {
      unfollowMutation.mutate({ id: user.id }, { onSuccess: onFollowChange });
    } else {
      followMutation.mutate({ id: user.id }, { onSuccess: onFollowChange });
    }
  };

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Link href={`/profile/${user.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0 border-2 border-gray-100">
            <AvatarImage src={user.avatarUrl || ""} />
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              {user.verificationStatus === "verified" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.role}</p>
            {(user.industry || user.country) && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {user.industry && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{user.industry}</Badge>
                )}
                {user.country && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />{user.country}
                  </span>
                )}
              </div>
            )}
          </div>
          {!isMe && (
            <button
              onClick={handleFollow}
              disabled={isPending}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                user.isFollowing
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-primary text-white border-primary hover:bg-primary/90"
              }`}
            >
              {user.isFollowing
                ? <><UserCheck className="h-3 w-3" /> Following</>
                : <><UserPlus className="h-3 w-3" /> Follow</>
              }
            </button>
          )}
        </div>
        {user.bio && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{user.bio}</p>
        )}
        <div className="flex gap-4 mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800">
          <div className="text-center">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{user.followersCount ?? 0}</p>
            <p className="text-[10px] text-gray-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{user.followingCount ?? 0}</p>
            <p className="text-[10px] text-gray-400">Following</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("industries");
  const [roleFilter, setRoleFilter] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: targets, isLoading: targetsLoading } = useListIndustryTargets({}, {
    query: { queryKey: getListIndustryTargetsQueryKey() },
  });

  const { data: opportunities } = useListOpportunities(undefined, {
    query: { queryKey: getListOpportunitiesQueryKey() },
  });

  const { data: users, isLoading: usersLoading } = useListUsers({}, {
    query: { queryKey: getListUsersQueryKey(), enabled: activeSection === "people" },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.role ?? "").toLowerCase().includes(q) ||
        (u.industry ?? "").toLowerCase().includes(q) ||
        (u.country ?? "").toLowerCase().includes(q)
      );
    }
    if (roleFilter) list = list.filter(u => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  const SECTIONS = [
    { id: "industries", label: "Industries" },
    { id: "targets", label: "Targets" },
    { id: "value-chains", label: "Value Chains" },
    { id: "opportunities", label: "Opportunities" },
    { id: "people", label: "People" },
  ];

  const ROLES = Array.from(new Set((users ?? []).map(u => u.role).filter(Boolean)));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover industries, opportunities, and economic actors</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search industries, products, ventures, people…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeSection === s.id
                ? "bg-primary text-white border-primary"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Industry Explorer */}
      {activeSection === "industries" && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-base text-foreground">Industry Explorer</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {INDUSTRIES.map((ind) => <IndustryCard key={ind.name} industry={ind} />)}
          </div>
        </section>
      )}

      {/* Industry Targets */}
      {activeSection === "targets" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-foreground">Industry Targets</h2>
            <Link href="/industry-targets">
              <button className="text-xs text-primary font-medium flex items-center gap-0.5">
                See all <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          {targetsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : targets && targets.length > 0 ? (
            targets.slice(0, 5).map((target) => (
              <div key={target.id} className="bg-background rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-sm text-foreground">{target.industry}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{target.subIndustry} · {target.specificProduct}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
                    {target.targetYear}
                  </Badge>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress to target</span>
                    <span className="font-bold text-primary">
                      {Math.round(((parseFloat(String(target.currentRevenue ?? 0)) / parseFloat(String(target.targetRevenue ?? 1))) * 100))}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round(((parseFloat(String(target.currentRevenue ?? 0)) / parseFloat(String(target.targetRevenue ?? 1))) * 100)))}
                    className="h-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground">Current</p>
                    <p className="text-xs font-bold text-foreground">${(parseFloat(String(target.currentRevenue ?? 0)) / 1e6).toFixed(0)}M</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground">Target</p>
                    <p className="text-xs font-bold text-primary">${(parseFloat(String(target.targetRevenue ?? 0)) / 1e6).toFixed(0)}M</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">No industry targets yet</div>
          )}
        </section>
      )}

      {/* Value Chains */}
      {activeSection === "value-chains" && (
        <section className="space-y-4">
          <h2 className="font-display font-bold text-base text-foreground">Value Chain Explorer</h2>
          <div className="bg-background rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Pepper Industry</h3>
                <p className="text-xs text-muted-foreground">Agriculture → Scotch Bonnet Pepper</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              {PEPPER_VALUE_CHAIN.map((stage, i) => {
                const Icon = stage.icon;
                const isLast = i === PEPPER_VALUE_CHAIN.length - 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {!isLast && <div className="w-0.5 h-4 bg-border my-1" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{stage.stage}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> {stage.actors.toLocaleString()} actors
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex gap-2">
              <button className="flex-1 py-2 bg-primary/5 text-primary text-xs font-semibold rounded-lg hover:bg-primary/10 transition-colors">
                Join this value chain
              </button>
              <button className="flex-1 py-2 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors">
                See opportunities
              </button>
            </div>
          </div>
          {[
            { name: "Okra Industry", chain: "Agriculture → Okra → Processing/Export", actors: 8200 },
            { name: "Shea Butter", chain: "Agriculture → Shea → Processing/Cosmetics", actors: 5400 },
            { name: "Cassava Industry", chain: "Agriculture → Cassava → Flour/Starch/Ethanol", actors: 22000 },
          ].map((vc, i) => (
            <div key={i} className="bg-background rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{vc.name}</p>
                <p className="text-xs text-muted-foreground">{vc.chain}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">{vc.actors.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">actors</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Opportunities */}
      {activeSection === "opportunities" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-foreground">Opportunities</h2>
            <Link href="/opportunities">
              <button className="text-xs text-primary font-medium flex items-center gap-0.5">
                All <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          {opportunities?.slice(0, 6).map((opp) => (
            <div key={opp.id} className="bg-background rounded-xl border border-border p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{opp.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{opp.industry}</p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                  {opp.type}
                </Badge>
              </div>
              {opp.country && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {opp.country}
                </div>
              )}
              <button className="mt-3 text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                View details <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
          {!opportunities?.length && (
            <div className="text-center py-10 text-muted-foreground text-sm">No opportunities found</div>
          )}
        </section>
      )}

      {/* People directory */}
      {activeSection === "people" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-foreground">
              People
              {users && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredUsers.length})</span>}
            </h2>
          </div>

          {/* Role filter chips */}
          {ROLES.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              <button
                onClick={() => setRoleFilter("")}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  !roleFilter ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                }`}
              >
                All
              </button>
              {ROLES.slice(0, 8).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(roleFilter === role ? "" : role)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    roleFilter === role ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {usersLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-background rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No people found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onFollowChange={() => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
