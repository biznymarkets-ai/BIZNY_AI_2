import { useState } from "react";
import { Link } from "wouter";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useListFeed,
  getListFeedQueryKey,
  useListPostComments,
  getListPostCommentsQueryKey,
  useCreatePostComment,
  useFollowUser,
  useUnfollowUser,
  useGetFollowStatus,
  getGetFollowStatusQueryKey,
  useReactToPost,
  useRepostPost,
  useSavePost,
  useUnsavePost,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Heart, HelpCircle, MessageSquare, TrendingUp, Target,
  Send, Loader2, CheckCircle2, ChevronDown, ChevronUp,
  UserPlus, UserCheck, Rocket, Award, Globe, Briefcase,
  BookOpen, ShoppingBag, Lightbulb, Share2, ShieldCheck,
  Repeat2, MoreHorizontal, Users, Zap, ArrowRight, MapPin,
  Factory, Link2, Paperclip, Bookmark, BookmarkCheck, Pen,
  X as XIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const POST_TYPE_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  share:              { label: "Share",       icon: <Share2 className="h-3 w-3" />,     bg: "bg-blue-50",    text: "text-blue-600" },
  question:           { label: "Question",    icon: <HelpCircle className="h-3 w-3" />, bg: "bg-violet-50",  text: "text-violet-600" },
  request:            { label: "Request",     icon: <MessageSquare className="h-3 w-3" />, bg: "bg-orange-50", text: "text-orange-600" },
  opportunity:        { label: "Opportunity", icon: <Briefcase className="h-3 w-3" />,  bg: "bg-emerald-50", text: "text-emerald-600" },
  template:           { label: "Template",    icon: <BookOpen className="h-3 w-3" />,   bg: "bg-teal-50",    text: "text-teal-600" },
  venture_progress:   { label: "Progress",    icon: <Rocket className="h-3 w-3" />,     bg: "bg-cyan-50",    text: "text-cyan-600" },
  milestone:          { label: "Milestone",   icon: <Award className="h-3 w-3" />,      bg: "bg-yellow-50",  text: "text-yellow-600" },
  marketplace_listing:{ label: "Listing",     icon: <ShoppingBag className="h-3 w-3" />, bg: "bg-pink-50",  text: "text-pink-600" },
  industry_insight:   { label: "Insight",     icon: <Lightbulb className="h-3 w-3" />,  bg: "bg-amber-50",   text: "text-amber-600" },
  verification_update:{ label: "Verified",    icon: <ShieldCheck className="h-3 w-3" />, bg: "bg-green-50", text: "text-green-600" },
};

const POST_TYPE_ACTIONS: Record<string, { label: string; icon: React.ReactNode }[]> = {
  question:           [{ label: "Answer", icon: <MessageSquare className="h-3 w-3" /> }, { label: "Ask AI-Assist", icon: <Zap className="h-3 w-3" /> }],
  request:            [{ label: "Respond", icon: <Send className="h-3 w-3" /> }, { label: "Interested", icon: <CheckCircle2 className="h-3 w-3" /> }],
  opportunity:        [{ label: "Apply", icon: <ArrowRight className="h-3 w-3" /> }, { label: "Interested", icon: <CheckCircle2 className="h-3 w-3" /> }],
  marketplace_listing:[{ label: "Enquire", icon: <MessageSquare className="h-3 w-3" /> }, { label: "WhatsApp", icon: <Share2 className="h-3 w-3" /> }],
  template:           [{ label: "Use Template", icon: <BookOpen className="h-3 w-3" /> }],
  venture_progress:   [{ label: "Follow Venture", icon: <Rocket className="h-3 w-3" /> }],
  milestone:          [{ label: "Celebrate", icon: <Award className="h-3 w-3" /> }],
  industry_insight:   [{ label: "Ask AI-Assist", icon: <Zap className="h-3 w-3" /> }],
};

function PostTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const meta = POST_TYPE_META[type];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function FollowButton({ targetUserId }: { targetUserId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const isSelf = !user || user.id === targetUserId;

  const { data: status, isLoading } = useGetFollowStatus(targetUserId, {
    query: { enabled: !isSelf, queryKey: getGetFollowStatusQueryKey(targetUserId) },
  });

  if (isSelf || isLoading) return null;
  const isFollowing = status?.following ?? false;
  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <button
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        const opts = {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetFollowStatusQueryKey(targetUserId) }),
          onError: () => toast({ variant: "destructive", description: "Action failed." }),
        };
        isFollowing ? unfollowMutation.mutate({ id: targetUserId }, opts) : followMutation.mutate({ id: targetUserId }, opts);
      }}
      className={`ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium shrink-0 ${
        isFollowing
          ? "border-gray-200 text-gray-500 bg-gray-50 hover:border-red-200 hover:text-red-500"
          : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
      }`}
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

function CommentThread({ postId }: { postId: number }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: comments, isLoading } = useListPostComments(postId, {
    query: { queryKey: getListPostCommentsQueryKey(postId) },
  });
  const createComment = useCreatePostComment();

  const handleSubmit = () => {
    if (!text.trim()) return;
    createComment.mutate(
      { id: postId, data: { content: text.trim() } },
      {
        onSuccess: () => { setText(""); queryClient.invalidateQueries({ queryKey: getListPostCommentsQueryKey(postId) }); },
        onError: () => toast({ variant: "destructive", description: "Failed to post comment." }),
      }
    );
  };

  return (
    <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
      ) : comments?.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-1">No replies yet</p>
      ) : (
        <div className="space-y-2.5">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="h-6 w-6 shrink-0 border border-gray-100">
                <AvatarImage src={c.author?.avatarUrl || ""} />
                <AvatarFallback className="text-[9px] bg-gray-100 text-gray-600">{c.author?.name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{c.author?.name}</span>
                  <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(c.createdAt))} ago</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply…"
          className="flex-1 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-all text-foreground"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        />
        <button
          disabled={!text.trim() || createComment.isPending}
          onClick={handleSubmit}
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {createComment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, onReact, openComments, onToggleComments }: {
  post: any;
  onReact: (type: "love" | "unsure") => void;
  openComments: boolean;
  onToggleComments: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userReaction = post.userReaction as "love" | "unsure" | null;
  const postType = (post as any).postType as string | null;
  const typeActions = postType ? (POST_TYPE_ACTIONS[postType] ?? []) : [];
  const isRepost = !!(post as any).repostOf;
  const originalPost = (post as any).originalPost;

  const [repostSheetOpen, setRepostSheetOpen] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteText, setQuoteText] = useState("");

  const repostMutation = useRepostPost();
  const saveMutation = useSavePost();
  const unsaveMutation = useUnsavePost();
  const isSaved = !!(post as any).isSaved;

  const handleRepost = () => {
    repostMutation.mutate(
      { id: post.id, data: {} },
      {
        onSuccess: () => {
          setRepostSheetOpen(false);
          queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
          toast({ description: "Reposted." });
        },
        onError: () => toast({ variant: "destructive", description: "Repost failed." }),
      }
    );
  };

  const handleQuoteRepost = () => {
    if (!quoteText.trim()) return;
    repostMutation.mutate(
      { id: post.id, data: { comment: quoteText.trim() } },
      {
        onSuccess: () => {
          setRepostSheetOpen(false);
          setQuoteText("");
          setQuoteMode(false);
          queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
          toast({ description: "Quote posted." });
        },
        onError: () => toast({ variant: "destructive", description: "Failed to quote post." }),
      }
    );
  };

  const handleSave = () => {
    if (isSaved) {
      unsaveMutation.mutate(
        { id: post.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
            toast({ description: "Post removed from saved." });
          },
        }
      );
    } else {
      saveMutation.mutate(
        { id: post.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
            toast({ description: "Post saved." });
          },
        }
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Repost banner */}
      {isRepost && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Repeat2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {post.author?.name} reposted
          </span>
        </div>
      )}

      {/* Original post preview (for reposts) */}
      {isRepost && originalPost && (
        <div className="mx-4 mb-2 mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={originalPost.author?.avatarUrl || ""} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {originalPost.author?.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{originalPost.author?.name}</span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">{originalPost.author?.role}</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{originalPost.content}</p>
        </div>
      )}

      {/* Post header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar className="h-10 w-10 shrink-0 border border-gray-100 dark:border-gray-700">
          <AvatarImage src={post.author?.avatarUrl || ""} />
          <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
            {post.author?.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.author?.name}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-[11px] text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </span>
            <PostTypeBadge type={postType} />
          </div>
          {post.author?.role && (
            <p className="text-[11px] text-gray-400 mt-0.5">{post.author.role}</p>
          )}
        </div>
        {post.author?.id && !isRepost && <FollowButton targetUserId={post.author.id} />}
      </div>

      {/* Content (skip for pure reposts with no quote) */}
      {(!isRepost || (post.content && post.content.trim())) && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Industrial stamps */}
          {((post as any).mainIndustry || (post as any).activityTag || (post as any).valueChainStage) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(post as any).mainIndustry && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/15">
                  <Factory className="h-2.5 w-2.5" />{(post as any).mainIndustry}
                </span>
              )}
              {(post as any).activityTag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {(post as any).activityTag}
                </span>
              )}
              {(post as any).valueChainStage && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {(post as any).valueChainStage}
                </span>
              )}
            </div>
          )}

          {/* Location */}
          {((post as any).locationName || (post as any).stateCity) && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] text-primary font-medium">
                {[(post as any).stateCity, (post as any).locationName].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}

          {/* Media previews */}
          {(post as any).mediaUrls && Array.isArray((post as any).mediaUrls) && (post as any).mediaUrls.length > 0 && (
            <div className={`mt-3 grid gap-1.5 ${(post as any).mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {((post as any).mediaUrls as string[]).map((url: string, i: number) => (
                url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                  <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-72" />
                ) : url.match(/\.(mp4|webm)/i) ? (
                  <video key={i} src={url} controls className="w-full rounded-xl max-h-72" />
                ) : (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted text-sm text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-4 w-4 shrink-0" /> Attachment {i + 1}
                  </a>
                )
              ))}
            </div>
          )}

          {/* Legacy single mediaUrl */}
          {!(post as any).mediaUrls && (post as any).mediaUrl && (
            <img src={(post as any).mediaUrl} alt="" className="mt-3 w-full rounded-xl object-cover max-h-72" />
          )}

          {/* Link */}
          {(post as any).linkUrl && (
            <a href={(post as any).linkUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 mt-2 text-[11px] text-primary hover:underline">
              <Link2 className="h-3 w-3" /> {(post as any).linkUrl}
            </a>
          )}
        </div>
      )}

      {/* Post-type specific actions */}
      {typeActions.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {typeActions.map((action, i) => (
            <button key={i}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Reaction bar */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-gray-50 dark:border-gray-800">
        {/* Love */}
        <button onClick={() => onReact("love")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            userReaction === "love" ? "bg-red-50 text-red-500 dark:bg-red-950/30" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}>
          <Heart className={`h-4 w-4 ${userReaction === "love" ? "fill-current" : ""}`} />
          <span>{post.loves ?? 0}</span>
        </button>

        {/* Unsure */}
        <button onClick={() => onReact("unsure")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            userReaction === "unsure" ? "bg-violet-50 text-violet-500 dark:bg-violet-950/30" : "text-gray-400 hover:text-violet-500 hover:bg-violet-50"
          }`}
          title="Unsure / needs more clarity">
          <HelpCircle className={`h-4 w-4 ${userReaction === "unsure" ? "fill-current" : ""}`} />
          <span>{post.unsures ?? 0}</span>
        </button>

        {/* Comments */}
        <button onClick={onToggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            openComments ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-primary hover:bg-primary/5"
          }`}>
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments ?? 0}</span>
          {openComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Repost */}
        <button
          onClick={() => setRepostSheetOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            (post as any).reposts > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          }`}>
          <Repeat2 className="h-4 w-4" />
          {(post as any).reposts > 0 && <span>{(post as any).reposts}</span>}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || unsaveMutation.isPending}
          className={`ml-auto p-1.5 rounded-full transition-all ${
            isSaved ? "text-primary bg-primary/10" : "text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title={isSaved ? "Unsave" : "Save"}>
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      {/* Comments section */}
      {openComments && <CommentThread postId={post.id} />}

      {/* Repost sheet */}
      <Sheet open={repostSheetOpen} onOpenChange={(open) => {
        setRepostSheetOpen(open);
        if (!open) { setQuoteMode(false); setQuoteText(""); }
      }}>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[70vh]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-display font-bold text-base text-foreground">
              {quoteMode ? "Quote Post" : "Repost"}
            </h2>
            <button onClick={() => setRepostSheetOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Original post preview */}
            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={post.author?.avatarUrl || ""} />
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{post.author?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground">{post.author?.name}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
            </div>

            {!quoteMode ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleRepost}
                  disabled={repostMutation.isPending}
                  className="h-12 rounded-xl flex flex-col gap-0.5"
                  variant="outline"
                >
                  {repostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
                  <span className="text-xs">Repost</span>
                </Button>
                <Button
                  onClick={() => setQuoteMode(true)}
                  className="h-12 rounded-xl flex flex-col gap-0.5"
                  variant="outline"
                >
                  <Pen className="h-4 w-4" />
                  <span className="text-xs">Quote Post</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  autoFocus
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Add your comment…"
                  className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-background border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary/40 resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleQuoteRepost}
                  disabled={!quoteText.trim() || repostMutation.isPending}
                  className="w-full rounded-xl"
                >
                  {repostMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Quote & Share
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

const PROGRESS_TYPES = new Set(["milestone", "venture_progress"]);

function MilestonePostCard({ post, onReact, openComments, onToggleComments }: {
  post: any;
  onReact: (type: "love" | "unsure") => void;
  openComments: boolean;
  onToggleComments: () => void;
}) {
  const progress = (post as any).progressPercent as number | null;
  const milestoneTag = (post as any).milestoneTag as string | null;
  const instanceId = (post as any).executionInstanceId as number | null;
  const userReaction = post.userReaction as "love" | "unsure" | null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border-l-4 border-l-slate-500 border border-slate-200 dark:border-slate-800/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <Avatar className="h-9 w-9 shrink-0 border-2 border-slate-200 dark:border-slate-700">
          <AvatarImage src={post.author?.avatarUrl || ""} />
          <AvatarFallback className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700">
            {post.author?.name?.charAt(0) ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{post.author?.name}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              <Award className="h-2.5 w-2.5" /> Milestone
            </span>
            <span className="text-[11px] text-gray-400">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
          </div>
          {post.author?.role && <p className="text-[11px] text-gray-400 mt-0.5">{post.author.role}</p>}
        </div>
        {progress !== null && progress !== undefined && (
          <div className="shrink-0 flex flex-col items-center">
            <span className="text-xl font-black text-primary leading-none">{progress}%</span>
            <span className="text-[9px] text-muted-foreground font-semibold">progress</span>
          </div>
        )}
      </div>

      {/* Milestone tag */}
      {milestoneTag && (
        <div className="px-4 pb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {milestoneTag}
          </span>
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && progress !== undefined && (
        <div className="px-4 pb-2">
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Evidence photos */}
        {(post as any).mediaUrls && Array.isArray((post as any).mediaUrls) && (post as any).mediaUrls.length > 0 && (
          <div className={`mt-3 grid gap-1.5 ${(post as any).mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {((post as any).mediaUrls as string[]).map((url: string, i: number) => (
              url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-56 border border-teal-100" />
              ) : (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-teal-100 bg-teal-50/50 text-xs text-teal-700">
                  <Paperclip className="h-3.5 w-3.5" /> Evidence {i + 1}
                </div>
              )
            ))}
          </div>
        )}

        {/* Location + industry tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(post as any).mainIndustry && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/15">
              <Factory className="h-2.5 w-2.5" />{(post as any).mainIndustry}
            </span>
          )}
          {(post as any).stateCity && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />{(post as any).stateCity}
            </span>
          )}
        </div>
      </div>

      {/* Execution link */}
      {instanceId && (
        <div className="px-4 pb-3">
          <Link href={`/executions`}>
            <span className="text-[11px] text-primary hover:underline flex items-center gap-1">
              <Rocket className="h-3 w-3" /> View execution →
            </span>
          </Link>
        </div>
      )}

      {/* Reaction bar */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-t border-border">
        <button onClick={() => onReact("love")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            userReaction === "love" ? "bg-red-50 text-red-500" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          }`}>
          <Heart className={`h-4 w-4 ${userReaction === "love" ? "fill-current" : ""}`} />
          <span>{post.loves ?? 0}</span>
        </button>
        <button onClick={onToggleComments}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            openComments ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-primary hover:bg-primary/5"
          }`}>
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments ?? 0}</span>
          {openComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <Award className="h-3 w-3" /> Milestone completed
        </span>
      </div>
      {openComments && <CommentThread postId={post.id} />}
    </div>
  );
}

function ComposePrompt({ user, onCompose }: { user: any; onCompose: () => void }) {
  return (
    <button
      onClick={onCompose}
      className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm hover:border-primary/30 transition-colors text-left"
    >
      <Avatar className="h-8 w-8 shrink-0 border border-gray-100 dark:border-gray-700">
        <AvatarImage src={user?.avatarUrl || ""} />
        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
          {user?.name?.charAt(0).toUpperCase() ?? "U"}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm text-muted-foreground">
        What's happening in your industry?
      </span>
      <span className="shrink-0 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
        Post
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [feedMode, setFeedMode] = useState<"general" | "progress">("general");
  const [showCompose, setShowCompose] = useState(false);

  const { data: stats } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: feedPosts, isLoading: feedLoading } = useListFeed(undefined, {
    query: { queryKey: getListFeedQueryKey() },
  });

  const reactMutation = useReactToPost();

  const toggleComments = (postId: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const handleReact = (postId: number, type: "love" | "unsure") => {
    reactMutation.mutate(
      { id: postId, data: { type } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() }),
        onError: () => toast({ variant: "destructive", description: "Reaction failed." }),
      }
    );
  };

  const visible = feedMode === "progress"
    ? (feedPosts ?? []).filter(p => PROGRESS_TYPES.has((p as any).postType ?? ""))
    : (feedPosts ?? []);

  return (
    <div className="animate-in fade-in duration-300 space-y-0">

      {/* ── Compact top bar: network pulse + feed tabs ─────────────────── */}
      <div className="flex items-center justify-between mb-3">
        {/* Tiny network stats inline */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {stats && (
            <>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" />
                <strong className="text-foreground font-bold">{stats.totalUsers?.toLocaleString()}</strong> members
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1">
                <Rocket className="h-3 w-3 text-primary" />
                <strong className="text-foreground font-bold">{stats.activeVentures?.toLocaleString()}</strong> live
              </span>
            </>
          )}
        </div>

        {/* Feed mode toggle */}
        <div className="flex items-center bg-muted rounded-full p-0.5 gap-0.5">
          <button
            onClick={() => setFeedMode("general")}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
              feedMode === "general"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3 w-3" /> All
          </button>
          <button
            onClick={() => setFeedMode("progress")}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
              feedMode === "progress"
                ? "bg-background text-teal-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3 w-3" /> Progress
          </button>
        </div>
      </div>

      {/* ── Compose prompt ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <ComposePrompt user={user} onCompose={() => setShowCompose(true)} />
      </div>

      {/* ── Quick-access chips (scrollable, compact) ───────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none mb-3">
        {[
          { label: "Opportunities", href: "/opportunities", color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
          { label: "Library", href: "/templates", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700" },
          { label: "Executions", href: "/executions", color: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900" },
          { label: "Knowledge", href: "/knowledge", color: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" },
          { label: "Marketplace", href: "/marketplace", color: "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900" },
          { label: "Deal Desk", href: "/deal-desk", color: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <span className={`shrink-0 inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${link.color}`}>
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Feed ───────────────────────────────────────────────────────── */}
      {feedLoading ? (
        <FeedSkeleton />
      ) : (feedPosts ?? []).length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Globe className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No posts yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Tap the Post button above to share with the network</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-teal-100 dark:border-teal-900/30">
          <Award className="h-8 w-8 text-teal-200 dark:text-teal-800 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No progress posts yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Complete a milestone in My Executions to publish your first</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((post) => {
            const postType = (post as any).postType as string | null;
            if (postType === "milestone" || postType === "venture_progress") {
              return (
                <MilestonePostCard
                  key={post.id}
                  post={post}
                  onReact={(type) => handleReact(post.id, type)}
                  openComments={openComments.has(post.id)}
                  onToggleComments={() => toggleComments(post.id)}
                />
              );
            }
            return (
              <PostCard
                key={post.id}
                post={post}
                onReact={(type) => handleReact(post.id, type)}
                openComments={openComments.has(post.id)}
                onToggleComments={() => toggleComments(post.id)}
              />
            );
          })}
          <div className="text-center py-6 text-xs text-muted-foreground">
            You're all caught up ·{" "}
            <button onClick={() => queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() })} className="text-primary hover:underline">
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Compose sheet (triggered by prompt or layout + button) */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setShowCompose(false)}>
          <div className="w-full bg-background rounded-t-2xl border-t border-border p-5 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <ComposeBox onClose={() => setShowCompose(false)} onPosted={() => {
              setShowCompose(false);
              queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ComposeBox({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [postType, setPostTypeState] = useState("share");
  const [industry, setIndustry] = useState(user?.industry ?? "");
  const [submitting, setSubmitting] = useState(false);

  const POST_TYPES = [
    { value: "share", label: "Share" },
    { value: "question", label: "Question" },
    { value: "request", label: "Request" },
    { value: "industry_insight", label: "Insight" },
    { value: "venture_progress", label: "Progress" },
  ];

  const handlePost = async () => {
    if (!content.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), postType, mainIndustry: industry || undefined }),
      });
      if (!res.ok) throw new Error();
      onPosted();
    } catch {
      toast({ variant: "destructive", description: "Failed to post." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <textarea
        autoFocus
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening in your industry?"
        className="w-full min-h-[120px] text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none leading-relaxed"
      />

      <div className="flex gap-1.5 flex-wrap">
        {POST_TYPES.map(pt => (
          <button
            key={pt.value}
            onClick={() => setPostTypeState(pt.value)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
              postType === pt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <input
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          placeholder="Industry tag (e.g. Agriculture)"
          className="flex-1 text-xs bg-muted rounded-full px-3 py-1.5 border-0 outline-none text-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="sm"
          className="rounded-full px-5 h-8 text-xs font-bold"
          disabled={!content.trim() || submitting}
          onClick={handlePost}
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post"}
        </Button>
      </div>
    </>
  );
}
