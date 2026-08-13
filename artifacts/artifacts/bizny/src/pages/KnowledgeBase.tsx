import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen, Search, PenSquare, Loader2, Sparkles, GraduationCap,
  AlertTriangle, FileText, ThumbsUp, Eye, Tag, User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type KnowledgeArticle = {
  id: number;
  title: string;
  slug: string;
  industry: string | null;
  category: string;
  content: string;
  tags: string[];
  sourceType: "editorial" | "community";
  authorId: number;
  authorName: string | null;
  helpfulCount: number;
  viewCount: number;
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  guide: { label: "Guide", icon: <BookOpen className="h-3 w-3" />, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800" },
  lesson: { label: "Lesson", icon: <GraduationCap className="h-3 w-3" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  pitfall: { label: "Pitfall", icon: <AlertTriangle className="h-3 w-3" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  case_study: { label: "Case Study", icon: <FileText className="h-3 w-3" />, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
  note: { label: "Field Note", icon: <FileText className="h-3 w-3" />, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800" },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.guide;
}

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "guide", label: "Guides" },
  { key: "lesson", label: "Lessons" },
  { key: "pitfall", label: "Pitfalls" },
  { key: "case_study", label: "Case Studies" },
];

function NewArticleDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("guide");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setIndustry(""); setCategory("guide"); setContent(""); setTags("");
  };

  const handleSubmit = async () => {
    if (!token || !title.trim() || !content.trim()) {
      toast({ variant: "destructive", description: "Title and content are required." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/knowledge-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          industry: industry.trim() || undefined,
          category,
          content: content.trim(),
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      toast({ description: "Article published to the Knowledge Base." });
      reset();
      onSuccess();
      onClose();
    } catch {
      toast({ variant: "destructive", description: "Failed to publish article." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenSquare className="h-4 w-4 text-primary" /> Write a Guide
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How to source day-old chicks reliably" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industry (optional)</Label>
              <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Agriculture" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm h-9" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="guide">Guide</option>
                <option value="lesson">Lesson</option>
                <option value="pitfall">Pitfall</option>
                <option value="case_study">Case Study</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} className="min-h-[140px]" placeholder="Share what you know..." />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma-separated, optional)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="poultry, sourcing" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function KnowledgeBase() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const queryKey = ["knowledge-articles", category, search];

  const { data: articles, isLoading, refetch } = useQuery<KnowledgeArticle[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/knowledge-articles?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load knowledge base");
      return res.json();
    },
  });

  const editorialCount = (articles ?? []).filter(a => a.sourceType === "editorial").length;
  const communityCount = (articles ?? []).filter(a => a.sourceType === "community").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold font-display tracking-tight">Knowledge Base</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Team-authored guides plus real lessons shared from active executions across the network.
          </p>
        </div>
        {token && (
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setShowNewDialog(true)}>
            <PenSquare className="h-3.5 w-3.5" /> Write a Guide
          </Button>
        )}
      </div>

      {!isLoading && (articles?.length ?? 0) > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
          <span><strong className="text-foreground font-bold">{articles?.length ?? 0}</strong> articles</span>
          <span><strong className="text-foreground font-bold">{editorialCount}</strong> editorial</span>
          <span><strong className="text-foreground font-bold">{communityCount}</strong> from the field</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search guides, lessons, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setCategory(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-32">
              <div className="h-4 bg-muted animate-pulse rounded-full w-2/3 mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded-full w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : (articles ?? []).length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-card/40">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-1">No articles yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Be the first to share a guide, or promote a lesson from your execution journal.
          </p>
          {token && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNewDialog(true)}>
              <PenSquare className="h-3.5 w-3.5" /> Write a Guide
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(articles ?? []).map(article => {
            const cat = getCategoryConfig(article.category);
            return (
              <Link key={article.id} href={`/knowledge/${article.slug}`}>
                <Card className="hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.color}`}>
                        {cat.icon} {cat.label}
                      </span>
                      {article.sourceType === "community" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          From the field
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2">{article.title}</h3>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mb-3 flex-1">{article.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {article.authorName ?? "Anonymous"}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {article.helpfulCount}</span>
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {article.viewCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <NewArticleDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} onSuccess={refetch} />
    </div>
  );
}
