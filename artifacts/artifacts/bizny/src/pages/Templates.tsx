import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListTemplates,
  getListTemplatesQueryKey,
  useAdoptTemplate,
  useForkTemplate,
  useFollowTemplate,
  useSaveTemplate,
  useCreateTemplate,
  getListExecutionInstancesQueryKey,
} from "@workspace/api-client-react";
import type { VentureTemplate } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, Clock, Users, GitFork, Bookmark, Eye,
  Briefcase, FlaskConical, Cog, Leaf, BookOpen, Globe,
  ClipboardList, Lightbulb, Beaker, Layers,
  ArrowRight, Star, Loader2, Filter, ChevronRight,
  CheckCircle2, Circle, Trash2, X,
} from "lucide-react";

// ─── Template type config ─────────────────────────────────────────────────────

const TEMPLATE_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string; dot: string }> = {
  business_model:        { label: "Business Model",       icon: <Briefcase className="h-3.5 w-3.5" />,    color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",    dot: "bg-slate-500" },
  sop:                   { label: "SOP",                  icon: <ClipboardList className="h-3.5 w-3.5" />, color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",  dot: "bg-slate-500" },
  guide:                 { label: "Guide",                icon: <BookOpen className="h-3.5 w-3.5" />,     color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",    dot: "bg-blue-500" },
  blueprint:             { label: "Blueprint",            icon: <Layers className="h-3.5 w-3.5" />,       color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  playbook:              { label: "Playbook",             icon: <ClipboardList className="h-3.5 w-3.5" />,color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",  dot: "bg-amber-500" },
  engineering_design:    { label: "Engineering Design",   icon: <Cog className="h-3.5 w-3.5" />,          color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",    dot: "bg-blue-500" },
  manufacturing_process: { label: "Manufacturing",        icon: <Layers className="h-3.5 w-3.5" />,       color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  agricultural_system:   { label: "Agricultural System",  icon: <Leaf className="h-3.5 w-3.5" />,         color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",  dot: "bg-green-500" },
  research_framework:    { label: "Research",             icon: <BookOpen className="h-3.5 w-3.5" />,     color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  community_solution:    { label: "Community Solution",   icon: <Globe className="h-3.5 w-3.5" />,        color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",     dot: "bg-pink-500" },
  operational_procedure: { label: "Procedure",            icon: <ClipboardList className="h-3.5 w-3.5" />,color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",  dot: "bg-slate-500" },
  experiment:            { label: "Experiment",           icon: <Beaker className="h-3.5 w-3.5" />,       color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",     dot: "bg-cyan-500" },
  innovation_concept:    { label: "Innovation Concept",   icon: <Lightbulb className="h-3.5 w-3.5" />,    color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  project:               { label: "Project",              icon: <FlaskConical className="h-3.5 w-3.5" />, color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  initiative:            { label: "Initiative",           icon: <Globe className="h-3.5 w-3.5" />,        color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",     dot: "bg-rose-500" },
};

const TYPE_ALL = "__all__";

function getTypeConfig(type?: string) {
  return TEMPLATE_TYPES[type ?? "business_model"] ?? TEMPLATE_TYPES["business_model"];
}

function TypeBadge({ type }: { type?: string }) {
  const cfg = getTypeConfig(type);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Adopt dialog ─────────────────────────────────────────────────────────────

function AdoptDialog({ template, open, onClose }: { template: VentureTemplate | null; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [instanceType, setInstanceType] = useState("venture");
  const [location, setLocation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adoptMutation = useAdoptTemplate();

  const milestoneCount = (template?.milestones as unknown[])?.length ?? 0;

  const handleAdopt = () => {
    if (!template) return;
    adoptMutation.mutate(
      { id: template.id, data: { title: title || template.title, instanceType, country: location || undefined } },
      {
        onSuccess: () => {
          toast({
            title: "Execution started",
            description: `${milestoneCount} milestones inherited. Track your progress in My Executions.`,
          });
          queryClient.invalidateQueries({ queryKey: getListExecutionInstancesQueryKey() });
          setTitle(""); setLocation(""); onClose();
        },
        onError: () => toast({ variant: "destructive", description: "Failed to adopt template." }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Use This Template
          </DialogTitle>
          <DialogDescription>
            Creates a personal Execution with all {milestoneCount} milestones from <strong>{template?.title}</strong> already loaded.
          </DialogDescription>
        </DialogHeader>
        {milestoneCount > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">What gets inherited automatically:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>{milestoneCount} milestones with evidence requirements</li>
              <li>Required resources and tools</li>
              <li>Industry and sector tags</li>
              <li>Estimated timeline: {template?.durationDays} days</li>
            </ul>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Give your execution a name</Label>
            <Input placeholder={template?.title ?? "My execution"} value={title} onChange={(e) => setTitle(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Leave blank to use the template name</p>
          </div>
          <div className="space-y-1.5">
            <Label>Execution type</Label>
            <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" value={instanceType} onChange={(e) => setInstanceType(e.target.value)}>
              <option value="venture">Venture</option>
              <option value="project">Project</option>
              <option value="experiment">Experiment</option>
              <option value="community_initiative">Community Initiative</option>
              <option value="research">Research</option>
              <option value="operational_run">Operational Run</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Your location (optional)</Label>
            <Input placeholder="e.g. Enugu, Nigeria" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <Button onClick={handleAdopt} disabled={adoptMutation.isPending} className="w-full gap-2">
            {adoptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Start My Execution
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Multi-step Create Template Modal ────────────────────────────────────────

type MilestoneInput = { title: string; description: string; evidenceRequired: boolean; evidenceTypes: string[] };

const EVIDENCE_TYPE_OPTIONS = ["Photo", "Video", "Audio", "Text Report", "Receipt", "Document"];

function CreateTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1 — Identity
  const [title, setTitle] = useState("");
  const [templateType, setTemplateType] = useState("business_model");
  const [industry, setIndustry] = useState("");
  const [subIndustry, setSubIndustry] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [description, setDescription] = useState("");
  const [problemSolved, setProblemSolved] = useState("");

  // Step 2 — Milestones
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { title: "", description: "", evidenceRequired: true, evidenceTypes: ["Photo"] },
  ]);
  const [newMilestone, setNewMilestone] = useState("");

  // Step 3 — Resources
  const [durationDays, setDurationDays] = useState("30");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [toolsInput, setToolsInput] = useState("");
  const [requiredTools, setRequiredTools] = useState<string[]>([]);
  const [resourcesInput, setResourcesInput] = useState("");
  const [requiredResources, setRequiredResources] = useState<string[]>([]);
  const [expectedOutputsInput, setExpectedOutputsInput] = useState("");
  const [expectedOutputs, setExpectedOutputs] = useState<string[]>([]);
  const [riskInput, setRiskInput] = useState("");
  const [riskFactors, setRiskFactors] = useState<string[]>([]);

  // Step 4 — Publish
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateTemplate();

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones(prev => [...prev, { title: newMilestone.trim(), description: "", evidenceRequired: true, evidenceTypes: ["Photo"] }]);
    setNewMilestone("");
  };
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: keyof MilestoneInput, value: unknown) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };
  const toggleEvidenceType = (i: number, type: string) => {
    setMilestones(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const has = m.evidenceTypes.includes(type);
      return { ...m, evidenceTypes: has ? m.evidenceTypes.filter(t => t !== type) : [...m.evidenceTypes, type] };
    }));
  };

  const addTag = (input: string, setter: (v: string[]) => void, current: string[], clearFn: () => void) => {
    const val = input.trim();
    if (!val || current.includes(val)) return;
    setter([...current, val]);
    clearFn();
  };

  const handlePublish = () => {
    if (!title.trim() || !industry.trim() || !description.trim()) {
      toast({ variant: "destructive", description: "Title, industry and description are required." });
      return;
    }
    const validMilestones = milestones.filter(m => m.title.trim());
    createMutation.mutate(
      {
        data: {
          title: title.trim(),
          industry: industry.trim(),
          subIndustry: subIndustry.trim() || undefined,
          description: description.trim(),
          problemSolved: problemSolved.trim() || undefined,
          estimatedTimeline: `${durationDays} days`,
          durationDays: parseInt(durationDays) || 30,
          estimatedStartupCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
          templateType,
          difficulty,
          milestones: validMilestones.map(m => ({
            title: m.title,
            description: m.description || undefined,
            evidenceRequired: m.evidenceRequired,
            evidenceTypes: m.evidenceTypes,
          })),
          requiredTools,
          requiredResources,
          expectedOutputs,
          riskFactors,
          visibility,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Template published", description: "Your template is now in the Library." });
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          onClose();
          // Reset
          setStep(1); setTitle(""); setIndustry(""); setDescription("");
          setMilestones([{ title: "", description: "", evidenceRequired: true, evidenceTypes: ["Photo"] }]);
        },
        onError: () => toast({ variant: "destructive", description: "Failed to publish template." }),
      }
    );
  };

  const canNext = () => {
    if (step === 1) return title.trim().length > 0 && industry.trim().length > 0 && description.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary" />
            <DialogTitle>Add to Library</DialogTitle>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
            <span className="text-[11px] text-muted-foreground ml-1 shrink-0">Step {step} of {TOTAL_STEPS}</span>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="font-semibold text-sm mb-3">What are you documenting?</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Palm Oil Processing — Small Scale" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" value={templateType} onChange={e => setTemplateType(e.target.value)}>
                      {Object.entries(TEMPLATE_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Difficulty</Label>
                    <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Specific industry or activity <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Pepper Drying, Water Turbine Fabrication, Paper Recycling" value={industry} onChange={e => setIndustry(e.target.value)} />
                  <p className="text-[11px] text-muted-foreground">Use specific terms, not broad sectors.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub-industry (optional)</Label>
                  <Input placeholder="e.g. Solar-powered drying, Local market" value={subIndustry} onChange={e => setSubIndustry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="What is this template, and who is it for? What does it help someone do?" value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Problem it solves (optional)</Label>
                  <Textarea placeholder="What challenge does this template address?" value={problemSolved} onChange={e => setProblemSolved(e.target.value)} className="min-h-[60px]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="font-semibold text-sm mb-0.5">Milestones</h3>
              <p className="text-xs text-muted-foreground mb-3">Break the process into steps. Each milestone can require evidence before marking complete.</p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {milestones.map((m, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                      <Input
                        className="flex-1 h-8 text-sm"
                        placeholder={`Milestone ${i + 1} title`}
                        value={m.title}
                        onChange={e => updateMilestone(i, "title", e.target.value)}
                      />
                      <button onClick={() => removeMilestone(i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Description (optional)"
                      value={m.description}
                      onChange={e => updateMilestone(i, "description", e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateMilestone(i, "evidenceRequired", !m.evidenceRequired)}
                        className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${m.evidenceRequired ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {m.evidenceRequired ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        Evidence required
                      </button>
                      {m.evidenceRequired && (
                        <div className="flex gap-1 flex-wrap ml-2">
                          {EVIDENCE_TYPE_OPTIONS.map(type => (
                            <button
                              key={type}
                              onClick={() => toggleEvidenceType(i, type)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${m.evidenceTypes.includes(type) ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border text-muted-foreground hover:border-primary/40"}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <Input
                  className="h-8 text-sm"
                  placeholder="Add a milestone…"
                  value={newMilestone}
                  onChange={e => setNewMilestone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addMilestone()}
                />
                <Button size="sm" variant="outline" onClick={addMilestone} className="h-8 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{milestones.filter(m => m.title).length} milestone(s) added. Press Enter to add quickly.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-1">
            <h3 className="font-semibold text-sm mb-0">Resources & Setup</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input type="number" min="1" placeholder="30" value={durationDays} onChange={e => setDurationDays(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Est. startup cost (₦)</Label>
                <Input type="number" min="0" placeholder="e.g. 500000" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} />
              </div>
            </div>
            {[
              { label: "Required tools / equipment", input: toolsInput, setInput: setToolsInput, list: requiredTools, setList: setRequiredTools, placeholder: "e.g. Tray dryer, Weighing scale" },
              { label: "Required resources / materials", input: resourcesInput, setInput: setResourcesInput, list: requiredResources, setList: setRequiredResources, placeholder: "e.g. Raw pepper, Packaging bags" },
              { label: "Expected outputs", input: expectedOutputsInput, setInput: setExpectedOutputsInput, list: expectedOutputs, setList: setExpectedOutputs, placeholder: "e.g. 200kg dried pepper per batch" },
              { label: "Risk factors", input: riskInput, setInput: setRiskInput, list: riskFactors, setList: setRiskFactors, placeholder: "e.g. Market price fluctuation" },
            ].map(({ label, input, setInput, list, setList, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <Input className="h-8 text-sm" placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { addTag(input, setList, list, () => setInput("")); } }} />
                  <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => addTag(input, setList, list, () => setInput(""))}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {list.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {list.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full px-2 py-0.5 border border-border">
                        {item}
                        <button onClick={() => setList(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 pt-1">
            <h3 className="font-semibold text-sm mb-0">Review & Publish</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm border border-border">
              <p><strong>{title}</strong></p>
              <p className="text-muted-foreground text-xs">{description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <TypeBadge type={templateType} />
                <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full">{industry}</span>
                <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full capitalize">{difficulty}</span>
                <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full">{milestones.filter(m => m.title).length} milestones</span>
                <span className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full">{durationDays} days</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated, optional)</Label>
              <Input placeholder="e.g. agriculture, processing, Nigeria" value={tags} onChange={e => setTags(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "public", label: "Public", sub: "Anyone can find and use this" }, { v: "draft", label: "Draft", sub: "Only you can see it" }].map(({ v, label, sub }) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`p-3 border rounded-lg text-left transition-all ${visibility === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border mt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1 gap-1.5">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={createMutation.isPending} className="flex-1 gap-1.5">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              Publish to Library
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ template, onAdopt }: { template: VentureTemplate; onAdopt: (t: VentureTemplate) => void }) {
  const { toast } = useToast();
  const followMutation = useFollowTemplate();
  const saveMutation = useSaveTemplate();
  const forkMutation = useForkTemplate();
  const queryClient = useQueryClient();

  const milestoneCount = (template.milestones as unknown[])?.length ?? 0;

  const handleFork = (e: React.MouseEvent) => {
    e.preventDefault();
    forkMutation.mutate(
      { id: template.id, data: {} },
      { onSuccess: () => { toast({ description: "Template forked to your drafts." }); queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() }); } }
    );
  };
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    saveMutation.mutate({ id: template.id }, { onSuccess: () => toast({ description: "Template saved." }) });
  };

  return (
    <Card className="flex flex-col overflow-hidden hover:border-primary/40 transition-all hover:shadow-md group border-border/70">
      {template.coverImageUrl ? (
        <div className="h-32 overflow-hidden bg-muted">
          <img src={template.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={template.title} />
        </div>
      ) : (
        <div className="h-28 flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 group-hover:from-primary/5 group-hover:to-primary/10 transition-colors">
          <div className="w-10 h-10 rounded-xl border border-border/50 bg-background flex items-center justify-center text-primary">
            {getTypeConfig(template.templateType).icon}
          </div>
        </div>
      )}

      <CardContent className="flex-1 p-4 pb-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <TypeBadge type={template.templateType} />
          {template.difficulty && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5 capitalize">
              {template.difficulty}
            </span>
          )}
        </div>

        <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
          {template.title}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {template.description}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {template.durationDays}d</span>
          {milestoneCount > 0 && (
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {milestoneCount} steps</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {template.adoptionCount ?? 0} used</span>
          <span className="flex items-center gap-1 ml-auto text-[10px] font-medium truncate max-w-[80px]">{template.industry}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex gap-1.5">
        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => { e.preventDefault(); onAdopt(template); }}>
          <ArrowRight className="h-3.5 w-3.5" /> Use Template
        </Button>
        <Link href={`/templates/${template.id}`}>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="View details">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Fork" onClick={handleFork} disabled={forkMutation.isPending}>
          <GitFork className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Save" onClick={handleSave}>
          <Bookmark className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Library page ─────────────────────────────────────────────────────────────

export default function Library() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>(TYPE_ALL);
  const [adoptTarget, setAdoptTarget] = useState<VentureTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: templates, isLoading } = useListTemplates(undefined, {
    query: { queryKey: getListTemplatesQueryKey() }
  });

  const filtered = useMemo(() => {
    let rows = templates ?? [];
    if (selectedType !== TYPE_ALL) rows = rows.filter(t => (t.templateType ?? "business_model") === selectedType);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.industry.toLowerCase().includes(q) ||
        (t.tags ?? []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [templates, selectedType, search]);

  const typeCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of templates ?? []) {
      const key = t.templateType ?? "business_model";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [templates]);

  const totalAdoptions = (templates ?? []).reduce((s, t) => s + (t.adoptionCount ?? t.useCount ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold font-display tracking-tight">Library</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Proven templates, SOPs, guides, and blueprints — discover, adopt, and replicate what works.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/executions">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> My Executions
            </Button>
          </Link>
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add to Library
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      {!isLoading && (templates?.length ?? 0) > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
          <span><strong className="text-foreground font-bold">{templates?.length ?? 0}</strong> templates</span>
          <span><strong className="text-foreground font-bold">{totalAdoptions}</strong> adoptions</span>
          <span><strong className="text-foreground font-bold">{Object.keys(typeCount).length}</strong> types</span>
        </div>
      )}

      {/* Search + type filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-10" placeholder="Search Library by title, industry, or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType(TYPE_ALL)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedType === TYPE_ALL ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
          >
            All ({templates?.length ?? 0})
          </button>
          {Object.entries(TEMPLATE_TYPES).map(([key, cfg]) => {
            const count = typeCount[key] ?? 0;
            if (count === 0 && selectedType !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedType === key ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}
              >
                {cfg.icon} {cfg.label} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="h-72 overflow-hidden">
              <div className="h-28 bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded-full w-24" />
                <div className="h-5 bg-muted animate-pulse rounded-full w-4/5" />
                <div className="h-3 bg-muted animate-pulse rounded-full w-full" />
                <div className="h-3 bg-muted animate-pulse rounded-full w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-card/40">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-1">
            {search || selectedType !== TYPE_ALL ? "Nothing matches your filters" : "Library is empty"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search || selectedType !== TYPE_ALL
              ? "Try different search terms or browse all types."
              : "Be the first to contribute a template, SOP, or guide."}
          </p>
          <div className="flex items-center justify-center gap-2">
            {(search || selectedType !== TYPE_ALL) && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedType(TYPE_ALL); }}>
                Clear filters
              </Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add to Library
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => (
            <TemplateCard key={t.id} template={t} onAdopt={() => setAdoptTarget(t)} />
          ))}
        </div>
      )}

      <AdoptDialog template={adoptTarget} open={!!adoptTarget} onClose={() => setAdoptTarget(null)} />
      <CreateTemplateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
