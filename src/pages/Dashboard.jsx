import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getStudentsAggregates } from "../api";
import PieChart from "../components/PieChart";

/* ─── helpers ─────────────────────────────────────────────── */
const getRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return localStorage.getItem("role")?.toUpperCase();
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return p.role?.toUpperCase() || localStorage.getItem("role")?.toUpperCase();
  } catch {
    return localStorage.getItem("role")?.toUpperCase();
  }
};

const statusColor = (s) => {
  const m = {
    Approved: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    Pending:  { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
    Rejected: { bg: "#fee2e2", color: "#7f1d1d", border: "#fca5a5" },
    Returned: { bg: "#fff7ed", color: "#7c2d12", border: "#fdba74" },
    Forward:  { bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" },
    Forwarded:{ bg: "#e0f2fe", color: "#0c4a6e", border: "#7dd3fc" },
  };
  return m[s] || { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
};

/* ─── stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, gradient, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 160px",
        borderRadius: "16px",
        background: gradient,
        color: "#fff",
        padding: "20px 22px",
        cursor: onClick ? "pointer" : "default",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 16px 40px rgba(0,0,0,0.18)"
          : "0 4px 16px rgba(0,0,0,0.10)",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        minWidth: 0,
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, opacity: 0.88, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate();
  const role = getRole();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState({ states: [], cities: [], courses: [] });

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, aggRes] = await Promise.all([
          getDashboardStats(),
          getStudentsAggregates(),
        ]);
        setStats(statsRes.data);
        setAggregates(aggRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border" style={{ color: "#667eea" }} role="status" />
      </div>
    );
  }

  /* derive data */
  const byStatus  = stats?.byStatus  || [];
  const byCourse  = stats?.byCourse  || [];
  const recent    = stats?.recentStudents || [];

  /* map status counts */
  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, +s.count]));
  const approved  = statusMap["Approved"]  || 0;
  const rejected  = statusMap["Rejected"]  || 0;
  const returned  = statusMap["Returned"]  || 0;
  const forwarded = (statusMap["Forward"] || 0) + (statusMap["Forwarded"] || 0);
  const pending   = statusMap["Pending"]   || 0;

  const statusPieData = [
    { label: "Pending",   value: pending },
    { label: "Approved",  value: approved },
    { label: "Rejected",  value: rejected },
    { label: "Returned",  value: returned },
    { label: "Forwarded", value: forwarded },
  ].filter((d) => d.value > 0);

  const coursePieData = byCourse.map((c) => ({ label: c.course, value: +c.count }));

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="rounded-4 mb-4 p-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          boxShadow: "0 8px 32px rgba(102,126,234,0.3)",
        }}
      >
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: 26 }}>
            📊 Dashboard Overview
          </h4>
          <p className="mb-0" style={{ opacity: 0.85, fontSize: 14 }}>
            Welcome back, <strong>{role}</strong> — here's what's happening today.
          </p>
        </div>
        <button
          className="btn fw-semibold px-4"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10 }}
          onClick={() => navigate("/read")}
        >
          📋 Go to Student List
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        <StatCard icon="👨‍🎓" label="Total Students" value={stats?.students ?? 0}
          gradient="linear-gradient(135deg,#667eea,#764ba2)"
          onClick={() => navigate("/read")} />
        <StatCard icon="✅" label="Approved" value={approved}
          gradient="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon="⏳" label="Pending" value={pending}
          gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard icon="❌" label="Rejected" value={rejected}
          gradient="linear-gradient(135deg,#ef4444,#b91c1c)" />
        <StatCard icon="↩️" label="Returned" value={returned}
          gradient="linear-gradient(135deg,#f97316,#ea580c)" />
        <StatCard icon="➡️" label="Forwarded" value={forwarded}
          gradient="linear-gradient(135deg,#06b6d4,#0284c7)" />
      </div>

      {/* ── Masters Row ─────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-3 mb-4">
        {[
          { icon:"🗺️", label:"Total States",  val: stats?.states  ?? 0, path:"/states",  allowed:["HEADMASTER"] },
          { icon:"🏙️", label:"Total Cities",  val: stats?.cities  ?? 0, path:"/cities",  allowed:["HEADMASTER"] },
          { icon:"📘", label:"Total Courses", val: stats?.courses ?? 0, path:"/courses", allowed:["HEADMASTER"] },
        ].map(({ icon, label, val, path, allowed }) => (
          <div
            key={label}
            onClick={() => allowed.includes(role) && navigate(path)}
            style={{
              flex: "1 1 180px",
              background: "#fff",
              border: "1px solid #e8eaff",
              borderRadius: 14,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              cursor: allowed.includes(role) ? "pointer" : "default",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => { if (allowed.includes(role)) e.currentTarget.style.boxShadow = "0 6px 24px rgba(102,126,234,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#f4f6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#667eea" }}>{val}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────── */}
      <div className="row g-4 mb-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: "4px solid #667eea" }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4" style={{ color: "#374151" }}>🎯 Student Status Distribution</h6>
              <PieChart
                title=""
                data={statusPieData.length ? statusPieData : [{ label: "No Data", value: 1 }]}
                headerColor="#667eea"
                unit="Total"
              />
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: "4px solid #10b981" }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4" style={{ color: "#374151" }}>📚 Students by Course</h6>
              {coursePieData.length === 0 ? (
                <div className="text-muted text-center py-5">No course data available</div>
              ) : (
                <div>
                  {coursePieData.map((c, i) => {
                    const total = coursePieData.reduce((s, x) => s + x.value, 0);
                    const pct   = Math.round((c.value / total) * 100);
                    const clrs  = ["#667eea","#10b981","#f59e0b","#ef4444","#06b6d4","#8b5cf6"];
                    const color = clrs[i % clrs.length];
                    return (
                      <div key={i} className="mb-3">
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: 13 }}>
                          <span className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>{c.label}</span>
                          <span className="text-muted">{c.value} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pie Charts Row (by State, City, Course) ─────────── */}
      <div className="row g-4 mb-4">
        <div className="col-md-4 col-12">
          <PieChart
            title="🗺️ Students by State"
            data={aggregates.states || []}
            headerColor="#6366f1"
            unit="States"
          />
        </div>
        <div className="col-md-4 col-12">
          <PieChart
            title="🏙️ Students by City"
            data={aggregates.cities || []}
            headerColor="#f97316"
            unit="Cities"
          />
        </div>
        <div className="col-md-4 col-12">
          <PieChart
            title="📘 Students by Course"
            data={aggregates.courses || []}
            headerColor="#ec4899"
            unit="Courses"
          />
        </div>
      </div>

      {/* ── Recent Students ─────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ borderTop: "4px solid #764ba2" }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h6 className="fw-bold mb-0" style={{ color: "#374151" }}>🕒 Recently Added Students</h6>
            <button
              className="btn btn-sm fw-semibold px-3"
              style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", borderRadius: 8, border: "none" }}
              onClick={() => navigate("/read")}
            >
              View All →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="text-center text-muted py-4">No students yet</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8f9ff" }}>
                    <th className="fw-semibold text-muted border-0">Name</th>
                    <th className="fw-semibold text-muted border-0">Email</th>
                    <th className="fw-semibold text-muted border-0">Course</th>
                    <th className="fw-semibold text-muted border-0">State</th>
                    <th className="fw-semibold text-muted border-0">Status</th>
                    <th className="fw-semibold text-muted border-0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => {
                    const st     = s.latest_request_status || "Pending";
                    const colors = statusColor(st);
                    return (
                      <tr key={s.id}>
                        <td className="fw-semibold">{s.name}</td>
                        <td className="text-muted">{s.email}</td>
                        <td>{s.course || "—"}</td>
                        <td>{s.state  || "—"}</td>
                        <td>
                          <span
                            style={{
                              background: colors.bg,
                              color: colors.color,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 20,
                              padding: "2px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {st}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm"
                            style={{ background: "#f4f6ff", color: "#667eea", border: "none", fontWeight: 600, fontSize: 12, borderRadius: 8 }}
                            onClick={() => navigate(`/student-details/${s.id}`)}
                          >
                            View →
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

    </div>
  );
}
