import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  MapPin, Users, Target, TrendingUp, ChevronRight,
  Calendar, Globe, Wrench, CheckCircle2, Clock,
  Plus, Upload, MessageSquare, Bookmark, Share2,
  BarChart2, FileText, ArrowLeft, Lightbulb,
  Flag, AlertTriangle, DollarSign, Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const STAGE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  idea: { color: "text-blue-600", bg: "bg-blue-50 border-blue-100", label: "Idea" },
  planning: { color: "text-amber-600", bg: "bg-amber-50 border-amber-100", label: "Planning" },
  building: { color: "text-purple-600", bg: "bg-purple-50 border-purple-100", label: "Building" },
  testing: { color: "text-orange-600", bg: "bg-orange-50 border-orange-100", label: "Testing" },
  operating: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", label: "Operating" },
  scaling: { color: "text-primary", bg: "bg-teal-50 border-teal-100", label: "Scaling" },
  completed: { color: "text-gray-600", bg: "bg-gray-50 border-gray-100", label: "Completed" },
};

const MOCK_PROJECT = {
  id: 1,
  title: "Community Pepper Processing Hub",
  description: "Building a shared pepper drying, processing, and packaging facility that serves 200+ smallholder farmers in Kaduna State. The facility will reduce post-harvest losses by 60%, increase farmer income by 40%, and create 35 permanent local jobs.",
  industry: "Agriculture",
  subIndustry: "Pepper Processing",
  product: "Scotch Bonnet Pepper",
  location: "Kaduna, Nigeria",
  stage: "building",
  progress: 45,
  goal: "Build a shared pepper drying and packaging facility serving 200+ farmers",
  fundingNeed: "$85,000",
  owner: { name: "Chidi Nwankwo", role: "Agripreneur", initials: "CN" },
  teamMembers: [
    { name: "Amara Okafor", role: "Processing Engineer", initials: "AO" },
    { name: "Bisi Adeyemi", role: "Market Coordinator", initials: "BA" },
    { name: "Grace Okeke", role: "Community Liaison", initials: "GO" },
  ],
  collaboratorsNeeded: [
    { role: "Packaging Specialist", count: 1 },
    { role: "Equipment Supplier", count: 2 },
    { role: "Logistics Partner", count: 1 },
    { role: "Marketing Lead", count: 1 },
  ],
  milestones: [
    { title: "Feasibility study complete", done: true, date: "Jan 2026" },
    { title: "Land secured and approved", done: true, date: "Feb 2026" },
    { title: "Equipment procurement", done: false, date: "Mar 2026" },
    { title: "Construction complete", done: false, date: "May 2026" },
    { title: "First processing batch", done: false, date: "Jun 2026" },
  ],
  updates: [
    {
      id: 1,
      author: "Chidi Nwankwo",
      initials: "CN",
      content: "Land purchase agreement signed this week. Construction permits filed with Kaduna State Government. On track for March equipment delivery.",
      date: "3 days ago",
      likes: 14,
    },
    {
      id: 2,
      author: "Amara Okafor",
      initials: "AO",
      content: "Equipment sourcing complete. Comparing quotes from 3 suppliers — Nairobi Industrial, Lagos Machimex, and a German firm via AfDB trade portal.",
      date: "1 week ago",
      likes: 8,
    },
  ],
  tags: ["Food Processing", "Cooperative", "Post-Harvest", "SmallholderFarmers"],
  risks: [
    "Equipment import delays due to port congestion",
    "Seasonal pepper availability gap during build phase",
  ],
};

type Tab = "overview" | "milestones" | "team" | "updates" | "documents";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const project = MOCK_PROJECT;
  const stage = STAGE_CONFIG[project.stage];

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Milestones" },
    { id: "team", label: "Team" },
    { id: "updates", label: "Updates" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 -mx-4 -mt-4">
      {/* Header image area */}
      <div className="h-40 bg-gradient-to-br from-primary/20 via-teal-100 to-emerald-50 relative flex items-end">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate("/projects")}
            className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm text-gray-600">
            <Bookmark className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm text-gray-600">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pb-4">
          <Badge
            variant="outline"
            className={`text-[10px] mb-2 border ${stage?.color} ${stage?.bg}`}
          >
            {stage?.label}
          </Badge>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Title + meta */}
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight leading-snug">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Globe className="h-3 w-3" /> {project.industry} · {project.subIndustry}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" /> {project.location}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-gray-700">Overall Progress</span>
            <span className="font-bold text-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400">Funding Need</p>
                <p className="text-xs font-semibold text-gray-700">{project.fundingNeed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400">Team Size</p>
                <p className="text-xs font-semibold text-gray-700">{project.teamMembers.length + 1} members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button className="flex flex-col items-center gap-1.5 py-3 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Users className="h-4 w-4" /> Join
          </button>
          <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors">
            <Wrench className="h-4 w-4" /> Offer Resource
          </button>
          <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4" /> Follow
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">About This Project</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Project Goal</h3>
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{project.goal}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Collaborators Needed</h3>
              <div className="space-y-2">
                {project.collaboratorsNeeded.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-gray-700">{c.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{c.count} needed</span>
                      <button className="text-xs text-primary font-semibold hover:underline">Apply</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {project.risks.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Identified Risks
                </h3>
                <div className="space-y-1.5">
                  {project.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-amber-400 mt-0.5">•</span> {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <button className="w-full py-3 border border-dashed border-primary/30 rounded-xl text-sm text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                <Rocket className="h-4 w-4" /> Convert to Venture
              </button>
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{project.milestones.filter(m => m.done).length} of {project.milestones.length} complete</p>
              <button className="text-xs text-primary font-semibold">Add Milestone</button>
            </div>
            {project.milestones.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${m.done ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100"}`}>
                <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${m.done ? "text-emerald-500" : "text-gray-300"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${m.done ? "text-emerald-800 line-through" : "text-gray-900"}`}>{m.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "team" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {project.owner.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{project.owner.name}</p>
                <p className="text-xs text-gray-500">{project.owner.role}</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Owner</Badge>
            </div>
            {project.teamMembers.map((m, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-sm">{m.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.role}</p>
                </div>
                <button className="text-xs text-primary font-semibold">Message</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-3">
            <button className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Post Project Update
            </button>
            {project.updates.map((u) => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{u.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.author}</p>
                    <p className="text-xs text-gray-400">{u.date}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{u.content}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                    ❤️ {u.likes}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                    <MessageSquare className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-3">
            <button className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" /> Upload Document
            </button>
            <div className="text-center py-10 text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No documents yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
