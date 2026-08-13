import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListTemplates,
  useCreateTemplate,
  useSaveTemplate,
  useUnsaveTemplate,
  getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import type { VentureTemplate } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { INDUSTRY_SECTORS } from "@/lib/countries";
import {
  Search, BookOpen, Clock, Bookmark, BookmarkCheck,
  Plus, Users, GitFork, Star, ArrowRight,
  Briefcase, Cog, Layers, Leaf, Globe, ClipboardList,
  Lightbulb, Beaker, FlaskConical, Filter, Loader2,
  ChevronDown, Package,
} from "lucide-react";

const TEMPLATE_TYPES = [
  { id: "all",                   label: "All Types",             icon: Package,       color: "text-gray-600" },
  { id: "business_model",        label: "Business Model",        icon: Briefcase,     color: "text-teal-600" },
  { id: "engineering_design",    label: "Engineering Design",    icon: Cog,           color: "text-blue-600" },
  { id: "manufacturing_process", label: "Manufacturing Process", icon: Layers,        color: "text-orange-600" },
  { id: "agricultural_system",   label: "Agricultural System",   icon: Leaf,          color: "text-green-600" },
  { id: "research_framework",    label: "Research Framework",    icon: BookOpen,      color: "text-purple-600" },
  { id: "community_solution",    label: "Community Solution",    icon: Globe,         color: "text-pink-600" },
  { id: "operational_procedure", label: "Operational Procedure", icon: ClipboardList, color: "text-slate-600" },
  { id: "playbook",              label: "Playbook",              icon: ClipboardList, color: "text-amber-600" },
  { id: "experiment",            label: "Experiment",            icon: Beaker,        color: "text-cyan-600" },
  { id: "innovation_concept",    label: "Innovation Concept",    icon: Lightbulb,     color: "text-violet-600" },
  { id: "project",               label: "Project",               icon: FlaskConical,  color: "text-indigo-600" },
];

const TYPE_BADGE_COLORS: Record<string, string> = {
  business_model:        "text-teal-600 bg-teal-50 border-teal-200",
  engineering_design:    "text-blue-600 bg-blue-50 border-blue-200",
  manufacturing_process: "text-orange-600 bg-orange-50 border-orange-200",
  agricultural_system:   "text-green-600 bg-green-50 border-green-200",
  research_framework:    "text-purple-600 bg-purple-50 border-purple-200",
  community_solution:    "text-pink-600 bg-pink-50 border-pink-200",
  operational_procedure: "text-slate-600 bg-slate-50 border-slate-200",
  playbook:              "text-amber-600 bg-amber-50 border-amber-200",
  experiment:            "text-cyan-600 bg-cyan-50 border-cyan-200",
  innovation_concept:    "text-violet-600 bg-violet-50 border-violet-200",
  project:               "text-indigo-600 bg-indigo-50 border-indigo-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     "text-green-700 bg-green-50 border-green-200",
  intermediate: "text-amber-700 bg-amber-50 border-amber-200",
  advanced:     "text-red-700 bg-red-50 border-red-200",
};

function getTypeLabel(type?: string) {
  return TEMPLATE_TYPES.find(t => t.id === type)?.label ?? type ?? "Template";
}

function TemplateCard({ template, saved, onToggleSave }: {
  template: VentureTemplate;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const badgeColor = TYPE_BADGE_COLORS[template.templateType ?? ""] ?? "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <Link href={`/templates/${template.id}`}>
      <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer">
        {template.coverImageUrl ? (
          <div className="h-28 bg-muted overflow-hidden">
            <img src={template.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border-b border-border/60">
            <BookOpen className="h-8 w-8 text-primary/20" />
          </div>
        )}
        <div className="p-3.5">
          <div className="flex items-start gap-1.5 mb-2 flex-wrap">
            <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor} uppercase tracking-wide shrink-0`}>
              {getTypeLabel(template.templateType)}
            </span>
            {template.difficulty && (
              <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[template.difficulty] ?? "text-gray-600 bg-gray-50 border-gray-200"} capitalize`}>
                {template.difficulty}
              </span>
            )}
          </div>
          <h3 className="font-display font-semibold text-sm text-foreground mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {template.title}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {template.description}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{template.durationDays}d
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />{template.adoptionCount ?? 0}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5" />{template.followCount ?? 0}
            </span>
            <span className="ml-auto text-[10px] truncate text-muted-foreground/70">{template.industry}</span>
          </div>
          <div className="flex gap-1.5">
            <div
              onClick={(e) => e.preventDefault()}
              className="contents"
            >
              <Link href={`/templates/${template.id}`}>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-primary text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowRight className="h-3 w-3" /> View & Adopt
                </button>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
                className={`p-1.5 rounded-lg border transition-colors ${saved ? "bg-primary/10 border-primary/20 text-primary" : "border-border hover:bg-muted text-muted-foreground hover:text-primary"}`}
              >
                {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CreateForm {
  title: string;
  description: string;
  industry: string;
  templateType: string;
  durationDays: string;
  estimatedTimeline: string;
  problemSolved: string;
}

const EMPTY_FORM: CreateForm = {
  title: "",
  description: "",
  industry: "",
  templateType: "business_model",
  durationDays: "30",
  estimatedTimeline: "30 days",
  problemSolved: "",
};

export default function Repository() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const { data: templates, isLoading } = useListTemplates(undefined, {
    query: { queryKey: getListTemplatesQueryKey() },
  });

  const createMutation = useCreateTemplate();
  const saveMutation = useSaveTemplate();
  const unsaveMutation = useUnsaveTemplate();

  const filtered = (templates ?? []).filter((t) => {
    if (typeFilter !== "all" && t.templateType !== typeFilter) return false;
    if (industryFilter && t.industry !== industryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.industry.toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleToggleSave = (id: number) => {
    if (savedIds.has(id)) {
      unsaveMutation.mutate({ id }, {
        onSuccess: () => {
          setSavedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
          toast({ description: "Removed from saved." });
        },
      });
    } else {
      saveMutation.mutate({ id }, {
        onSuccess: () => {
          setSavedIds(prev => new Set(prev).add(id));
          toast({ description: "Template saved." });
        },
      });
    }
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.industry || !form.description.trim()) {
      toast({ variant: "destructive", description: "Title, industry and description are required." });
      return;
    }
    createMutation.mutate(
      {
        data: {
          title: form.title.trim(),
          description: form.description.trim(),
          industry: form.industry,
          durationDays: parseInt(form.durationDays) || 30,
          estimatedTimeline: form.estimatedTimeline.trim() || `${form.durationDays} days`,
          problemSolved: form.problemSolved.trim() || undefined,
          visibility: "public",
        } as any,
      },
      {
        onSuccess: (t) => {
          toast({ title: "Template created!", description: "Find it in the Repository." });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          setCreateOpen(false);
          setForm(EMPTY_FORM);
          navigate(`/templates/${t.id}`);
        },
        onError: () => toast({ variant: "destructive", description: "Failed to create template." }),
      }
    );
  };

  const set = (key: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const typeCounts = (templates ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.templateType ?? ""] = (acc[t.templateType ?? ""] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">Repository</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${(templates ?? []).length} knowledge assets — adopt, fork, and execute`}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" /> Create
        </Button>
      </div>

      {/* Search + Industry filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates, industries, tags…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="appearance-none bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-sm outline-none focus:border-primary/50 cursor-pointer transition-all text-foreground"
          >
            <option value="">All industries</option>
            {INDUSTRY_SECTORS.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {TEMPLATE_TYPES.map((type) => {
          const Icon = type.icon;
          const count = type.id === "all" ? (templates?.length ?? 0) : (typeCounts[type.id] ?? 0);
          const active = typeFilter === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {type.label}
              {count > 0 && <span className={`text-[10px] ${active ? "text-white/70" : "text-muted-foreground/60"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm mb-1">No templates found</p>
          <p className="text-xs text-muted-foreground/70 mb-4">Try a different filter or create the first one</p>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create Template
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "template" : "templates"}
              {typeFilter !== "all" && ` · ${getTypeLabel(typeFilter)}`}
              {industryFilter && ` · ${industryFilter}`}
            </p>
            {(typeFilter !== "all" || industryFilter || search) && (
              <button
                onClick={() => { setTypeFilter("all"); setIndustryFilter(""); setSearch(""); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                saved={savedIds.has(t.id)}
                onToggleSave={() => handleToggleSave(t.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Share a repeatable process, blueprint, or system with the community.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Smallholder Cassava Processing Setup" value={form.title} onChange={set("title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Template Type</Label>
              <select
                value={form.templateType}
                onChange={set("templateType")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50"
              >
                {TEMPLATE_TYPES.filter(t => t.id !== "all").map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Industry <span className="text-destructive">*</span></Label>
                <select
                  value={form.industry}
                  onChange={set("industry")}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm outline-none focus:border-primary/50"
                >
                  <option value="">Select…</option>
                  {INDUSTRY_SECTORS.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input type="number" min="1" value={form.durationDays} onChange={set("durationDays")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="What does this template help someone build or achieve?"
                rows={3}
                value={form.description}
                onChange={set("description")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Problem Solved</Label>
              <Textarea
                placeholder="What specific problem does this address? (optional)"
                rows={2}
                value={form.problemSolved}
                onChange={set("problemSolved")}
              />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
