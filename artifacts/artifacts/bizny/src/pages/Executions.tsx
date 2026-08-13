import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  useListExecutionInstances,
  useUpdateExecutionInstance,
  useDeleteExecutionInstance,
  getListExecutionInstancesQueryKey,
} from "@workspace/api-client-react";
import type { ExecutionInstance } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Rocket, Plus, BookOpen, MapPin, Calendar, CheckCircle2, Circle,
  Loader2, Trash2, ExternalLink, ArrowRight,
  Briefcase, Beaker, Users, Cog, Layers,
  Edit2, TrendingUp, ChevronDown, ChevronUp,
  Image as ImageIcon, FileText, Award, X, Upload,
  Flame, Sunrise, NotebookPen, ListChecks, Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// ─── Timeline / Daily Coaching Engine types ────────────────────────────────────

type TimelineTask = { day: number; title: string; description?: string; index: number };

type TimelineState = {
  day: number;
  totalDays: number | null;
  isComplete: boolean;
  tasksToday: TimelineTask[];
  overdueTasks: TimelineTask[];
  nextMilestone: TimelineTask | null;
  completedMilestones: number;
  totalMilestones: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  timelineMode: string;
};

type JournalEntry = {
  id: number;
  executionInstanceId: number;
  day: number;
  entryType: "milestone_complete" | "checkin" | "note";
  title: string;
  notes: string | null;
  evidenceUrls: string[];
  createdAt: string;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Milestone = {
  title: string;
  description?: string;
  completed?: boolean;
  completedAt?: string;
  day?: number;
  evidenceRequired?: boolean;
  evidenceTypes?: string[];
  evidenceNote?: string;
  evidenceUrls?: string[];
  evidenceText?: string;
};

// ─── Type/status config ───────────────────────────────────────────────────────

const INSTANCE_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  venture:              { label: "Venture",              icon: <Rocket className="h-3.5 w-3.5" />,    color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800" },
  project:              { label: "Project",              icon: <Briefcase className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
  experiment:           { label: "Experiment",           icon: <Beaker className="h-3.5 w-3.5" />,    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800" },
  community_initiative: { label: "Community Initiative", icon: <Users className="h-3.5 w-3.5" />,     color: "text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800" },
  research:             { label: "Research",             icon: <BookOpen className="h-3.5 w-3.5" />,  color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800" },
  operational_run:      { label: "Operational Run",      icon: <Cog className="h-3.5 w-3.5" />,       color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  custom:               { label: "Custom",               icon: <Layers className="h-3.5 w-3.5" />,    color: "text-slate-600 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800" },
};

const STATUS_COLORS: Record<string, { pill: string; dot: string }> = {
  planning:  { pill: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",   dot: "bg-blue-500" },
  active:    { pill: "text-green-600 bg-green-50 dark:bg-green-950/30", dot: "bg-green-500" },
  paused:    { pill: "text-amber-600 bg-amber-50 dark:bg-amber-950/30", dot: "bg-amber-500" },
  completed: { pill: "text-teal-600 bg-teal-50 dark:bg-teal-950/30",   dot: "bg-teal-500" },
  abandoned: { pill: "text-slate-500 bg-slate-50 dark:bg-slate-950/30", dot: "bg-slate-400" },
};

function getTypeConfig(type?: string) {
  return INSTANCE_TYPES[type ?? "venture"] ?? INSTANCE_TYPES["venture"];
}

function getStatusConfig(status?: string) {
  return STATUS_COLORS[status ?? "planning"] ?? STATUS_COLORS["planning"];
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Evidence upload dialog ───────────────────────────────────────────────────

async function uploadFile(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  return data.url as string;
}

function EvidenceDialog({
  instanceId,
  milestoneIndex,
  milestone,
  open,
  onClose,
  onSuccess,
}: {
  instanceId: number;
  milestoneIndex: number;
  milestone: Milestone;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !token) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(e.target.files)) {
        const url = await uploadFile(file, token);
        urls.push(url);
      }
      setEvidenceUrls(prev => [...prev, ...urls]);
      toast({ description: `${urls.length} file(s) uploaded.` });
    } catch {
      toast({ variant: "destructive", description: "Upload failed. Try again." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (milestone.evidenceRequired && evidenceUrls.length === 0 && !evidenceText.trim()) {
      toast({ variant: "destructive", description: "This milestone requires evidence. Upload a file or add a note." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/execution-instances/${instanceId}/milestones/${milestoneIndex}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ evidenceUrls, evidenceText: evidenceText.trim(), autoPost: true }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Milestone completed!", description: "Progress updated and a post was published to your feed." });
      onSuccess();
      onClose();
      setEvidenceText("");
      setEvidenceUrls([]);
    } catch {
      toast({ variant: "destructive", description: "Failed to complete milestone." });
    } finally {
      setSubmitting(false);
    }
  };

  const evidenceTypes = milestone.evidenceTypes ?? ["Photo", "Video"];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Complete Milestone
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-sm font-semibold">{milestone.title}</p>
            {milestone.description && <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>}
            {milestone.evidenceRequired && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-muted-foreground">Evidence required:</span>
                {evidenceTypes.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded font-medium">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Upload evidence</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? "Uploading…" : "Tap to upload photos or videos"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, MP4, MOV supported</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

            {evidenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {evidenceUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
                      {url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={() => setEvidenceUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Progress note (optional)</Label>
            <Textarea
              placeholder="Describe what you accomplished, what you observed, or what you learned at this milestone…"
              value={evidenceText}
              onChange={e => setEvidenceText(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <p className="text-[11px] text-muted-foreground">This will be published as a progress post on your feed.</p>
          </div>

          <Button onClick={handleSubmit} disabled={submitting || uploading} className="w-full gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark Complete & Post to Feed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Milestone list panel ─────────────────────────────────────────────────────

function MilestonePanel({
  instance,
  onRefresh,
}: {
  instance: ExecutionInstance;
  onRefresh: () => void;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [evidenceTarget, setEvidenceTarget] = useState<{ index: number; milestone: Milestone } | null>(null);
  const [uncompleting, setUncompleting] = useState<number | null>(null);

  const milestones = (instance.milestones ?? []) as Milestone[];
  const completed = milestones.filter(m => m.completed).length;
  const total = milestones.length;

  const handleUncomplete = async (index: number) => {
    if (!token) return;
    setUncompleting(index);
    try {
      const res = await fetch(`/api/execution-instances/${instance.id}/milestones/${index}/uncomplete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast({ description: "Milestone marked incomplete." });
      onRefresh();
    } catch {
      toast({ variant: "destructive", description: "Failed to update milestone." });
    } finally {
      setUncompleting(null);
    }
  };

  if (total === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No milestones yet. Adopt a template to inherit milestones automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="font-semibold text-foreground">{completed}/{total} milestones completed</span>
        <span className="text-primary font-bold">{instance.progressPercent}%</span>
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {milestones.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
              m.completed
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-card border-border hover:border-primary/30"
            }`}
          >
            <button
              className="mt-0.5 shrink-0"
              onClick={() => m.completed ? handleUncomplete(i) : setEvidenceTarget({ index: i, milestone: m })}
              disabled={uncompleting === i}
            >
              {uncompleting === i ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : m.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className={`text-xs font-semibold leading-snug ${m.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {i + 1}. {m.title}
                </p>
                {m.evidenceRequired && !m.completed && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 rounded font-semibold shrink-0">
                    Evidence
                  </span>
                )}
              </div>

              {m.description && !m.completed && (
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{m.description}</p>
              )}

              {m.completed && (
                <div className="flex items-center gap-2 mt-1">
                  {m.completedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(m.completedAt), "dd MMM yyyy")}
                    </span>
                  )}
                  {(m.evidenceUrls ?? []).length > 0 && (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <ImageIcon className="h-2.5 w-2.5" /> {m.evidenceUrls!.length} file(s)
                    </span>
                  )}
                  {m.evidenceText && (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <FileText className="h-2.5 w-2.5" /> Note
                    </span>
                  )}
                </div>
              )}

              {!m.completed && (
                <button
                  className="text-[10px] text-primary hover:underline mt-1 font-medium"
                  onClick={() => setEvidenceTarget({ index: i, milestone: m })}
                >
                  Complete milestone →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {evidenceTarget && (
        <EvidenceDialog
          instanceId={instance.id}
          milestoneIndex={evidenceTarget.index}
          milestone={evidenceTarget.milestone}
          open={!!evidenceTarget}
          onClose={() => setEvidenceTarget(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// ─── Daily Coaching Engine: Today banner ──────────────────────────────────────

function TodayBanner({ instance }: { instance: ExecutionInstance }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkingIn, setCheckingIn] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteBox, setShowNoteBox] = useState(false);

  const queryKey = ["execution-today", instance.id];

  const { data: today, isLoading } = useQuery<TimelineState>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/execution-instances/${instance.id}/today`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to load today's timeline");
      return res.json();
    },
    enabled: !!token,
  });

  const checkedInToday = today?.lastCheckInDate === new Date().toISOString().slice(0, 10);

  const handleCheckIn = async () => {
    if (!token) return;
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/execution-instances/${instance.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: note.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({ description: "Checked in for today. Streak updated." });
      setNote("");
      setShowNoteBox(false);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["execution-journal", instance.id] });
    } catch {
      toast({ variant: "destructive", description: "Check-in failed. Try again." });
    } finally {
      setCheckingIn(false);
    }
  };

  if (isLoading || !today) {
    return <div className="h-16 bg-muted/40 rounded-lg animate-pulse mb-3" />;
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground">
            {today.totalDays ? `Day ${today.day} of ${today.totalDays}` : `Day ${today.day}`}
          </span>
          {today.currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800">
              <Flame className="h-2.5 w-2.5" /> {today.currentStreak} day streak
            </span>
          )}
        </div>
        {!checkedInToday && !showNoteBox && (
          <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1" onClick={() => setShowNoteBox(true)}>
            <CheckCircle2 className="h-3 w-3" /> Check in
          </Button>
        )}
        {checkedInToday && (
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Checked in
          </span>
        )}
      </div>

      {today.tasksToday.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Today's focus</p>
          {today.tasksToday.map(t => (
            <p key={t.index} className="text-xs text-foreground leading-snug">• {t.title}</p>
          ))}
        </div>
      )}

      {today.overdueTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Overdue</p>
          {today.overdueTasks.map(t => (
            <p key={t.index} className="text-xs text-amber-700 dark:text-amber-400 leading-snug">• Day {t.day}: {t.title}</p>
          ))}
        </div>
      )}

      {today.tasksToday.length === 0 && today.overdueTasks.length === 0 && today.nextMilestone && (
        <p className="text-xs text-muted-foreground">Next up: Day {today.nextMilestone.day} — {today.nextMilestone.title}</p>
      )}

      {today.isComplete && (
        <p className="text-xs text-teal-600 font-semibold">Timeline complete — all milestones reached.</p>
      )}

      {showNoteBox && (
        <div className="space-y-1.5 pt-1">
          <Textarea
            placeholder="What did you work on today? (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="min-h-[50px] text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleCheckIn} disabled={checkingIn}>
              {checkingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Confirm check-in
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNoteBox(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Execution journal panel ───────────────────────────────────────────────────

function JournalPanel({ instance }: { instance: ExecutionInstance }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const { data: entries, isLoading, refetch } = useQuery<JournalEntry[]>({
    queryKey: ["execution-journal", instance.id],
    queryFn: async () => {
      const res = await fetch(`/api/execution-instances/${instance.id}/journal`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to load journal");
      return res.json();
    },
    enabled: !!token,
  });

  const handlePromote = async (entryId: number) => {
    if (!token) return;
    setPromotingId(entryId);
    try {
      const res = await fetch(`/api/knowledge-articles/from-journal/${entryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      toast({ description: "Shared to the Knowledge Base." });
      refetch();
    } catch {
      toast({ variant: "destructive", description: "Failed to share this entry." });
    } finally {
      setPromotingId(null);
    }
  };

  if (isLoading) {
    return <div className="h-16 bg-muted/40 rounded-lg animate-pulse" />;
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <NotebookPen className="h-6 w-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No journal entries yet. Check in or complete a milestone to start your log.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {entries.map(e => (
        <div key={e.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card">
          {e.entryType === "milestone_complete" ? (
            <Award className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          ) : (
            <NotebookPen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground leading-snug">Day {e.day} · {e.title}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(e.createdAt), "dd MMM")}</span>
            </div>
            {e.notes && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{e.notes}</p>}
            {e.evidenceUrls.length > 0 && (
              <span className="text-[10px] text-green-600 flex items-center gap-0.5 mt-1">
                <ImageIcon className="h-2.5 w-2.5" /> {e.evidenceUrls.length} file(s)
              </span>
            )}
            {e.notes && (
              <button
                onClick={() => handlePromote(e.id)}
                disabled={promotingId === e.id}
                className="mt-1.5 text-[10px] font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {promotingId === e.id ? "Sharing..." : "Share as Knowledge"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Execution card ───────────────────────────────────────────────────────────

function ExecutionCard({
  instance,
  onEdit,
  onRefresh,
}: {
  instance: ExecutionInstance;
  onEdit: (i: ExecutionInstance) => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteExecutionInstance();
  const typeConfig = getTypeConfig(instance.instanceType);
  const statusConfig = getStatusConfig(instance.status);

  const milestones = (instance.milestones ?? []) as Milestone[];
  const completed = milestones.filter(m => m.completed).length;
  const total = milestones.length;
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"milestones" | "journal">("milestones");
  const showTimeline = instance.status === "active" || instance.status === "planning";

  const handleDelete = () => {
    if (!confirm("Delete this execution? This cannot be undone.")) return;
    deleteMutation.mutate(
      { id: instance.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExecutionInstancesQueryKey() });
          toast({ description: "Execution deleted." });
        },
      }
    );
  };

  return (
    <Card className={`transition-all border-border/70 ${expanded ? "border-primary/30 shadow-md" : "hover:border-primary/20 hover:shadow-sm"}`}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
            {typeConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-sm leading-snug line-clamp-1">{instance.title}</h3>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(instance)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                {typeConfig.icon} {typeConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusConfig.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {instance.status}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
          {(instance.stateCity || instance.country) && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{instance.stateCity || instance.country}</span>
          )}
          {instance.startDate && (
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(instance.startDate), { addSuffix: true })}
            </span>
          )}
          {total > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {completed}/{total}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Progress</span>
            <span className="font-bold text-primary">{instance.progressPercent}%</span>
          </div>
          <ProgressBar value={instance.progressPercent} />
        </div>

        {/* Source template link */}
        {instance.templateId && (
          <div className="mb-3 pb-3 border-b border-border/50">
            <Link href={`/templates/${instance.templateId}`}>
              <span className="text-xs text-primary hover:underline flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> View source template
                <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </Link>
          </div>
        )}

        {/* Daily Coaching Engine: today's timeline */}
        {showTimeline && <TodayBanner instance={instance} />}

        {/* Expand milestones / journal */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>
            {total > 0 ? `${total} Milestones` : "No milestones"}
            {total > 0 && completed > 0 && <span className="text-green-600 ml-1">· {completed} done</span>}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setTab("milestones")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  tab === "milestones" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListChecks className="h-3 w-3" /> Milestones
              </button>
              <button
                onClick={() => setTab("journal")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  tab === "journal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <NotebookPen className="h-3 w-3" /> Journal
              </button>
            </div>
            {tab === "milestones" ? (
              <MilestonePanel instance={instance} onRefresh={onRefresh} />
            ) : (
              <JournalPanel instance={instance} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Edit dialog ──────────────────────────────────────────────────────────────

function EditDialog({ instance, open, onClose }: { instance: ExecutionInstance | null; open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState(instance?.status ?? "active");
  const [results, setResults] = useState(instance?.results ?? "");
  const [lessons, setLessons] = useState(instance?.lessonsLearned ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateExecutionInstance();

  const handleSave = () => {
    if (!instance) return;
    updateMutation.mutate(
      {
        id: instance.id,
        data: {
          status,
          results: results || undefined,
          lessonsLearned: lessons || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ description: "Execution updated." });
          queryClient.invalidateQueries({ queryKey: getListExecutionInstancesQueryKey() });
          onClose();
        },
      }
    );
  };

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Execution</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Results so far (optional)</Label>
            <Textarea placeholder="What have you achieved so far?" value={results} onChange={(e) => setResults(e.target.value)} className="min-h-[80px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Lessons learned (optional)</Label>
            <Textarea placeholder="What have you learned? What would you do differently?" value={lessons} onChange={(e) => setLessons(e.target.value)} className="min-h-[60px]" />
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full gap-2">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "planning", label: "Planning" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
];

// ─── Executions page ──────────────────────────────────────────────────────────

export default function Executions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [editTarget, setEditTarget] = useState<ExecutionInstance | null>(null);

  const queryClient = useQueryClient();

  const { data: instances, isLoading } = useListExecutionInstances({
    query: { queryKey: getListExecutionInstancesQueryKey() }
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListExecutionInstancesQueryKey() });

  const filtered = (instances ?? []).filter(i =>
    statusFilter === "all" || i.status === statusFilter
  );

  const counts: Record<string, number> = { all: instances?.length ?? 0 };
  for (const i of instances ?? []) {
    counts[i.status] = (counts[i.status] ?? 0) + 1;
  }

  const totalCompleted = (instances ?? []).reduce((s, i) => {
    const ms = (i.milestones ?? []) as Milestone[];
    return s + ms.filter(m => m.completed).length;
  }, 0);
  const totalMilestones = (instances ?? []).reduce((s, i) => s + ((i.milestones ?? []) as Milestone[]).length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold font-display tracking-tight">My Executions</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Your active template adoptions. Complete milestones, upload evidence, and document results.
          </p>
        </div>
        <Link href="/templates">
          <Button size="sm" className="h-9 gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Browse Library
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && (instances?.length ?? 0) > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
          <span><strong className="text-foreground font-bold">{instances?.length ?? 0}</strong> executions</span>
          <span><strong className="text-foreground font-bold">{totalCompleted}</strong> milestones completed</span>
          {totalMilestones > 0 && (
            <span><strong className="text-foreground font-bold">{Math.round((totalCompleted / totalMilestones) * 100)}%</strong> overall progress</span>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-32 flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-muted animate-pulse rounded-full w-2/3" />
                <div className="h-3 bg-muted animate-pulse rounded-full w-1/3" />
                <div className="h-2 bg-muted animate-pulse rounded-full w-full mt-4" />
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-card/40">
          <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-1">
            {statusFilter !== "all" ? `No ${statusFilter} executions` : "No executions yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {statusFilter !== "all"
              ? "Try a different filter."
              : "Find a template in the Library and click \"Use Template\" to start your first execution."}
          </p>
          <Link href="/templates">
            <Button size="sm" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Browse Library
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(instance => (
            <ExecutionCard
              key={instance.id}
              instance={instance}
              onEdit={setEditTarget}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      <EditDialog instance={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
