import { useState, useEffect } from "react";
import { Navbar } from "../components/common/Shared";

const SUBJECTS  = ["All","Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit"];
const CITIES    = ["All","Hyderabad","Delhi","Mumbai","Bangalore","Chennai","Pune","Kolkata","Ahmedabad","Visakhapatnam","Vijayawada"];
const EXPS      = ["All","Fresher","Less than 1 Year","1–2 Years","2–3 Years","3–5 Years","5–8 Years","8–10 Years","10+ Years"];
const MODES     = ["All","Full-time","Part-time","Online","Home Tuition"];

export default function BrowseTeachersPage({ setPage }) {
  const [teachers, setTeachers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filter,   setFilter]   = useState({ subject:"All", city:"All", experience:"All", mode:"All", search:"" });

  const API = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/admin/public/teachers`)
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(data => {
        setTeachers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError("Could not load teachers. Please try again.");
        setLoading(false);
      });
  }, []);

  const filtered = teachers.filter(t =>
    (filter.subject === "All"    || (t.specialization||"").toLowerCase().includes(filter.subject.toLowerCase())) &&
    (filter.city    === "All"    || (t.city||"").toLowerCase().includes(filter.city.toLowerCase())) &&
    (filter.experience === "All" || t.total_experience === filter.experience) &&
    (filter.mode === "All"       || (t.work_mode||"").toLowerCase().includes(filter.mode.toLowerCase()) ||
                                    (t.teaching_mode||"").toLowerCase().includes(filter.mode.toLowerCase())) &&
    (!filter.search || t.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
                       (t.specialization||"").toLowerCase().includes(filter.search.toLowerCase()) ||
                       (t.current_role||"").toLowerCase().includes(filter.search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB" }}>
      <Navbar setPage={setPage} />
      <div style={{ paddingTop:90 }}>

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#1E3A8A,#1A56DB)", padding:"52px 0 40px" }}>
          <div className="container" style={{ textAlign:"center" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.15)", borderRadius:20, padding:"5px 16px", fontSize:13, color:"#BAE6FD", fontWeight:600, marginBottom:16 }}>
              👩‍🏫 {loading ? "..." : teachers.length.toLocaleString()}+ Verified Teachers
            </div>
            <h1 style={{ fontSize:38, fontWeight:900, color:"#fff", marginBottom:12 }}>Browse Qualified Teachers</h1>
            <p style={{ color:"#93C5FD", fontSize:16, marginBottom:28, maxWidth:520, margin:"0 auto 28px" }}>
              Find verified, experienced teachers for your school or coaching institute
            </p>
            <div style={{ display:"flex", gap:0, maxWidth:520, margin:"0 auto", background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.15)" }}>
              <input
                style={{ flex:1, border:"none", outline:"none", padding:"14px 18px", fontSize:14, fontFamily:"Nunito,sans-serif" }}
                placeholder="Search by name, subject or qualification..."
                value={filter.search}
                onChange={e => setFilter(f => ({...f, search:e.target.value}))}
              />
              <button style={{ background:"#1A56DB", color:"#fff", border:"none", padding:"0 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>Search</button>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding:"32px 0 60px" }}>
          {/* Filters */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24, background:"#fff", padding:"16px 20px", borderRadius:12, border:"1px solid #E5E7EB" }}>
            {[
              { key:"subject",    label:"Subject",    options:SUBJECTS },
              { key:"city",       label:"City",       options:CITIES   },
              { key:"experience", label:"Experience", options:EXPS     },
              { key:"mode",       label:"Work Mode",  options:MODES    },
            ].map(f => (
              <select key={f.key}
                style={{ border:"1px solid #E5E7EB", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, color:"#374151", background:"#F9FAFB", cursor:"pointer" }}
                value={filter[f.key]} onChange={e => setFilter(prev => ({...prev, [f.key]:e.target.value}))}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            {(filter.subject!=="All"||filter.city!=="All"||filter.experience!=="All"||filter.mode!=="All"||filter.search) && (
              <button onClick={() => setFilter({ subject:"All", city:"All", experience:"All", mode:"All", search:"" })}
                style={{ border:"1px solid #FECACA", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, color:"#DC2626", background:"#FEF2F2", cursor:"pointer" }}>
                Clear ✕
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:13, color:"#6B7280", alignSelf:"center", fontWeight:600 }}>
              {filtered.length} teacher{filtered.length!==1?"s":""} found
            </span>
          </div>

          {/* States */}
          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"14px 18px", marginBottom:20, color:"#DC2626", fontWeight:600, fontSize:14 }}>
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"#6B7280" }}>
              <div style={{ width:44, height:44, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
              <div style={{ fontWeight:600, fontSize:15 }}>Fetching teachers from database...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:8 }}>
                {teachers.length === 0 ? "No teachers registered yet" : "No teachers match filters"}
              </h3>
              <p style={{ color:"#6B7280", fontSize:14 }}>
                {teachers.length === 0 ? "Teachers who register will appear here." : "Try adjusting your search filters"}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {filtered.map(t => (
                <div key={t.id}
                  style={{ background:"#fff", borderRadius:16, border:"1px solid #E5E7EB", padding:24, transition:"all .2s", cursor:"default" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(26,86,219,.12)"; e.currentTarget.style.borderColor="#93C5FD"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#E5E7EB"; e.currentTarget.style.transform="none"; }}>

                  {/* Photo + Name */}
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                    <div style={{ width:54, height:54, borderRadius:"50%", overflow:"hidden", background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
                      {t.profile_photo
                        ? <img src={(process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + t.profile_photo} alt={t.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : "👤"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{t.name}</div>
                      <div style={{ fontSize:12, color:"#1A56DB", fontWeight:600, marginTop:2 }}>{t.specialization || t.current_role || "Educator"}</div>
                      {t.current_org && <div style={{ fontSize:11, color:"#6B7280", marginTop:1 }}>{t.current_org}</div>}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {t.city             && <span style={{ background:"#F3F4F6", color:"#374151", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>📍 {t.city}</span>}
                    {t.total_experience && <span style={{ background:"#EBF5FF", color:"#1A56DB", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>⏳ {t.total_experience}</span>}
                    {t.qualification    && <span style={{ background:"#F5F3FF", color:"#6D28D9", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>🎓 {t.qualification}</span>}
                    {t.work_mode        && <span style={{ background:"#ECFDF5", color:"#059669", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{t.work_mode}</span>}
                  </div>

                  {/* Profile completion bar */}
                  {t.completion_pct > 0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#6B7280", fontWeight:600, marginBottom:4 }}>
                        <span>Profile completion</span>
                        <span style={{ color:t.completion_pct>=70?"#059669":"#D97706", fontWeight:700 }}>{t.completion_pct}%</span>
                      </div>
                      <div style={{ height:5, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:5, borderRadius:3, background:t.completion_pct>=70?"#059669":"#FBBF24", width:`${t.completion_pct}%`, transition:"width .4s" }} />
                      </div>
                    </div>
                  )}

                  <button
                    style={{ width:"100%", padding:"9px 0", borderRadius:10, border:"1.5px solid #BFDBFE", background:"#EBF5FF", color:"#1A56DB", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                    onClick={() => setPage("signup")}
                    onMouseEnter={e => { e.currentTarget.style.background="#1A56DB"; e.currentTarget.style.color="#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#EBF5FF"; e.currentTarget.style.color="#1A56DB"; }}>
                    Contact Teacher →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
