import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ThumbsUp, Eye, User, Tag, BookOpen, GraduationCap,
  AlertTriangle, FileText, Trash2, Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

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
  sourceExecutionInstanceId: number | null;
  helpfulCount: number;
  viewCount: number;
  createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  guide: { label: "Guide", icon: <BookOpen className="h-3.5 w-3.5" />, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800" },
  lesson: { label: "Lesson", icon: <GraduationCap className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  pitfall: { label: "Pitfall", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  case_study: { label: "Case Study", icon: <FileText className="h-3.5 w-3.5" />, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
  note: { label: "Field Note", icon: <FileText className="h-3.5 w-3.5" />, color: "text-slate-600 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800" },
};

export default function KnowledgeArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const queryKey = ["knowledge-article", slug];

  const { data: article, isLoading } = useQuery<KnowledgeArticle>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/knowledge-articles/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const handleHelpful = async () => {
    if (!article) return;
    try {
      const res = await fetch(`/api/knowledge-articles/${article.id}/helpful`, { method: "POST" });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast({ variant: "destructive", description: "Failed to mark helpful." });
    }
  };

  const handleDelete = async () => {
    if (!article || !token) return;
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/knowledge-articles/${article.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast({ description: "Article deleted." });
      navigate("/knowledge");
    } catch {
      toast({ variant: "destructive", description: "Failed to delete article." });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
        <div className="h-6 bg-muted animate-pulse rounded-full w-1/3" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-24">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-semibold mb-1">Article not found</h3>
        <Link href="/knowledge"><Button size="sm" variant="outline" className="mt-3 gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to Knowledge Base</Button></Link>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[article.category] ?? CATEGORY_CONFIG.guide;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500">
      <Link href="/knowledge">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Knowledge Base
        </Button>
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.color}`}>
              {cat.icon} {cat.label}
            </span>
            {article.sourceType === "community" && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                From the field
              </span>
            )}
            {article.industry && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {article.industry}
              </span>
            )}
          </div>

          <h1 className="text-lg font-bold font-display tracking-tight mb-2">{article.title}</h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 pb-5 border-b border-border/50">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {article.authorName ?? "Anonymous"}</span>
            <span>{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}</span>
            {article.sourceExecutionInstanceId && (
              <Link href={`/executions`}>
                <span className="text-primary hover:underline">View source execution</span>
              </Link>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {article.content}
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5 pt-5 border-t border-border/50">
              {article.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-border/50">
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleHelpful}>
                <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({article.helpfulCount})
              </Button>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> {article.viewCount} views
              </span>
            </div>
            {user?.id === article.authorId && (
              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-destructive/70 hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
