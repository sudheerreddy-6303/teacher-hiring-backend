import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { INDIA_LOCATIONS, SUBS } from "../../constants";
import { Toast, Divider, FilterBar } from "../../components/common/Shared";
import './School.css';

function SchoolDashboard({ user, setPage }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [showPost, setShowPost] = useState(false);
  const [autoReqId, setAutoReqId] = useState("");
  const [reqIdLoading, setReqIdLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState({
    // Basic
    institution_name:"", institution_type:"",
    location_state:"", location_city:"",
    contact_person:"", contact_number:"", email:"",
    requirement_type:"Teacher",
    // Job details
    subject:"", grades:[], board:"CBSE", experience:"",
    salary_min:"", salary_max:"",
    joining_timeline:"Immediate",
    work_mode:"Full-time",
    // Conditions
    residential:"No", accommodation:"Not Provided",
    gender_preference:"No Preference",
    interview_mode:"Online", demo_required:"No",
    positions:1, status:"Open",
    assigned_recruiter:"", notes:""
  });
  const [myJobs,     setMyJobs]     = useState([]);
  const [jobsLoading,setJobsLoading] = useState(false);
  const [allApplicants, setAllApplicants] = useState([]);  // all applicants across all jobs
  const [appsLoading,setAppsLoading] = useState(false);
  const [dbTeachers,  setDbTeachers]  = useState([]);
  const [dbLoading,   setDbLoading]   = useState(false);
  const [dbFilter,    setDbFilter]    = useState({ search:"", subject:"", city:"", experience:"", mode:"" });
  const [resumeTeacher,  setResumeTeacher]  = useState(null);
  const [contactTeacher, setContactTeacher] = useState(null);
  const [resumeApplicant, setResumeApplicant] = useState(null); // applicant resume modal

  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const up = (k, v) => setForm(f => ({...f, [k]:v}));
  const API_BASE = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  // ── Fetch school's own jobs from acadhr.jobs ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("acadhr_token");
    if (!token) return;
    setJobsLoading(true);
    fetch(`${API_BASE}/jobs/my-jobs`, { headers: { Authorization: "Bearer " + token } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setMyJobs(Array.isArray(data) ? data.map(j => ({
          ...j,
          toReview:      j.applicant_count || 0,
          newApplicants: j.applicant_count || 0,
          location:      j.location_city || "",
          posted:        j.created_at ? new Date(j.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "",
        })) : []);
        setJobsLoading(false);
      })
      .catch(() => setJobsLoading(false));
  }, []);

  // ── Fetch all applicants for all school jobs ──────────────────────────────
  useEffect(() => {
    if (!myJobs.length) return;
    const token = localStorage.getItem("acadhr_token");
    if (!token) return;
    setAppsLoading(true);
    Promise.all(
      myJobs.map(j =>
        fetch(`${API_BASE}/jobs/job-applicants/${j.id}`, { headers: { Authorization: "Bearer " + token } })
          .then(r => r.ok ? r.json() : [])
          .then(apps => apps.map(a => ({ ...a, jobTitle: j.title })))
          .catch(() => [])
      )
    ).then(results => {
      setAllApplicants(results.flat());
      setAppsLoading(false);
    });
  }, [myJobs]);

  // ── Fetch teacher database (public) ──────────────────────────────────────
  function loadTeacherDB() {
    if (dbTeachers.length) return;   // already loaded
    setDbLoading(true);
    fetch(`${API_BASE}/admin/public/teachers`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDbTeachers(Array.isArray(data) ? data : []); setDbLoading(false); })
      .catch(() => setDbLoading(false));
  }

  const [appStatus, setAppStatus] = useState([]);
  const [jobFilter, setJobFilter] = useState({ title:"", status:"" });
  const [appFilter, setAppFilter] = useState({ name:"", subject:"", status:"" });

  async function postJob(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("acadhr_token");
      const payload = {
        ...form,
        grades: Array.isArray(form.grades) ? form.grades : [],
        contact_email: form.email,
        title: (form.requirement_type || "Teacher") + " — " + form.subject,
      };
      const res = await fetch(
        (process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api") + "/jobs",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit job");

      const title = (form.requirement_type || "Teacher") + " — " + form.subject;
      setMyJobs(j => [...j, {
        id: data.jobId,
        requirement_id: data.requirement_id,
        title, status:"pending", toReview:0, newApplicants:0,
        location: form.location_city || "Hyderabad", posted:"Just now", premium:false
      }]);

      setShowPost(false);
      setAutoReqId("");
      setForm({
        institution_name:"", institution_type:"",
        location_state:"", location_city:"",
        contact_person:"", contact_number:"", email:"",
        requirement_type:"Teacher",
        subject:"", grades:[], board:"CBSE", experience:"",
        salary_min:"", salary_max:"",
        joining_timeline:"Immediate", work_mode:"Full-time",
        residential:"No", accommodation:"Not Provided",
        gender_preference:"No Preference",
        interview_mode:"Online", demo_required:"No",
        positions:1, status:"Open",
        assigned_recruiter:"", notes:""
      });
      showToast("Job submitted! ID: " + data.requirement_id);
      setTab("overview");
    } catch (err) {
      console.error('[postJob]', err);
      showToast("❌ Error: " + err.message);
    }
  }

  // School profile state
  const [schoolProfile, setSchoolProfile] = useState({
    // Basic
    institute_name:     user.name  || "",
    email:              user.email || "",
    phone:              user.phone || "",
    city:               user.city  || "",
    // Institution details
    institute_type:     "",
    affiliation_board:  "",
    est_year:           "",
    student_count:      "",
    medium_of_instruction: "",
    classes_offered:    "",
    streams_available:  "",
    // Staff & Infrastructure
    principal_name:     "",
    total_teachers:     "",
    non_teaching_staff: "",
    infrastructure:     "",
    // Contact & Location
    address:            "",
    state:              "",
    pincode:            "",
    website:            "",
    contact_person:     "",
    designation:        "",
    alternate_phone:    "",
    // About
    description:        "",
    hiring_for:         "",
    social_media:       "",
  });
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const upProfile = (k, v) => setSchoolProfile(p => ({...p, [k]:v}));

  const liveJobs  = myJobs.filter(j => j.status === "approved");
  const pendJobs  = myJobs.filter(j => j.status === "pending");
  const totalCandidates = allApplicants.length || myJobs.reduce((s,j) => s + (j.toReview||0), 0);

  const MENU = [
    { id:"overview",   icon:"🏠",  label:"Overview"         },
    { id:"profile",    icon:"🏫",  label:"My Profile"       },
    { id:"jobs",       icon:"💼",  label:"My Jobs"          },
    { id:"applicants", icon:"👥",  label:"Applicants"       },
    { id:"database",   icon:"🗄️",  label:"Teacher Database" },
    { id:"analytics",  icon:"📊",  label:"Analytics"        },
    { id:"credits",    icon:"💳",  label:"Credits"          },
    { id:"settings",   icon:"⚙️",  label:"Settings"         },
  ];
  const EXPS = ["Fresher OK","1+ Years","2+ Years","3+ Years","5+ Years","10+ Years"];


  return (
    <div style={{ display:"flex", width:"100vw", minHeight:"100vh", background:"#F7F8FA", fontFamily:"Nunito,sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width:sidebarOpen?210:64, flexShrink:0, background:"#fff", borderRight:"1px solid #E5E7EB", display:"flex", flexDirection:"column", transition:"width .2s", overflow:"hidden", position:"fixed", top:0, left:0, bottom:0, zIndex:300 }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:56 }}>
          {sidebarOpen && <div style={{ cursor:"pointer" }} onClick={() => setPage("home")}><img src="/acadhr-logo.png" alt="AcadHr" style={{ height:32, objectFit:"contain" }} /></div>}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#6B7280", padding:4 }}>{sidebarOpen ? "◀" : "▶"}</button>
        </div>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#1A56DB", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>{user.name.charAt(0)}</div>
          {sidebarOpen && <div style={{ overflow:"hidden" }}><div style={{ fontWeight:700, fontSize:13, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div><div style={{ fontSize:11, color:"#9CA3AF" }}>{user.email || "institute@edu.in"}</div></div>}
        </div>
        <div style={{ flex:1, paddingTop:8 }}>
          {MENU.map(m => (
            <div key={m.id} onClick={() => {
              setTab(m.id);
              // Auto-minimize sidebar for Teacher Database to give more space
              if (m.id === "database") setSidebarOpen(false);
              else if (!sidebarOpen) setSidebarOpen(true);
            }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", borderLeft:`3px solid ${tab===m.id?"#1A56DB":"transparent"}`, background:tab===m.id?"#EBF5FF":"transparent", color:tab===m.id?"#1A56DB":"#374151", fontWeight:tab===m.id?700:600, fontSize:14, transition:"all .15s" }}>
              <span style={{ fontSize:17, flexShrink:0 }}>{m.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace:"nowrap" }}>{m.label}</span>}
              {sidebarOpen && m.id==="jobs" && <span style={{ marginLeft:"auto", background:"#1A56DB", color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:800 }}>{myJobs.length}</span>}
            </div>
          ))}
          {sidebarOpen && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", color:"#374151", fontWeight:600, fontSize:14 }}>
              <span style={{ fontSize:17 }}>💬</span><span>WA Quick Recruit</span>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <div style={{ margin:"12px", background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1E429F", marginBottom:4 }}>Hire faster with Premium Jobs</div>
            <div style={{ fontSize:11, color:"#6B7280", marginBottom:10 }}>Contact us to get a better pricing just for you</div>
            <button className="btn btn-primary btn-sm" style={{ width:"100%", justifyContent:"center", fontSize:11 }}>Contact Us</button>
          </div>
        )}
        {sidebarOpen && (
          <div style={{ borderTop:"1px solid #E5E7EB", padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:6, background:"#F3F4F6", border:"1px solid #D1D5DB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#374151" }}>{user.name.substring(0,2).toUpperCase()}</div>
            <div style={{ flex:1, overflow:"hidden" }}><div style={{ fontWeight:700, fontSize:12, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div><div style={{ fontSize:10, color:"#9CA3AF" }}>{liveJobs.length} Job{liveJobs.length!==1?"s":""}</div></div>
            <span style={{ color:"#9CA3AF", fontSize:14 }}>⌄</span>
          </div>
        )}
        <div onClick={logout} style={{ padding:"10px 16px", cursor:"pointer", color:"#DC2626", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", gap:10, borderTop:"1px solid #F3F4F6" }}>
          <span>🚪</span>{sidebarOpen && "Sign Out"}
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft:sidebarOpen?210:64, flex:1, transition:"margin-left .2s" }}>
        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>
                {tab==="overview"?"Overview":tab==="profile"?"My Profile":tab==="jobs"?"My Jobs":tab==="applicants"?"Applicants":tab==="database"?"Teacher Database":tab==="analytics"?"Analytics":tab==="credits"?"Credits":"Settings"}
              </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"#FFF7ED", border:"1px solid #FDE68A", borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700, color:"#D97706" }}><span>🪙</span> 0 +</div>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              setShowPost(true);
              setReqIdLoading(true);
              try {
                const token = localStorage.getItem("acadhr_token");
                const r = await fetch((process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api") + "/generate-req-id", {
                  headers: token ? { Authorization: "Bearer " + token } : {}
                });
                const d = await r.json();
                setAutoReqId(d.requirement_id || "");
              } catch { setAutoReqId(""); }
              finally { setReqIdLoading(false); }
            }} style={{ fontSize:13 }}>Post a Job</button>
          </div>
        </div>

        {toast && <Toast msg={toast} />}

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">

            {/* Welcome header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:4 }}>
                  Welcome back, {(schoolProfile.institute_name || user.name).split(" ")[0]}! 👋
                </h1>
                <p style={{ color:"#6B7280", fontSize:14 }}>Here's your hiring overview for today</p>
              </div>
              <button className="btn btn-primary" onClick={async () => {
                setShowPost(true); setReqIdLoading(true);
                try {
                  const token = localStorage.getItem("acadhr_token");
                  const r = await fetch((process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api") + "/generate-req-id", { headers: token ? { Authorization:"Bearer "+token } : {} });
                  const d = await r.json(); setAutoReqId(d.requirement_id || "");
                } catch { setAutoReqId(""); } finally { setReqIdLoading(false); }
              }}>+ Post a Job</button>
            </div>

            {/* Stats cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:22 }}>
              {[
                { icon:"✅", label:"Live Jobs",          value:liveJobs.length,    color:"#059669", bg:"#ECFDF5", onClick:()=>setTab("jobs") },
                { icon:"⏳", label:"Pending Review",     value:pendJobs.length,    color:"#D97706", bg:"#FFFBEB", onClick:()=>setTab("jobs") },
                { icon:"👥", label:"Total Applicants",   value:totalCandidates,    color:"#1A56DB", bg:"#EBF5FF", onClick:()=>setTab("applicants") },
                { icon:"💳", label:"Credits",            value:0,                  color:"#6D28D9", bg:"#F5F3FF", onClick:()=>setTab("credits") },
              ].map(s => (
                <div key={s.label} onClick={s.onClick}
                  style={{ background:s.bg, borderRadius:14, padding:"20px 18px", cursor:"pointer", transition:"transform .15s, box-shadow .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:"Playfair Display,serif", lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"#6B7280", fontWeight:700, marginTop:6, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Institution quick info */}
            <div style={{ background:"linear-gradient(135deg,#0EA5E9,#1A56DB)", borderRadius:16, padding:"22px 28px", marginBottom:22, display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ width:60, height:60, borderRadius:14, background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>🏫</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:18, color:"#fff", marginBottom:3 }}>{schoolProfile.institute_name || user.name}</div>
                <div style={{ color:"#BAE6FD", fontSize:13 }}>
                  {[schoolProfile.institute_type, schoolProfile.affiliation_board, schoolProfile.city].filter(Boolean).join(" · ") || "Complete your profile to show details"}
                </div>
              </div>
              <button onClick={() => setTab("profile")}
                style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", color:"#fff", padding:"8px 18px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                Edit Profile →
              </button>
            </div>

            {/* Applicants + Live Jobs row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:22 }}>
              {/* Recent Applicants */}
              <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>👥</span>
                    <h3 style={{ fontSize:15, fontWeight:800, color:"#111827" }}>Recent Applicants</h3>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab("applicants")}>View All</button>
                </div>
                {allApplicants.length === 0 ? (
                  <div style={{ padding:"24px 20px", textAlign:"center", color:"#9CA3AF", fontSize:13 }}>
                    No applicants yet — post a job to start receiving applications
                  </div>
                ) : allApplicants.slice(0,3).map((a,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:i<2?"1px solid #F3F4F6":"none" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>👤</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{a.teacher_name || a.name || "Applicant"}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF" }}>{a.subject || "—"} · {a.experience || a.total_experience || "—"}</div>
                    </div>
                    <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                      background:a.status==="shortlisted"?"#ECFDF5":a.status==="rejected"?"#FEF2F2":"#FFFBEB",
                      color:a.status==="shortlisted"?"#059669":a.status==="rejected"?"#DC2626":"#D97706" }}>
                      {a.status==="shortlisted"?"Shortlisted":a.status==="rejected"?"Rejected":"Under Review"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Jobs grid */}
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:20 }}>💼</span>
                  <h3 style={{ fontSize:15, fontWeight:800, color:"#111827" }}>Active Job Postings</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab("jobs")}>View All</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:20 }}>
                {myJobs.slice(0,4).map((j,i) => (
                  <div key={i} style={{ border:"1px solid #E5E7EB", borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                      <span style={{ background:j.status==="approved"?"#ECFDF5":"#FFFBEB", color:j.status==="approved"?"#059669":"#D97706", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, border:`1px solid ${j.status==="approved"?"#A7F3D0":"#FDE68A"}` }}>
                        {j.status==="approved"?"● Live":"⏳ Pending"}
                      </span>
                    </div>
                    <div style={{ fontWeight:800, fontSize:14, color:"#111827", marginBottom:3 }}>{j.title}</div>
                    {j.requirement_id && <div style={{ fontSize:10, color:"#059669", fontFamily:"Fira Code,monospace", fontWeight:700, marginBottom:3 }}>🔖 {j.requirement_id}</div>}
                    <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:12 }}>📍 {j.location} · {j.posted}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ flex:1, background:"#F9FAFB", borderRadius:8, padding:"8px 0", textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{j.toReview}</div>
                        <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:600 }}>To Review</div>
                      </div>
                      <div style={{ flex:1, background:"#F9FAFB", borderRadius:8, padding:"8px 0", textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:"#1A56DB" }}>{j.newApplicants}</div>
                        <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:600 }}>New</div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Post new job card */}
                <div onClick={async () => {
                  setShowPost(true); setReqIdLoading(true);
                  try {
                    const token = localStorage.getItem("acadhr_token");
                    const r = await fetch((process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api") + "/generate-req-id", { headers: token ? { Authorization:"Bearer "+token } : {} });
                    const d = await r.json(); setAutoReqId(d.requirement_id || "");
                  } catch { setAutoReqId(""); } finally { setReqIdLoading(false); }
                }} style={{ border:"2px dashed #D1D5DB", borderRadius:12, padding:16, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:"#9CA3AF", minHeight:120, transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#1A56DB"; e.currentTarget.style.color="#1A56DB"; e.currentTarget.style.background="#EBF5FF"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#D1D5DB"; e.currentTarget.style.color="#9CA3AF"; e.currentTarget.style.background="transparent"; }}>
                  <span style={{ fontSize:28 }}>+</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>Post New Job</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MY PROFILE ══ */}
        {tab==="profile" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            {!profileEditMode ? (
              <>
                {/* Hero */}
                <div style={{ background:"linear-gradient(135deg,#0EA5E9,#1A56DB)", borderRadius:20, padding:"32px 36px", marginBottom:20, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
                  <div style={{ position:"absolute", bottom:-60, right:80, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
                  <div style={{ display:"flex", alignItems:"center", gap:24, position:"relative", zIndex:1 }}>
                    <div style={{ width:88, height:88, borderRadius:18, background:"rgba(255,255,255,.2)", border:"3px solid rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, flexShrink:0 }}>🏫</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:4 }}>{schoolProfile.institute_name || user.name}</div>
                      <div style={{ color:"#BAE6FD", fontSize:14, fontWeight:600, marginBottom:8 }}>
                        {[schoolProfile.institute_type, schoolProfile.affiliation_board].filter(Boolean).join(" · ") || "School / Institution"}
                      </div>
                      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                        {schoolProfile.city    && <span style={{ color:"#E0F2FE", fontSize:13 }}>📍 {schoolProfile.city}</span>}
                        {schoolProfile.est_year && <span style={{ color:"#E0F2FE", fontSize:13 }}>📅 Est. {schoolProfile.est_year}</span>}
                        {schoolProfile.student_count && <span style={{ color:"#E0F2FE", fontSize:13 }}>👥 {schoolProfile.student_count}</span>}
                        {schoolProfile.medium_of_instruction && <span style={{ color:"#E0F2FE", fontSize:13 }}>🗣 {schoolProfile.medium_of_instruction}</span>}
                      </div>
                    </div>
                    <button onClick={() => setProfileEditMode(true)}
                      style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", color:"#fff", padding:"10px 20px", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:14, backdropFilter:"blur(4px)", flexShrink:0 }}>
                      ✏️ Edit Profile
                    </button>
                  </div>
                </div>

                {profileSaved && <div className="alert a-ok" style={{ marginBottom:16 }}>✅ Profile updated successfully!</div>}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

                  {/* Section 1: Institution Details */}
                  <div className="card" style={{ padding:22 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:"#0EA5E9", textTransform:"uppercase", letterSpacing:1, marginBottom:14, paddingBottom:8, borderBottom:"2px solid #E0F2FE" }}>🏫 Institution Details</div>
                    {[
                      ["Name",              schoolProfile.institute_name || user.name, "🏫"],
                      ["Type",              schoolProfile.institute_type,              "🏷️"],
                      ["Affiliation/Board", schoolProfile.affiliation_board,           "📋"],
                      ["Est. Year",         schoolProfile.est_year,                    "📅"],
                      ["Students",          schoolProfile.student_count,               "👥"],
                      ["Classes Offered",   schoolProfile.classes_offered,             "📚"],
                      ["Streams",           schoolProfile.streams_available,           "🎓"],
                      ["Medium",            schoolProfile.medium_of_instruction,       "🗣"],
                    ].filter(([,v]) => v).map(([l,v,i]) => (
                      <div key={l} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{i}</span>
                        <div><div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:1 }}>{l}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{v}</div></div>
                      </div>
                    ))}
                  </div>

                  {/* Section 2: Contact Details */}
                  <div className="card" style={{ padding:22 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:"#059669", textTransform:"uppercase", letterSpacing:1, marginBottom:14, paddingBottom:8, borderBottom:"2px solid #ECFDF5" }}>📞 Contact & Location</div>
                    {[
                      ["Email",           schoolProfile.email || user.email, "📧"],
                      ["Phone",           schoolProfile.phone,                "📱"],
                      ["Alt. Phone",      schoolProfile.alternate_phone,      "📲"],
                      ["Contact Person",  schoolProfile.contact_person,       "👤"],
                      ["Designation",     schoolProfile.designation,          "💼"],
                      ["Principal",       schoolProfile.principal_name,       "🎓"],
                      ["Address",         schoolProfile.address,              "📍"],
                      ["City",            schoolProfile.city,                 "🏙️"],
                      ["State",           schoolProfile.state,                "🗺️"],
                      ["Pincode",         schoolProfile.pincode,              "📮"],
                    ].filter(([,v]) => v).map(([l,v,i]) => (
                      <div key={l} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{i}</span>
                        <div style={{ minWidth:0 }}><div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:1 }}>{l}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#111827", wordBreak:"break-word" }}>{v}</div></div>
                      </div>
                    ))}
                    {schoolProfile.website && (
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                        <span style={{ fontSize:14 }}>🌐</span>
                        <div><div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:1 }}>Website</div>
                        <a href={schoolProfile.website} target="_blank" rel="noreferrer" style={{ fontSize:13, fontWeight:600, color:"#1A56DB" }}>{schoolProfile.website}</a></div>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Staff & Infrastructure */}
                  <div className="card" style={{ padding:22 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:"#6D28D9", textTransform:"uppercase", letterSpacing:1, marginBottom:14, paddingBottom:8, borderBottom:"2px solid #F5F3FF" }}>👨‍🏫 Staff & Infrastructure</div>
                    {[
                      ["Total Teachers",    schoolProfile.total_teachers,     "👩‍🏫"],
                      ["Non-Teaching Staff",schoolProfile.non_teaching_staff,  "👔"],
                      ["Infrastructure",    schoolProfile.infrastructure,      "🏗️"],
                    ].filter(([,v]) => v).map(([l,v,i]) => (
                      <div key={l} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{i}</span>
                        <div><div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:1 }}>{l}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{v}</div></div>
                      </div>
                    ))}
                    {schoolProfile.hiring_for && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>Currently Hiring For</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {schoolProfile.hiring_for.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                            <span key={s} style={{ background:"#F5F3FF", color:"#6D28D9", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 4: Hiring Stats */}
                  <div className="card" style={{ padding:22 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:14, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>📊 Hiring Activity</div>
                    {[
                      ["Live Jobs",       liveJobs.length,   "✅", "#059669"],
                      ["Pending Review",  pendJobs.length,   "⏳", "#D97706"],
                      ["Total Jobs",      myJobs.length,     "💼", "#1A56DB"],
                      ["Total Applicants",totalCandidates,   "👥", "#6D28D9"],
                    ].map(([l,v,i,c]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #F3F4F6" }}>
                        <span style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>{i} {l}</span>
                        <span style={{ fontWeight:800, fontSize:15, color:c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {schoolProfile.description && (
                  <div className="card" style={{ padding:22, marginBottom:16 }}>
                    <div style={{ fontWeight:800, fontSize:12, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>📝 About the Institution</div>
                    <p style={{ fontSize:13, color:"#374151", lineHeight:1.8, margin:0 }}>{schoolProfile.description}</p>
                  </div>
                )}

                <div style={{ textAlign:"center", marginTop:16 }}>
                  <button className="btn btn-primary" style={{ justifyContent:"center", minWidth:200 }} onClick={() => setProfileEditMode(true)}>✏️ Edit Profile</button>
                </div>
              </>
            ) : (
              /* ── EDIT MODE ── */
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#111827" }}>Edit Institution Profile</h2>
                    <p style={{ color:"#6B7280", fontSize:13, marginTop:2 }}>Fill all details for a complete profile</p>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setProfileEditMode(false); setProfileSaved(false); }}>✕ Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setProfileEditMode(false); setProfileSaved(true); }}>Save ✓</button>
                  </div>
                </div>

                {/* Section 1 */}
                <div className="card" style={{ padding:28, marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:12, color:"#0EA5E9", textTransform:"uppercase", letterSpacing:1, marginBottom:16, paddingBottom:8, borderBottom:"2px solid #E0F2FE" }}>🏫 Institution Details</div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Institution Name *</label>
                      <input className="input" value={schoolProfile.institute_name} onChange={e => upProfile("institute_name",e.target.value)} placeholder="e.g. Delhi Public School" /></div>
                    <div className="fg"><label className="flabel">Institution Type *</label>
                      <select className="input" value={schoolProfile.institute_type} onChange={e => upProfile("institute_type",e.target.value)}>
                        <option value="">Select type</option>
                        <option>School</option><option>Coaching Centre</option><option>Junior College</option><option>Degree College</option><option>Online Platform</option><option>Residential School</option>
                      </select></div>
                    <div className="fg"><label className="flabel">Affiliation / Board</label>
                      <select className="input" value={schoolProfile.affiliation_board} onChange={e => upProfile("affiliation_board",e.target.value)}>
                        <option value="">Select board</option>
                        <option>CBSE</option><option>ICSE</option><option>State Board (AP)</option><option>State Board (TS)</option><option>IB</option><option>IGCSE</option><option>Multiple Boards</option>
                      </select></div>
                    <div className="fg"><label className="flabel">Est. Year</label>
                      <input className="input" type="number" value={schoolProfile.est_year} onChange={e => upProfile("est_year",e.target.value)} placeholder="e.g. 1995" /></div>
                    <div className="fg"><label className="flabel">No. of Students</label>
                      <select className="input" value={schoolProfile.student_count} onChange={e => upProfile("student_count",e.target.value)}>
                        <option value="">Select</option>
                        <option>Under 500</option><option>500–1,000</option><option>1,000–3,000</option><option>3,000–5,000</option><option>5,000+</option>
                      </select></div>
                    <div className="fg"><label className="flabel">Medium of Instruction</label>
                      <select className="input" value={schoolProfile.medium_of_instruction} onChange={e => upProfile("medium_of_instruction",e.target.value)}>
                        <option value="">Select</option>
                        <option>English</option><option>Hindi</option><option>Telugu</option><option>Kannada</option><option>Tamil</option><option>Bilingual</option>
                      </select></div>
                    <div className="fg"><label className="flabel">Classes Offered</label>
                      <input className="input" value={schoolProfile.classes_offered} onChange={e => upProfile("classes_offered",e.target.value)} placeholder="e.g. Nursery–Grade 12" /></div>
                    <div className="fg"><label className="flabel">Streams Available</label>
                      <input className="input" value={schoolProfile.streams_available} onChange={e => upProfile("streams_available",e.target.value)} placeholder="e.g. Science, Commerce, Arts" /></div>
                  </div>
                  <div className="fg"><label className="flabel">About the Institution</label>
                    <textarea className="input" rows={3} value={schoolProfile.description} onChange={e => upProfile("description",e.target.value)} placeholder="Brief description about your institution, vision, mission..." /></div>
                  <div className="fg"><label className="flabel">Currently Hiring For (comma separated)</label>
                    <input className="input" value={schoolProfile.hiring_for} onChange={e => upProfile("hiring_for",e.target.value)} placeholder="e.g. Mathematics Teacher, Science Teacher, Hindi Teacher" /></div>
                </div>

                {/* Section 2 */}
                <div className="card" style={{ padding:28, marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:12, color:"#059669", textTransform:"uppercase", letterSpacing:1, marginBottom:16, paddingBottom:8, borderBottom:"2px solid #ECFDF5" }}>📞 Contact & Location</div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Email *</label>
                      <input className="input" type="email" value={schoolProfile.email} onChange={e => upProfile("email",e.target.value)} placeholder="contact@school.edu.in" /></div>
                    <div className="fg"><label className="flabel">Phone *</label>
                      <input className="input" type="tel" value={schoolProfile.phone} onChange={e => upProfile("phone",e.target.value)} placeholder="+91 98765 43210" /></div>
                    <div className="fg"><label className="flabel">Alternate Phone</label>
                      <input className="input" type="tel" value={schoolProfile.alternate_phone} onChange={e => upProfile("alternate_phone",e.target.value)} placeholder="+91 98765 43210" /></div>
                    <div className="fg"><label className="flabel">Contact Person</label>
                      <input className="input" value={schoolProfile.contact_person} onChange={e => upProfile("contact_person",e.target.value)} placeholder="e.g. Admissions Head" /></div>
                    <div className="fg"><label className="flabel">Designation</label>
                      <input className="input" value={schoolProfile.designation} onChange={e => upProfile("designation",e.target.value)} placeholder="e.g. HR Manager" /></div>
                    <div className="fg"><label className="flabel">Principal Name</label>
                      <input className="input" value={schoolProfile.principal_name} onChange={e => upProfile("principal_name",e.target.value)} placeholder="e.g. Dr. Ramesh Kumar" /></div>
                    <div className="fg"><label className="flabel">City *</label>
                      <input className="input" value={schoolProfile.city} onChange={e => upProfile("city",e.target.value)} placeholder="Hyderabad" /></div>
                    <div className="fg"><label className="flabel">State</label>
                      <input className="input" value={schoolProfile.state} onChange={e => upProfile("state",e.target.value)} placeholder="Telangana" /></div>
                  </div>
                  <div className="fg"><label className="flabel">Full Address</label>
                    <input className="input" value={schoolProfile.address} onChange={e => upProfile("address",e.target.value)} placeholder="Plot No., Street, Area, City" /></div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Pincode</label>
                      <input className="input" value={schoolProfile.pincode} onChange={e => upProfile("pincode",e.target.value)} placeholder="500001" /></div>
                    <div className="fg"><label className="flabel">Website</label>
                      <input className="input" type="url" value={schoolProfile.website} onChange={e => upProfile("website",e.target.value)} placeholder="https://school.edu.in" /></div>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="card" style={{ padding:28, marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:12, color:"#6D28D9", textTransform:"uppercase", letterSpacing:1, marginBottom:16, paddingBottom:8, borderBottom:"2px solid #F5F3FF" }}>👨‍🏫 Staff & Infrastructure</div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Total Teachers</label>
                      <select className="input" value={schoolProfile.total_teachers} onChange={e => upProfile("total_teachers",e.target.value)}>
                        <option value="">Select</option>
                        <option>1–10</option><option>10–25</option><option>25–50</option><option>50–100</option><option>100+</option>
                      </select></div>
                    <div className="fg"><label className="flabel">Non-Teaching Staff</label>
                      <select className="input" value={schoolProfile.non_teaching_staff} onChange={e => upProfile("non_teaching_staff",e.target.value)}>
                        <option value="">Select</option>
                        <option>1–10</option><option>10–25</option><option>25–50</option><option>50+</option>
                      </select></div>
                  </div>
                  <div className="fg"><label className="flabel">Infrastructure / Facilities</label>
                    <textarea className="input" rows={2} value={schoolProfile.infrastructure} onChange={e => upProfile("infrastructure",e.target.value)} placeholder="e.g. Smart classrooms, Labs, Library, Sports complex, Hostel..." /></div>
                  <div className="fg"><label className="flabel">Social Media / Other Links</label>
                    <input className="input" value={schoolProfile.social_media} onChange={e => upProfile("social_media",e.target.value)} placeholder="Facebook / LinkedIn page URL" /></div>
                </div>

                <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                  <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setProfileEditMode(false); setProfileSaved(false); }}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex:2, justifyContent:"center" }} onClick={() => { setProfileEditMode(false); setProfileSaved(true); }}>Save All Changes ✓</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ MY JOBS ══ */}
        {tab==="jobs" && (
          <div style={{ padding:"28px" }} className="fadeUp">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:4 }}>My Jobs</h2>
                <p style={{ color:"#6B7280", fontSize:13 }}>{myJobs.length} job{myJobs.length!==1?"s":""} posted</p>
              </div>
              <button className="btn btn-primary" onClick={async () => {
                setShowPost(true); setReqIdLoading(true);
                try {
                  const token = localStorage.getItem("acadhr_token");
                  const r = await fetch((process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api") + "/jobs/generate-req-id", { headers: { Authorization:"Bearer "+token } });
                  const d = await r.json(); setAutoReqId(d.requirement_id||"");
                } catch { setAutoReqId(""); } finally { setReqIdLoading(false); }
              }}>+ Post New Job</button>
            </div>

            {/* Filter bar */}
            <div style={{ display:"flex", gap:10, marginBottom:24, background:"#fff", padding:"14px 18px", borderRadius:12, border:"1px solid #E5E7EB", flexWrap:"wrap" }}>
              <input className="input" style={{ maxWidth:260 }} placeholder="🔍 Search title..."
                value={jobFilter.title} onChange={e => setJobFilter(f => ({...f, title:e.target.value}))} />
              <select className="input" style={{ maxWidth:180 }} value={jobFilter.status} onChange={e => setJobFilter(f => ({...f, status:e.target.value}))}>
                <option value="">All Statuses</option>
                <option value="approved">✅ Live</option>
                <option value="pending">⏳ Pending</option>
                <option value="rejected">❌ Rejected</option>
              </select>
              {(jobFilter.title||jobFilter.status) && (
                <button className="btn btn-ghost btn-sm" onClick={() => setJobFilter({ title:"", status:"" })}>Clear ✕</button>
              )}
            </div>

            {jobsLoading ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#6B7280" }}>
                <div style={{ width:36, height:36, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 14px" }} />
                <div style={{ fontWeight:600 }}>Loading jobs from database...</div>
              </div>
            ) : myJobs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>💼</div>
                <h3 style={{ color:"#111827", marginBottom:8 }}>No jobs posted yet</h3>
                <p style={{ fontSize:14 }}>Post your first job to start receiving applications</p>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
                {myJobs
                  .filter(j =>
                    (!jobFilter.title  || (j.title||"").toLowerCase().includes(jobFilter.title.toLowerCase())) &&
                    (!jobFilter.status || j.status === jobFilter.status)
                  )
                  .map(j => (
                    <div key={j.id} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:22, display:"flex", flexDirection:"column", gap:12, transition:"all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 6px 24px rgba(26,86,219,.1)"; e.currentTarget.style.borderColor="#93C5FD"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#E5E7EB"; }}>

                      {/* Status + REQ ID */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ background:j.status==="approved"?"#ECFDF5":j.status==="rejected"?"#FEF2F2":"#FFFBEB", color:j.status==="approved"?"#059669":j.status==="rejected"?"#DC2626":"#D97706", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, border:`1px solid ${j.status==="approved"?"#A7F3D0":j.status==="rejected"?"#FECACA":"#FDE68A"}` }}>
                          {j.status==="approved"?"✅ Live":j.status==="rejected"?"❌ Rejected":"⏳ Pending"}
                        </span>
                        {j.requirement_id && <span style={{ fontSize:10, color:"#059669", fontFamily:"Fira Code,monospace", fontWeight:700 }}>🔖 {j.requirement_id}</span>}
                      </div>

                      {/* Title */}
                      <div>
                        <div style={{ fontWeight:800, fontSize:16, color:"#111827", marginBottom:4 }}>{j.title}</div>
                        <div style={{ fontSize:12, color:"#1A56DB", fontWeight:600 }}>{j.institution_name || user.name}</div>
                      </div>

                      {/* Meta pills */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {j.location_city && <span style={{ background:"#F3F4F6", color:"#374151", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600 }}>📍 {j.location_city}</span>}
                        {j.subject       && <span style={{ background:"#EBF5FF", color:"#1A56DB", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600 }}>📚 {j.subject}</span>}
                        {j.board         && <span style={{ background:"#F5F3FF", color:"#6D28D9", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600 }}>{j.board}</span>}
                        {j.experience    && <span style={{ background:"#F9FAFB", color:"#6B7280", borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:600 }}>🎓 {j.experience}</span>}
                      </div>

                      {/* Salary + Date */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:"1px solid #F3F4F6" }}>
                        <span style={{ fontWeight:800, fontSize:13, color:"#059669" }}>
                          {j.salary_min && j.salary_max ? `₹${Number(j.salary_min).toLocaleString("en-IN")}–₹${Number(j.salary_max).toLocaleString("en-IN")}/mo` : "Negotiable"}
                        </span>
                        <span style={{ fontSize:11, color:"#9CA3AF" }}>📅 {j.posted}</span>
                      </div>

                      {/* Applicants count + View button */}
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <div style={{ flex:1, background:"#EBF5FF", borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:"#1A56DB", lineHeight:1 }}>{j.toReview||0}</div>
                          <div style={{ fontSize:10, color:"#6B7280", fontWeight:600, marginTop:2 }}>Applicants</div>
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ flex:2, justifyContent:"center" }}
                          onClick={() => setTab("applicants")}>View Applicants →</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ══ APPLICANTS ══ */}
        {tab==="applicants" && (
          <div style={{ padding:"28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:4 }}>Applicants</h2>
            <p style={{ color:"#6B7280", fontSize:13, marginBottom:20 }}>{allApplicants.length} application{allApplicants.length!==1?"s":""} across all your jobs</p>

            {/* Filter bar */}
            <div style={{ display:"flex", gap:10, marginBottom:20, background:"#fff", padding:"14px 18px", borderRadius:12, border:"1px solid #E5E7EB", flexWrap:"wrap" }}>
              <input className="input" style={{ maxWidth:200 }} placeholder="🔍 Search name..."
                value={appFilter.name} onChange={e => setAppFilter(f => ({...f, name:e.target.value}))} />
              <input className="input" style={{ maxWidth:180 }} placeholder="📚 Subject..."
                value={appFilter.subject} onChange={e => setAppFilter(f => ({...f, subject:e.target.value}))} />
              <select className="input" style={{ maxWidth:180 }} value={appFilter.status} onChange={e => setAppFilter(f => ({...f, status:e.target.value}))}>
                <option value="">All Statuses</option>
                <option value="pending">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Not Selected</option>
              </select>
              {(appFilter.name||appFilter.subject||appFilter.status) && (
                <button className="btn btn-ghost btn-sm" onClick={() => setAppFilter({ name:"", subject:"", status:"" })}>Clear ✕</button>
              )}
            </div>

            {appsLoading ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#6B7280" }}>
                <div style={{ width:36, height:36, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 14px" }} />
                <div style={{ fontWeight:600 }}>Loading applicants from database...</div>
              </div>
            ) : allApplicants.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
                <h3 style={{ color:"#111827", marginBottom:8 }}>No applications yet</h3>
                <p style={{ fontSize:14 }}>Applications will appear here once teachers apply to your jobs</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {allApplicants
                  .filter(a =>
                    (!appFilter.name    || (a.teacher_name||"").toLowerCase().includes(appFilter.name.toLowerCase())) &&
                    (!appFilter.subject || (a.subject||"").toLowerCase().includes(appFilter.subject.toLowerCase())) &&
                    (!appFilter.status  || a.status === appFilter.status)
                  )
                  .map((a, i) => (
                    <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"18px 22px", transition:"all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 20px rgba(26,86,219,.09)"; e.currentTarget.style.borderColor="#BFDBFE"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#E5E7EB"; }}>

                      {/* Row 1 — Avatar + Name + Status */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                          <div style={{ width:48, height:48, borderRadius:12, background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#1A56DB", flexShrink:0, overflow:"hidden" }}>
                            {a.profile_photo
                              ? <img
                                  src={a.profile_photo.startsWith("http")
                                    ? a.profile_photo
                                    : (process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + a.profile_photo}
                                  alt=""
                                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                                  onError={e => { e.target.style.display="none"; e.target.parentNode.innerHTML = (a.teacher_name||"A").charAt(0).toUpperCase(); }}
                                />
                              : (a.teacher_name||"A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{a.teacher_name||a.name||"Applicant"}</div>
                            <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{a.email||""}</div>
                          </div>
                        </div>
                        <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, flexShrink:0,
                          background: a.status==="shortlisted"?"#ECFDF5":a.status==="rejected"?"#FEF2F2":"#FFFBEB",
                          color:      a.status==="shortlisted"?"#059669":a.status==="rejected"?"#DC2626":"#D97706",
                          border:`1px solid ${a.status==="shortlisted"?"#A7F3D0":a.status==="rejected"?"#FECACA":"#FDE68A"}` }}>
                          {a.status==="shortlisted"?"✅ Shortlisted":a.status==="rejected"?"❌ Not Selected":"⏳ Under Review"}
                        </span>
                      </div>

                      {/* Row 2 — Job applied for */}
                      <div style={{ background:"#F0F4FF", borderRadius:8, padding:"7px 12px", marginBottom:10, borderLeft:"3px solid #1A56DB", display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>Applied for:</span>
                        <span style={{ fontSize:13, color:"#1A56DB", fontWeight:700 }}>{a.jobTitle||"—"}</span>
                      </div>

                      {/* Row 3 — Details */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14 }}>
                        {a.subject && <span style={{ background:"#F3F4F6", color:"#374151", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 }}>📚 {a.subject}</span>}
                        {(a.experience||a.total_experience) && <span style={{ background:"#EBF5FF", color:"#1A56DB", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 }}>⏳ {a.experience||a.total_experience}</span>}
                        {a.qualification && <span style={{ background:"#F5F3FF", color:"#6D28D9", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 }}>🎓 {a.qualification}</span>}
                        {a.city && <span style={{ background:"#F3F4F6", color:"#374151", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600 }}>📍 {a.city}</span>}
                        {a.completion_pct > 0 && <span style={{ background:a.completion_pct>=70?"#ECFDF5":"#FFFBEB", color:a.completion_pct>=70?"#059669":"#D97706", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>👤 {a.completion_pct}% profile</span>}
                        <span style={{ background:"#F9FAFB", color:"#9CA3AF", borderRadius:20, padding:"3px 10px", fontSize:12 }}>
                          📅 {a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                        </span>
                      </div>

                      {/* Row 4 — Actions */}
                      <div style={{ display:"flex", justifyContent:"flex-end", gap:8, paddingTop:10, borderTop:"1px solid #F3F4F6" }}>
                        <button
                          style={{ padding:"8px 16px", borderRadius:9, border:"1.5px solid #D1D5DB", background:"#fff", color:"#374151", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                          onClick={() => setResumeApplicant(a)}
                          onMouseEnter={e => { e.currentTarget.style.background="#F9FAFB"; e.currentTarget.style.borderColor="#9CA3AF"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#D1D5DB"; }}>
                          📄 View Resume
                        </button>
                        <button
                          style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"#ECFDF5", color:"#059669", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                          onClick={() => {
                            const token = localStorage.getItem("acadhr_token");
                            fetch(`${API_BASE}/jobs/applications/${a.id}`, { method:"PATCH", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body:JSON.stringify({status:"shortlisted"}) })
                              .then(() => setAllApplicants(prev => prev.map(x => x.id===a.id ? {...x, status:"shortlisted"} : x)));
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background="#059669"; e.currentTarget.style.color="#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="#ECFDF5"; e.currentTarget.style.color="#059669"; }}>
                          ✓ Shortlist
                        </button>
                        <button
                          style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"#FEF2F2", color:"#DC2626", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                          onClick={() => {
                            const token = localStorage.getItem("acadhr_token");
                            fetch(`${API_BASE}/jobs/applications/${a.id}`, { method:"PATCH", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body:JSON.stringify({status:"rejected"}) })
                              .then(() => setAllApplicants(prev => prev.map(x => x.id===a.id ? {...x, status:"rejected"} : x)));
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background="#DC2626"; e.currentTarget.style.color="#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="#FEF2F2"; e.currentTarget.style.color="#DC2626"; }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TEACHER DATABASE ══ */}
        {tab==="database" && (() => {
          if (!dbTeachers.length && !dbLoading) loadTeacherDB();
          const filtered = dbTeachers.filter(t =>
            (!dbFilter.search     || (t.name||"").toLowerCase().includes(dbFilter.search.toLowerCase()) ||
                                     (t.specialization||"").toLowerCase().includes(dbFilter.search.toLowerCase())) &&
            (!dbFilter.subject    || (t.specialization||"").toLowerCase().includes(dbFilter.subject.toLowerCase())) &&
            (!dbFilter.city       || (t.city||"").toLowerCase().includes(dbFilter.city.toLowerCase())) &&
            (!dbFilter.experience || t.total_experience === dbFilter.experience) &&
            (!dbFilter.mode       || (t.work_mode||"").toLowerCase().includes(dbFilter.mode.toLowerCase()))
          );

          const FilterSection = ({ label, icon, children }) => {
            const [open, setOpen] = useState(true);
            return (
              <div style={{ marginBottom:8, borderBottom:"1px solid #F3F4F6" }}>
                <div onClick={() => setOpen(o => !o)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 4px", cursor:"pointer", userSelect:"none" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:.6 }}>{icon} {label}</span>
                  <span style={{ fontSize:11, color:"#9CA3AF", transition:"transform .2s", transform:open?"rotate(180deg)":"none" }}>▾</span>
                </div>
                {open && <div style={{ paddingBottom:10 }}>{children}</div>}
              </div>
            );
          };

          const DropFilter = ({ value, onChange, options, placeholder }) => (
            <select
              value={value}
              onChange={e => onChange(e.target.value)}
              style={{ width:"100%", border:"1.5px solid #D1D5DB", borderRadius:8, padding:"9px 10px", fontSize:13, color:"#111827", background:"#fff", cursor:"pointer", outline:"none", fontFamily:"Nunito,sans-serif", fontWeight:500, appearance:"auto", WebkitAppearance:"auto" }}>
              <option value="" style={{ color:"#6B7280", fontWeight:400 }}>{placeholder}</option>
              {options.map(o => <option key={o} value={o} style={{ color:"#111827", fontWeight:500 }}>{o}</option>)}
            </select>
          );

          return (
            <div style={{ display:"flex", height:"100%", minHeight:"calc(100vh - 130px)" }} className="fadeUp">

              {/* ── Left filter panel ─────────────────────────────────────── */}
              <div style={{ width:220, flexShrink:0, borderRight:"1px solid #E5E7EB", padding:"20px 16px", background:"#FAFBFC", overflowY:"auto" }}>

                <div style={{ fontWeight:800, fontSize:14, color:"#111827", marginBottom:16 }}>🔍 Filters</div>

                {/* Search */}
                <FilterSection label="Search" icon="">
                  <input className="input" style={{ fontSize:13, padding:"8px 10px", width:"100%" }}
                    placeholder="Name or subject..."
                    value={dbFilter.search}
                    onChange={e => setDbFilter(f => ({...f, search:e.target.value}))} />
                </FilterSection>

                {/* Subject */}
                <FilterSection label="Subject" icon="📚">
                  <DropFilter
                    value={dbFilter.subject}
                    onChange={v => setDbFilter(f => ({...f, subject:v}))}
                    placeholder="All Subjects"
                    options={["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit"]} />
                </FilterSection>

                {/* City */}
                <FilterSection label="City" icon="📍">
                  <DropFilter
                    value={dbFilter.city}
                    onChange={v => setDbFilter(f => ({...f, city:v}))}
                    placeholder="All Cities"
                    options={["Hyderabad","Delhi","Mumbai","Bangalore","Chennai","Pune","Kolkata","Ahmedabad","Visakhapatnam","Vijayawada"]} />
                </FilterSection>

                {/* Experience */}
                <FilterSection label="Experience" icon="⏳">
                  <DropFilter
                    value={dbFilter.experience}
                    onChange={v => setDbFilter(f => ({...f, experience:v}))}
                    placeholder="All Experience"
                    options={["Fresher","Less than 1 Year","1–2 Years","2–3 Years","3–5 Years","5–8 Years","8–10 Years","10+ Years"]} />
                </FilterSection>

                {/* Work Mode */}
                <FilterSection label="Work Mode" icon="💼">
                  <DropFilter
                    value={dbFilter.mode}
                    onChange={v => setDbFilter(f => ({...f, mode:v}))}
                    placeholder="All Modes"
                    options={["Full-time","Part-time","Online","Home Tuition"]} />
                </FilterSection>

                {/* Active filters summary */}
                {Object.values(dbFilter).some(v=>v) && (
                  <div style={{ marginTop:12, padding:"10px 12px", background:"#EBF5FF", borderRadius:10, border:"1px solid #BFDBFE" }}>
                    <div style={{ fontSize:11, color:"#1A56DB", fontWeight:700, marginBottom:6 }}>Active Filters:</div>
                    {Object.entries(dbFilter).filter(([,v])=>v).map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"#374151", textTransform:"capitalize" }}>{k}: <strong>{v}</strong></span>
                        <span style={{ cursor:"pointer", color:"#DC2626", fontSize:12, fontWeight:700 }}
                          onClick={() => setDbFilter(f => ({...f, [k]:""}))} >✕</span>
                      </div>
                    ))}
                    <button className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center", marginTop:6, fontSize:12 }}
                      onClick={() => setDbFilter({ search:"", subject:"", city:"", experience:"", mode:"" })}>
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right: cards grid ─────────────────────────────────────── */}
              <div style={{ flex:1, padding:"24px 24px", overflowY:"auto" }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:3 }}>Teacher Database</h2>
                    <p style={{ color:"#6B7280", fontSize:13 }}>
                      <strong style={{ color:"#111827" }}>{filtered.length}</strong> of{" "}
                      <strong style={{ color:"#111827" }}>{dbTeachers.length}</strong> teachers
                      {Object.values(dbFilter).some(v=>v) && <span style={{ color:"#1A56DB", fontWeight:600 }}> (filtered)</span>}
                    </p>
                  </div>
                </div>

                {dbLoading ? (
                  <div style={{ textAlign:"center", padding:"80px 0", color:"#6B7280" }}>
                    <div style={{ width:40, height:40, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
                    <div style={{ fontWeight:600 }}>Loading teacher database...</div>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"80px 0", color:"#9CA3AF" }}>
                    <div style={{ fontSize:52, marginBottom:14 }}>🔍</div>
                    <h3 style={{ color:"#111827", marginBottom:8 }}>
                      {dbTeachers.length === 0 ? "No teachers registered yet" : "No teachers match filters"}
                    </h3>
                    <p style={{ fontSize:14 }}>
                      {dbTeachers.length === 0 ? "Teachers who register on AcadHr will appear here." : "Try adjusting the filters on the left"}
                    </p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {filtered.map(t => (
                      <div key={t.id} style={{ background:"#fff", borderRadius:14, border:"1px solid #E5E7EB", padding:"18px 22px", transition:"all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 20px rgba(26,86,219,.09)"; e.currentTarget.style.borderColor="#BFDBFE"; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#E5E7EB"; }}>

                        {/* Row 1 — Avatar + Name + Badge + Feedback */}
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                            {/* Avatar */}
                            <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", background:"#E0E7FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#4338CA", flexShrink:0 }}>
                              {t.profile_photo
                                ? <img src={(process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + t.profile_photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                : (t.name||"T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{t.name}</span>
                                {(t.completion_pct||0) >= 70 && (
                                  <span style={{ background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700 }}>Top Match</span>
                                )}
                              </div>
                              <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>
                                {[t.total_experience||"Fresher", t.gender].filter(Boolean).join(", ")}
                              </div>
                            </div>
                          </div>
                          {/* Relevance feedback */}
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:11, color:"#9CA3AF" }}>Is this candidate relevant?</span>
                            <button style={{ background:"none", border:"1px solid #E5E7EB", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14 }}>👍</button>
                            <button style={{ background:"none", border:"1px solid #E5E7EB", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14 }}>👎</button>
                          </div>
                        </div>

                        {/* Row 2 — Experience + Location + Language */}
                        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#374151" }}>
                            <span style={{ fontSize:14 }}>💼</span>
                            <span style={{ fontWeight:600 }}>{t.total_experience || "Fresher"}</span>
                          </span>
                          {t.city && (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#374151" }}>
                              <span style={{ fontSize:14 }}>📍</span>
                              <span>{t.city}{t.current_location && t.current_location !== t.city ? `, ${t.current_location}` : ""}</span>
                            </span>
                          )}
                          {t.languages && (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#374151" }}>
                              <span style={{ fontSize:14 }}>🌐</span>
                              <span>{t.languages.split(",")[0]}</span>
                            </span>
                          )}
                        </div>

                        {/* Divider */}
                        <div style={{ height:1, background:"#F3F4F6", margin:"10px 0" }} />

                        {/* Row 3 — Details box */}
                        <div style={{ background:"#F9FAFB", borderRadius:10, padding:"12px 16px", marginBottom:14, borderLeft:"3px solid #BFDBFE" }}>
                          <div style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                            <span style={{ fontSize:12, color:"#6B7280", fontWeight:600, minWidth:130, flexShrink:0 }}>Relevant Experience:</span>
                            <span style={{ fontSize:13, color:"#111827" }}>
                              {t.total_experience || "Fresher"} in{" "}
                              <strong>{t.specialization || t.current_role || "Teaching"}</strong>
                              {!t.total_experience ? " (Interested in Role)" : ""}
                            </span>
                          </div>
                          <div style={{ display:"flex", gap:8, marginBottom:7, alignItems:"flex-start" }}>
                            <span style={{ fontSize:12, color:"#6B7280", fontWeight:600, minWidth:130, flexShrink:0 }}>Education:</span>
                            <span style={{ fontSize:13, color:"#111827" }}>{t.qualification || "—"}</span>
                          </div>
                          {t.subjects && (
                            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                              <span style={{ fontSize:12, color:"#6B7280", fontWeight:600, minWidth:130, flexShrink:0 }}>Subjects:</span>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                {t.subjects.split(",").map(s => s.trim()).filter(Boolean).map(s => (
                                  <span key={s} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 9px", fontSize:12, color:"#374151", fontWeight:500 }}>{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {!t.subjects && t.specialization && (
                            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                              <span style={{ fontSize:12, color:"#6B7280", fontWeight:600, minWidth:130, flexShrink:0 }}>Specialization:</span>
                              <span style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 9px", fontSize:12, color:"#374151", fontWeight:500 }}>{t.specialization}</span>
                            </div>
                          )}
                        </div>

                        {/* Row 4 — Action buttons */}
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                          <button
                            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:9, border:"1.5px solid #D1D5DB", background:"#fff", color:"#374151", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                            onClick={() => setResumeTeacher(t)}
                            onMouseEnter={e => { e.currentTarget.style.background="#F9FAFB"; e.currentTarget.style.borderColor="#9CA3AF"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#D1D5DB"; }}>
                            📄 View Resume
                          </button>
                          <button
                            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:9, border:"none", background:"#1A56DB", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"background .15s" }}
                            onClick={() => setContactTeacher(t)}
                            onMouseEnter={e => e.currentTarget.style.background="#1E429F"}
                            onMouseLeave={e => e.currentTarget.style.background="#1A56DB"}>
                            📞 View Contact
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Applicant Resume Modal ─────────────────────────────────────── */}
        {resumeApplicant && (
          <div className="overlay" onClick={() => setResumeApplicant(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:"#fff", borderRadius:20, width:"90%", maxWidth:780, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
              {/* Header */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:17, color:"#111827", marginBottom:2 }}>
                    📄 Resume — {resumeApplicant.teacher_name||resumeApplicant.name}
                  </h3>
                  <p style={{ fontSize:12, color:"#6B7280" }}>
                    {resumeApplicant.specialization || resumeApplicant.subject || ""} · Applied for: {resumeApplicant.jobTitle||""}
                  </p>
                </div>
                <button onClick={() => setResumeApplicant(null)}
                  style={{ width:32, height:32, borderRadius:"50%", border:"1px solid #E5E7EB", background:"#F9FAFB", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ flex:1, overflow:"auto", padding:24 }}>
                {(() => {
                  const link = resumeApplicant.resume_link;
                  if (!link) return (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
                      <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
                      <h3 style={{ color:"#111827", marginBottom:8 }}>No resume uploaded</h3>
                      <p style={{ fontSize:14, marginBottom:20 }}>{resumeApplicant.teacher_name} hasn't uploaded a resume yet.</p>
                      <button className="btn btn-primary"
                        onClick={() => { setResumeApplicant(null); window.open(`mailto:${resumeApplicant.email}?subject=Please share your resume - ${user.name}`); }}>
                        📧 Request Resume by Email
                      </button>
                    </div>
                  );

                  // Google Drive / Docs
                  if (link.includes("drive.google.com") || link.includes("docs.google.com")) {
                    const embedUrl = link.replace("/view", "/preview").replace("/edit", "/preview");
                    return <iframe src={embedUrl} style={{ width:"100%", height:520, border:"none", borderRadius:10 }} title="Resume" />;
                  }

                  // PDF file (uploaded to server)
                  if (link.endsWith(".pdf") || link.includes("/uploads/")) {
                    const fileUrl = link.startsWith("http")
                      ? link
                      : (process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + link;
                    return <iframe src={fileUrl} style={{ width:"100%", height:520, border:"none", borderRadius:10 }} title="Resume" />;
                  }

                  // External link (not embeddable)
                  return (
                    <div style={{ textAlign:"center", padding:"40px 0" }}>
                      <div style={{ fontSize:48, marginBottom:16 }}>📄</div>
                      <p style={{ color:"#6B7280", marginBottom:20 }}>Resume is on an external link</p>
                      <a href={link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration:"none" }}>
                        Open Resume →
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              {resumeApplicant.resume_link && (
                <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, color:"#6B7280" }}>
                    {resumeApplicant.resume_file_name && <span>📎 {resumeApplicant.resume_file_name}</span>}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setResumeApplicant(null)}>Close</button>
                    <a href={resumeApplicant.resume_link.startsWith("http") ? resumeApplicant.resume_link : (process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + resumeApplicant.resume_link}
                      target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration:"none" }}>
                      Open in New Tab ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Resume Modal ─────────────────────────────────────────────── */}
        {resumeTeacher && (
          <div className="overlay" onClick={() => setResumeTeacher(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:"#fff", borderRadius:20, width:"90%", maxWidth:780, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
              {/* Header */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:17, color:"#111827", marginBottom:2 }}>📄 Resume — {resumeTeacher.name}</h3>
                  <p style={{ fontSize:12, color:"#6B7280" }}>{resumeTeacher.specialization || resumeTeacher.current_role || "Teacher"}</p>
                </div>
                <button onClick={() => setResumeTeacher(null)}
                  style={{ width:32, height:32, borderRadius:"50%", border:"1px solid #E5E7EB", background:"#F9FAFB", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
              {/* Content */}
              <div style={{ flex:1, overflow:"auto", padding:24 }}>
                {resumeTeacher.resume_link ? (
                  // If it's a Google Drive/Docs link, embed it
                  resumeTeacher.resume_link.includes("drive.google.com") || resumeTeacher.resume_link.includes("docs.google.com") ? (
                    <iframe
                      src={resumeTeacher.resume_link.replace("/view", "/preview")}
                      style={{ width:"100%", height:520, border:"none", borderRadius:10 }}
                      title="Resume"
                    />
                  ) : resumeTeacher.resume_link.endsWith(".pdf") ||
                      resumeTeacher.resume_link.includes("uploads") ? (
                    <iframe
                      src={(process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + resumeTeacher.resume_link}
                      style={{ width:"100%", height:520, border:"none", borderRadius:10 }}
                      title="Resume"
                    />
                  ) : (
                    <div style={{ textAlign:"center", padding:"40px 0" }}>
                      <div style={{ fontSize:48, marginBottom:16 }}>📄</div>
                      <p style={{ color:"#6B7280", marginBottom:20 }}>Resume is hosted on an external link</p>
                      <a href={resumeTeacher.resume_link} target="_blank" rel="noreferrer"
                        className="btn btn-primary" style={{ textDecoration:"none" }}>
                        Open Resume →
                      </a>
                    </div>
                  )
                ) : (
                  <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
                    <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
                    <h3 style={{ color:"#111827", marginBottom:8 }}>No resume uploaded</h3>
                    <p style={{ fontSize:14 }}>{resumeTeacher.name} hasn't uploaded a resume yet.</p>
                    <button className="btn btn-primary" style={{ marginTop:16 }}
                      onClick={() => { setResumeTeacher(null); window.open(`mailto:${resumeTeacher.email}?subject=Please share your resume - ${user.name}`); }}>
                      📧 Request Resume by Email
                    </button>
                  </div>
                )}
              </div>
              {/* Footer */}
              {resumeTeacher.resume_link && (
                <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB", display:"flex", justifyContent:"flex-end", gap:10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setResumeTeacher(null)}>Close</button>
                  <a href={resumeTeacher.resume_link} target="_blank" rel="noreferrer"
                    className="btn btn-primary btn-sm" style={{ textDecoration:"none" }}>
                    Open in New Tab ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contact Details Modal ─────────────────────────────────────── */}
        {contactTeacher && (
          <div className="overlay" onClick={() => setContactTeacher(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:"#fff", borderRadius:20, width:"90%", maxWidth:420, boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
              {/* Header */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid #E5E7EB", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#1A56DB" }}>
                    {contactTeacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontWeight:800, fontSize:16, color:"#111827", marginBottom:1 }}>{contactTeacher.name}</h3>
                    <p style={{ fontSize:12, color:"#6B7280" }}>{contactTeacher.specialization || "Teacher"}</p>
                  </div>
                </div>
                <button onClick={() => setContactTeacher(null)}
                  style={{ width:32, height:32, borderRadius:"50%", border:"1px solid #E5E7EB", background:"#F9FAFB", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              {/* Contact details */}
              <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:12 }}>

                {/* Phone */}
                {(contactTeacher.mobile || contactTeacher.phone) && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#F9FAFB", borderRadius:12, border:"1px solid #E5E7EB" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:22 }}>📱</span>
                      <div>
                        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, marginBottom:2 }}>PHONE NUMBER</div>
                        <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>{contactTeacher.mobile || contactTeacher.phone}</div>
                      </div>
                    </div>
                    <a href={`tel:${contactTeacher.mobile || contactTeacher.phone}`}
                      style={{ background:"#1A56DB", color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                      Call
                    </a>
                  </div>
                )}

                {/* WhatsApp */}
                {(contactTeacher.mobile || contactTeacher.phone) && (() => {
                  const raw = (contactTeacher.mobile || contactTeacher.phone).replace(/\D/g, "");
                  const num = raw.startsWith("91") ? raw : "91" + raw;
                  const msg = encodeURIComponent(`Hi ${contactTeacher.name}, I found your profile on AcadHr. We have a teaching opportunity at ${user.name}. Are you available to discuss?`);
                  return (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#F0FDF4", borderRadius:12, border:"1px solid #A7F3D0" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:22 }}>💬</span>
                        <div>
                          <div style={{ fontSize:11, color:"#059669", fontWeight:600, marginBottom:2 }}>WHATSAPP</div>
                          <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>{contactTeacher.mobile || contactTeacher.phone}</div>
                        </div>
                      </div>
                      <a href={`https://wa.me/${num}?text=${msg}`} target="_blank" rel="noreferrer"
                        style={{ background:"#25D366", color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.112 1.518 5.845L0 24l6.335-1.502A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.488-5.187-1.342l-.371-.214-3.762.892.941-3.667-.234-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                        Chat on WhatsApp
                      </a>
                    </div>
                  );
                })()}

                {/* Email */}
                {contactTeacher.email && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#F9FAFB", borderRadius:12, border:"1px solid #E5E7EB" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:22 }}>📧</span>
                      <div>
                        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, marginBottom:2 }}>EMAIL</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{contactTeacher.email}</div>
                      </div>
                    </div>
                    <a href={`mailto:${contactTeacher.email}?subject=Teaching Opportunity at ${user.name}&body=Dear ${contactTeacher.name},%0D%0A%0D%0AWe found your profile on AcadHr and would like to discuss a teaching opportunity at ${user.name}.%0D%0A%0D%0APlease let us know your availability.%0D%0A%0D%0ARegards,%0D%0A${user.name}`}
                      style={{ background:"#1A56DB", color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                      Send Email
                    </a>
                  </div>
                )}

                {!contactTeacher.mobile && !contactTeacher.phone && !contactTeacher.email && (
                  <div style={{ textAlign:"center", padding:"24px 0", color:"#9CA3AF" }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                    <p style={{ fontSize:14 }}>No contact details available</p>
                  </div>
                )}
              </div>

              <div style={{ padding:"14px 24px", borderTop:"1px solid #E5E7EB" }}>
                <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"center" }} onClick={() => setContactTeacher(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab==="analytics" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:6 }}>Analytics</h2>
            <p style={{ color:"#6B7280", fontSize:14, marginBottom:24 }}>Your hiring performance at a glance</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[
                ["Live Jobs",      liveJobs.length,      "✅","#059669","#ECFDF5"],
                ["Pending Jobs",   pendJobs.length,      "⏳","#D97706","#FFFBEB"],
                ["Total Jobs",     myJobs.length,        "💼","#1A56DB","#EBF5FF"],
                ["Total Applicants",totalCandidates,     "👥","#6D28D9","#F5F3FF"],
              ].map(([l,v,i,c,bg]) => (
                <div key={l} style={{ background:bg, borderRadius:14, padding:"20px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{i}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:11, color:"#6B7280", fontWeight:700, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:40, textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
              <h3>Detailed Analytics Coming Soon</h3>
              <p style={{ color:"#6B7280", fontSize:14, marginTop:8 }}>Application trends, candidate quality scores, and hiring funnel analytics will appear here.</p>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab==="settings" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:24 }}>Settings</h2>
            <div className="card" style={{ padding:28, marginBottom:16, maxWidth:500 }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:16, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>⚙️ Account</div>
              {[
                ["Institution",  user.name],
                ["Email",        user.email],
                ["Role",         "School / Institution"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #F3F4F6", fontSize:13 }}>
                  <span style={{ color:"#6B7280", fontWeight:600 }}>{k}</span>
                  <span style={{ color:"#111827", fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:20, display:"flex", gap:10 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setTab("profile")}>Edit Profile</button>
                <button className="btn btn-danger btn-sm" onClick={() => { if(window.confirm("Logout?")) logout(); }}>🚪 Logout</button>
              </div>
            </div>
          </div>
        )}

        {tab==="credits" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:22 }}>Credits</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
              {[["Available Credits","0","🪙","#D97706"],["Credits Used","0","📊","#1A56DB"],["Jobs Boosted","0","🚀","#059669"]].map(([l,v,i,c]) => (
                <div key={l} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"24px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>{i}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:c, fontFamily:"Playfair Display,serif" }}>{v}</div>
                  <div style={{ fontSize:13, color:"#6B7280", fontWeight:600, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"28px 24px", textAlign:"center", maxWidth:480 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>💎</div>
              <h3 style={{ fontSize:18, marginBottom:8 }}>Get Premium Credits</h3>
              <p style={{ color:"#6B7280", fontSize:14, marginBottom:20 }}>Boost your job listings and reach more qualified candidates faster.</p>
              <button className="btn btn-primary" style={{ justifyContent:"center" }}>Buy Credits</button>
            </div>
          </div>
        )}

        {/* MORE / PROFILE */}
        {tab==="more" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:22 }}>Institute Profile</h2>
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:28, maxWidth:560 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
                <div style={{ width:64, height:64, borderRadius:16, background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>🏫</div>
                <div><div style={{ fontWeight:800, fontSize:18, color:"#111827" }}>{user.name}</div><span className="badge bblue" style={{ marginTop:4 }}>✓ Verified Institution</span></div>
              </div>
              <Divider />
              <div style={{ marginTop:20 }}>
                <div className="fg"><label className="flabel">Institute Name</label><input className="input" defaultValue={user.name} /></div>
                <div className="grid2">
                  <div className="fg"><label className="flabel">Type</label><select className="input"><option>School (CBSE)</option><option>School (ICSE)</option><option>Junior College</option><option>Coaching Institute</option></select></div>
                  <div className="fg"><label className="flabel">City</label><input className="input" defaultValue="Hyderabad" /></div>
                </div>
                <div className="grid2">
                  <div className="fg"><label className="flabel">Phone</label><input className="input" defaultValue="+91 9123 456789" /></div>
                  <div className="fg"><label className="flabel">Website</label><input className="input" defaultValue="https://yourschool.edu.in" /></div>
                </div>
                <div className="fg"><label className="flabel">About</label><textarea className="input" rows={4} defaultValue="A premier institution committed to academic excellence." /></div>
                <button className="btn btn-primary">Save Changes ✓</button>
              </div>
            </div>
          </div>
        )}

        {/* POST JOB MODAL */}
        {showPost && (
          <div className="overlay" onClick={() => setShowPost(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:680, padding:"0" }}>
              {/* Modal header */}
              <div style={{ padding:"20px 28px", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:10, borderRadius:"18px 18px 0 0" }}>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:"#111827" }}>Post a New Requirement</h2>
                  <p style={{ fontSize:13, color:"#6B7280", marginTop:2 }}>Fill in all details — your posting will be reviewed before going live</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPost(false)}>✕</button>
              </div>
              <div style={{ padding:"24px 28px", overflowY:"auto", maxHeight:"72vh" }}>
              <div className="alert a-warn" style={{ marginBottom:20 }}>⚠️ Your posting will be reviewed by the AcadHr team before going live.</div>
              <form onSubmit={postJob}>

                {/* ── Section 1: Institution Details ── */}
                <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:14, paddingBottom:6, borderBottom:"2px solid #EBF5FF" }}>
                  🏫 Institution Details
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Requirement ID</label>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"#F0FDF4", border:"1.5px solid #A7F3D0", borderRadius:8 }}>
                      <span style={{ fontSize:16 }}>🔖</span>
                      <span style={{ fontWeight:800, fontSize:16, color:"#059669", fontFamily:"Fira Code,monospace", letterSpacing:1 }}>
                        {reqIdLoading ? "Generating..." : (autoReqId || "Will be generated on submit")}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:"#6B7280", marginTop:4 }}>Auto-generated by the system. Unique & saved to database.</div>
                  </div>
                  <div className="fg">
                    <label className="flabel">Institution Name *</label>
                    <input className="input" placeholder="e.g. Delhi Public School" value={form.institution_name} onChange={e => up("institution_name",e.target.value)} required />
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Institution Type *</label>
                    <select className="input" value={form.institution_type} onChange={e => up("institution_type",e.target.value)} required>
                      <option value="">Select type</option>
                      <option>School</option><option>Coaching</option><option>Junior College</option>
                      <option>Degree College</option><option>Online Platform</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">State *</label>
                    <select className="input" value={form.location_state} onChange={e => { up("location_state", e.target.value); up("location_city", ""); }} required>
                      <option value="">Select state</option>
                      {Object.keys(INDIA_LOCATIONS).sort().map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">City *</label>
                    <select className="input" value={form.location_city} onChange={e => up("location_city", e.target.value)} required disabled={!form.location_state}>
                      <option value="">{form.location_state ? "Select city" : "Select state first"}</option>
                      {form.location_state && (INDIA_LOCATIONS[form.location_state]||[]).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Contact Person</label>
                    <input className="input" placeholder="Name" value={form.contact_person} onChange={e => up("contact_person",e.target.value)} />
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Contact Number</label>
                    <input className="input" type="tel" placeholder="+91 98765 43210" value={form.contact_number} onChange={e => up("contact_number",e.target.value)} />
                  </div>
                  <div className="fg">
                    <label className="flabel">Email</label>
                    <input className="input" type="email" placeholder="contact@school.edu.in" value={form.email} onChange={e => up("email",e.target.value)} />
                  </div>
                </div>

                {/* ── Section 2: Requirement Details ── */}
                <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginTop:22, marginBottom:14, paddingBottom:6, borderBottom:"2px solid #EBF5FF" }}>
                  📋 Requirement Details
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Requirement Type *</label>
                    <select className="input" value={form.requirement_type} onChange={e => up("requirement_type",e.target.value)}>
                      <option>Teacher</option><option>Faculty</option><option>Tutor</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Subject *</label>
                    <select className="input" value={form.subject} onChange={e => up("subject",e.target.value)} required>
                      <option value="">Select subject</option>
                      {SUBS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Grades — radio buttons */}
                <div className="fg">
                  <label className="flabel">Grades / Classes</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                    {["Nursery–KG","Grade 1–5","Grade 6–8","Grade 9–10","Grade 11–12","All Grades","Degree","Diploma"].map(g => (
                      <label key={g} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, border:`1.5px solid ${form.grades.includes(g)?"#1A56DB":"#D1D5DB"}`, background:form.grades.includes(g)?"#EBF5FF":"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:form.grades.includes(g)?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                        <input
                          type="checkbox"
                          style={{ display:"none" }}
                          checked={form.grades.includes(g)}
                          onChange={() => {
                            const next = form.grades.includes(g)
                              ? form.grades.filter(x => x !== g)
                              : [...form.grades, g];
                            up("grades", next);
                          }}
                        />
                        {form.grades.includes(g) ? "✓ " : ""}{g}
                      </label>
                    ))}
                  </div>
                  {form.grades.length > 0 && <div style={{ fontSize:11, color:"#6B7280", marginTop:6 }}>Selected: {form.grades.join(", ")}</div>}
                </div>

                <div className="fg">
                  <label className="flabel">Board</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                    {["CBSE","ICSE","State Board","IB","IGCSE","All Boards"].map(b => (
                      <label key={b} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, border:`1.5px solid ${form.board===b?"#1A56DB":"#D1D5DB"}`, background:form.board===b?"#EBF5FF":"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:form.board===b?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                        <input type="radio" name="board" style={{ display:"none" }} checked={form.board===b} onChange={() => up("board", b)} />
                        {form.board===b ? "● " : "○ "}{b}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience — radio buttons */}
                <div className="fg">
                  <label className="flabel">Experience Required</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                    {["Fresher","0–1 Year","1–3 Years","3–5 Years","5–8 Years","8–10 Years","10+ Years"].map(exp => (
                      <label key={exp} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, border:`1.5px solid ${form.experience===exp?"#1A56DB":"#D1D5DB"}`, background:form.experience===exp?"#EBF5FF":"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:form.experience===exp?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                        <input type="radio" name="experience" style={{ display:"none" }} checked={form.experience===exp} onChange={() => up("experience", exp)} />
                        {form.experience===exp ? "● " : "○ "}{exp}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Section 3: Compensation & Schedule ── */}
                <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginTop:22, marginBottom:14, paddingBottom:6, borderBottom:"2px solid #EBF5FF" }}>
                  💰 Compensation & Schedule
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Salary Budget — Min (₹/mo)</label>
                    <input className="input" type="number" placeholder="e.g. 30000" value={form.salary_min} onChange={e => up("salary_min",e.target.value)} />
                  </div>
                  <div className="fg">
                    <label className="flabel">Salary Budget — Max (₹/mo)</label>
                    <input className="input" type="number" placeholder="e.g. 60000" value={form.salary_max} onChange={e => up("salary_max",e.target.value)} />
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Joining Timeline</label>
                    <select className="input" value={form.joining_timeline} onChange={e => up("joining_timeline",e.target.value)}>
                      <option>Immediate</option><option>Within 15 days</option>
                      <option>30 days</option><option>60 days</option><option>Flexible</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Work Mode</label>
                    <select className="input" value={form.work_mode} onChange={e => up("work_mode",e.target.value)}>
                      <option>Full-time</option><option>Part-time</option>
                      <option>Online</option><option>Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* ── Section 4: Conditions ── */}
                <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginTop:22, marginBottom:14, paddingBottom:6, borderBottom:"2px solid #EBF5FF" }}>
                  🏠 Conditions & Preferences
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Residential</label>
                    <select className="input" value={form.residential} onChange={e => up("residential",e.target.value)}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Accommodation</label>
                    <select className="input" value={form.accommodation} onChange={e => up("accommodation",e.target.value)}>
                      <option>Not Provided</option><option>Provided</option>
                    </select>
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Gender Preference</label>
                    <select className="input" value={form.gender_preference} onChange={e => up("gender_preference",e.target.value)}>
                      <option>No Preference</option><option>Male</option><option>Female</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Interview Mode</label>
                    <select className="input" value={form.interview_mode} onChange={e => up("interview_mode",e.target.value)}>
                      <option>Online</option><option>Offline</option><option>Both</option>
                    </select>
                  </div>
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Demo Required</label>
                    <select className="input" value={form.demo_required} onChange={e => up("demo_required",e.target.value)}>
                      <option>No</option><option>Yes</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Number of Positions</label>
                    <input className="input" type="number" min="1" placeholder="1" value={form.positions} onChange={e => up("positions",e.target.value)} />
                  </div>
                </div>

                {/* ── Section 5: Admin / Internal ── */}
                <div style={{ fontWeight:800, fontSize:13, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, marginTop:22, marginBottom:14, paddingBottom:6, borderBottom:"2px solid #F3F4F6" }}>
                  🗂 Internal Details
                </div>
                <div className="grid2">
                  <div className="fg">
                    <label className="flabel">Status</label>
                    <select className="input" value={form.status} onChange={e => up("status",e.target.value)}>
                      <option>Open</option><option>Closed</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label className="flabel">Assigned Recruiter</label>
                    <input className="input" placeholder="Recruiter name" value={form.assigned_recruiter} onChange={e => up("assigned_recruiter",e.target.value)} />
                  </div>
                </div>
                <div className="fg">
                  <label className="flabel">Notes / Remarks</label>
                  <textarea className="input" rows={3} placeholder="Any additional remarks or special requirements..." value={form.notes} onChange={e => up("notes",e.target.value)} />
                </div>

                {/* Submit buttons */}
                <div style={{ display:"flex", gap:10, marginTop:8, paddingTop:20, borderTop:"1px solid #E5E7EB" }}>
                  <button type="button" className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => setShowPost(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex:2, justifyContent:"center" }}>Submit for Review →</button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchoolDashboard;
