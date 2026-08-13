import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useListListings,
  getListListingsQueryKey,
  useListDeals,
  getListDealsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Store, Handshake, ShoppingBag, Plus, Search, MapPin,
  Phone, ArrowRight, CheckCircle, Clock, AlertCircle,
  FileText, Package, Wrench, Factory, Globe, Star,
  MessageSquare, ExternalLink, Building,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DEAL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:           { label: "Draft",           color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",             icon: <FileText className="h-3 w-3" /> },
  open:            { label: "Open",            color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",           icon: <Clock className="h-3 w-3" /> },
  agreed:          { label: "Agreed",          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle className="h-3 w-3" /> },
  witness_pending: { label: "Witness Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",       icon: <AlertCircle className="h-3 w-3" /> },
  active:          { label: "Active",          color: "bg-primary/10 text-primary",                                                  icon: <CheckCircle className="h-3 w-3" /> },
  completed:       { label: "Completed",       color: "bg-emerald-100 text-emerald-700",                                            icon: <CheckCircle className="h-3 w-3" /> },
  cancelled:       { label: "Cancelled",       color: "bg-red-100 text-red-600",                                                    icon: <AlertCircle className="h-3 w-3" /> },
};

const LISTING_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  product:   <Package className="h-4 w-4" />,
  service:   <Wrench className="h-4 w-4" />,
  supplier:  <Factory className="h-4 w-4" />,
  commodity: <Globe className="h-4 w-4" />,
};

type MarketTab = "marketplace" | "deal-desk" | "stores";

export default function Market() {
  const [, navigate] = useLocation();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<MarketTab>("marketplace");
  const [search, setSearch] = useState("");

  const tabs: { key: MarketTab; label: string; icon: React.ReactNode }[] = [
    { key: "marketplace", label: "Marketplace",  icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "deal-desk",   label: "Deal Desk",     icon: <Handshake className="h-4 w-4" /> },
    { key: "stores",      label: "Stores",        icon: <Store className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Market</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Commerce · Deals · Storefronts</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={
            activeTab === "marketplace" ? "Search products, services, suppliers…" :
            activeTab === "deal-desk" ? "Search deals, partners, industries…" :
            "Search stores, businesses…"
          }
          className="pl-9"
        />
      </div>

      {activeTab === "marketplace" && <MarketplaceTab search={search} token={token} navigate={navigate} />}
      {activeTab === "deal-desk" && <DealDeskTab search={search} token={token} navigate={navigate} />}
      {activeTab === "stores" && <StoresTab search={search} token={token} navigate={navigate} />}
    </div>
  );
}

function MarketplaceTab({ search, token, navigate }: { search: string; token?: string | null; navigate: any }) {
  const { data: listings, isLoading } = useListListings(undefined, {
    query: { enabled: true, queryKey: getListListingsQueryKey() },
  });

  const filtered = (listings ?? []).filter((l: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.title ?? "").toLowerCase().includes(q) ||
      (l.description ?? "").toLowerCase().includes(q) ||
      (l.industry ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" onClick={() => navigate("/marketplace")} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Listing
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="No listings yet"
          subtitle="Business and supplier discovery — contact info only, no payments"
          action={{ label: "Browse all", onClick: () => navigate("/marketplace") }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((listing: any) => (
            <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-primary/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {LISTING_CATEGORY_ICONS[listing.category ?? "product"] ?? <ShoppingBag className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1">{listing.title}</h3>
                    {listing.priceRange && (
                      <span className="text-xs font-bold text-primary shrink-0">{listing.priceRange}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{listing.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {listing.industry && (
                      <span className="text-[10px] text-primary bg-primary/5 border border-primary/15 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Factory className="h-2.5 w-2.5" />{listing.industry}
                      </span>
                    )}
                    {listing.location && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />{listing.location}
                      </span>
                    )}
                    {listing.contactWhatsapp && (
                      <a href={`https://wa.me/${listing.contactWhatsapp?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"
                        className="text-[10px] text-emerald-600 flex items-center gap-1 hover:underline">
                        <Phone className="h-2.5 w-2.5" />WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => navigate("/marketplace")}>
            View all listings <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function DealDeskTab({ search, token, navigate }: { search: string; token?: string | null; navigate: any }) {
  const { data: deals, isLoading } = useListDeals(undefined, {
    query: { enabled: !!token, queryKey: getListDealsQueryKey() },
  });

  const filtered = (deals ?? []).filter((d: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.title ?? "").toLowerCase().includes(q) ||
      (d.industry ?? "").toLowerCase().includes(q) ||
      (d.dealType ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{filtered.length} deal{filtered.length !== 1 ? "s" : ""}</p>
        <Button size="sm" variant="outline" onClick={() => navigate("/deal-desk/new")} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Deal
        </Button>
      </div>

      {/* What is Deal Desk */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-[11px] text-primary font-semibold mb-1">What is Deal Desk?</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Coordinate supply agreements, partnerships, and collaborations. All parties sign off digitally. Field agents witness high-value deals.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : !token ? (
        <EmptyState
          icon={<Handshake className="h-8 w-8" />}
          title="Sign in to view deals"
          subtitle="Deal Desk requires authentication"
          action={{ label: "Sign in", onClick: () => navigate("/login") }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Handshake className="h-8 w-8" />}
          title="No deals yet"
          subtitle="Create coordinated agreements with multiple parties"
          action={{ label: "Create a deal", onClick: () => navigate("/deal-desk/new") }}
        />
      ) : (
        <div className="space-y-3">
          {(filtered as any[]).map((deal: any) => {
            const sc = DEAL_STATUS_CONFIG[deal.status] ?? DEAL_STATUS_CONFIG.draft;
            return (
              <button
                key={deal.id}
                onClick={() => navigate(`/deal-desk/${deal.id}`)}
                className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{deal.dealType}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{deal.title}</h3>
                    {(deal.industry || deal.country) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[deal.industry, deal.country].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">{deal.parties?.length ?? 0} parties</span>
                      {deal.financialValue && (
                        <span className="text-xs font-medium text-foreground">{deal.financialValue}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(deal.createdAt))} ago
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
          <Button variant="outline" className="w-full" onClick={() => navigate("/deal-desk")}>
            View all deals <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function StoresTab({ search, token, navigate }: { search: string; token?: string | null; navigate: any }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display font-bold text-lg text-foreground mb-1.5">Stores Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          User-owned storefronts for businesses and suppliers on Bizny. Full commercialization with product catalogs, enquiry management, and order coordination.
        </p>
        <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
          {[
            "Product catalog with photos and pricing",
            "Enquiry and order management",
            "Business verification badge",
            "AI-Assist powered listing optimization",
            "Field agent inventory verification",
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full max-w-xs" variant="outline">
          Notify me when ready
        </Button>
      </div>

      {/* In the meantime */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-foreground mb-3">In the meantime, explore:</p>
        <div className="space-y-2">
          {[
            { label: "Marketplace listings", desc: "Browse products and services", href: "/marketplace", icon: <ShoppingBag className="h-4 w-4 text-pink-500" /> },
            { label: "Deal Desk", desc: "Coordinate supply agreements", href: "/deal-desk", icon: <Handshake className="h-4 w-4 text-primary" /> },
            { label: "Directory", desc: "Find businesses and suppliers", href: "/directory", icon: <Building className="h-4 w-4 text-blue-500" /> },
          ].map(item => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-background text-left transition-all"
            >
              {item.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
      <div className="text-gray-200 dark:text-gray-700 mx-auto mb-3 flex justify-center">{icon}</div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">{subtitle}</p>
      <Button variant="outline" size="sm" onClick={action.onClick}>{action.label}</Button>
    </div>
  );
}
