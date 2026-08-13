import { useState, useEffect } from "react";
import {
  useGetMe,
  getGetMeQueryKey,
  useUpdateUser,
  useListVentures,
  getListVenturesQueryKey,
  useRequestVerification,
  useGetFollowStatus,
  getGetFollowStatusQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, Clock, ShieldAlert, MapPin, Phone, Mail,
  Loader2, Save, Building, Globe, ShieldCheck, Send, Rocket,
  Link2, User, Briefcase, Plus, X, Factory, ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import {
  AFRICAN_COUNTRIES, INDUSTRY_SECTORS, SPECIFIC_ACTIVITIES, VENTURE_TYPES,
} from "@/lib/countries";

function TagInput({
  label, tags, setTags, placeholder,
}: {
  label: string;
  tags: string[];
  setTags: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput("");
    }
  };
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <Badge key={t} variant="secondary" className="gap-1 text-xs">
            {t}
            <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [form, setForm] = useState<any>({});

  const { data: user, isLoading: userLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const { data: ventures, isLoading: venturesLoading } = useListVentures({
    query: { queryKey: getListVenturesQueryKey() },
  });

  const { data: followStatus } = useGetFollowStatus(authUser?.id ?? 0, {
    query: {
      enabled: !!authUser?.id,
      queryKey: getGetFollowStatusQueryKey(authUser?.id ?? 0),
    },
  });

  const updateMutation = useUpdateUser();
  const verifyMutation = useRequestVerification();

  const initForm = () => {
    if (!user) return;
    setForm({
      name: user.name,
      bio: user.bio || "",
      country: user.country,
      industry: user.industry,
      role: user.role,
      whatsapp: user.whatsapp || "",
      phone: (user as any).phone || "",
      website: (user as any).website || "",
      stateCity: (user as any).stateCity || "",
      isBusiness: (user as any).isBusiness ?? false,
      businessName: (user as any).businessName || "",
      businessRegistrationNumber: (user as any).businessRegistrationNumber || "",
      publicSlug: (user as any).publicSlug || generateSlug(user.name),
      skills: user.skills ?? [],
      interests: user.interests ?? [],
      subIndustries: (user as any).subIndustries ?? [],
      primaryProducts: (user as any).primaryProducts ?? [],
      services: (user as any).services ?? [],
    });
  };

  useEffect(() => {
    if (user && !isEditing) initForm();
  }, [user]);

  const handleEditToggle = () => {
    if (!isEditing) initForm();
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (!user) return;
    updateMutation.mutate(
      { id: user.id, data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setIsEditing(false);
          toast({ description: "Profile updated." });
        },
        onError: () => toast({ variant: "destructive", description: "Failed to update profile." }),
      }
    );
  };

  const handleRequestVerification = () => {
    if (!user) return;
    verifyMutation.mutate(
      { id: user.id, data: { notes: verifyMessage.trim() || undefined, targetType: "user" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setShowVerifyForm(false);
          setVerifyMessage("");
          toast({ title: "Verification Requested", description: "A Field Agent will review your profile shortly." });
        },
        onError: () => toast({ variant: "destructive", description: "Failed to submit verification request." }),
      }
    );
  };

  if (userLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
  if (!user) return null;

  const u = user as any;
  const isBusiness = isEditing ? form.isBusiness : (u.isBusiness ?? false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Identity Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your professional presence on Bizny</p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={handleEditToggle}
          size="sm"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-5 pb-5">
          {/* Avatar + badge */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-4 border-card flex items-center justify-center text-primary text-2xl font-bold font-display overflow-hidden shadow-sm">
              {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
              user.verificationStatus === "verified"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                : user.verificationStatus === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {user.verificationStatus === "verified" && <CheckCircle2 className="h-3 w-3" />}
              {user.verificationStatus === "pending" && <Clock className="h-3 w-3" />}
              {user.verificationStatus === "unverified" && <ShieldAlert className="h-3 w-3" />}
              {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
            </div>
          </div>

          {!isEditing ? (
            <>
              <h2 className="font-display font-bold text-xl">{user.name}</h2>
              {isBusiness && u.businessName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building className="h-3.5 w-3.5" /> {u.businessName}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">{user.role} · {user.industry}</p>
              {u.publicSlug && (
                <p className="text-xs text-primary/60 mt-0.5 font-mono">@{u.publicSlug}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">
                  <span className="font-bold text-foreground">{followStatus?.followersCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </span>
                <span className="text-sm">
                  <span className="font-bold text-foreground">{followStatus?.followingCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </span>
              </div>
              {user.bio && (
                <p className="text-sm text-foreground mt-3 leading-relaxed">{user.bio}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
                {(u.stateCity || user.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[u.stateCity, user.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
                {user.whatsapp && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {user.whatsapp}
                  </span>
                )}
                {u.website && (
                  <a href={u.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-3 w-3" />
                    {u.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
              </div>
            </>
          ) : (
            /* Edit form */
            <div className="space-y-1">
              {/* Personal / Business tab */}
              <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4 w-fit">
                {(["personal", "business"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    {tab === "personal" ? <><User className="h-3 w-3 inline mr-1" />Personal</> : <><Building className="h-3 w-3 inline mr-1" />Business</>}
                  </button>
                ))}
              </div>

              {activeTab === "personal" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Full name</label>
                      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, publicSlug: generateSlug(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Public slug</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                        <Input value={form.publicSlug} onChange={e => setForm({ ...form, publicSlug: e.target.value })} className="pl-7 font-mono text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Bio</label>
                    <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="resize-none" rows={3} placeholder="Your professional background and focus..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Country</label>
                      <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">State / City</label>
                      <Input value={form.stateCity} onChange={e => setForm({ ...form, stateCity: e.target.value })} placeholder="Lagos, Nairobi..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Industry</label>
                      <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Role</label>
                      <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Farmer, Industrial Enthusiast..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">WhatsApp</label>
                      <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+234..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Phone</label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Website</label>
                    <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
                  </div>
                  <TagInput label="Skills" tags={form.skills} setTags={v => setForm({ ...form, skills: v })} placeholder="e.g. Agronomy, Welding, Logistics..." />
                  <TagInput label="Industrial Interests" tags={form.interests} setTags={v => setForm({ ...form, interests: v })} placeholder="e.g. Solar energy, Cassava processing..." />
                  <TagInput label="Sub-industries / Specialisations" tags={form.subIndustries} setTags={v => setForm({ ...form, subIndustries: v })} placeholder="e.g. Organic farming, Cold chain..." />
                </div>
              )}

              {activeTab === "business" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <input
                      type="checkbox"
                      id="isBusiness"
                      checked={form.isBusiness}
                      onChange={e => setForm({ ...form, isBusiness: e.target.checked })}
                      className="rounded w-4 h-4"
                    />
                    <label htmlFor="isBusiness" className="text-sm font-semibold">I represent a registered business or organisation</label>
                  </div>
                  {form.isBusiness && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Business name</label>
                          <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Eze Farms Ltd." />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Reg. number</label>
                          <Input value={form.businessRegistrationNumber} onChange={e => setForm({ ...form, businessRegistrationNumber: e.target.value })} placeholder="RC1234567" />
                        </div>
                      </div>
                      <TagInput label="Primary products" tags={form.primaryProducts} setTags={v => setForm({ ...form, primaryProducts: v })} placeholder="e.g. Cassava starch, Palm oil..." />
                      <TagInput label="Services offered" tags={form.services} setTags={v => setForm({ ...form, services: v })} placeholder="e.g. Cold chain logistics, Training..." />
                    </>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills / Interests / Sub-industries (view mode) */}
      {!isEditing && (
        <div className="grid grid-cols-1 gap-4">
          {((user.skills ?? []).length > 0 || (user.interests ?? []).length > 0 || u.subIndustries?.length > 0) ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="space-y-4">
                {(user.skills ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.skills ?? []).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {(user.interests ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Industrial Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.interests ?? []).map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                    </div>
                  </div>
                )}
                {u.subIndustries?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Factory className="h-3 w-3" /> Specialisations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {u.subIndustries.map((s: string) => <Badge key={s} variant="secondary" className="text-xs bg-primary/5 text-primary border-primary/15">{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Business card (view mode) */}
          {isBusiness && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> Business Profile
              </p>
              <div className="space-y-2">
                {u.businessName && <p className="font-semibold text-foreground">{u.businessName}</p>}
                {u.businessRegistrationNumber && <p className="text-xs text-muted-foreground">Reg: {u.businessRegistrationNumber}</p>}
                {u.primaryProducts?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1.5">Products</p>
                    <div className="flex flex-wrap gap-1.5">
                      {u.primaryProducts.map((p: string) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {u.services?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-1.5">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {u.services.map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ventures */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-foreground">Active Ventures</p>
          <Link href="/ventures/new">
            <button className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              <Plus className="h-3 w-3" /> New
            </button>
          </Link>
        </div>
        {venturesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : !ventures || ventures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            <Rocket className="h-8 w-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm">No ventures yet.</p>
            <Link href="/ventures/new">
              <button className="text-xs text-primary font-semibold mt-1 hover:underline">Start one now</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {ventures.map(v => (
              <Link key={v.id} href={`/ventures/${v.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 bg-muted/30 cursor-pointer group">
                  <div>
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{v.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Day {v.currentDay} · {Math.round(v.progressPercent)}% complete</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{v.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Network stats */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Network Stats</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{ventures?.filter(v => v.status === "active").length ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active Ventures</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-2xl font-bold text-foreground">{ventures?.filter(v => v.status === "completed").length ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{new Date(u.createdAt || Date.now()).getFullYear()}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Member Since</p>
          </div>
        </div>
      </div>

      {/* Field Agent Verification */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Field Agent Verification</p>
          </div>
          <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            user.verificationStatus === "verified"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : user.verificationStatus === "pending"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
          }`}>
            {user.verificationStatus === "verified" && "✓ Verified"}
            {user.verificationStatus === "pending" && "⏳ Under Review"}
            {user.verificationStatus === "unverified" && "Not Verified"}
          </div>
        </div>

        {/* Verified state */}
        {user.verificationStatus === "verified" && (
          <div className="p-5">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Your identity is verified</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  You carry a trust badge across the Bizny network. Verified profiles receive priority visibility on the Marketplace, increased deal trust, and can apply for Field Agent status.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Trust Badge", desc: "Visible on all posts & listings" },
                { label: "Priority Listing", desc: "Marketplace priority placement" },
                { label: "Deal Trust", desc: "Partners prefer verified users" },
              ].map(b => (
                <div key={b.label} className="p-3 bg-muted/30 rounded-xl border border-border text-center">
                  <p className="text-xs font-semibold text-foreground">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending state */}
        {user.verificationStatus === "pending" && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Verification in progress</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  A Field Agent has been assigned to review your profile. They may contact you via WhatsApp or phone to confirm your identity and business activity.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What to expect</p>
            <div className="space-y-2.5">
              {[
                { step: "1", label: "Field Agent Contact", desc: "A local agent may call or WhatsApp you within 3–7 days" },
                { step: "2", label: "Document Review", desc: "They may ask for your business registration or ID" },
                { step: "3", label: "Site Visit (optional)", desc: "For business verification, an in-person visit may be arranged" },
                { step: "4", label: "Status Update", desc: "You'll be notified when verification is complete" },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-amber-700">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unverified — request form */}
        {user.verificationStatus === "unverified" && (
          <div className="p-5 space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm font-semibold text-foreground mb-1">Why get verified?</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  "Trust badge on all posts",
                  "Marketplace priority",
                  "Partners prefer verified users",
                  "Deal Desk credibility",
                  "Eligible for Field Agent status",
                  "Access to premium opportunities",
                ].map(b => (
                  <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {b}
                  </div>
                ))}
              </div>
            </div>

            {!showVerifyForm ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Before you request — prepare these</p>
                <div className="space-y-2">
                  {[
                    { label: "Valid government-issued ID", desc: "National ID, passport, or driver's license" },
                    { label: "Business registration (if applicable)", desc: "CAC certificate, BRELA, or equivalent" },
                    { label: "Contact information", desc: "Ensure your phone and WhatsApp are up to date" },
                    { label: "Business description", desc: "Clear description of your activity or business" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2.5 text-xs">
                      <div className="h-4 w-4 rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-white" onClick={() => setShowVerifyForm(true)}>
                  <ShieldCheck className="h-4 w-4" /> Request Field Agent Verification
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Describe your business or professional activity</p>
                  <Textarea
                    value={verifyMessage}
                    onChange={e => setVerifyMessage(e.target.value)}
                    placeholder="e.g. I run a solar installation business in Kano. I have 4 employees and we have completed 12 installations since 2022. CAC registered as SunTech Solar Ltd (RC 1234567)."
                    className="text-sm resize-none h-28 bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    A Field Agent will contact you via WhatsApp or phone within 3–7 business days. Ensure your contact details are accurate in your profile.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-white"
                    onClick={handleRequestVerification}
                    disabled={verifyMutation.isPending || !verifyMessage.trim()}
                  >
                    {verifyMutation.isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                      : <><Send className="h-3.5 w-3.5" /> Submit Request</>
                    }
                  </Button>
                  <Button variant="outline" onClick={() => setShowVerifyForm(false)} className="border-gray-200">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
