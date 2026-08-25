import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Home, Search, Bell, Menu, X, ChevronRight,
  Compass, FolderOpen, Rocket, User, Plus,
  Briefcase, Store, BookOpen, Activity, Hand,
  Users, Target, Settings, HelpCircle, ShieldCheck,
  Globe, MessageSquare, Landmark, LogOut,
  Share2, HelpCircle as QuestionIcon, Lightbulb,
  ShoppingBag, PenSquare, Send, Loader2,
  ArrowLeft, Image, Tag, MapPin, Eye,
  Heart, Repeat2, MoreHorizontal, LayoutGrid,
  Sun, Moon, Monitor, Factory, Link2, Handshake, Paperclip, X as XIcon,
  FlaskConical, ShoppingCart, Zap, BrainCircuit, ClipboardList, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationsRead,
  useCreatePost,
  getListFeedQueryKey,
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { INDUSTRY_SECTORS, SPECIFIC_ACTIVITIES, VALUE_CHAIN_STAGES } from "@/lib/countries";
import { SyntheticUniverseBar } from "@/components/SyntheticUniverseBar";
import BiznyLogo from "@/components/BiznyLogo";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Home",
  "/explore": "Explore",
  "/repository": "Repository",
  "/directory": "Directory",
  "/projects": "Projects",
  "/ventures": "Ventures",
  "/ventures/new": "New Venture",
  "/marketplace": "Marketplace",
  "/opportunities": "Opportunities",
  "/templates": "Library",
  "/executions": "My Executions",
  "/knowledge": "Knowledge Base",
  "/updates": "Updates",
  "/copilot": "Co-pilot",
  "/clinic": "Productivity Clinic",
  "/coach": "Productivity Coach",
  "/profile": "Profile",
  "/industry-targets": "Industry Targets",
  "/deal-desk": "Deal Desk",
  "/deal-desk/new": "New Deal",
  "/innovation": "Innovation",
  "/market": "Market",
};

const BOTTOM_NAV = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/copilot", icon: Target, label: "Co-pilot" },
  { href: "/templates", icon: BookOpen, label: "Library" },
  { href: "/market", icon: Store, label: "Market" },
];

const HAMBURGER_SECTIONS = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", icon: Home, label: "Home" },
      { href: "/explore", icon: Compass, label: "Explore" },
      { href: "/templates", icon: BookOpen, label: "Library" },
      { href: "/executions", icon: Rocket, label: "My Executions" },
      { href: "/knowledge", icon: Sparkles, label: "Knowledge Base" },
      { href: "/deal-desk", icon: Handshake, label: "Deal Desk" },
    ],
  },
  {
    title: "Discover",
    items: [
      { href: "/opportunities", icon: Briefcase, label: "Opportunities" },
      { href: "/marketplace", icon: Store, label: "Marketplace" },
      { href: "/industry-targets", icon: Target, label: "Industry Targets" },
      { href: "/innovation", icon: FlaskConical, label: "Innovation" },
      { href: "/market", icon: Store, label: "Market" },
      { href: "/updates", icon: Activity, label: "Updates" },
      { href: "/directory", icon: Users, label: "Directory" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/clinic", icon: ClipboardList, label: "Productivity Clinic" },
      { href: "/coach", icon: Zap, label: "Productivity Coach" },
      { href: "/copilot", icon: Target, label: "Co-pilot" },
      { href: "/profile", icon: User, label: "Profile" },
    ],
  },
  {
    title: "Info",
    items: [
      { href: "/", icon: Globe, label: "Landing Page" },
    ],
  },
];

type ComposerPostType =
  | "share" | "question" | "request" | "opportunity"
  | "marketplace_listing" | "industry_insight" | "template"
  | "innovation_idea" | "innovation_challenge";

const COMPOSER_TYPES: {
  value: ComposerPostType;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  placeholder: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "share",
    label: "Share Something",
    subtitle: "Post an update, thought, or announcement",
    icon: <Share2 className="h-5 w-5" />,
    placeholder: "What are you building, learning, or sharing today?",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900",
  },
  {
    value: "question",
    label: "Ask a Question",
    subtitle: "Get answers from the community",
    icon: <QuestionIcon className="h-5 w-5" />,
    placeholder: "What do you need to understand?",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900",
  },
  {
    value: "request",
    label: "Request Help",
    subtitle: "Find collaborators, resources, or support",
    icon: <MessageSquare className="h-5 w-5" />,
    placeholder: "What do you need, and who can help?",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900",
  },
  {
    value: "opportunity",
    label: "Share an Opportunity",
    subtitle: "Post funding, jobs, partnerships, or projects",
    icon: <Briefcase className="h-5 w-5" />,
    placeholder: "What opportunity are you making available?",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900",
  },
  {
    value: "marketplace_listing",
    label: "List a Product or Service",
    subtitle: "Let people discover what you sell or provide",
    icon: <ShoppingBag className="h-5 w-5" />,
    placeholder: "What product, service, or supplier should people discover?",
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-100 dark:bg-pink-950/30 dark:border-pink-900",
  },
  {
    value: "industry_insight",
    label: "Share Industry Insight",
    subtitle: "Share market knowledge or analysis",
    icon: <Lightbulb className="h-5 w-5" />,
    placeholder: "What industry knowledge or market observation are you sharing?",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900",
  },
  {
    value: "template",
    label: "Create a Template",
    subtitle: "Share a repeatable process or venture blueprint",
    icon: <LayoutGrid className="h-5 w-5" />,
    placeholder: "What repeatable process or venture blueprint are you sharing?",
    color: "text-slate-600",
    bg: "bg-slate-100 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700",
  },
  {
    value: "innovation_idea",
    label: "Innovation Idea",
    subtitle: "Share a new concept or solution idea with the ecosystem",
    icon: <Lightbulb className="h-5 w-5" />,
    placeholder: "Describe your innovation — what's the idea, and what impact could it have?",
    color: "text-cyan-600",
    bg: "bg-cyan-50 border-cyan-100 dark:bg-cyan-950/30 dark:border-cyan-900",
  },
  {
    value: "innovation_challenge",
    label: "Innovation Challenge",
    subtitle: "Post an unsolved problem seeking solutions from the community",
    icon: <Zap className="h-5 w-5" />,
    placeholder: "What is the challenge? Who faces it, and what would a great solution look like?",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900",
  },
];

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

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, token } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [composerSheetOpen, setComposerSheetOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ComposerPostType>("share");
  const [composerContent, setComposerContent] = useState("");

  // Location fields
  const [locationBarOpen, setLocationBarOpen] = useState(false);
  const [composerLocation, setComposerLocation] = useState("");
  const [stateCity, setStateCity] = useState("");
  const [localArea, setLocalArea] = useState("");

  // Industry stamps
  const [stampOpen, setStampOpen] = useState(false);
  const [mainIndustry, setMainIndustry] = useState("");
  const [subIndustry, setSubIndustry] = useState("");
  const [activityTag, setActivityTag] = useState("");
  const [valueChainStage, setValueChainStage] = useState("");

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const activities = mainIndustry ? (SPECIFIC_ACTIVITIES[mainIndustry] ?? []) : [];
  const stampCount = [mainIndustry, activityTag, valueChainStage, stateCity].filter(Boolean).length;

  const currentTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    location === path || location.startsWith(path + "/")
  )?.[1] ?? "Bizny";

  const { data: notifications } = useListNotifications({
    query: { enabled: !!token, queryKey: getListNotificationsQueryKey() },
  });

  const { data: unreadData } = useGetUnreadNotificationCount({
    query: {
      enabled: !!token,
      queryKey: getGetUnreadNotificationCountQueryKey(),
      refetchInterval: 30000,
    },
  });

  const markReadMutation = useMarkNotificationsRead();
  const createPostMutation = useCreatePost();
  const unreadCount = unreadData?.count ?? 0;

  const handleOpenNotif = () => {
    setNotifOpen(true);
    if (unreadCount > 0 && notifications) {
      const ids = notifications.filter(n => !n.read).map(n => n.id);
      markReadMutation.mutate(
        { data: { ids } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
          },
        }
      );
    }
  };

  const handleSelectType = (type: ComposerPostType) => {
    setSelectedType(type);
    setComposerSheetOpen(false);
    setComposerContent("");
    setComposerLocation("");
    setStateCity("");
    setLocalArea("");
    setMainIndustry("");
    setSubIndustry("");
    setActivityTag("");
    setValueChainStage("");
    setMediaUrls([]);
    setLinkUrl("");
    setLocationBarOpen(false);
    setStampOpen(false);
    setComposerOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token) return;
    setUploadingMedia(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, token);
        urls.push(url);
      }
      setMediaUrls(prev => [...prev, ...urls]);
    } catch {
      toast({ variant: "destructive", description: "Failed to upload file." });
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canPublish = composerContent.trim().length > 0 || mediaUrls.length > 0 || linkUrl.trim().length > 0;

  const handlePublish = () => {
    const finalContent = composerContent.trim() || (mediaUrls.length > 0 ? "Shared attachment" : linkUrl.trim() ? "Shared link" : "");
    if (!finalContent) {
      toast({ description: "Please type something or attach media to post." });
      return;
    }
    createPostMutation.mutate(
      {
        data: {
          content: finalContent,
          postType: selectedType,
          ...(composerLocation.trim() ? { locationName: composerLocation.trim() } : {}),
          ...(stateCity.trim() ? { stateCity: stateCity.trim() } : {}),
          ...(localArea.trim() ? { localArea: localArea.trim() } : {}),
          ...(mainIndustry ? { mainIndustry } : {}),
          ...(subIndustry.trim() ? { subIndustry: subIndustry.trim() } : {}),
          ...(activityTag ? { activityTag } : {}),
          ...(valueChainStage ? { valueChainStage } : {}),
          ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
          ...(linkUrl.trim() ? { linkUrl: linkUrl.trim() } : {}),
        } as any,
      },
      {
        onSuccess: () => {
          setComposerOpen(false);
          setComposerContent("");
          setComposerLocation("");
          setStateCity("");
          setLocalArea("");
          setMainIndustry("");
          setSubIndustry("");
          setActivityTag("");
          setValueChainStage("");
          setMediaUrls([]);
          setLinkUrl("");
          setLocationBarOpen(false);
          setStampOpen(false);
          queryClient.invalidateQueries({ queryKey: getListFeedQueryKey() });
          toast({ description: "Post published successfully!" });
        },
        onError: () => toast({ variant: "destructive", description: "Failed to publish post. Please try again." }),
      }
    );
  };

  const typeConfig = COMPOSER_TYPES.find(t => t.value === selectedType)!;

  const themeNext = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* TOP BAR */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center px-4 z-40">
        <button
          onClick={() => setHamburgerOpen(true)}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        <div className="flex items-center gap-2 ml-2">
          <BiznyLogo size="sm" showText={false} />
          <span className="font-display font-bold text-base text-foreground tracking-tight">
            {currentTitle === "Home" ? "Bizny" : currentTitle}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={handleOpenNotif}
            className="p-2 rounded-full hover:bg-muted transition-colors relative"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setAvatarSheetOpen(true)}
            className="ml-1 rounded-full overflow-hidden border-2 border-border hover:border-primary/30 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* HAMBURGER DRAWER */}
      <Sheet open={hamburgerOpen} onOpenChange={setHamburgerOpen}>
        <SheetContent side="left" className="w-72 p-0 border-r border-border bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <BiznyLogo size="md" showText={false} />
                <div>
                  <p className="font-display font-bold text-foreground leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
                </div>
              </div>
              <button onClick={() => setHamburgerOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {HAMBURGER_SECTIONS.map((section) => (
                <div key={section.title} className="mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 py-2">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href || location.startsWith(item.href + "/");
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          onClick={() => setHamburgerOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                            {item.label}
                          </span>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary/50" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Theme toggle + logout */}
            <div className="border-t border-border p-4 space-y-1">
              <button
                onClick={() => setTheme(themeNext)}
                className="flex items-center gap-3 w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <ThemeIcon className="h-4 w-4 text-muted-foreground" />
                {theme === "light" ? "Switch to Dark" : theme === "dark" ? "Use System Theme" : "Switch to Light"}
              </button>
              <button
                onClick={() => { logout(); navigate("/login"); setHamburgerOpen(false); }}
                className="flex items-center gap-3 w-full py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* AVATAR SHEET */}
      <Sheet open={avatarSheetOpen} onOpenChange={setAvatarSheetOpen}>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[80vh]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="font-display font-bold text-foreground leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <button onClick={() => setAvatarSheetOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-y-auto pb-8">
            {[
              { icon: User, label: "My Profile", href: "/profile" },
              { icon: Settings, label: "Settings", href: "/profile" },
              { icon: ShieldCheck, label: "Verification", href: "/profile" },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href}>
                <div
                  onClick={() => setAvatarSheetOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
                </div>
              </Link>
            ))}
            <div className="border-t border-border mt-1">
              <button
                onClick={() => setTheme(themeNext)}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ThemeIcon className="h-4 w-4 text-muted-foreground" />
                {theme === "light" ? "Switch to Dark Mode" : theme === "dark" ? "Use System Theme" : "Switch to Light Mode"}
              </button>
              <button
                onClick={() => { logout(); navigate("/login"); setAvatarSheetOpen(false); }}
                className="flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* NOTIFICATIONS DRAWER */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-80 p-0 bg-background border-l border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground">Notifications</h2>
            <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-y-auto h-full pb-4">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3.5 border-b border-border ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(n.createdAt))} ago
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* COMPOSE TYPE SELECTOR */}
      <Sheet open={composerSheetOpen} onOpenChange={setComposerSheetOpen}>
        <SheetContent side="bottom" className="p-0 rounded-t-2xl border-0 bg-background max-h-[85vh]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-display font-bold text-foreground text-base">What would you like to do?</h2>
            <button onClick={() => setComposerSheetOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 pb-8">
            <div className="grid grid-cols-1 gap-2.5">
              {COMPOSER_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleSelectType(type.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm active:scale-98 ${type.bg}`}
                >
                  <div className={`shrink-0 ${type.color}`}>{type.icon}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto shrink-0" />
                </button>
              ))}

              {/* Start a Venture */}
              <Link href="/ventures/new">
                <button
                  onClick={() => setComposerSheetOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-left w-full transition-all hover:shadow-sm"
                >
                  <div className="shrink-0 text-primary"><Rocket className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">Start a Venture</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Launch a tracked production or project venture</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto shrink-0" />
                </button>
              </Link>

              {/* Create a Deal */}
              <Link href="/deal-desk/new">
                <button
                  onClick={() => setComposerSheetOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 text-left w-full transition-all hover:shadow-sm"
                >
                  <div className="shrink-0 text-emerald-700 dark:text-emerald-400"><Handshake className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">Create a Deal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Initiate a formal deal, supply agreement, or partnership</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto shrink-0" />
                </button>
              </Link>

              {/* Start a Project */}
              <Link href="/projects">
                <button
                  onClick={() => setComposerSheetOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900 text-left w-full transition-all hover:shadow-sm"
                >
                  <div className="shrink-0 text-indigo-600"><FolderOpen className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">Start a Project</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Turn an idea into a tracked project</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto shrink-0" />
                </button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* COMPOSER MODAL */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
            <button
              onClick={() => { setComposerOpen(false); }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 ${typeConfig?.color || "text-muted-foreground"}`}
            >
              {typeConfig?.label}
            </Badge>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!canPublish || createPostMutation.isPending}
              className="rounded-full px-5 h-8 text-sm font-semibold"
            >
              {createPostMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publish"}
            </Button>
          </div>

          {/* Body */}
          <div className="flex gap-3 p-4 flex-1 min-h-0 overflow-y-auto">
            <Avatar className="h-10 w-10 shrink-0 border border-border">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-2">{user?.role} · {user?.industry}</p>
              <textarea
                autoFocus
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                placeholder={typeConfig?.placeholder}
                className="flex-1 w-full resize-none text-base text-foreground placeholder:text-muted-foreground border-0 outline-none bg-transparent leading-relaxed min-h-[120px]"
                rows={6}
              />

              {/* Media previews */}
              {mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
                      {url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Paperclip className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => setMediaUrls(mediaUrls.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center"
                      >
                        <XIcon className="h-3 w-3 text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Location bar */}
              {locationBarOpen && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <input
                      type="text"
                      value={composerLocation}
                      onChange={e => setComposerLocation(e.target.value)}
                      placeholder="General location — e.g. Nairobi, Kenya"
                      className="flex-1 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none bg-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stateCity}
                      onChange={e => setStateCity(e.target.value)}
                      placeholder="State / City"
                      className="flex-1 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={localArea}
                      onChange={e => setLocalArea(e.target.value)}
                      placeholder="Local area"
                      className="flex-1 text-sm text-foreground placeholder:text-muted-foreground border-0 outline-none bg-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Industry stamp panel */}
              {stampOpen && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Factory className="h-3 w-3" /> Industrial Stamps
                  </p>
                  <select
                    value={mainIndustry}
                    onChange={e => { setMainIndustry(e.target.value); setActivityTag(""); }}
                    className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                  >
                    <option value="">Industry sector...</option>
                    {INDUSTRY_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {activities.length > 0 && (
                    <select
                      value={activityTag}
                      onChange={e => setActivityTag(e.target.value)}
                      className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                    >
                      <option value="">Specific activity...</option>
                      {activities.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  )}
                  <input
                    type="text"
                    value={subIndustry}
                    onChange={e => setSubIndustry(e.target.value)}
                    placeholder="Sub-industry / niche (optional)"
                    className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                  />
                  <select
                    value={valueChainStage}
                    onChange={e => setValueChainStage(e.target.value)}
                    className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                  >
                    <option value="">Value chain stage...</option>
                    {VALUE_CHAIN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Active stamps preview */}
              {stampCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {mainIndustry && <Badge variant="secondary" className="text-[11px] gap-1"><Factory className="h-2.5 w-2.5" />{mainIndustry}</Badge>}
                  {activityTag && <Badge variant="secondary" className="text-[11px]">{activityTag}</Badge>}
                  {valueChainStage && <Badge variant="outline" className="text-[11px]">{valueChainStage}</Badge>}
                  {stateCity && <Badge variant="outline" className="text-[11px] gap-1"><MapPin className="h-2.5 w-2.5" />{stateCity}</Badge>}
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="border-t border-border px-4 py-3 flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
              className={`p-2 rounded-full transition-colors ${uploadingMedia ? "text-primary animate-pulse" : "hover:bg-muted text-muted-foreground hover:text-primary"}`}
              title="Attach media"
            >
              {uploadingMedia ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setStampOpen(v => !v)}
              className={`p-2 rounded-full transition-colors ${stampOpen || stampCount > 0 ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-primary"}`}
              title="Industry stamp"
            >
              <Factory className="h-5 w-5" />
              {stampCount > 0 && <span className="sr-only">{stampCount} stamps</span>}
            </button>
            <button
              onClick={() => setLocationBarOpen(v => !v)}
              className={`p-2 rounded-full transition-colors ${locationBarOpen || composerLocation || stateCity ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-primary"}`}
              title="Add location"
            >
              <MapPin className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Visibility">
              <Eye className="h-5 w-5" />
            </button>
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-3">
              {composerContent.length > 0 && (
                <span className={composerContent.length > 280 ? "text-red-500" : "text-muted-foreground"}>
                  {composerContent.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main className="pt-14 pb-20 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pt-2 pb-4 space-y-3">
          <SyntheticUniverseBar />
          {children}
        </div>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => setComposerSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-40 flex items-center justify-around px-2">
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const isActive = location === href || (href !== "/dashboard" && location.startsWith(href + "/"));
          return (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-colors min-w-[56px] ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary font-semibold" : ""}`}>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
