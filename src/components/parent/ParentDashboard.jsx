import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Toast, Divider } from "../common/Shared";
import './Parent.css';

function ParentDashboard({ user, setPage }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState({
    student_name:"", student_class:"", board:"", subject:"",
    location:"", mode:"", preferred_time:"", budget:"",
    tutor_gender_pref:"", experience_req:"", status:"Open",
    assigned_tutor:"", notes:""
  });
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState("");

  const API = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  useEffect(() => {
    const token = localStorage.getItem("acadhr_token");
    if (!token) return;
    fetch(API + "/profile", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile) {
          const p = data.profile;
          setProfile(prev => ({
            ...prev,
            student_name:      p.student_name      || "",
            student_class:     p.student_class     || "",
            board:             p.board             || "",
            subject:           p.subject           || "",
            location:          p.location          || "",
            mode:              p.mode              || "",
            preferred_time:    p.preferred_time    || "",
            budget:            p.budget            || "",
            tutor_gender_pref: p.tutor_gender_pref || "",
            experience_req:    p.experience_req    || "",
            status:            p.status            || "Open",
            assigned_tutor:    p.assigned_tutor    || "",
            notes:             p.notes             || "",
          }));
        }
      }).catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true); setSaveError("");
    try {
      const token = localStorage.getItem("acadhr_token");
      const r = await fetch(API + "/profile", {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:"Bearer "+token },
        body: JSON.stringify({
          student_name: profile.student_name, student_class: profile.student_class,
          board: profile.board, subject: profile.subject, location: profile.location,
          mode: profile.mode, preferred_time: profile.preferred_time, budget: profile.budget,
          tutor_gender_pref: profile.tutor_gender_pref, experience_req: profile.experience_req,
          notes: profile.notes
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSaved(true); setEditMode(false);
    } catch(err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  function up(k,v) { setProfile(p => ({...p, [k]:v})); }

  const MENU = [
    { id:"overview",     icon:"🏠", label:"Overview" },
    { id:"profile",      icon:"👤", label:"My Profile" },
    { id:"requirement",  icon:"📋", label:"My Requirement" },
    { id:"tutors",       icon:"🧑‍🎓", label:"Find Tutors" },
  ];

  return (
    <div style={{ display:"flex", width:"100vw", minHeight:"100vh" }}>
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ cursor:"pointer" }} onClick={() => setPage("home")}>
            <img src="/acadhr-logo.png" alt="AcadHr" style={{ height:48, objectFit:"contain" }} />
          </div>
          <div style={{ fontSize:10, color:"#6B7280", marginTop:5, fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>Parent Portal</div>
        </div>
        <div style={{ padding:"14px 22px 12px", borderBottom:"1px solid #E5E7EB", background:"#F9FAFB" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{user.name}</div>
          <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>👨‍👩‍👧 Parent / Guardian</div>
          {profile.student_name && <div style={{ fontSize:11, color:"#1A56DB", fontWeight:600, marginTop:3 }}>Child: {profile.student_name}</div>}
        </div>
        <div className="sidebar-sec">Navigation</div>
        {MENU.map(m => (
          <div key={m.id} className={"s-item"+(tab===m.id?" active":"")} onClick={() => setTab(m.id)}>
            <span>{m.icon}</span>{m.label}
          </div>
        ))}
        <div style={{ marginTop:"auto", padding:"20px 0" }}>
          <div className="sidebar-sec">Account</div>
          <div className="s-item" onClick={() => setPage("home")}>🏠 Back to Site</div>
          <div className="s-item" onClick={logout}>🚪 Logout</div>
        </div>
      </div>

      <div className="main">
        {/* ══ MY PROFILE ══ */}
        {tab==="profile" && (
          <div className="fadeUp">
            <div className="page-title">My Profile</div>
            <div className="page-sub">Your personal account details</div>
            <div className="card" style={{ padding:28, maxWidth:560 }}>
              <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24 }}>
                <div style={{ width:70, height:70, borderRadius:"50%", background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>👨‍👩‍👧</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:20, color:"#111827" }}>{user.name}</div>
                  <div style={{ fontSize:13, color:"#1A56DB", fontWeight:600, marginTop:2 }}>Parent / Guardian</div>
                  <span className="badge bgreen" style={{ marginTop:6 }}>✓ Verified Account</span>
                </div>
              </div>
              <Divider />
              <div style={{ marginTop:18 }}>
                {[
                  ["👤 Full Name",    user.name],
                  ["📧 Email",        user.email],
                  ["📱 Phone",        user.phone || "Not added"],
                  ["📍 City",         user.city  || "Not added"],
                  ["🧒 Child Name",   profile.student_name  || "Not set"],
                  ["📚 Class",        profile.student_class || "Not set"],
                  ["🏫 Board",        profile.board         || "Not set"],
                  ["📖 Subject(s)",   profile.subject       || "Not set"],
                  ["📋 Status",       profile.status        || "Open"],
                  ["🧑‍🎓 Assigned Tutor", profile.assigned_tutor || "Not assigned yet"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F3F4F6", fontSize:13 }}>
                    <span style={{ color:"#6B7280", fontWeight:600 }}>{label}</span>
                    <span style={{ color: value==="Not set"||value==="Not added"||value==="Not assigned yet" ? "#9CA3AF" : "#111827", fontWeight:600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:20 }}>
                <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={() => setTab("requirement")}>
                  ✏️ Edit Tutor Requirement
                </button>
              </div>
            </div>
          </div>
        )}

        {tab==="overview" && (
          <div className="fadeUp">
            <div className="page-title">Welcome, {user.name.split(" ")[0]} 👋</div>
            <div className="page-sub">Your tutor search at a glance</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:24 }}>
              {[
                ["Student",   profile.student_name||"Not set", "🧒", "#1A56DB"],
                ["Class",     profile.student_class||"Not set", "📚", "#059669"],
                ["Status",    profile.status||"Open",           "📋", "#D97706"],
              ].map(([l,v,i,c]) => (
                <div key={l} className="card kpi" style={{ padding:22, textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{i}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:12, color:"#6B7280", fontWeight:600, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h3 style={{ fontSize:17, fontWeight:800 }}>My Tutor Requirement</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setTab("requirement")}>Edit Requirement</button>
              </div>
              {[
                ["Subject(s)", profile.subject],
                ["Board", profile.board],
                ["Location", profile.location],
                ["Mode", profile.mode],
                ["Preferred Time", profile.preferred_time],
                ["Budget", profile.budget],
                ["Tutor Gender", profile.tutor_gender_pref||"No Preference"],
                ["Experience Needed", profile.experience_req||"Any"],
              ].map(([k,v]) => v ? (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F3F4F6", fontSize:13 }}>
                  <span style={{ color:"#6B7280", fontWeight:600 }}>{k}</span>
                  <span style={{ color:"#111827", fontWeight:600 }}>{v}</span>
                </div>
              ) : null)}
              {profile.notes && (
                <div style={{ marginTop:12, background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#92400E" }}>
                  📝 {profile.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {tab==="requirement" && (
          <div className="fadeUp">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <div className="page-title">My Tutor Requirement</div>
                <div className="page-sub" style={{ marginBottom:0 }}>Update your child's tutor requirement details</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditMode(e => !e); setSaved(false); }}>
                  {editMode ? "✕ Cancel" : "✏️ Edit"}
                </button>
                {editMode && <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save ✓"}</button>}
              </div>
            </div>
            {saved    && <div className="alert a-ok" style={{ marginBottom:16 }}>✅ Requirement saved successfully!</div>}
            {saveError && <div className="alert a-err" style={{ marginBottom:16 }}>❌ {saveError}</div>}
            {!editMode && <div className="alert a-info" style={{ marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>👁 View mode — click Edit to make changes</span>
              <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>
            </div>}
            <div className="card" style={{ padding:28 }}>
              <div className="grid2">
                <div className="fg"><label className="flabel">Student Name *</label>
                  <input className="input" readOnly={!editMode} value={profile.student_name} onChange={e => up("student_name",e.target.value)} placeholder="Child's name" style={{ background:!editMode?"#F9FAFB":"#fff" }} />
                </div>
                <div className="fg"><label className="flabel">Class / Grade *</label>
                  <select className="input" value={profile.student_class} onChange={e => editMode && up("student_class",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">Select class</option>
                    {["Pre-Primary (Nursery–KG)","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","Degree"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div className="fg"><label className="flabel">Board</label>
                  <select className="input" value={profile.board} onChange={e => editMode && up("board",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">Select board</option>
                    <option>CBSE</option><option>ICSE</option><option>State Board (AP)</option><option>State Board (TS)</option><option>IB</option><option>IGCSE</option>
                  </select>
                </div>
                <div className="fg"><label className="flabel">Subject(s) Required *</label>
                  <input className="input" readOnly={!editMode} value={profile.subject} onChange={e => up("subject",e.target.value)} placeholder="e.g. Mathematics, Physics" style={{ background:!editMode?"#F9FAFB":"#fff" }} />
                </div>
              </div>
              <div className="fg"><label className="flabel">Location / Area</label>
                <input className="input" readOnly={!editMode} value={profile.location} onChange={e => up("location",e.target.value)} placeholder="e.g. Banjara Hills, Hyderabad" style={{ background:!editMode?"#F9FAFB":"#fff" }} />
              </div>
              <div className="fg"><label className="flabel">Tutoring Mode</label>
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  {["Home","Online","Either"].map(m => (
                    <label key={m} onClick={() => editMode && up("mode",m)}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:10, border:`2px solid ${profile.mode===m?"#1A56DB":"#E5E7EB"}`, background:profile.mode===m?"#EBF5FF":"#F9FAFB", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.mode===m?"#1A56DB":"#6B7280", userSelect:"none" }}>
                      {m==="Home"?"🏠":m==="Online"?"💻":"🔄"} {m}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid2">
                <div className="fg"><label className="flabel">Preferred Time</label>
                  <select className="input" value={profile.preferred_time} onChange={e => editMode && up("preferred_time",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">Select</option>
                    <option>Morning (6am–12pm)</option><option>Afternoon (12pm–4pm)</option>
                    <option>Evening (4pm–8pm)</option><option>Flexible</option>
                  </select>
                </div>
                <div className="fg"><label className="flabel">Monthly Budget (₹)</label>
                  <select className="input" value={profile.budget} onChange={e => editMode && up("budget",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">Select range</option>
                    <option>Under ₹2,000</option><option>₹2,000–₹4,000</option>
                    <option>₹4,000–₹6,000</option><option>₹6,000–₹10,000</option><option>Above ₹10,000</option>
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div className="fg"><label className="flabel">Tutor Gender Preference</label>
                  <select className="input" value={profile.tutor_gender_pref} onChange={e => editMode && up("tutor_gender_pref",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">No Preference</option><option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="fg"><label className="flabel">Experience Required</label>
                  <select className="input" value={profile.experience_req} onChange={e => editMode && up("experience_req",e.target.value)} style={{ pointerEvents:editMode?"auto":"none", background:!editMode?"#F9FAFB":"#fff" }}>
                    <option value="">Any</option>
                    <option>Fresher OK</option><option>1+ Years</option><option>2+ Years</option><option>3+ Years</option><option>5+ Years</option>
                  </select>
                </div>
              </div>
              <div className="fg"><label className="flabel">Additional Notes</label>
                <textarea className="input" readOnly={!editMode} rows={3} value={profile.notes} onChange={e => up("notes",e.target.value)} placeholder="Any special requirements..." style={{ background:!editMode?"#F9FAFB":"#fff" }} />
              </div>
              {editMode && (
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex:2, justifyContent:"center" }} onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save Changes ✓"}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab==="tutors" && (
          <TutorFinder user={user} profile={profile} />
        )}
      </div>
    </div>
  );
}

// ── TutorFinder — only shown to approved parents ─────────────────────────────
function TutorFinder({ user, profile }) {
  const [tutors,   setTutors]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [approved, setApproved] = useState(true); // is_active from backend
  const [filter,   setFilter]   = useState({ subject:"", city:"" });
  const [contacted, setContacted] = useState([]);

  const API = process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api";

  useEffect(() => {
    const token = localStorage.getItem("acadhr_token");
    if (!token) { setLoading(false); return; }
    // Fetch tutors — backend returns 403 if not approved
    fetch(API + "/tutors" + (profile.subject ? `?subject=${encodeURIComponent(profile.subject)}` : ""), {
      headers: { Authorization: "Bearer " + token }
    })
    .then(async r => {
      if (r.status === 403) { setApproved(false); setLoading(false); return; }
      const d = await r.json();
      if (r.ok) setTutors(d);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const filtered = tutors.filter(t =>
    (!filter.subject || (t.subject||"").toLowerCase().includes(filter.subject.toLowerCase())) &&
    (!filter.city    || (t.city||"").toLowerCase().includes(filter.city.toLowerCase()))
  );

  if (!approved) return (
    <div className="fadeUp">
      <div className="page-title">Find Tutors</div>
      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:16, padding:"40px 32px", textAlign:"center", marginTop:8 }}>
        <div style={{ fontSize:52, marginBottom:14 }}>⏳</div>
        <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8, color:"#92400E" }}>Account Pending Approval</h3>
        <p style={{ color:"#B45309", fontSize:14, maxWidth:420, margin:"0 auto 16px", lineHeight:1.7 }}>
          Your account is currently under review by the AcadHr admin team.<br/>
          Once approved, you'll be able to browse and contact tutors here.
        </p>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:10, padding:"10px 20px", fontSize:13, color:"#92400E", fontWeight:600 }}>
          📧 You'll receive a confirmation once your account is approved.
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ width:36, height:36, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 14px" }} />
      <div style={{ fontWeight:600, color:"#6B7280" }}>Loading tutors...</div>
    </div>
  );

  return (
    <div className="fadeUp">
      <div className="page-title">Find Tutors</div>
      <div className="page-sub">Tutors matching your requirement — {filtered.length} available</div>

      {/* Filters */}
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", gap:10, flexWrap:"wrap" }}>
        <input className="input" style={{ maxWidth:220 }} placeholder="📚 Filter by subject..."
          value={filter.subject} onChange={e => setFilter(f => ({...f, subject:e.target.value}))} />
        <input className="input" style={{ maxWidth:200 }} placeholder="📍 Filter by city..."
          value={filter.city} onChange={e => setFilter(f => ({...f, city:e.target.value}))} />
        {(filter.subject||filter.city) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({subject:"",city:""})}>Clear ✕</button>
        )}
      </div>

      {/* Tutor requirement summary */}
      {profile.subject && (
        <div style={{ background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#1E429F" }}>
          🔍 Showing tutors for: <strong>{profile.subject}</strong>
          {profile.location && <> · 📍 <strong>{profile.location}</strong></>}
          {profile.budget   && <> · 💰 Budget: <strong>{profile.budget}</strong></>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#9CA3AF" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🧑‍🎓</div>
          <div style={{ fontWeight:600, fontSize:16 }}>No tutors found</div>
          <div style={{ fontSize:13, marginTop:6 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div className="grid2">
          {filtered.map(t => (
            <div key={t.id} className="card" style={{ padding:24, transition:"all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(26,86,219,.12)"; e.currentTarget.style.borderColor="#93C5FD"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow=""; e.currentTarget.style.borderColor="#E5E7EB"; }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>🧑‍🎓</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"#1A56DB", fontWeight:600, marginTop:2 }}>{t.subject||"—"}</div>
                  {t.hourly_rate && <div style={{ fontSize:12, color:"#059669", fontWeight:700, marginTop:2 }}>💰 {t.hourly_rate}</div>}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                {t.city           && <span style={{ fontSize:11, background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 8px", color:"#6B7280" }}>📍 {t.city}</span>}
                {t.experience     && <span style={{ fontSize:11, background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 8px", color:"#6B7280" }}>🎓 {t.experience}</span>}
                {t.teaching_mode  && <span style={{ fontSize:11, background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:6, padding:"2px 8px", color:"#1A56DB", fontWeight:600 }}>{t.teaching_mode}</span>}
                {t.qualification  && <span style={{ fontSize:11, background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 8px", color:"#6B7280" }}>📜 {t.qualification}</span>}
              </div>
              {t.bio && <p style={{ fontSize:12, color:"#6B7280", lineHeight:1.6, marginBottom:14 }}>{t.bio.slice(0,100)}{t.bio.length>100?"...":""}</p>}
              <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:14 }}>
                {contacted.includes(t.id) ? (
                  <div style={{ textAlign:"center", fontSize:13, color:"#059669", fontWeight:700 }}>✅ Contact request sent!</div>
                ) : (
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:"center" }}
                      onClick={() => setContacted(c => [...c, t.id])}>
                      📞 Contact Tutor
                    </button>
                    {(t.phone || t.email) && (
                      <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:"center" }}
                        onClick={() => {
                          setContacted(c => [...c, t.id]);
                          if (t.phone) window.open("tel:"+t.phone);
                        }}>
                        📱 {t.phone||t.email}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
