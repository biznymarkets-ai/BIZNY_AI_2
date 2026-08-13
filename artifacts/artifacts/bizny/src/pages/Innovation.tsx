import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Lightbulb, Trophy, Search, Plus, Heart, MessageSquare,
  Users, Star, TrendingUp, Rocket, ArrowRight, Globe,
  MapPin, Factory, Clock, X as XIcon, Loader2, BookOpen,
  Zap, ChevronRight, Filter, Target, Award, FlaskConical,
  Bookmark, Share2, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { INDUSTRY_SECTORS, AFRICAN_COUNTRIES, SPECIFIC_ACTIVITIES } from "@/lib/countries";

type InnovationType = "idea" | "challenge" | "research" | "problem" | "solution_request";

interface Innovation {
  id: number;
  title: string;
  description: string;
  innovationType: InnovationType;
  author?: { id: number; name: string; role?: string; avatarUrl?: string };
  industry?: string;
  subIndustry?: string;
  activityTag?: string;
  country?: string;
  stateCity?: string;
  expectedOutcome?: string;
  reward?: string;
  deadline?: string;
  requiredSkills?: string[];
  requiredCollaborators?: string[];
  tags?: string[];
  mediaUrls?: string[];
  status: string;
  loves: number;
  comments: number;
  solutionsCount: number;
  isFollowing?: boolean;
  hasLoved?: boolean;
  createdAt: string;
}

const TYPE_META: Record<InnovationType, { label: string; icon: React.ReactNode; color: string; bg: string; description: string }> = {
  idea:             { label: "Innovation Idea",    icon: <Lightbulb className="h-3.5 w-3.5" />, color: "text-amber-600",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",   description: "A new idea ready for discussion" },
  challenge:        { label: "Challenge",          icon: <Trophy className="h-3.5 w-3.5" />,    color: "text-violet-600",  bg: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800", description: "A problem seeking solutions" },
  research:         { label: "Research Request",   icon: <FlaskConical className="h-3.5 w-3.5" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",     description: "Research collaboration needed" },
  problem:          { label: "Problem Statement",  icon: <Target className="h-3.5 w-3.5" />,    color: "text-red-600",     bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",           description: "An unsolved industrial problem" },
  solution_request: { label: "Solution Request",   icon: <Zap className="h-3.5 w-3.5" />,       color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800", description: "Requesting a specific solution" },
};

function TypeBadge({ type }: { type: InnovationType }) {
  const meta = TYPE_META[type] ?? TYPE_META.idea;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
      {meta.icon}{meta.label}
    </span>
  );
}

async function apiFetch(path: string, token?: string | null, method = "GET", body?: any) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

function useInnovations(params?: Record<string, string>) {
  const { token } = useAuth();
  const [data, setData] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    apiFetch(`/innovations${qs}`, token)
      .then(d => setData(d ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, reload: load };
}

function InnovationCard({ innovation, onReact, onFollow, onViewSolutions, token }: {
  innovation: Innovation;
  onReact: (id: number) => void;
  onFollow: (id: number) => void;
  onViewSolutions: (innovation: Innovation) => void;
  token?: string | null;
}) {
  const [, navigate] = useLocation();
  const meta = TYPE_META[innovation.innovationType] ?? TYPE_META.idea;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0 border border-gray-100 dark:border-gray-700">
            <AvatarImage src={innovation.author?.avatarUrl || ""} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {innovation.author?.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{innovation.author?.name}</span>
              <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(innovation.createdAt))} ago</span>
            </div>
            <TypeBadge type={innovation.innovationType} />
          </div>
        </div>

        <h3 className="font-display font-bold text-base text-foreground mt-3 leading-tight">{innovation.title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">{innovation.description}</p>

        {/* Stamps */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {innovation.industry && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
              <Factory className="h-2.5 w-2.5" />{innovation.industry}
            </span>
          )}
          {innovation.activityTag && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {innovation.activityTag}
            </span>
          )}
          {(innovation.stateCity || innovation.country) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              <MapPin className="h-2.5 w-2.5" />{[innovation.stateCity, innovation.country].filter(Boolean).join(", ")}
            </span>
          )}
          {(innovation.tags ?? []).slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{t}</span>
          ))}
        </div>

        {/* Challenge extras */}
        {innovation.innovationType === "challenge" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {innovation.reward && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Reward</p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{innovation.reward}</p>
              </div>
            )}
            {innovation.deadline && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Deadline</p>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">{innovation.deadline}</p>
              </div>
            )}
          </div>
        )}

        {innovation.expectedOutcome && (
          <div className="mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Expected Outcome</p>
            <p className="text-xs text-foreground/80 line-clamp-2">{innovation.expectedOutcome}</p>
          </div>
        )}

        {(innovation.requiredSkills ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(innovation.requiredSkills ?? []).slice(0, 4).map(s => (
              <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">{s}</span>
            ))}
            {(innovation.requiredSkills?.length ?? 0) > 4 && (
              <span className="text-[10px] text-muted-foreground">+{(innovation.requiredSkills?.length ?? 0) - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Media previews */}
      {(innovation.mediaUrls ?? []).length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-1.5 ${(innovation.mediaUrls?.length ?? 0) === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {(innovation.mediaUrls ?? []).slice(0, 4).map((url, i) => (
              url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                ? <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-48" />
                : null
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-gray-50 dark:border-gray-800">
        <button
          onClick={() => onReact(innovation.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            innovation.hasLoved ? "bg-red-50 text-red-500 dark:bg-red-950/30" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <Heart className={`h-4 w-4 ${innovation.hasLoved ? "fill-current" : ""}`} />
          {innovation.loves > 0 && <span>{innovation.loves}</span>}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
          <MessageSquare className="h-4 w-4" />
          {innovation.comments > 0 && <span>{innovation.comments}</span>}
        </button>

        {(innovation.innovationType === "challenge" || innovation.innovationType === "problem" || innovation.innovationType === "solution_request") && (
          <button
            onClick={() => onViewSolutions(innovation)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            {innovation.solutionsCount > 0 ? `${innovation.solutionsCount} Solutions` : "Submit Solution"}
          </button>
        )}

        {innovation.innovationType === "idea" && (
          <button
            onClick={() => navigate("/ventures/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
          >
            <Rocket className="h-3.5 w-3.5" /> Start Project
          </button>
        )}

        <button
          onClick={() => onFollow(innovation.id)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            innovation.isFollowing
              ? "text-primary bg-primary/10 border border-primary/20"
              : "text-gray-400 hover:text-primary hover:bg-primary/5"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${innovation.isFollowing ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  );
}

function SolutionsSheet({ innovation, onClose, token }: { innovation: Innovation | null; onClose: () => void; token?: string | null }) {
  const { toast } = useToast();
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSolutions = async () => {
    if (!innovation) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/innovations/${innovation.id}/solutions`, token);
      setSolutions(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (innovation) loadSolutions(); }, [innovation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !innovation) return;
    setSubmitting(true);
    try {
      const sol = await apiFetch(`/innovations/${innovation.id}/solutions`, token, "POST", { title, content });
      setSolutions(prev => [sol, ...prev]);
      setTitle(""); setContent("");
      toast({ description: "Solution submitted!" });
    } catch {
      toast({ variant: "destructive", description: "Failed to submit solution." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={!!innovation} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-display font-bold text-base text-foreground">Solutions</h2>
            {innovation && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{innovation.title}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Submit form */}
          {token && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-semibold text-foreground">Submit your solution</p>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Solution title" className="text-sm" />
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe your approach, method, or solution…" className="text-sm resize-none" rows={4} />
              <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || submitting} className="w-full rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Solution
              </Button>
            </div>
          )}

          {/* Solutions list */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : solutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No solutions yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solutions.map(sol => (
                <div key={sol.id} className="rounded-xl border border-border bg-white dark:bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={sol.author?.avatarUrl || ""} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{sol.author?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-xs font-semibold text-foreground">{sol.author?.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{formatDistanceToNow(new Date(sol.createdAt))} ago</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{sol.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sol.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewInnovationSheet({ open, onClose, onCreated, token }: { open: boolean; onClose: () => void; onCreated: () => void; token?: string | null }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [innovationType, setInnovationType] = useState<InnovationType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [activityTag, setActivityTag] = useState("");
  const [country, setCountry] = useState("");
  const [stateCity, setStateCity] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const activities = industry ? (SPECIFIC_ACTIVITIES[industry] ?? []) : [];
  const isChallenge = innovationType === "challenge" || innovationType === "problem" || innovationType === "solution_request";

  const resetForm = () => {
    setStep(1); setInnovationType("idea"); setTitle(""); setDescription("");
    setIndustry(""); setActivityTag(""); setCountry(""); setStateCity("");
    setExpectedOutcome(""); setReward(""); setDeadline(""); setRequiredSkills([]); setTags([]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/innovations", token, "POST", {
        title, description, innovationType, industry: industry || undefined,
        activityTag: activityTag || undefined, country: country || undefined,
        stateCity: stateCity || undefined, expectedOutcome: expectedOutcome || undefined,
        reward: reward || undefined, deadline: deadline || undefined,
        requiredSkills: requiredSkills.length > 0 ? requiredSkills : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast({ description: "Innovation published!" });
      resetForm();
      onCreated();
      onClose();
    } catch {
      toast({ variant: "destructive", description: "Failed to publish." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { onClose(); } }}>
      <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-display font-bold text-base text-foreground">Publish Innovation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.entries(TYPE_META) as [InnovationType, typeof TYPE_META[InnovationType]][]).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setInnovationType(key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        innovationType === key ? `${meta.bg} border-current` : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} shrink-0`}>
                        {meta.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${innovationType === key ? meta.color : "text-foreground"}`}>{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{meta.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isChallenge ? "State the challenge clearly" : "Name your idea"} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Description *</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder={isChallenge ? "Describe the problem, constraints, and what success looks like…" : "Describe the idea, its novelty, and potential impact…"} className="resize-none text-sm" />
              </div>
              <Button disabled={!title.trim() || !description.trim()} onClick={() => setStep(2)} className="w-full rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Industry</label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{INDUSTRY_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {activities.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Activity</label>
                    <Select value={activityTag} onValueChange={setActivityTag}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>{activities.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Country</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">City / State</label>
                  <Input value={stateCity} onChange={e => setStateCity(e.target.value)} placeholder="Lagos, Nairobi…" />
                </div>
              </div>

              {isChallenge && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Reward (optional)</label>
                    <Input value={reward} onChange={e => setReward(e.target.value)} placeholder="e.g. ₦500,000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Deadline (optional)</label>
                    <Input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="e.g. Dec 2025" />
                  </div>
                </div>
              )}

              {!isChallenge && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Expected Outcome</label>
                  <Textarea value={expectedOutcome} onChange={e => setExpectedOutcome(e.target.value)} rows={3} placeholder="What would success look like?" className="resize-none text-sm" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Required Skills</label>
                <div className="flex gap-2 mb-2">
                  <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="e.g. Welding, Logistics…"
                    onKeyDown={e => { if (e.key === "Enter") { if (skillInput.trim()) { setRequiredSkills(p => [...p, skillInput.trim()]); setSkillInput(""); } }}} />
                  <Button type="button" variant="outline" size="sm" onClick={() => { if (skillInput.trim()) { setRequiredSkills(p => [...p, skillInput.trim()]); setSkillInput(""); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {requiredSkills.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1 text-xs">
                      {s}<button onClick={() => setRequiredSkills(p => p.filter(x => x !== s))}><XIcon className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. sustainable, solar…"
                    onKeyDown={e => { if (e.key === "Enter") { if (tagInput.trim()) { setTags(p => [...p, tagInput.trim()]); setTagInput(""); } }}} />
                  <Button type="button" variant="outline" size="sm" onClick={() => { if (tagInput.trim()) { setTags(p => [...p, tagInput.trim()]); setTagInput(""); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 text-xs">
                      {t}<button onClick={() => setTags(p => p.filter(x => x !== t))}><XIcon className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-xl">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Publish
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeader({ title, icon, count }: { title: string; icon: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h2 className="font-display font-bold text-base text-foreground">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{count}</span>
        )}
      </div>
    </div>
  );
}

export default function Innovation() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"feed" | "challenges" | "mine">("feed");
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [solutionsFor, setSolutionsFor] = useState<Innovation | null>(null);

  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const loadInnovations = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (industryFilter) params.industry = industryFilter;
      if (search.trim()) params.search = search.trim();
      if (activeTab === "challenges") params.type = "challenge";
      if (activeTab === "mine" && user) params.mine = "true";
      const qs = Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
      const data = await apiFetch(`/innovations${qs}`, token);
      setInnovations(data ?? []);
    } catch {
      setInnovations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when filters/tab change
  useEffect(() => { loadInnovations(); }, [activeTab, typeFilter, industryFilter, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReact = async (id: number) => {
    if (!token) return;
    try {
      await apiFetch(`/innovations/${id}/react`, token, "POST");
      setInnovations(prev => prev.map(i => i.id === id ? { ...i, loves: i.loves + 1, hasLoved: true } : i));
    } catch { /* ignore */ }
  };

  const handleFollow = async (id: number) => {
    if (!token) return;
    const innovation = innovations.find(i => i.id === id);
    if (!innovation) return;
    try {
      if (innovation.isFollowing) {
        await apiFetch(`/innovations/${id}/follow`, token, "DELETE");
        setInnovations(prev => prev.map(i => i.id === id ? { ...i, isFollowing: false } : i));
      } else {
        await apiFetch(`/innovations/${id}/follow`, token, "POST");
        setInnovations(prev => prev.map(i => i.id === id ? { ...i, isFollowing: true } : i));
      }
    } catch { /* ignore */ }
  };

  // Compute counts
  const ideas = innovations.filter(i => i.innovationType === "idea");
  const challenges = innovations.filter(i => i.innovationType === "challenge" || i.innovationType === "problem" || i.innovationType === "solution_request");
  const featured = challenges.filter(i => i.reward || (i.requiredSkills ?? []).length > 0).slice(0, 3);

  // Top contributors (mock, computed from who has most innovations)
  const contributorMap: Record<number, { name: string; avatarUrl?: string; count: number }> = {};
  for (const inn of innovations) {
    if (inn.author) {
      contributorMap[inn.author.id] = contributorMap[inn.author.id]
        ? { ...contributorMap[inn.author.id], count: contributorMap[inn.author.id].count + 1 }
        : { ...inn.author, count: 1 };
    }
  }
  const topContributors = Object.values(contributorMap).sort((a, b) => b.count - a.count).slice(0, 5);

  const tabs = [
    { key: "feed", label: "All" },
    { key: "challenges", label: "Challenges" },
    { key: "mine", label: "Mine" },
  ] as const;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Innovation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Ideas · Challenges · Research · Solutions</p>
        </div>
        <Button onClick={() => setNewSheetOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Publish
        </Button>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Ideas", value: ideas.length, icon: <Lightbulb className="h-3.5 w-3.5" />, color: "text-amber-600" },
          { label: "Challenges", value: challenges.length, icon: <Trophy className="h-3.5 w-3.5" />, color: "text-violet-600" },
          { label: "Solutions", value: innovations.reduce((a, i) => a + i.solutionsCount, 0), icon: <Zap className="h-3.5 w-3.5" />, color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
            <p className={`font-display font-bold text-lg ${s.color}`}>{s.value}</p>
            <div className={`flex items-center justify-center gap-1 mt-0.5 ${s.color}`}>
              {s.icon}
              <span className="text-[10px] font-medium text-muted-foreground">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") loadInnovations(); }}
          placeholder="Search innovations, challenges, ideas…"
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Featured Challenges */}
      {activeTab === "feed" && featured.length > 0 && (
        <div>
          <SectionHeader title="Featured Challenges" icon={<Trophy className="h-4 w-4" />} count={featured.length} />
          <div className="space-y-3">
            {featured.map(inn => (
              <InnovationCard
                key={inn.id}
                innovation={inn}
                onReact={handleReact}
                onFollow={handleFollow}
                onViewSolutions={setSolutionsFor}
                token={token}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Contributors */}
      {activeTab === "feed" && topContributors.length > 0 && (
        <div>
          <SectionHeader title="Top Contributors" icon={<Award className="h-4 w-4" />} />
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {topContributors.map(c => (
              <div key={c.name} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={c.avatarUrl || ""} />
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-[10px] font-semibold text-center text-foreground leading-tight line-clamp-2">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.count} post{c.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main feed */}
      <div>
        <SectionHeader
          title={activeTab === "challenges" ? "Challenges & Problems" : activeTab === "mine" ? "My Innovations" : "New Ideas"}
          icon={activeTab === "challenges" ? <Trophy className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
          count={innovations.length}
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : innovations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Lightbulb className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              {activeTab === "mine" ? "You haven't published any innovations yet" : "No innovations yet"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setNewSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Be the first
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {innovations.map(inn => (
              <InnovationCard
                key={inn.id}
                innovation={inn}
                onReact={handleReact}
                onFollow={handleFollow}
                onViewSolutions={setSolutionsFor}
                token={token}
              />
            ))}
          </div>
        )}
      </div>

      {/* Innovation workflow explainer */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Innovation Pathway</p>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {["Idea / Challenge", "Discussion", "Project", "Venture", "Market"].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-foreground bg-white dark:bg-gray-900 border border-border rounded-full px-3 py-1">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Sheets */}
      <NewInnovationSheet
        open={newSheetOpen}
        onClose={() => setNewSheetOpen(false)}
        onCreated={loadInnovations}
        token={token}
      />
      <SolutionsSheet
        innovation={solutionsFor}
        onClose={() => setSolutionsFor(null)}
        token={token}
      />
    </div>
  );
}
