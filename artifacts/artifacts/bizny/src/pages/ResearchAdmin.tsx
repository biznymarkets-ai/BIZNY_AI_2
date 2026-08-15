import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { BiznyLogo } from "@/components/BiznyLogo";
import {
  Database,
  Download,
  Search,
  Users,
  Building2,
  Brain,
  Globe,
  TrendingUp,
  RefreshCw,
  Eye,
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Key,
  ExternalLink,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";

export default function ResearchAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Data states
  const [activeTab, setActiveTab] = useState<"research" | "users" | "deals" | "overview">("overview");
  const [overview, setOverview] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string>("");

  const getStoredToken = () => {
    return localStorage.getItem("bizny_admin_token") || "";
  };

  // Check saved session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkeyInput, email: "biznymarkets@gmail.com" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("bizny_admin_token", data.token || "bizny_admin_session_key");
        setIsAuthenticated(true);
        setPasskeyInput("");
      } else {
        setAuthError(data.error || "Invalid admin passkey.");
      }
    } catch (err) {
      setAuthError("Failed to authenticate. Please check server connection.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bizny_admin_token");
    setIsAuthenticated(false);
    setOverview(null);
    setSubmissions([]);
    setUsers([]);
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const token = getStoredToken() || "bizny_admin_session_key";
    const headers = { "x-admin-key": token };

    try {
      const [resOverview, resResearch, resUsers] = await Promise.all([
        fetch("/api/admin/overview", { headers }),
        fetch("/api/admin/research", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      if (resOverview.ok) {
        const dataOverview = await resOverview.json();
        setOverview(dataOverview);
      }
      if (resResearch.ok) {
        const dataResearch = await resResearch.json();
        setSubmissions(dataResearch.submissions || []);
      }
      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        setUsers(dataUsers.users || []);
      }
    } catch (e) {
      console.error("Failed loading admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleDeleteSubmission = async (submissionId: string) => {
    const token = getStoredToken() || "bizny_admin_session_key";
    try {
      const res = await fetch(`/api/admin/research/${submissionId}`, {
        method: "DELETE",
        headers: { "x-admin-key": token },
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => (s.submissionId || s.id) !== submissionId));
        setDeleteConfirmId(null);
        if (selectedSubmission && (selectedSubmission.submissionId || selectedSubmission.id) === submissionId) {
          setSelectedSubmission(null);
        }
        setActionSuccessMessage(`Submission #${submissionId} successfully deleted.`);
        setTimeout(() => setActionSuccessMessage(""), 4000);
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (s.respondentName || "").toLowerCase().includes(q) ||
      (s.respondentEmail || "").toLowerCase().includes(q) ||
      (s.country || "").toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q) ||
      (s.goals || "").toLowerCase().includes(q) ||
      (s.biggestObstacle || "").toLowerCase().includes(q);

    const matchesCountry = countryFilter === "all" || (s.country || "").toLowerCase().includes(countryFilter.toLowerCase());

    return matchesSearch && matchesCountry;
  });

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.country || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.industry || "").toLowerCase().includes(q)
    );
  });

  const uniqueCountries = Array.from(
    new Set(submissions.map((s) => s.country).filter(Boolean))
  );

  // If Not Authenticated -> Show Admin Login / Passkey Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#072833] rounded-3xl p-8 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <BiznyLogo size="lg" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#033B4C]/10 text-[#033B4C] dark:bg-[#79A7B7]/20 dark:text-[#98CBD9] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Founder & Admin Portal
            </div>
            <h2 className="text-2xl font-bold text-[#033B4C] dark:text-white font-display">
              Admin Authentication
            </h2>
            <p className="text-xs text-gray-500">
              Enter your master administrative passkey to access survey responses, founder records, and database exports.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value="biznymarkets@gmail.com"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Master Passkey
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter passkey..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBE5EE] dark:border-[#0F3B4A] bg-white dark:bg-[#041B23] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#033B4C]"
                />
                <Key className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Default Passkey: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">bizny2026!admin</code></span>
                <button
                  type="button"
                  onClick={() => setPasskeyInput("bizny2026!admin")}
                  className="text-[#033B4C] dark:text-[#79A7B7] hover:underline font-semibold"
                >
                  Auto-fill
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-[#033B4C] hover:bg-[#054a5f] text-white font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Unlock Admin Dashboard
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-gray-100 dark:border-gray-800">
            <Link href="/" className="text-xs text-gray-500 hover:text-[#033B4C] dark:hover:text-white transition-colors">
              &larr; Return to Bizny Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tokenParam = `token=${getStoredToken() || "bizny_admin_session_key"}`;

  return (
    <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Success Toast */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage("")} className="text-emerald-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#072833] p-5 rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
          <div className="flex items-center gap-3">
            <BiznyLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#033B4C] dark:text-white font-display">
                  Bizny Administrative Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Live Cloud Database
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Direct view of Google Cloud Firestore & local storage data records
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>

            {/* Direct Export Dropdown / Buttons */}
            <a
              href={`/api/admin/research/export.csv?${tokenParam}`}
              download
              className="px-3.5 py-2 rounded-xl bg-[#033B4C] text-white text-xs font-bold hover:bg-[#054a5f] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Survey CSV
            </a>

            <a
              href={`/api/admin/backup.json?${tokenParam}`}
              download
              className="px-3.5 py-2 rounded-xl border border-[#033B4C] text-[#033B4C] dark:text-[#79A7B7] text-xs font-bold hover:bg-[#033B4C]/5 flex items-center gap-1.5 transition-all"
            >
              <FileJson className="w-3.5 h-3.5" /> Full Backup (JSON)
            </a>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Lock Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" /> Lock
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#CBE5EE] dark:border-[#0F3B4A] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#033B4C] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#072833]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> System Overview
          </button>

          <button
            onClick={() => setActiveTab("research")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "research"
                ? "bg-[#033B4C] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#072833]"
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> Founding Research ({submissions.length})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-[#033B4C] text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#072833]"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Registered Users ({users.length})
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Research Responses</span>
                  <Brain className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
                </div>
                <p className="text-3xl font-bold text-[#033B4C] dark:text-white">{submissions.length}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 font-medium">Stored in Firestore</span>
                  <button onClick={() => setActiveTab("research")} className="text-[#033B4C] dark:text-[#79A7B7] hover:underline font-bold">
                    View list &rarr;
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
                </div>
                <p className="text-3xl font-bold text-[#033B4C] dark:text-white">{users.length}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Founders & Members</span>
                  <button onClick={() => setActiveTab("users")} className="text-[#033B4C] dark:text-[#79A7B7] hover:underline font-bold">
                    View users &rarr;
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Active Countries</span>
                  <Globe className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
                </div>
                <p className="text-3xl font-bold text-[#033B4C] dark:text-white">{uniqueCountries.length}</p>
                <span className="text-[11px] text-gray-500 block mt-2">Geographic coverage</span>
              </div>

              <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Database Target</span>
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-600 truncate mt-1">Google Cloud Firestore</p>
                <span className="text-[11px] text-gray-500 block mt-2">europe-west2 region</span>
              </div>
            </div>

            {/* Quick Actions & Recent Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Submissions Stream */}
              <div className="lg:col-span-2 bg-white dark:bg-[#072833] rounded-3xl p-6 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#033B4C] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" /> Recent Research Responses
                  </h3>
                  <button
                    onClick={() => setActiveTab("research")}
                    className="text-xs text-[#033B4C] dark:text-[#79A7B7] font-semibold hover:underline"
                  >
                    View All ({submissions.length})
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 space-y-3">
                    <Database className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="text-xs">No research submissions collected yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((sub) => (
                      <div
                        key={sub.submissionId || sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className="p-4 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23] border border-[#CBE5EE]/50 dark:border-[#0F3B4A]/50 hover:border-[#033B4C] transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                              {sub.respondentName || "Anonymous Founder"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#033B4C]/10 text-[#033B4C] dark:text-[#79A7B7] text-[10px] font-semibold">
                              {sub.country || "Global"}
                            </span>
                            <span className="text-[10px] text-gray-400">{sub.role || "Founder"}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                            {sub.biggestObstacle || sub.goals || "Survey submitted"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-400 block">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "Recent"}
                          </span>
                          <span className="text-xs font-bold text-[#033B4C] dark:text-[#79A7B7]">
                            AI Comfort: {sub.aiComfort || 3}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Data Tools & Export Center */}
              <div className="bg-white dark:bg-[#072833] rounded-3xl p-6 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-[#033B4C] dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" /> Direct Export Center
                </h3>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Download real-time survey datasets and user registries directly to your machine without needing external Google Cloud console access.
                </p>

                <div className="space-y-3">
                  <a
                    href={`/api/admin/research/export.csv?${tokenParam}`}
                    download
                    className="w-full p-3.5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] hover:bg-[#F4F8FA] dark:hover:bg-[#041B23] flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Research Responses (.CSV)</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#033B4C]" />
                  </a>

                  <a
                    href={`/api/admin/research/export.json?${tokenParam}`}
                    download
                    className="w-full p-3.5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] hover:bg-[#F4F8FA] dark:hover:bg-[#041B23] flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileJson className="w-4 h-4 text-blue-600" />
                      <span>Research Responses (.JSON)</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#033B4C]" />
                  </a>

                  <a
                    href={`/api/admin/users/export.csv?${tokenParam}`}
                    download
                    className="w-full p-3.5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] hover:bg-[#F4F8FA] dark:hover:bg-[#041B23] flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Registered Users (.CSV)</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#033B4C]" />
                  </a>

                  <a
                    href={`/api/admin/backup.json?${tokenParam}`}
                    download
                    className="w-full p-3.5 rounded-2xl bg-[#033B4C] text-white hover:bg-[#054a5f] flex items-center justify-between text-xs font-bold shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-[#79A7B7]" />
                      <span>Complete Database Dump (.JSON)</span>
                    </div>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authenticated as biznymarkets@gmail.com
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: RESEARCH SUBMISSIONS */}
        {activeTab === "research" && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Country Filter */}
            <div className="bg-white dark:bg-[#072833] p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-2/3">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, email, country, role, obstacle, or goal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#041B23] text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
                >
                  <option value="all">All Countries ({submissions.length})</option>
                  {uniqueCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <a
                  href={`/api/admin/research/export.csv?${tokenParam}`}
                  download
                  className="px-3.5 py-1.5 rounded-xl bg-[#033B4C] text-white text-xs font-bold hover:bg-[#054a5f] flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </a>
              </div>
            </div>

            {/* Table of Submissions */}
            <div className="bg-white dark:bg-[#072833] rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#CBE5EE] dark:border-[#0F3B4A] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#033B4C] dark:text-white uppercase tracking-wider">
                  Survey Submissions ({filteredSubmissions.length} of {submissions.length})
                </h3>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-3">
                  <Database className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs">No matching research records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                    <thead className="bg-[#F4F8FA] dark:bg-[#041B23] text-gray-500 font-semibold border-b border-[#CBE5EE] dark:border-[#0F3B4A]">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Respondent</th>
                        <th className="p-3.5">Country</th>
                        <th className="p-3.5">Role / Stage</th>
                        <th className="p-3.5">Biggest Obstacle</th>
                        <th className="p-3.5">AI Comfort</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBE5EE]/50 dark:divide-[#0F3B4A]">
                      {filteredSubmissions.map((s) => {
                        const sid = s.submissionId || s.id;
                        return (
                          <tr key={sid} className="hover:bg-[#F4F8FA]/50 dark:hover:bg-[#041B23]/50 transition-colors">
                            <td className="p-3.5 text-gray-500">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Just now"}
                            </td>
                            <td className="p-3.5 font-medium text-gray-900 dark:text-white">
                              <div>{s.respondentName || "Anonymous"}</div>
                              <div className="text-[11px] text-gray-500">{s.respondentEmail || "No email"}</div>
                            </td>
                            <td className="p-3.5 font-semibold text-[#033B4C] dark:text-[#79A7B7]">
                              {s.country || "—"}
                            </td>
                            <td className="p-3.5">
                              <div>{s.role || "Founder"}</div>
                              <div className="text-[10px] text-gray-400">{s.stage || "Early stage"}</div>
                            </td>
                            <td className="p-3.5 max-w-xs truncate">{s.biggestObstacle || s.obstacles || "—"}</td>
                            <td className="p-3.5 font-bold text-[#033B4C] dark:text-[#79A7B7]">
                              {s.aiComfort || "3"}/5
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedSubmission(s)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#033B4C]/10 text-[#033B4C] dark:bg-[#79A7B7]/20 dark:text-[#98CBD9] font-bold text-[11px] hover:bg-[#033B4C]/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(sid)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 font-bold text-[11px] hover:bg-red-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: REGISTERED USERS */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-[#072833] p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-2/3">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search users by name, email, country, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none"
                />
              </div>

              <a
                href={`/api/admin/users/export.csv?${tokenParam}`}
                download
                className="px-3.5 py-2 rounded-xl bg-[#033B4C] text-white text-xs font-bold hover:bg-[#054a5f] flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Export Users (.CSV)
              </a>
            </div>

            <div className="bg-white dark:bg-[#072833] rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#CBE5EE] dark:border-[#0F3B4A] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#033B4C] dark:text-white uppercase tracking-wider">
                  Registered Founder Accounts ({filteredUsers.length})
                </h3>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-500 space-y-3">
                  <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs">No registered users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                    <thead className="bg-[#F4F8FA] dark:bg-[#041B23] text-gray-500 font-semibold border-b border-[#CBE5EE] dark:border-[#0F3B4A]">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Contact</th>
                        <th className="p-3.5">Country & Location</th>
                        <th className="p-3.5">Industry / Role</th>
                        <th className="p-3.5">Business Name</th>
                        <th className="p-3.5 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBE5EE]/50 dark:divide-[#0F3B4A]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id || u.email} className="hover:bg-[#F4F8FA]/50 dark:hover:bg-[#041B23]/50 transition-colors">
                          <td className="p-3.5 font-bold text-gray-900 dark:text-white">
                            <div>{u.name || "Member"}</div>
                            <div className="text-[11px] font-normal text-gray-500">{u.email}</div>
                          </td>
                          <td className="p-3.5 text-gray-600 dark:text-gray-300">
                            <div>{u.phone || "—"}</div>
                            {u.whatsapp && <div className="text-[10px] text-emerald-600">WA: {u.whatsapp}</div>}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-[#033B4C] dark:text-[#79A7B7]">{u.country || "—"}</span>
                            {u.stateCity && <div className="text-[10px] text-gray-400">{u.stateCity}</div>}
                          </td>
                          <td className="p-3.5">
                            <div>{u.role || "Founder"}</div>
                            <div className="text-[10px] text-gray-400">{u.industry || "General"}</div>
                          </td>
                          <td className="p-3.5 font-medium">{u.businessName || "—"}</td>
                          <td className="p-3.5 text-right text-gray-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#072833] w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 space-y-5 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#CBE5EE] dark:border-[#0F3B4A] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#033B4C] dark:text-white font-display">
                  Research Submission Details
                </h3>
                <p className="text-xs text-gray-500 font-mono">ID: {selectedSubmission.submissionId || selectedSubmission.id}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F4F8FA] dark:bg-[#041B23]">
                <div>
                  <span className="text-gray-500 block text-[11px]">Respondent:</span>
                  <strong className="text-sm text-gray-900 dark:text-white">
                    {selectedSubmission.respondentName || "Anonymous"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Contact Info:</span>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSubmission.respondentEmail || "N/A"}</div>
                  {selectedSubmission.respondentPhone && (
                    <div className="text-[11px] text-gray-500">{selectedSubmission.respondentPhone}</div>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Country & Stage:</span>
                  <strong className="text-[#033B4C] dark:text-[#79A7B7]">
                    {selectedSubmission.country || "—"} ({selectedSubmission.stage || "Stage unlisted"})
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">AI Comfort & Role:</span>
                  <strong>{selectedSubmission.aiComfort || 3}/5 rating — {selectedSubmission.role || "Founder"}</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Goals & Vision:</span>
                <p className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.goals || "No response provided"}
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Obstacles & Bottlenecks:</span>
                <p className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.obstacles || "None listed"}
                  {selectedSubmission.biggestObstacle && (
                    <span className="block mt-1 font-semibold text-[#033B4C] dark:text-[#79A7B7]">
                      Primary Obstacle: {selectedSubmission.biggestObstacle}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Top Requested Features:</span>
                <p className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/60 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.topFeatures || "General platform features"}
                </p>
              </div>

              {selectedSubmission.fullData && (
                <div>
                  <span className="font-bold text-gray-500 block uppercase mb-1">Raw Payload & Field Dump:</span>
                  <pre className="p-3.5 rounded-2xl bg-gray-900 text-gray-100 text-[10px] overflow-x-auto font-mono max-h-48">
                    {JSON.stringify(selectedSubmission.fullData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#072833] w-full max-w-sm rounded-3xl p-6 space-y-4 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
              Delete Submission Record?
            </h3>
            <p className="text-xs text-gray-500">
              This will permanently remove submission <code className="font-mono">{deleteConfirmId}</code> from both memory and Google Cloud Firestore.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubmission(deleteConfirmId)}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
