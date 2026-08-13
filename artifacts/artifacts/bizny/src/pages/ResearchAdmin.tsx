import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { BiznyLogo } from "@/components/BiznyLogo";
import {
  Database,
  Download,
  Search,
  Filter,
  Users,
  Building2,
  Brain,
  Globe,
  TrendingUp,
  FileSpreadsheet,
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function ResearchAdmin() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSub, resStats] = await Promise.all([
        fetch("/api/research/submissions"),
        fetch("/api/research/stats"),
      ]);
      if (resSub.ok) {
        const data = await resSub.json();
        setSubmissions(data.submissions || []);
      }
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }
    } catch (e) {
      console.error("Failed loading research admin data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.respondentName || "").toLowerCase().includes(q) ||
      (s.respondentEmail || "").toLowerCase().includes(q) ||
      (s.country || "").toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q) ||
      (s.goals || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F4F8FA] dark:bg-[#041B23] text-gray-900 dark:text-gray-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#072833] p-5 rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-sm">
          <div className="flex items-center gap-3">
            <BiznyLogo size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#033B4C] dark:text-white font-display">
                Founding Research Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">
                Real-time survey submissions & founder analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>

            <a
              href="/api/research/export.csv"
              download
              className="px-4 py-2.5 rounded-xl bg-[#033B4C] text-white text-xs font-bold hover:bg-[#054a5f] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export Submissions (CSV)
            </a>

            <Link
              href="/research"
              className="px-3.5 py-2 rounded-xl border border-[#033B4C] text-[#033B4C] dark:text-[#79A7B7] text-xs font-semibold hover:bg-[#033B4C]/5 transition-colors"
            >
              View Survey
            </Link>
          </div>
        </div>

        {/* Stats Overview Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Total Responses</span>
                <Users className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
              </div>
              <p className="text-2xl font-bold text-[#033B4C] dark:text-white">{stats.totalResponses}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Real-world data</span>
            </div>

            <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Avg AI Comfort</span>
                <Brain className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
              </div>
              <p className="text-2xl font-bold text-[#033B4C] dark:text-white">{stats.avgAiComfort} / 5</p>
              <span className="text-[11px] text-gray-500">1 (Low) to 5 (High)</span>
            </div>

            <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Paid Interest</span>
                <TrendingUp className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
              </div>
              <p className="text-2xl font-bold text-[#033B4C] dark:text-white">{stats.paidConversionInterest}%</p>
              <span className="text-[11px] text-emerald-600 font-medium">Willing to pay for value</span>
            </div>

            <div className="bg-white dark:bg-[#072833] p-5 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Founding Members</span>
                <Globe className="w-4 h-4 text-[#033B4C] dark:text-[#79A7B7]" />
              </div>
              <p className="text-2xl font-bold text-[#033B4C] dark:text-white">{stats.foundingCommunityInterest}</p>
              <span className="text-[11px] text-gray-500">Early community signups</span>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-[#072833] p-4 rounded-2xl border border-[#CBE5EE] dark:border-[#0F3B4A] flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search responses by name, email, country, role, or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none"
          />
        </div>

        {/* Submissions Table */}
        <div className="bg-white dark:bg-[#072833] rounded-3xl border border-[#CBE5EE] dark:border-[#0F3B4A] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#CBE5EE] dark:border-[#0F3B4A] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#033B4C] dark:text-white uppercase tracking-wider">
              Survey Submissions ({filteredSubmissions.length})
            </h3>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Database className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No research submissions found.</p>
              <Link
                href="/research"
                className="inline-block px-4 py-2 rounded-xl bg-[#033B4C] text-white text-xs font-semibold"
              >
                Submit First Research Response
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                <thead className="bg-[#F4F8FA] dark:bg-[#041B23] text-gray-500 font-semibold border-b border-[#CBE5EE] dark:border-[#0F3B4A]">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Name / Email</th>
                    <th className="p-3.5">Country</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Top Features</th>
                    <th className="p-3.5">AI Comfort</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBE5EE]/50 dark:divide-[#0F3B4A]">
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F4F8FA]/50 dark:hover:bg-[#041B23]/50 transition-colors">
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
                      <td className="p-3.5">{s.role || "—"}</td>
                      <td className="p-3.5 max-w-xs truncate">{s.topFeatures || "—"}</td>
                      <td className="p-3.5 font-bold">{s.aiComfort || "3"}/5</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedSubmission(s)}
                          className="px-3 py-1.5 rounded-lg bg-[#033B4C]/10 text-[#033B4C] dark:bg-[#79A7B7]/20 dark:text-[#98CBD9] font-bold text-[11px] hover:bg-[#033B4C]/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#072833] w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 space-y-5 border border-[#CBE5EE] dark:border-[#0F3B4A] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#CBE5EE] dark:border-[#0F3B4A] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#033B4C] dark:text-white font-display">
                  Research Submission Detail
                </h3>
                <p className="text-xs text-gray-500">ID: {selectedSubmission.submissionId}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F4F8FA] dark:bg-[#041B23]">
                <div>
                  <span className="text-gray-500 block">Respondent:</span>
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {selectedSubmission.respondentName || "Anonymous"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Contact:</span>
                  <strong>{selectedSubmission.respondentEmail || "N/A"} | {selectedSubmission.respondentPhone || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Country:</span>
                  <strong className="text-[#033B4C] dark:text-[#79A7B7]">{selectedSubmission.country}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Stage:</span>
                  <strong>{selectedSubmission.stage}</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Goals & Vision:</span>
                <p className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.goals || "No response provided"}
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Obstacles & Bottlenecks:</span>
                <p className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.obstacles} (Biggest: {selectedSubmission.biggestObstacle})
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-500 block uppercase mb-1">Top Requested Features:</span>
                <p className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 leading-relaxed text-gray-800 dark:text-gray-200">
                  {selectedSubmission.topFeatures}
                </p>
              </div>

              {selectedSubmission.fullData && (
                <div>
                  <span className="font-bold text-gray-500 block uppercase mb-1">Full Raw Payload:</span>
                  <pre className="p-3 rounded-xl bg-gray-900 text-gray-100 text-[10px] overflow-x-auto font-mono">
                    {JSON.stringify(selectedSubmission.fullData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
