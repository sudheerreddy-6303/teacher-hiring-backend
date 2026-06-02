import { useState, useEffect } from "react";
import { Navbar } from "../components/common/Shared";

const SUBJECTS = ["All","Mathematics","Physics","Chemistry","Biology","English","Hindi","Computer Science","Economics","Accountancy","Social Science"];
const MODES    = ["All","Online","Offline","Both"];
const CITIES   = ["All","Hyderabad","Delhi","Mumbai","Bangalore","Chennai","Pune","Kolkata","Visakhapatnam","Vijayawada"];
const EXPS     = ["All","Fresher","1 Year","2 Years","3 Years","4 Years","5+ Years"];

export default function BrowseTutorsPage({ setPage }) {
  const [tutors,  setTutors]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState({ subject:"All", mode:"All", city:"All", experience:"All", search:"" });

  const API = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/admin/public/tutors`)
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(data => {
        setTutors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load tutors. Please try again.");
        setLoading(false);
      });
  }, []);

  const filtered = tutors.filter(t =>
    (filter.subject === "All"    || (t.subject||"").toLowerCase().includes(filter.subject.toLowerCase())) &&
    (filter.mode    === "All"    || (t.teaching_mode||"") === filter.mode) &&
    (filter.city    === "All"    || (t.city||"").toLowerCase().includes(filter.city.toLowerCase())) &&
    (filter.experience === "All" || (t.experience||"").includes(filter.experience)) &&
    (!filter.search || t.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
                       (t.subject||"").toLowerCase().includes(filter.search.toLowerCase()) ||
                       (t.qualification||"").toLowerCase().includes(filter.search.toLowerCase()))
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB" }}>
      <Navbar setPage={setPage} />
      <div style={{ paddingTop:90 }}>

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#4C1D95,#6D28D9)", padding:"52px 0 40px" }}>
          <div className="container" style={{ textAlign:"center" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.15)", borderRadius:20, padding:"5px 16px", fontSize:13, color:"#DDD6FE", fontWeight:600, marginBottom:16 }}>
              🧑‍🎓 {loading ? "..." : tutors.length.toLocaleString()}+ Verified Tutors
            </div>
            <h1 style={{ fontSize:38, fontWeight:900, color:"#fff", marginBottom:12 }}>Find the Perfect Tutor</h1>
            <p style={{ color:"#C4B5FD", fontSize:16, marginBottom:28, maxWidth:520, margin:"0 auto 28px" }}>
              Home tutors, online tutors and coaching experts for every subject and grade
            </p>
            <div style={{ display:"flex", gap:0, maxWidth:520, margin:"0 auto", background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.15)" }}>
              <input
                style={{ flex:1, border:"none", outline:"none", padding:"14px 18px", fontSize:14, fontFamily:"Nunito,sans-serif" }}
                placeholder="Search by name, subject or qualification..."
                value={filter.search}
                onChange={e => setFilter(f => ({...f, search:e.target.value}))}
              />
              <button style={{ background:"#6D28D9", color:"#fff", border:"none", padding:"0 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif" }}>Search</button>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding:"32px 0 60px" }}>
          {/* Filters */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24, background:"#fff", padding:"16px 20px", borderRadius:12, border:"1px solid #E5E7EB" }}>
            {[
              { key:"subject",    label:"Subject",    options:SUBJECTS },
              { key:"mode",       label:"Mode",       options:MODES    },
              { key:"city",       label:"City",       options:CITIES   },
              { key:"experience", label:"Experience", options:EXPS     },
            ].map(f => (
              <select key={f.key}
                style={{ border:"1px solid #E5E7EB", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, color:"#374151", background:"#F9FAFB", cursor:"pointer" }}
                value={filter[f.key]} onChange={e => setFilter(prev => ({...prev, [f.key]:e.target.value}))}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            {(filter.subject!=="All"||filter.mode!=="All"||filter.city!=="All"||filter.experience!=="All"||filter.search) && (
              <button onClick={() => setFilter({ subject:"All", mode:"All", city:"All", experience:"All", search:"" })}
                style={{ border:"1px solid #FECACA", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, color:"#DC2626", background:"#FEF2F2", cursor:"pointer" }}>
                Clear ✕
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:13, color:"#6B7280", alignSelf:"center", fontWeight:600 }}>
              {filtered.length} tutor{filtered.length!==1?"s":""} found
            </span>
          </div>

          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"14px 18px", marginBottom:20, color:"#DC2626", fontWeight:600, fontSize:14 }}>
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:"#6B7280" }}>
              <div style={{ width:44, height:44, border:"3px solid #E5E7EB", borderTopColor:"#6D28D9", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
              <div style={{ fontWeight:600, fontSize:15 }}>Fetching tutors from database...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:8 }}>
                {tutors.length === 0 ? "No tutors registered yet" : "No tutors match filters"}
              </h3>
              <p style={{ color:"#6B7280", fontSize:14 }}>
                {tutors.length === 0 ? "Tutors who register will appear here." : "Try adjusting your search filters"}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {filtered.map(t => (
                <div key={t.id}
                  style={{ background:"#fff", borderRadius:16, border:"1px solid #E5E7EB", padding:24, transition:"all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(109,40,217,.12)"; e.currentTarget.style.borderColor="#C4B5FD"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#E5E7EB"; e.currentTarget.style.transform="none"; }}>

                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                    <div style={{ width:54, height:54, borderRadius:"50%", background:"#F5F3FF", border:"2px solid #DDD6FE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                      🧑‍🎓
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{t.name}</div>
                      <div style={{ fontSize:12, color:"#6D28D9", fontWeight:600, marginTop:2 }}>{t.subject || "Tutor"}</div>
                      {t.qualification && <div style={{ fontSize:11, color:"#6B7280", marginTop:1 }}>{t.qualification}</div>}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {t.city          && <span style={{ background:"#F3F4F6", color:"#374151", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>📍 {t.city}</span>}
                    {t.experience    && <span style={{ background:"#F5F3FF", color:"#6D28D9", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>⏳ {t.experience}</span>}
                    {t.teaching_mode && <span style={{ background:"#E0F2FE", color:"#0369A1", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                      {t.teaching_mode === "Online" ? "💻" : t.teaching_mode === "Offline" ? "🏠" : "🔄"} {t.teaching_mode}
                    </span>}
                  </div>

                  {t.hourly_rate && (
                    <div style={{ fontWeight:800, fontSize:16, color:"#059669", marginBottom:14 }}>
                      💰 {t.hourly_rate}
                    </div>
                  )}

                  <button
                    style={{ width:"100%", padding:"9px 0", borderRadius:10, border:"1.5px solid #DDD6FE", background:"#F5F3FF", color:"#6D28D9", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .15s" }}
                    onClick={() => setPage("signup")}
                    onMouseEnter={e => { e.currentTarget.style.background="#6D28D9"; e.currentTarget.style.color="#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#F5F3FF"; e.currentTarget.style.color="#6D28D9"; }}>
                    Contact Tutor →
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
