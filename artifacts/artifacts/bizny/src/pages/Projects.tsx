import { useState } from "react";
import { Link } from "wouter";
import {
  FolderOpen, Plus, Search, MapPin, Users, ChevronRight,
  Rocket, Clock, Target, TrendingUp, Lightbulb,
  CheckCircle2, Wrench, BarChart2, Globe, Filter,
  ArrowRight, Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STAGES = [
  { id: "all", label: "All" },
  { id: "idea", label: "Idea" },
  { id: "planning", label: "Planning" },
  { id: "building", label: "Building" },
  { id: "testing", label: "Testing" },
  { id: "operating", label: "Operating" },
  { id: "scaling", label: "Scaling" },
  { id: "completed", label: "Completed" },
];

const STAGE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  idea: { color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: <Lightbulb className="h-3 w-3" /> },
  planning: { color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: <Target className="h-3 w-3" /> },
  building: { color: "text-purple-600", bg: "bg-purple-50 border-purple-100", icon: <Wrench className="h-3 w-3" /> },
  testing: { color: "text-orange-600", bg: "bg-orange-50 border-orange-100", icon: <BarChart2 className="h-3 w-3" /> },
  operating: { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: <CheckCircle2 className="h-3 w-3" /> },
  scaling: { color: "text-primary", bg: "bg-teal-50 border-teal-100", icon: <TrendingUp className="h-3 w-3" /> },
  completed: { color: "text-gray-600", bg: "bg-gray-50 border-gray-100", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const MOCK_PROJECTS = [
  {
    id: 1,
    title: "Community Pepper Processing Hub",
    industry: "Agriculture",
    subIndustry: "Pepper Processing",
    location: "Kaduna, Nigeria",
    stage: "building",
    progress: 45,
    goal: "Build a shared pepper drying and packaging facility serving 200+ farmers",
    teamCount: 8,
    nextMilestone: "Equipment procurement complete",
    owner: "Chidi Nwankwo",
    tags: ["Food Processing", "Cooperative"],
  },
  {
    id: 2,
    title: "Solar-Powered Irrigation Network",
    industry: "Agriculture",
    subIndustry: "Irrigation Infrastructure",
    location: "Machakos, Kenya",
    stage: "planning",
    progress: 20,
    goal: "Connect 50 smallholder farms to shared solar irrigation infrastructure",
    teamCount: 4,
    nextMilestone: "Land survey and mapping",
    owner: "Amara Wanjiku",
    tags: ["Renewable Energy", "Irrigation"],
  },
  {
    id: 3,
    title: "Cross-Border Logistics Cooperative",
    industry: "Logistics",
    subIndustry: "Last-Mile Distribution",
    location: "Lomé, Togo",
    stage: "idea",
    progress: 5,
    goal: "Form a cooperative of 20 small truck operators to serve ECOWAS trade routes",
    teamCount: 2,
    nextMilestone: "Founding member recruitment",
    owner: "Kwame Asante",
    tags: ["Trade", "Cooperative"],
  },
  {
    id: 4,
    title: "Textile Micro-Factory",
    industry: "Manufacturing",
    subIndustry: "Textiles & Apparel",
    location: "Accra, Ghana",
    stage: "operating",
    progress: 75,
    goal: "Produce and export African-designed clothing to EU markets under AfCFTA",
    teamCount: 12,
    nextMilestone: "First EU export order",
    owner: "Efua Mensah",
    tags: ["Export", "AfCFTA", "Textiles"],
  },
  {
    id: 5,
    title: "Cold Storage Network — Northern Uganda",
    industry: "Agriculture",
    subIndustry: "Post-Harvest Infrastructure",
    location: "Gulu, Uganda",
    stage: "scaling",
    progress: 88,
    goal: "Reduce post-harvest losses in Northern Uganda by 40% through distributed cold storage",
    teamCount: 16,
    nextMilestone: "10th facility operational",
    owner: "Grace Acen",
    tags: ["Cold Chain", "Infrastructure"],
  },
];

function ProjectCard({ project }: { project: typeof MOCK_PROJECTS[0] }) {
  const stage = STAGE_CONFIG[project.stage] ?? STAGE_CONFIG.idea;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors leading-snug">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">{project.industry}</span>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" /> {project.location}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0.5 shrink-0 flex items-center gap-1 border ${stage.color} ${stage.bg}`}
          >
            {stage.icon} {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
          </Badge>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{project.goal}</p>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Progress</span>
            <span className="font-semibold text-primary">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" /> {project.teamCount}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Target className="h-3 w-3" />
              <span className="line-clamp-1 max-w-[120px]">{project.nextMilestone}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {project.tags.slice(0, 1).map((tag, i) => (
              <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const [activeStage, setActiveStage] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PROJECTS.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.industry.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeStage !== "all" && p.stage !== activeStage) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Ideas becoming ventures becoming businesses</p>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name or industry…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Stage filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStage(s.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeStage === s.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Project Pipeline visual */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Pipeline</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {Object.entries(STAGE_CONFIG).map(([key, val], i) => {
            const count = MOCK_PROJECTS.filter(p => p.stage === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveStage(key)}
                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-center transition-all ${
                  activeStage === key ? `${val.bg} border` : "hover:bg-gray-50"
                }`}
              >
                <span className={`text-lg font-bold ${val.color}`}>{count}</span>
                <span className="text-[9px] text-gray-500 capitalize">{key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No projects found</p>
          </div>
        ) : (
          filtered.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-teal-600 rounded-xl p-5 text-white">
        <h3 className="font-display font-bold text-base mb-1">Have a business idea?</h3>
        <p className="text-white/80 text-sm mb-4">Turn it into a tracked project, find collaborators, and convert it into a venture.</p>
        <button className="bg-white text-primary text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2">
          <FolderOpen className="h-4 w-4" /> Start a Project
        </button>
      </div>
    </div>
  );
}
