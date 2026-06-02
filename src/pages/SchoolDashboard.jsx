import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { INDIA_LOCATIONS, SUBS } from "../constants";
import { Toast, Divider, FilterBar } from "../components/common/Shared";

function SchoolDashboard({ user, setPage }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState("home");
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
  const [myJobs, setMyJobs] = useState([
    { id:101, title:"Mathematics Teacher", status:"approved", toReview:14, newApplicants:8, location:"Hyderabad", posted:"5 days ago", premium:true },
    { id:102, title:"Science Teacher (Grade 8-10)", status:"pending", toReview:0, newApplicants:0, location:"Hyderabad", posted:"2 hours ago", premium:false },
  ]);
  const [verSteps] = useState([
    { label:"Create an account",   status:"completed" },
    { label:"Post your first job",  status:"completed" },
    { label:"Email Verification",   status:"pending" },
    { label:"Document Submission",  status:"not_started" },
    { label:"Verification",         status:"not_started" },
  ]);
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const up = (k, v) => setForm(f => ({...f, [k]:v}));

  const APPLICANTS = [
    { name:"Priya Sharma", subject:"Mathematics", exp:"5 yrs", city:"Hyderabad", qual:"M.Sc+B.Ed", job:"Mathematics Teacher",         status:"pending",     emoji:"👩‍🏫" },
    { name:"Ravi Kumar",   subject:"Physics",     exp:"3 yrs", city:"Bangalore", qual:"M.Sc+B.Ed", job:"Mathematics Teacher",         status:"pending",     emoji:"👨‍🔬" },
    { name:"Ananya Singh", subject:"Mathematics", exp:"2 yrs", city:"Mumbai",    qual:"B.Sc+B.Ed",  job:"Science Teacher (Grade 8-10)",status:"shortlisted", emoji:"👩‍🔬" },
  ];
  const [appStatus, setAppStatus] = useState(APPLICANTS.map(a => a.status));
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
      setTab("home");
    } catch (err) {
      console.error('[postJob]', err);
      showToast("❌ Error: " + err.message);
    }
  }

  const liveJobs  = myJobs.filter(j => j.status === "approved");
  const pendJobs  = myJobs.filter(j => j.status === "pending");
  const totalCandidates = myJobs.reduce((s,j) => s + j.toReview, 0);

  const MENU = [
    { id:"home",       icon:"🏠", label:"Home" },
    { id:"jobs",       icon:"💼", label:"Jobs" },
    { id:"database",   icon:"🗄️", label:"Database" },
    { id:"credits",    icon:"💳", label:"Credits" },
    { id:"more",       icon:"⚙️", label:"More" },
  ];
  const SUBS = ["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education"];
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
            <div key={m.id} onClick={() => setTab(m.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", borderLeft:`3px solid ${tab===m.id?"#1A56DB":"transparent"}`, background:tab===m.id?"#EBF5FF":"transparent", color:tab===m.id?"#1A56DB":"#374151", fontWeight:tab===m.id?700:600, fontSize:14, transition:"all .15s" }}>
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
          <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>{tab==="home"?"Home":tab==="jobs"?"Jobs":tab==="database"?"Database":tab==="credits"?"Credits":"More"}</div>
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

        {/* HOME */}
        {tab==="home" && (
          <div style={{ padding:"28px 28px", maxWidth:1000 }} className="fadeUp">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <h1 style={{ fontSize:22, fontWeight:800, color:"#111827" }}>Welcome back, {user.name.split(" ")[0]}!</h1>
              <button className="btn btn-primary" onClick={async () => {
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
            }}>Post a Job</button>
            </div>

            {/* Verification Steps */}
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, marginBottom:22, overflow:"hidden" }}>
              <div style={{ padding:"18px 24px", borderBottom:"3px solid #059669", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>🛡️</span>
                <h3 style={{ fontSize:16, fontWeight:700, color:"#111827" }}>Verification Steps</h3>
              </div>
              {verSteps.map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", padding:"14px 24px", borderBottom:i<verSteps.length-1?"1px solid #F3F4F6":"none", gap:14 }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, background:s.status==="completed"?"#059669":"#fff", border:s.status==="completed"?"none":"2px solid #D1D5DB", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {s.status==="completed" && <span style={{ color:"#fff", fontSize:12, fontWeight:800 }}>✓</span>}
                  </div>
                  <div style={{ flex:1, fontWeight:600, fontSize:14, color:"#111827" }}>{s.label}</div>
                  <span style={{ padding:"3px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:s.status==="completed"?"#ECFDF5":s.status==="pending"?"#FFF7ED":"#F3F4F6", color:s.status==="completed"?"#059669":s.status==="pending"?"#D97706":"#6B7280", border:`1px solid ${s.status==="completed"?"#A7F3D0":s.status==="pending"?"#FDE68A":"#E5E7EB"}` }}>
                    {s.status==="completed"?"Completed":s.status==="pending"?"Pending":"Not Started"}
                  </span>
                  {s.status==="completed" && i===1 && <button className="btn btn-ghost btn-sm">View</button>}
                  {s.status==="pending" && <button className="btn btn-outline btn-sm" style={{ borderColor:"#1A56DB", color:"#1A56DB" }}>Verify</button>}
                  {s.label==="Document Submission" && <button className="btn btn-ghost btn-sm">⬆ Upload</button>}
                  {s.label==="Verification" && <button className="btn btn-ghost btn-sm">ℹ Info</button>}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:22 }}>
              {[
                { icon:"💼", label:"Live Job",           value:liveJobs.length    },
                { icon:"⏱",  label:"Under Review Jobs",  value:pendJobs.length    },
                { icon:"🪙", label:"Credits",             value:0                  },
                { icon:"👥", label:"Pending Candidates",  value:totalCandidates    },
              ].map(s => (
                <div key={s.label} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:"#F9FAFB", border:"1px solid #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600, marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:"#111827", fontFamily:"Playfair Display,serif", lineHeight:1 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Jobs */}
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"16px 24px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:20 }}>💼</span>
                  <h3 style={{ fontSize:16, fontWeight:700, color:"#111827" }}>Live Jobs</h3>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab("jobs")}>View All</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:20 }}>
                {liveJobs.map((j,i) => (
                  <div key={i} style={{ border:"1px solid #E5E7EB", borderRadius:12, padding:18 }}>
                    <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                      <span style={{ background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>● Live</span>
                      {j.premium && <span style={{ background:"#F5F3FF", color:"#6D28D9", border:"1px solid #DDD6FE", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>💎 Premium</span>}
                    </div>
                    <div style={{ fontWeight:800, fontSize:15, color:"#111827", marginBottom:4 }}>{j.title}</div>
                    {j.requirement_id && <div style={{ fontSize:11, color:"#059669", fontFamily:"Fira Code,monospace", fontWeight:700, marginBottom:4 }}>🔖 {j.requirement_id}</div>}
                    <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:14 }}>📍 {j.location}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                      <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{j.toReview}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>To Review</div>
                      </div>
                      <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{j.newApplicants}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>New</div>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center" }} onClick={() => setTab("database")}>🚀 Boost</button>
                  </div>
                ))}
                <div onClick={async () => {
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
              }} style={{ border:"2px dashed #D1D5DB", borderRadius:12, padding:18, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer", minHeight:160, transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#1A56DB"; e.currentTarget.style.background="#F9FAFB"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#D1D5DB"; e.currentTarget.style.background="transparent"; }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>+</div>
                  <span style={{ fontWeight:600, fontSize:14, color:"#374151" }}>Post a job</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOBS */}
        {tab==="jobs" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#111827" }}>All Job Postings</h2>
              <button className="btn btn-primary" onClick={() => setShowPost(true)}>+ Post New Position</button>
            </div>
            <div style={{ display:"flex", gap:4, marginBottom:12, background:"#F3F4F6", borderRadius:10, padding:4, width:"fit-content" }}>
              {[["All",myJobs.length],["Live",liveJobs.length],["Pending",pendJobs.length]].map(([l,c]) => (
                <div key={l} onClick={() => setJobFilter(f => ({...f, status: l==="All"?"": l==="Live"?"approved":"pending"}))}
                  style={{ padding:"7px 18px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.08)", color:"#111827" }}>{l} ({c})</div>
              ))}
            </div>
            <FilterBar filters={jobFilter} setFilters={setJobFilter} fields={[
              { key:"title",  type:"text",   placeholder:"🔍 Search by title...", width:240 },
              { key:"status", type:"select", placeholder:"All Statuses",         width:160,
                options:[{v:"approved",l:"● Live"},{v:"pending",l:"⏳ Pending"}] },
            ]} />
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {myJobs.filter(j =>
                (!jobFilter.title  || j.title.toLowerCase().includes(jobFilter.title.toLowerCase())) &&
                (!jobFilter.status || j.status === jobFilter.status)
              ).map((j,i) => (
                <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"20px 24px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <span style={{ padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:j.status==="approved"?"#ECFDF5":"#FFFBEB", color:j.status==="approved"?"#059669":"#D97706", border:`1px solid ${j.status==="approved"?"#A7F3D0":"#FDE68A"}` }}>{j.status==="approved"?"● Live":"⏳ Pending"}</span>
                        {j.premium && <span style={{ background:"#F5F3FF", color:"#6D28D9", border:"1px solid #DDD6FE", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>💎 Premium</span>}
                      </div>
                      <div style={{ fontWeight:800, fontSize:16, color:"#111827", marginBottom:4 }}>{j.title}</div>
                      <div style={{ fontSize:13, color:"#9CA3AF" }}>📍 {j.location} · Posted {j.posted}</div>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      <div style={{ textAlign:"center", background:"#F9FAFB", borderRadius:10, padding:"10px 16px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{j.toReview}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>To Review</div>
                      </div>
                      <div style={{ textAlign:"center", background:"#F9FAFB", borderRadius:10, padding:"10px 16px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{j.newApplicants}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>New</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setTab("database")}>View Applicants</button>
                      <button className="btn btn-ghost btn-sm">🚀 Boost</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATABASE */}
        {tab==="database" && (
          <div style={{ padding:"28px 28px" }} className="fadeUp">
            <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:22 }}>Candidate Database</h2>
            <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
              <input className="input" style={{ maxWidth:220 }} placeholder="🔍 Search by name..." />
              <select className="input" style={{ maxWidth:180 }}><option>All Subjects</option>{SUBS.map(s => <option key={s}>{s}</option>)}</select>
              <select className="input" style={{ maxWidth:180 }}><option>All Statuses</option><option>Under Review</option><option>Shortlisted</option><option>Not Selected</option></select>
            </div>
            <FilterBar filters={appFilter} setFilters={setAppFilter} fields={[
              { key:"name",    type:"text",   placeholder:"🔍 Search by name...",    width:200 },
              { key:"subject", type:"text",   placeholder:"📚 Subject...",           width:180 },
              { key:"status",  type:"select", placeholder:"All Statuses",           width:170,
                options:[{v:"pending",l:"Under Review"},{v:"shortlisted",l:"Shortlisted"},{v:"rejected",l:"Not Selected"}] },
            ]} />
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {APPLICANTS.filter(a =>
                (!appFilter.name    || a.name.toLowerCase().includes(appFilter.name.toLowerCase())) &&
                (!appFilter.subject || a.subject.toLowerCase().includes(appFilter.subject.toLowerCase())) &&
                (!appFilter.status  || appStatus[APPLICANTS.indexOf(a)] === appFilter.status)
              ).map((a,i) => {
                const origIdx = APPLICANTS.indexOf(a);
                return (
                <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"18px 22px", display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
                  <div style={{ width:46, height:46, borderRadius:"50%", background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{a.emoji}</div>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{a.name}</div>
                    <div style={{ fontSize:12, color:"#6B7280", marginTop:3 }}>📚 {a.subject} &nbsp;·&nbsp; 🎓 {a.exp} &nbsp;·&nbsp; 📍 {a.city} &nbsp;·&nbsp; {a.qual}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>Applied for: {a.job}</div>
                  </div>
                  <span style={{ padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700, background:appStatus[i]==="shortlisted"?"#ECFDF5":appStatus[i]==="rejected"?"#FEF2F2":"#FFFBEB", color:appStatus[i]==="shortlisted"?"#059669":appStatus[i]==="rejected"?"#DC2626":"#D97706", border:`1px solid ${appStatus[i]==="shortlisted"?"#A7F3D0":appStatus[i]==="rejected"?"#FECACA":"#FDE68A"}` }}>
                    {appStatus[i]==="shortlisted"?"Shortlisted":appStatus[i]==="rejected"?"Not Selected":"Under Review"}
                  </span>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => setAppStatus(s => { const n=[...s]; n[i]="shortlisted"; return n; })}>✓ Shortlist</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => setAppStatus(s => { const n=[...s]; n[i]="rejected";    return n; })}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREDITS */}
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
