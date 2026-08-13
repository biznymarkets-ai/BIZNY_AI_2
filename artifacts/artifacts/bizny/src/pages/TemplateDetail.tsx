import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetTemplate,
  useGetTemplateStatus,
  useGetTemplateExecutions,
  useFollowTemplate,
  useUnfollowTemplate,
  useSaveTemplate,
  useUnsaveTemplate,
  useAdoptTemplate,
  useForkTemplate,
  getListTemplatesQueryKey,
  getGetTemplateQueryKey,
  getGetTemplateStatusQueryKey,
  getGetTemplateExecutionsQueryKey,
  getListExecutionInstancesQueryKey,
} from "@workspace/api-client-react";
import type { VentureTemplate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Clock, Users, GitFork, Bookmark, BookmarkCheck,
  Star, CheckCircle2, AlertTriangle, Wrench, Package, Target,
  Loader2, ArrowRight, UserCheck, Layers, MapPin,
  Briefcase, Cog, Leaf, BookOpen, Globe, ClipboardList,
  Lightbulb, Beaker, FlaskConical, FolderOpen,
} from "lucide-react";

const TEMPLATE_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  business_model:        { label: "Business Model",       icon: <Briefcase className="h-4 w-4" />,    color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800" },
  engineering_design:    { label: "Engineering Design",   icon: <Cog className="h-4 w-4" />,          color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
  manufacturing_process: { label: "Manufacturing Process",icon: <Layers className="h-4 w-4" />,       color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  agricultural_system:   { label: "Agricultural System",  icon: <Leaf className="h-4 w-4" />,         color: "text-green-600 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" },
  research_framework:    { label: "Research Framework",   icon: <BookOpen className="h-4 w-4" />,     color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800" },
  community_solution:    { label: "Community Solution",   icon: <Globe className="h-4 w-4" />,        color: "text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800" },
  operational_procedure: { label: "Operational Procedure",icon: <ClipboardList className="h-4 w-4" />,color: "text-slate-600 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800" },
  playbook:              { label: "Playbook",             icon: <ClipboardList className="h-4 w-4" />,color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  experiment:            { label: "Experiment",           icon: <Beaker className="h-4 w-4" />,       color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800" },
  innovation_concept:    { label: "Innovation Concept",   icon: <Lightbulb className="h-4 w-4" />,    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800" },
  project:               { label: "Project",              icon: <FlaskConical className="h-4 w-4" />, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800" },
};

function getTypeConfig(type?: string) {
  return TEMPLATE_TYPES[type ?? "business_model"] ?? TEMPLATE_TYPES["business_model"];
}

type TabKey = "overview" | "milestones" | "resources" | "risks" | "executions";

export default function TemplateDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id ?? "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [adoptOpen, setAdoptOpen] = useState(false);
  const [adoptTitle, setAdoptTitle] = useState("");
  const [adoptType, setAdoptType] = useState("venture");
  const [adoptLocation, setAdoptLocation] = useState("");

  const { data: template, isLoading } = useGetTemplate(id, {
    query: { queryKey: getGetTemplateQueryKey(id), enabled: !!id }
  });
  const { data: status } = useGetTemplateStatus(id, {
    query: { queryKey: getGetTemplateStatusQueryKey(id), enabled: !!id }
  });
  const { data: executions } = useGetTemplateExecutions(id, {
    query: { queryKey: getGetTemplateExecutionsQueryKey(id), enabled: !!id }
  });

  const followMutation = useFollowTemplate();
  const unfollowMutation = useUnfollowTemplate();
  const saveMutation = useSaveTemplate();
  const unsaveMutation = useUnsaveTemplate();
  const adoptMutation = useAdoptTemplate();
  const forkMutation = useForkTemplate();

  const invalidateStatus = () => {
    queryClient.invalidateQueries({ queryKey: getGetTemplateStatusQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
  };

  const handleFollow = () => {
    if (status?.isFollowing) {
      unfollowMutation.mutate({ id }, { onSuccess: () => { invalidateStatus(); toast({ description: "Unfollowed template." }); } });
    } else {
      followMutation.mutate({ id }, { onSuccess: () => { invalidateStatus(); toast({ description: "Following template." }); } });
    }
  };

  const handleSave = () => {
    if (status?.isSaved) {
      unsaveMutation.mutate({ id }, { onSuccess: () => { invalidateStatus(); toast({ description: "Removed from saved." }); } });
    } else {
      saveMutation.mutate({ id }, { onSuccess: () => { invalidateStatus(); toast({ description: "Template saved." }); } });
    }
  };

  const handleAdopt = () => {
    if (!template) return;
    adoptMutation.mutate(
      { id, data: { title: adoptTitle || template.title, instanceType: adoptType, country: adoptLocation || undefined } },
      {
        onSuccess: (instance) => {
          toast({ title: "Execution started!", description: "Track your progress in My Executions." });
          queryClient.invalidateQueries({ queryKey: getListExecutionInstancesQueryKey() });
          setAdoptOpen(false);
          navigate("/executions");
        },
        onError: () => toast({ variant: "destructive", description: "Failed to adopt template." }),
      }
    );
  };

  const handleFork = () => {
    forkMutation.mutate(
      { id, data: {} },
      {
        onSuccess: () => {
          toast({ description: "Template forked to your drafts." });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        <div className="h-48 bg-muted animate-pulse rounded-2xl" />
        <div className="h-8 bg-muted animate-pulse rounded-full w-2/3" />
        <div className="h-4 bg-muted animate-pulse rounded-full w-full" />
        <div className="h-4 bg-muted animate-pulse rounded-full w-5/6" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Template not found.</p>
        <Button variant="link" onClick={() => navigate("/templates")}>Back to Repository</Button>
      </div>
    );
  }

  const typeConfig = getTypeConfig(template.templateType);
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "milestones", label: `Milestones (${template.milestones?.length ?? 0})` },
    { key: "resources", label: "Resources" },
    { key: "risks", label: "Risk Factors" },
    { key: "executions", label: `Executions (${executions?.length ?? 0})` },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      {/* Back */}
      <button onClick={() => navigate("/templates")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ChevronLeft className="h-4 w-4" /> Repository
      </button>

      {/* Hero */}
      {template.coverImageUrl ? (
        <div className="h-52 w-full rounded-2xl overflow-hidden mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
          <img src={template.coverImageUrl} className="w-full h-full object-cover" alt={template.title} />
        </div>
      ) : (
        <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl border border-primary/20 bg-background flex items-center justify-center text-primary">
            {typeConfig.icon}
          </div>
        </div>
      )}

      {/* Title + meta */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${typeConfig.color}`}>
          {typeConfig.icon} {typeConfig.label}
        </span>
        <Badge variant="outline">{template.industry}</Badge>
        {template.difficulty && (
          <Badge variant="outline" className="capitalize">{template.difficulty}</Badge>
        )}
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {template.durationDays} days
        </Badge>
      </div>

      <h1 className="text-xl font-bold font-display tracking-tight mb-2">{template.title}</h1>
      <p className="text-muted-foreground mb-5 leading-relaxed">{template.description}</p>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border">
        <Button onClick={() => setAdoptOpen(true)} className="gap-2">
          <ArrowRight className="h-4 w-4" /> Adopt Template
        </Button>
        <Button variant="outline" onClick={handleFork} disabled={forkMutation.isPending} className="gap-2">
          <GitFork className="h-4 w-4" />
          {forkMutation.isPending ? "Forking…" : "Fork"}
        </Button>
        <Button
          variant={status?.isFollowing ? "default" : "outline"}
          onClick={handleFollow}
          disabled={followMutation.isPending || unfollowMutation.isPending}
          className="gap-2"
        >
          <Star className="h-4 w-4" />
          {status?.isFollowing ? "Following" : "Follow"}
          {(template.followCount ?? 0) > 0 && <span className="opacity-70">({template.followCount})</span>}
        </Button>
        <Button
          variant={status?.isSaved ? "default" : "outline"}
          size="icon"
          onClick={handleSave}
          disabled={saveMutation.isPending || unsaveMutation.isPending}
          title={status?.isSaved ? "Unsave" : "Save"}
        >
          {status?.isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Adoptions", value: template.adoptionCount ?? template.useCount ?? 0, icon: <Users className="h-4 w-4" /> },
          { label: "Forks", value: template.forkCount ?? template.cloneCount ?? 0, icon: <GitFork className="h-4 w-4" /> },
          { label: "Followers", value: template.followCount ?? 0, icon: <Star className="h-4 w-4" /> },
          { label: "Skills required", value: template.requiredSkills?.length ?? 0, icon: <UserCheck className="h-4 w-4" /> },
          { label: "Milestones", value: template.milestones?.length ?? 0, icon: <Target className="h-4 w-4" /> },
        ].map((s) => (
          <div key={s.label} className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
            <div className="flex justify-center text-primary mb-1">{s.icon}</div>
            <div className="text-xl font-bold font-display">{s.value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-5">
        {activeTab === "overview" && (
          <div className="space-y-5">
            {template.problemSolved && (
              <div className="bg-muted/30 border border-border/60 rounded-xl p-5">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Problem Solved</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{template.problemSolved}</p>
              </div>
            )}
            {(template.expectedOutputs?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Expected Outputs</h3>
                <ul className="space-y-1.5">
                  {template.expectedOutputs?.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(template.tags?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-bold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags?.map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-3">
            {(template.milestones?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No milestones defined.</p>
            ) : (
              template.milestones?.map((m: { day?: number; title: string; description?: string }, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {m.day ?? (i + 1)}
                    </div>
                    {i < (template.milestones?.length ?? 1) - 1 && <div className="w-0.5 flex-1 bg-border/60 mt-1" />}
                  </div>
                  <div className="bg-muted/30 border border-border/60 rounded-xl p-4 mb-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {m.day && <span className="text-xs font-bold text-primary">Day {m.day}</span>}
                      <span className="font-semibold text-sm">{m.title}</span>
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Required Skills", items: template.requiredSkills ?? [], icon: <UserCheck className="h-4 w-4 text-primary" /> },
              { label: "Required Tools", items: template.requiredTools ?? [], icon: <Wrench className="h-4 w-4 text-primary" /> },
              { label: "Required Resources", items: template.requiredResources ?? [], icon: <Package className="h-4 w-4 text-primary" /> },
            ].map((s) => (
              <div key={s.label} className="bg-muted/30 border border-border/60 rounded-xl p-4">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">{s.icon} {s.label}</h4>
                {s.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None listed.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {s.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "risks" && (
          <div className="space-y-2">
            {(template.riskFactors?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No risk factors listed.</p>
            ) : (
              template.riskFactors?.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{r}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "executions" && (
          <div className="space-y-3">
            {(executions?.length ?? 0) === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl">
                <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm mb-3">No public executions yet.</p>
                <Button size="sm" onClick={() => setAdoptOpen(true)} className="gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" /> Be the first to adopt
                </Button>
              </div>
            ) : (
              executions?.map((ex) => (
                <div key={ex.id} className="flex items-center gap-4 p-4 bg-muted/30 border border-border/60 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{ex.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{ex.instanceType}</span>
                      {ex.country && <><span>·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ex.country}</span></>}
                      {ex.startDate && <><span>·</span><span>Started {new Date(ex.startDate).toLocaleDateString()}</span></>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{ex.progressPercent}%</div>
                      <div className="text-xs text-muted-foreground capitalize">{ex.status}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Adopt dialog */}
      <Dialog open={adoptOpen} onOpenChange={(o) => !o && setAdoptOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adopt Template</DialogTitle>
            <DialogDescription>Start executing <strong>{template.title}</strong>. This creates a tracked Execution Instance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Execution title</Label>
              <Input placeholder={template.title} value={adoptTitle} onChange={(e) => setAdoptTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Execution type</Label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" value={adoptType} onChange={(e) => setAdoptType(e.target.value)}>
                <option value="venture">Venture</option>
                <option value="project">Project</option>
                <option value="experiment">Experiment</option>
                <option value="community_initiative">Community Initiative</option>
                <option value="research">Research</option>
                <option value="operational_run">Operational Run</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Location (optional)</Label>
              <Input placeholder="e.g. Lagos, Nigeria" value={adoptLocation} onChange={(e) => setAdoptLocation(e.target.value)} />
            </div>
            <Button onClick={handleAdopt} disabled={adoptMutation.isPending} className="w-full">
              {adoptMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Start Execution
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
