import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight,
  Plus, Upload, X, BarChart2, Flame, Target, Star,
  ArrowRight, BookOpen, Zap, ClipboardList, RefreshCw,
  CheckSquare, ChevronDown, ChevronUp, Camera, FileText,
  Link2, Package, Shield, Loader2, TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachDashboard {
  hasPlan: boolean;
  planId?: number;
  goal?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  productivityScore: number;
  streakDays: number;
  weekNumber: number;
  evidenceCount: number;
  reviewsDue: boolean;
}

interface CoachTask {
  id: number;
  planId: number;
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  estimatedMinutes: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  weekNumber: number;
  evidenceRequired: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface TaskEvidence {
  id: number;
  taskId: number;
  evidenceType: "photo" | "video" | "document" | "receipt" | "text" | "link";
  url: string | null;
  textContent: string | null;
  note: string | null;
  createdAt: string;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const API = async <T,>(path: string, token: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "text-muted-foreground", bg: "bg-muted", icon: Circle },
  in_progress: { label: "In Progress", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", icon: Clock },
  completed: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 },
  blocked: { label: "Blocked", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", icon: AlertTriangle },
} as const;

const PRIORITY_CONFIG = {
  high: { label: "High", color: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  low: { label: "Low", color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
} as const;

const BLOCKER_REASONS = [
  { id: "no_transport", label: "No transport" },
  { id: "no_money", label: "No money or budget" },
  { id: "no_time", label: "Ran out of time" },
  { id: "supplier_unavailable", label: "Supplier unavailable" },
  { id: "market_closed", label: "Market was closed" },
  { id: "didnt_know_how", label: "Didn't know how to do it" },
  { id: "equipment_issue", label: "Equipment or tool problem" },
  { id: "other", label: "Other reason" },
];

function dueDateLabel(dueDate: string | null): { text: string; urgent: boolean } {
  if (!dueDate) return { text: "No due date", urgent: false };
  const d = new Date(dueDate);
  if (isToday(d)) return { text: "Due today", urgent: true };
  if (isTomorrow(d)) return { text: "Due tomorrow", urgent: false };
  if (isPast(d)) return { text: `Overdue — ${format(d, "MMM d")}`, urgent: true };
  return { text: `Due ${format(d, "MMM d")}`, urgent: false };
}

// ─── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onStatusChange,
  onOpenDetail,
}: {
  task: CoachTask;
  onStatusChange: (id: number, status: CoachTask["status"]) => void;
  onOpenDetail: (task: CoachTask) => void;
}) {
  const status = STATUS_CONFIG[task.status];
  const priority = PRIORITY_CONFIG[task.priority];
  const StatusIcon = status.icon;
  const due = dueDateLabel(task.dueDate);

  const nextStatus: Record<CoachTask["status"], CoachTask["status"]> = {
    not_started: "in_progress",
    in_progress: "completed",
    completed: "not_started",
    blocked: "in_progress",
  };

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      task.status === "completed" ? "bg-muted/30 border-border/50 opacity-70" : "bg-card border-border"
    )}>
      <div className="flex items-start gap-3 p-3.5">
        {/* Status toggle */}
        <button
          onClick={() => {
            if (task.status === "in_progress") {
              onOpenDetail(task); // Open detail to mark completed (with evidence prompt)
            } else {
              onStatusChange(task.id, nextStatus[task.status]);
            }
          }}
          className="mt-0.5 shrink-0"
        >
          <StatusIcon className={cn("w-5 h-5 transition-colors", status.color)} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold leading-tight",
            task.status === "completed" && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            <span className={cn("text-[11px] font-semibold flex items-center gap-1", priority.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priority.dot)} />
              {priority.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ~{task.estimatedMinutes}min
            </span>
            {task.dueDate && (
              <span className={cn("text-[11px] font-medium", due.urgent ? "text-red-500" : "text-muted-foreground")}>
                {due.text}
              </span>
            )}
            {task.evidenceRequired && (
              <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                <Camera className="w-3 h-3" /> Evidence needed
              </span>
            )}
          </div>
        </div>

        {/* Detail arrow */}
        <button onClick={() => onOpenDetail(task)} className="p-1 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ─── Task Detail Sheet ──────────────────────────────────────────────────────────

function TaskDetailSheet({
  task,
  open,
  onClose,
  onStatusChange,
  onBlockerSubmit,
  token,
}: {
  task: CoachTask | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: CoachTask["status"]) => void;
  onBlockerSubmit: (taskId: number, reason: string, detail: string) => Promise<void>;
  token: string;
}) {
  const queryClient = useQueryClient();
  const [showBlocker, setShowBlocker] = useState(false);
  const [blockerReason, setBlockerReason] = useState("");
  const [blockerDetail, setBlockerDetail] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: evidenceList = [] } = useQuery<TaskEvidence[]>({
    queryKey: ["task-evidence", task?.id],
    queryFn: () => API(`/coach/tasks/${task!.id}/evidence`, token),
    enabled: open && !!task,
  });

  const submitEvidence = async (type: "text" | "link" | "photo", payload: Record<string, string>) => {
    if (!task) return;
    setSubmitting(true);
    try {
      await API(`/coach/tasks/${task.id}/evidence`, token, {
        method: "POST",
        body: JSON.stringify({ evidenceType: type, ...payload }),
      });
      queryClient.invalidateQueries({ queryKey: ["task-evidence", task.id] });
      queryClient.invalidateQueries({ queryKey: ["coach-dashboard"] });
      setEvidenceText("");
      setEvidenceLink("");
      setEvidenceNote("");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      await API(`/coach/tasks/${task.id}/evidence`, token, {
        method: "POST",
        body: JSON.stringify({ evidenceType: "photo", url: data.url }),
      });
      queryClient.invalidateQueries({ queryKey: ["task-evidence", task.id] });
      queryClient.invalidateQueries({ queryKey: ["coach-dashboard"] });
    } finally {
      setUploading(false);
    }
  };

  const handleBlockerSubmit = async () => {
    if (!task || !blockerReason) return;
    setSubmitting(true);
    try {
      await onBlockerSubmit(task.id, blockerReason, blockerDetail);
      setShowBlocker(false);
      setBlockerReason("");
      setBlockerDetail("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  const status = STATUS_CONFIG[task.status];
  const StatusIcon = status.icon;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                  status.bg, status.color
                )}>
                  <StatusIcon className="w-3 h-3" /> {status.label}
                </span>
                <span className={cn("text-xs font-semibold", PRIORITY_CONFIG[task.priority].color)}>
                  {PRIORITY_CONFIG[task.priority].label} Priority
                </span>
              </div>
              <h2 className="text-lg font-bold font-display tracking-tight text-foreground leading-tight">
                {task.title}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border mb-4">
            <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
          </div>

          {/* Why this task */}
          <div className="mb-5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Why this task</p>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{task.reason}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> ~{task.estimatedMinutes} minutes
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="w-3.5 h-3.5" /> {format(new Date(task.dueDate), "EEE, MMM d")}
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="space-y-2 mb-5">
            {task.status !== "completed" && (
              <Button
                onClick={() => onStatusChange(task.id, "completed")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark as Completed
              </Button>
            )}
            {task.status === "not_started" && (
              <Button
                variant="outline"
                onClick={() => onStatusChange(task.id, "in_progress")}
                className="w-full h-11 rounded-xl gap-2"
              >
                <Clock className="w-4 h-4" /> Start Working on This
              </Button>
            )}
            {task.status !== "blocked" && task.status !== "completed" && (
              <Button
                variant="outline"
                onClick={() => setShowBlocker(true)}
                className="w-full h-11 rounded-xl gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
              >
                <AlertTriangle className="w-4 h-4" /> Report a Blocker
              </Button>
            )}
          </div>

          {/* Evidence section */}
          <div className="mb-4">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center justify-between w-full mb-3"
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Evidence {evidenceList.length > 0 ? `(${evidenceList.length})` : ""}
              </p>
              {showEvidence ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showEvidence && (
              <div className="space-y-3">
                {/* Existing evidence */}
                {evidenceList.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                    {ev.evidenceType === "photo" && ev.url ? (
                      <img src={ev.url} alt="Evidence" className="w-16 h-16 rounded-lg object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {ev.evidenceType === "text" ? <FileText className="w-4 h-4 text-primary" /> :
                         ev.evidenceType === "link" ? <Link2 className="w-4 h-4 text-primary" /> :
                         <Package className="w-4 h-4 text-primary" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground capitalize mb-0.5">{ev.evidenceType}</p>
                      {ev.textContent && <p className="text-sm text-foreground leading-relaxed">{ev.textContent}</p>}
                      {ev.url && ev.evidenceType !== "photo" && <p className="text-xs text-primary truncate">{ev.url}</p>}
                      {ev.note && <p className="text-xs text-muted-foreground mt-0.5 italic">{ev.note}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(ev.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                ))}

                {/* Add evidence */}
                <div className="p-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <p className="text-xs font-semibold text-primary">Add Evidence</p>

                  {/* Text note */}
                  <div>
                    <Textarea
                      value={evidenceText}
                      onChange={e => setEvidenceText(e.target.value)}
                      placeholder="Write your observation, finding, or note..."
                      className="text-sm min-h-[80px] resize-none rounded-lg bg-background border-border"
                    />
                    {evidenceText.trim() && (
                      <Button
                        size="sm"
                        onClick={() => submitEvidence("text", { textContent: evidenceText, note: evidenceNote })}
                        disabled={submitting}
                        className="mt-2 bg-primary text-white gap-1.5 h-8 text-xs rounded-lg"
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} Save Note
                      </Button>
                    )}
                  </div>

                  {/* Link */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={evidenceLink}
                      onChange={e => setEvidenceLink(e.target.value)}
                      placeholder="Paste a link (URL)..."
                      className="flex-1 text-sm h-9 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {evidenceLink.trim() && (
                      <Button
                        size="sm"
                        onClick={() => submitEvidence("link", { url: evidenceLink })}
                        disabled={submitting}
                        className="bg-primary text-white h-9 gap-1 text-xs rounded-lg px-3"
                      >
                        <Link2 className="w-3 h-3" /> Save
                      </Button>
                    )}
                  </div>

                  {/* Photo upload */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium text-foreground">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Blocker dialog */}
          {showBlocker && (
            <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <p className="text-sm font-bold text-foreground mb-1">What prevented you from completing this?</p>
              <p className="text-xs text-muted-foreground mb-3">Your blockers are saved and used to improve future recommendations.</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {BLOCKER_REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setBlockerReason(r.id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                      blockerReason === r.id
                        ? "border-red-400 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                        : "border-border bg-background text-foreground hover:border-red-200"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <Textarea
                value={blockerDetail}
                onChange={e => setBlockerDetail(e.target.value)}
                placeholder="Optional: describe what happened..."
                className="text-sm min-h-[60px] resize-none rounded-lg mb-3"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleBlockerSubmit}
                  disabled={!blockerReason || submitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white h-10 rounded-xl text-sm gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Report Blocker
                </Button>
                <Button variant="outline" onClick={() => setShowBlocker(false)} className="h-10 rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Weekly Review Modal ──────────────────────────────────────────────────────

function WeeklyReviewModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    biggestObstacle: string;
    learned: string;
    whatChanged: string;
    continueGoal: boolean;
    adjustments: string;
  }) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [biggestObstacle, setBiggestObstacle] = useState("");
  const [learned, setLearned] = useState("");
  const [whatChanged, setWhatChanged] = useState("");
  const [continueGoal, setContinueGoal] = useState(true);
  const [adjustments, setAdjustments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ biggestObstacle, learned, whatChanged, continueGoal, adjustments });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const QUESTIONS = [
    {
      q: "What was your biggest obstacle this week?",
      sub: "Be honest. Identifying obstacles is the first step to removing them.",
      value: biggestObstacle,
      set: setBiggestObstacle,
      placeholder: "I couldn't find reliable suppliers in my area...",
    },
    {
      q: "What did you learn?",
      sub: "What insight, skill, or understanding did you gain this week?",
      value: learned,
      set: setLearned,
      placeholder: "I learned that my target market prefers smaller pack sizes...",
    },
    {
      q: "What changed?",
      sub: "How is your situation, plan, or thinking different from last week?",
      value: whatChanged,
      set: setWhatChanged,
      placeholder: "I now have two confirmed suppliers instead of none...",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="p-0 rounded-2xl overflow-hidden max-w-md">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
            </div>
            <DialogTitle className="font-display font-bold text-foreground">Weekly Review</DialogTitle>
          </div>
          <div className="flex gap-1 mt-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-5">
          {step < 3 ? (
            <div>
              <h3 className="text-base font-bold font-display text-foreground mb-1">{QUESTIONS[step].q}</h3>
              <p className="text-xs text-muted-foreground mb-3">{QUESTIONS[step].sub}</p>
              <Textarea
                value={QUESTIONS[step].value}
                onChange={e => QUESTIONS[step].set(e.target.value)}
                placeholder={QUESTIONS[step].placeholder}
                className="min-h-[100px] resize-none text-sm rounded-xl"
                autoFocus
              />
              <Button
                onClick={() => setStep(step + 1)}
                className="w-full mt-3 bg-primary text-white h-11 rounded-xl gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold font-display text-foreground mb-1">
                Continue with your current goal?
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Your next week's tasks will be generated based on your answer.
              </p>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setContinueGoal(true)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-semibold transition-all",
                    continueGoal ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/30"
                  )}
                >
                  Yes, continue
                </button>
                <button
                  onClick={() => setContinueGoal(false)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-semibold transition-all",
                    !continueGoal ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/30"
                  )}
                >
                  Adjust the plan
                </button>
              </div>
              {!continueGoal && (
                <Textarea
                  value={adjustments}
                  onChange={e => setAdjustments(e.target.value)}
                  placeholder="What would you like to adjust about your goal or plan?"
                  className="min-h-[80px] resize-none text-sm rounded-xl mb-4"
                />
              )}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary text-white h-11 rounded-xl gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Review
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Coach page ──────────────────────────────────────────────────────────

export default function Coach() {
  const { user, token } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<CoachTask | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const { data: dashboard, isLoading: dashLoading } = useQuery<CoachDashboard>({
    queryKey: ["coach-dashboard"],
    queryFn: () => API("/coach/dashboard", token ?? ""),
    enabled: !!token,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<CoachTask[]>({
    queryKey: ["coach-tasks"],
    queryFn: () => API("/coach/tasks", token ?? ""),
    enabled: !!token && !!dashboard?.hasPlan,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: CoachTask["status"] }) =>
      API(`/coach/tasks/${id}`, token ?? "", { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["coach-dashboard"] });
    },
  });

  const blockerMutation = useCallback(async (taskId: number, reason: string, detail: string) => {
    await API(`/coach/tasks/${taskId}/blocker`, token ?? "", {
      method: "POST",
      body: JSON.stringify({ reason, detail }),
    });
    queryClient.invalidateQueries({ queryKey: ["coach-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["coach-dashboard"] });
  }, [token, queryClient]);

  const reviewMutation = useMutation({
    mutationFn: (data: Parameters<typeof API>[2]) =>
      API("/coach/reviews", token ?? "", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["coach-tasks"] });
    },
  });

  const handleOpenTask = (task: CoachTask) => {
    setSelectedTask(task);
    setTaskSheetOpen(true);
  };

  const handleStatusChange = (id: number, status: CoachTask["status"]) => {
    statusMutation.mutate({ id, status });
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, status } : null);
    }
  };

  // Categorize tasks
  const todayTasks = tasks.filter(t =>
    t.status !== "completed" && t.dueDate && isToday(new Date(t.dueDate))
  );
  const urgentTasks = tasks.filter(t =>
    t.status !== "completed" && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
  );
  const upcomingTasks = tasks.filter(t =>
    t.status !== "completed" && (!t.dueDate || (!isToday(new Date(t.dueDate)) && !isPast(new Date(t.dueDate))))
  );
  const completedTasks = tasks.filter(t => t.status === "completed");

  if (dashLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // No plan yet — prompt to start the Clinic
  if (!dashboard?.hasPlan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-display tracking-tight mb-2">No Execution Plan Yet</h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm">
          Complete your Productivity Clinic consultation first. Your plan will be automatically generated from your results.
        </p>
        <Link href="/clinic">
          <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl gap-2 text-base font-semibold shadow-md">
            <ClipboardList className="w-5 h-5" /> Start the Productivity Clinic
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-4">Takes about 3 minutes</p>
      </div>
    );
  }

  const progressPercent = dashboard.totalTasks > 0
    ? Math.round((dashboard.completedTasks / dashboard.totalTasks) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">

      {/* ── Weekly review banner ── */}
      {dashboard.reviewsDue && (
        <button
          onClick={() => setReviewOpen(true)}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Your weekly review is ready</p>
            <p className="text-xs text-muted-foreground">Reflect on this week and generate your next action plan.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-primary shrink-0" />
        </button>
      )}

      {/* ── Dashboard stats ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Week {dashboard.weekNumber} · Execution Plan
            </p>
            {dashboard.goal && (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                Goal: {dashboard.goal.replace(/_/g, " ")}
              </p>
            )}
          </div>
          {dashboard.streakDays > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" /> {dashboard.streakDays}d streak
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Overall Progress</span>
            <span className="font-bold text-foreground">{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Done", value: dashboard.completedTasks, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Active", value: dashboard.inProgressTasks, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
            { label: "Blocked", value: dashboard.blockedTasks, icon: AlertTriangle, color: "text-red-500" },
            { label: "Evidence", value: dashboard.evidenceCount, icon: Camera, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-2.5 text-center">
              <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
              <p className="text-base font-bold text-foreground font-display leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Task sections ── */}
      {tasksLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No tasks yet. Complete the Clinic to generate your plan.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Overdue */}
          {urgentTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Overdue</p>
              </div>
              <div className="space-y-2">
                {urgentTasks.map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onOpenDetail={handleOpenTask} />
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Today's Focus</p>
              </div>
              <div className="space-y-2">
                {todayTasks.map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onOpenDetail={handleOpenTask} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">This Week</p>
              </div>
              <div className="space-y-2">
                {(showAllTasks ? upcomingTasks : upcomingTasks.slice(0, 4)).map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onOpenDetail={handleOpenTask} />
                ))}
                {upcomingTasks.length > 4 && !showAllTasks && (
                  <button
                    onClick={() => setShowAllTasks(true)}
                    className="w-full py-2.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Show {upcomingTasks.length - 4} more tasks
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Completed ({completedTasks.length})
                </p>
              </div>
              <div className="space-y-2">
                {completedTasks.slice(0, 3).map(t => (
                  <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} onOpenDetail={handleOpenTask} />
                ))}
                {completedTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    + {completedTasks.length - 3} more completed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick links ── */}
      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Supporting Resources</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ClipboardList, label: "Productivity Clinic", href: "/clinic" },
            { icon: BookOpen, label: "Template Library", href: "/templates" },
            { icon: Target, label: "Opportunities", href: "/opportunities" },
            { icon: Zap, label: "Co-pilot", href: "/copilot" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Task detail sheet ── */}
      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onClose={() => { setTaskSheetOpen(false); setSelectedTask(null); }}
        onStatusChange={handleStatusChange}
        onBlockerSubmit={blockerMutation}
        token={token ?? ""}
      />

      {/* ── Weekly review modal ── */}
      <WeeklyReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onSubmit={async data => {
          await reviewMutation.mutateAsync(data as any);
        }}
      />
    </div>
  );
}
