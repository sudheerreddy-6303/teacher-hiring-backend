import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/common/Shared";

function JobsPage({ setPage }) {
  const { user } = useAuth();
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filter,     setFilter]     = useState({ subject:"", type:"", location:"", search:"" });
  const [selected,   setSelected]   = useState(null);
  const [applied,    setApplied]    = useState([]);
  const [loginAlert, setLoginAlert] = useState(false);

  const API = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  // ── Fetch from acadhr.jobs ─────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/jobs`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Could not connect to backend. Make sure the server is running."); setLoading(false); });
  }, []);

  // ── Filters using exact DB column names ───────────────────────────────────
  const filtered = jobs.filter(j =>
    (!filter.search   || (j.title||"").toLowerCase().includes(filter.search.toLowerCase()) ||
                         (j.institution_name||"").toLowerCase().includes(filter.search.toLowerCase()) ||
                         (j.subject||"").toLowerCase().includes(filter.search.toLowerCase())) &&
    (!filter.subject  || (j.subject||"").toLowerCase().includes(filter.subject.toLowerCase())) &&
    (!filter.type     || (j.job_type||"").toLowerCase().includes(filter.type.toLowerCase()) ||
                         (j.work_mode||"").toLowerCase().includes(filter.type.toLowerCase())) &&
    (!filter.location || (j.location_city||"").toLowerCase().includes(filter.location.toLowerCase()) ||
                         (j.location_state||"").toLowerCase().includes(filter.location.toLowerCase()))
  );

  // ── Apply ──────────────────────────────────────────────────────────────────
  function handleApply(job) {
    if (!user) { setLoginAlert(true); return; }
    if (user.role !== "teacher") { alert("Only teachers can apply."); return; }
    const pct = Number(localStorage.getItem("acadhr_teacher_completion") || 0);
    if (pct < 70) {
      alert(`Your profile is ${pct}% complete. Need 70%+ to apply.\nGo to Dashboard → My Profile.`);
      setPage("dashboard");
      return;
    }
    setSelected(job);
    if (!applied.includes(job.id)) setApplied(a => [...a, job.id]);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function fmtSalary(j) {
    if (j.salary_min && j.salary_max)
      return `₹${Number(j.salary_min).toLocaleString("en-IN")}–₹${Number(j.salary_max).toLocaleString("en-IN")}/mo`;
    if (j.salary_min) return `From ₹${Number(j.salary_min).toLocaleString("en-IN")}/mo`;
    return "Negotiable";
  }

  function statusBadge(status) {
    if (status === "approved") return { label:"✅ Live",    bg:"#ECFDF5", color:"#059669", border:"#A7F3D0" };
    if (status === "pending")  return { label:"⏳ Pending", bg:"#FFFBEB", color:"#D97706", border:"#FDE68A" };
    return                              { label:status,     bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" };
  }

  function typeBadge(jt) {
    const l = (jt||"").toLowerCase();
    if (l.includes("part")) return { label:"Part-Time",   bg:"#E0F2FE", color:"#0369A1" };
    if (l.includes("home") || l.includes("tuit")) return { label:"Home Tuition", bg:"#FEF3C7", color:"#B45309" };
    return                          { label:"Full-Time",   bg:"#EBF5FF", color:"#1A56DB" };
  }

  return (
    <div style={{ paddingTop:66, minHeight:"100vh", background:"#F9FAFB" }}>
      <Navbar setPage={setPage} />

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"40px 0 0" }}>
        <div className="container">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:30, fontWeight:900, color:"#111827", marginBottom:5 }}>Browse Teaching Jobs</h1>
              <p style={{ color:"#6B7280", fontSize:14 }}>
                {loading ? "Loading from acadhr.jobs..." : (
                  <>
                    <strong style={{ color:"#111827" }}>{jobs.length}</strong> total ·{" "}
                    <strong style={{ color:"#059669" }}>{jobs.filter(j=>j.status==="approved").length}</strong> live ·{" "}
                    <strong style={{ color:"#D97706" }}>{jobs.filter(j=>j.status==="pending").length}</strong> pending
                  </>
                )}
              </p>
            </div>
            {user?.role === "school" && (
              <button className="btn btn-primary" onClick={() => setPage("dashboard")}>+ Post a Job</button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingBottom:24 }}>
            <div style={{ position:"relative", flex:1, minWidth:220 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", pointerEvents:"none" }}>🔍</span>
              <input className="input" style={{ paddingLeft:38 }} placeholder="Title, school or keyword..."
                value={filter.search} onChange={e => setFilter(f => ({...f, search:e.target.value}))} />
            </div>
            <input className="input" style={{ maxWidth:160 }} placeholder="📚 Subject..."
              value={filter.subject} onChange={e => setFilter(f => ({...f, subject:e.target.value}))} />
            <select className="input" style={{ maxWidth:160 }} value={filter.type} onChange={e => setFilter(f => ({...f, type:e.target.value}))}>
              <option value="">All Types</option>
              <option value="Full-time">Full-Time</option>
              <option value="Part-time">Part-Time</option>
              <option value="Home Tuition">Home Tuition</option>
            </select>
            <input className="input" style={{ maxWidth:180 }} placeholder="📍 City..."
              value={filter.location} onChange={e => setFilter(f => ({...f, location:e.target.value}))} />
            {Object.values(filter).some(v=>v) && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ subject:"", type:"", location:"", search:"" })}>Clear ✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ paddingTop:32, paddingBottom:72 }}>

        {loginAlert && (
          <div className="alert a-warn flexb" style={{ marginBottom:20 }}>
            <span>Please log in as a Teacher to apply for jobs.</span>
            <button className="btn btn-primary btn-sm" onClick={() => setPage("login")}>Log In</button>
          </div>
        )}

        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"14px 20px", marginBottom:20, color:"#DC2626", fontWeight:600 }}>
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"#6B7280" }}>
            <div style={{ width:44, height:44, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontWeight:600, fontSize:15 }}>Fetching from acadhr.jobs table...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🔍</div>
            <h3 style={{ color:"#111827", marginBottom:8 }}>
              {jobs.length === 0 ? "No jobs in database yet" : "No jobs match your filters"}
            </h3>
            <p style={{ color:"#6B7280", fontSize:14 }}>
              {jobs.length === 0
                ? "Schools need to post jobs. Admin approves them to show as Live."
                : "Try clearing or adjusting your filters"}
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:"#6B7280", marginBottom:20 }}>
              Showing <strong style={{ color:"#111827" }}>{filtered.length}</strong> of <strong style={{ color:"#111827" }}>{jobs.length}</strong> jobs
            </div>

            <div className="grid3">
              {filtered.map(job => {
                const sb = statusBadge(job.status);
                const tb = typeBadge(job.job_type);
                return (
                  <div key={job.id} style={{ position:"relative" }}>
                    <div className="card jcard card-hover" onClick={() => handleApply(job)} style={{ cursor:"pointer" }}>

                      {/* Top row — icon + badges */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏫</div>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                          <span style={{ background:tb.bg, color:tb.color, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{tb.label}</span>
                          <span style={{ background:sb.bg, color:sb.color, border:`1px solid ${sb.border}`, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{sb.label}</span>
                        </div>
                      </div>

                      {/* Title — from jobs.title */}
                      <div style={{ fontWeight:800, fontSize:15, color:"#111827", marginBottom:4, lineHeight:1.3 }}>
                        {job.title}
                      </div>

                      {/* Institution name — from jobs.institution_name */}
                      <div style={{ fontSize:13, color:"#1A56DB", fontWeight:700, marginBottom:10 }}>
                        {job.institution_name || job.posted_by_name || "Institution"}
                      </div>

                      {/* Details — exact column names */}
                      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
                        {job.location_city    && <span style={{ fontSize:12, color:"#6B7280" }}>📍 {job.location_city}{job.location_state ? `, ${job.location_state}` : ""}</span>}
                        {job.subject          && <span style={{ fontSize:12, color:"#6B7280" }}>📚 {job.subject}</span>}
                        {job.board            && <span style={{ fontSize:12, color:"#6B7280" }}>🏫 Board: {job.board}</span>}
                        {job.grades           && <span style={{ fontSize:12, color:"#6B7280" }}>📖 Grades: {job.grades}</span>}
                        {job.experience       && <span style={{ fontSize:12, color:"#6B7280" }}>🎓 Exp: {job.experience}</span>}
                        {job.joining_timeline && <span style={{ fontSize:12, color:"#6B7280" }}>📅 Joining: {job.joining_timeline}</span>}
                        {job.positions > 1    && <span style={{ fontSize:12, color:"#059669", fontWeight:600 }}>👥 {job.positions} positions</span>}
                      </div>

                      {/* Footer — salary + date */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #F3F4F6" }}>
                        <span style={{ fontWeight:800, fontSize:13, color:"#059669" }}>{fmtSalary(job)}</span>
                        <span style={{ fontSize:11, color:"#9CA3AF" }}>
                          {job.created_at ? new Date(job.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Recent"}
                        </span>
                      </div>

                      {/* Requirement ID */}
                      {job.requirement_id && (
                        <div style={{ fontSize:10, color:"#9CA3AF", marginTop:8, fontFamily:"Fira Code,monospace", letterSpacing:.3 }}>
                          🔖 {job.requirement_id}
                        </div>
                      )}
                    </div>

                    {applied.includes(job.id) && (
                      <div style={{ position:"absolute", top:14, right:14 }}>
                        <span className="badge bgreen">✓ Applied</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Apply success modal */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:"center", padding:"10px 0 22px" }}>
              <div style={{ fontSize:58, marginBottom:10 }}>🎉</div>
              <h2 style={{ fontSize:22, marginBottom:6 }}>Application Submitted!</h2>
              <p style={{ color:"#6B7280", fontSize:14 }}>
                Your application for <strong>{selected.title}</strong> at{" "}
                <strong style={{ color:"#1A56DB" }}>{selected.institution_name || selected.posted_by_name}</strong> has been sent.
              </p>
            </div>
            <div className="alert a-ok">The school will review your profile and reach out if shortlisted.</div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center" }}
                onClick={() => { setSelected(null); setPage("dashboard"); }}>Go to Dashboard</button>
              <button className="btn btn-outline" style={{ flex:1, justifyContent:"center" }}
                onClick={() => setSelected(null)}>Browse More</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobsPage;
