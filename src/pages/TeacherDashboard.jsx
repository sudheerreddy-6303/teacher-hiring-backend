import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MOCK_JOBS, SUBS } from "../constants";
import { Toast, InlineBrowseJobs, FilterBar } from "../components/Shared";

function TeacherDashboard({ user, setPage }) {
  const { logout } = useAuth();
  const [tab, setTab]         = useState("overview");
  const [editMode, setEditMode]     = useState(false);
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Full profile with all fields from spec ──────────────────────────────────
  const [profile, setProfile] = useState({
    // Basic
    full_name:          user.name || "",
    mobile:             "",
    email:              user.email || "",
    gender:             "",
    dob:                "",
    current_location:   "",
    preferred_locations:"",
    // Qualifications
    qualification:      "",
    specialization:     user.subject || "",
    total_experience:   "",
    relevant_experience:"",
    current_role:       "",
    current_org:        "",
    current_salary:     "",
    expected_salary:    "",
    notice_period:      "",
    available_from:     "",
    // Work preferences
    work_mode:          "",
    tutor_type:         "",
    subjects:           "",
    grades_handling:    "",
    boards_handled:     "",
    competitive_exams:  "",
    teaching_mode:      "",
    // Demo & languages
    demo_available:     "",
    demo_link:          "",
    languages:          "",
    certifications:     "",
    // Other
    residential_pref:   "",
    relocation_ready:   "",
    accommodation_req:  "",
    aadhaar_verified:   "",
    resume_link:        "",
    profile_status:     "Active",
    remarks:            "",
    resume_file_name:   "",
    profile_photo:      "",
  });

  function up(k, v) { setProfile(p => ({...p, [k]: v})); }

  // Load profile from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("acadhr_token");
    if (!token) { setProfileLoading(false); return; }
    fetch((process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api") + "/teacher/profile", {
      headers: { Authorization: "Bearer " + token }
    })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) {
        setProfile(p => ({
          ...p,
          full_name:          data.full_name          || user.name || "",
          mobile:             data.mobile             || "",
          email:              user.email              || "",
          gender:             data.gender             || "",
          dob:                data.dob                || "",
          current_location:   data.current_location   || "",
          preferred_locations:data.preferred_locations|| "",
          qualification:      data.qualification      || "",
          specialization:     data.specialization     || user.subject || "",
          total_experience:   data.total_experience   || "",
          relevant_experience:data.relevant_experience|| "",
          current_role:       data.current_role       || "",
          current_org:        data.current_org        || "",
          current_salary:     data.current_salary     || "",
          expected_salary:    data.expected_salary    || "",
          notice_period:      data.notice_period      || "",
          available_from:     data.available_from     || "",
          certifications:     data.certifications     || "",
          work_mode:          data.work_mode          || "",
          tutor_type:         data.tutor_type         || "",
          subjects:           data.subjects           || "",
          grades_handling:    data.grades_handling    || "",
          boards_handled:     data.boards_handled     || "",
          competitive_exams:  data.competitive_exams  || "",
          teaching_mode:      data.teaching_mode      || "",
          languages:          data.languages          || "",
          demo_available:     data.demo_available     || "",
          demo_link:          data.demo_link          || "",
          residential_pref:   data.residential_pref   || "",
          relocation_ready:   data.relocation_ready   || "",
          accommodation_req:  data.accommodation_req  || "",
          aadhaar_verified:   data.aadhaar_verified   || "",
          resume_link:        data.resume_link        || "",
          resume_file_name:   data.resume_file_name   || "",
          profile_photo:      data.profile_photo       || "",
          profile_status:     data.profile_status     || "Active",
          remarks:            data.remarks            || "",
        }));
        if (data.completion_pct) {
          localStorage.setItem("acadhr_teacher_completion", String(data.completion_pct));
        }
      }
    })
    .catch(e => console.error("Profile load error:", e))
    .finally(() => setProfileLoading(false));
  }, []);

  // Save profile to backend
  async function saveProfile() {
    setSaving(true); setSaveError("");
    try {
      const token = localStorage.getItem("acadhr_token");
      const payload = { ...profile, completion_pct: completion };
      const res = await fetch(
        (process.env.REACT_APP_API_URL || "https://teacher-hiring-backend.onrender.com/api") + "/teacher/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setSaved(true);
      setEditMode(false);
      localStorage.setItem("acadhr_teacher_completion", String(completion));
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Profile completion calculator ───────────────────────────────────────────
  // Fields weighted for 70% threshold
  const REQUIRED_FIELDS = [
    "full_name","mobile","email","gender","dob","current_location",
    "qualification","specialization","total_experience","relevant_experience",
    "current_role","work_mode","subjects","grades_handling","boards_handled",
    "teaching_mode","languages","profile_status",
  ];
  const OPTIONAL_FIELDS = [
    "preferred_locations","current_org","current_salary","expected_salary",
    "notice_period","available_from","tutor_type","competitive_exams",
    "demo_available","demo_link","certifications","residential_pref",
    "relocation_ready","accommodation_req","aadhaar_verified","resume_link","remarks",
  ];
  const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  function calcCompletion() {
    const filled = ALL_FIELDS.filter(f => profile[f] && profile[f].toString().trim() !== "").length;
    return Math.round((filled / ALL_FIELDS.length) * 100);
  }

  const completion   = calcCompletion();
  const canApply     = completion >= 70;
  const progressColor = completion >= 70 ? "#059669" : completion >= 40 ? "#D97706" : "#DC2626";

  const applications = [
    { job:"Senior Mathematics Teacher", school:"Delhi Public School", status:"Shortlisted",  sClass:"bgreen", date:"May 15, 2026" },
    { job:"Math Tutor (Grade 9-10)",    school:"Narayana Classes",    status:"Under Review", sClass:"bamber", date:"May 12, 2026" },
    { job:"Physics Teacher",            school:"St. Mary's School",   status:"Not Selected", sClass:"bred",   date:"May 8, 2026" },
  ];

  const MENU = [
    { id:"overview",     icon:"🏠", label:"Overview" },
    { id:"profile",      icon:"👤", label:"My Profile" },
    { id:"applications", icon:"📋", label:"Applications" },
    { id:"browse",       icon:"🔍", label:"Browse Jobs" },
  ];

  const SUBS  = ["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit"];
  const QUALS = ["B.Sc","M.Sc","B.Tech","M.Tech","B.Ed","M.Ed","M.Sc + B.Ed","B.Tech + B.Ed","PhD","Diploma"];
  const GRADES= ["Pre-Primary","1–5","6–8","9–10","11–12","All Grades","Degree"];
  const BOARDS= ["CBSE","ICSE","State Board","IB","IGCSE","All Boards"];
  const EXAMS = ["NEET","JEE","Olympiad","UPSC","CA Foundation","None"];

  return (
    <div style={{ display:"flex", width:"100vw", overflowX:"hidden", minHeight:"100vh" }}>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand" style={{ cursor:"pointer" }} onClick={() => setPage("home")}>
            <img src="/acadhr-logo.png" alt="AcadHr" style={{ height:52, objectFit:"contain" }} />
          </div>
          <div style={{ fontSize:11, color:"#6B7280", marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Teacher Portal</div>
        </div>

        {/* Profile completion in sidebar */}
        <div style={{ padding:"16px 22px 14px", borderBottom:"1px solid #E5E7EB", background:"#F9FAFB" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ width:46, height:46, borderRadius:"50%", overflow:"hidden", border:"2px solid #BFDBFE", flexShrink:0, background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {profile.profile_photo
                ? <img src={(process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + profile.profile_photo} alt="Photo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:20 }}>👤</span>}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>{profile.full_name || user.name}</div>
              <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>{profile.specialization || user.subject || "Educator"}</div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:11, fontWeight:700 }}>
            <span style={{ color:"#374151" }}>Profile Complete</span>
            <span style={{ color:progressColor }}>{completion}%</span>
          </div>
          <div style={{ height:6, background:"#E5E7EB", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:6, borderRadius:3, background:progressColor, width:`${completion}%`, transition:"width .4s" }} />
          </div>
          {!canApply && (
            <div style={{ fontSize:10, color:"#DC2626", marginTop:5, fontWeight:600 }}>
              ⚠ Complete 70% to apply for jobs
            </div>
          )}
          {canApply && (
            <div style={{ fontSize:10, color:"#059669", marginTop:5, fontWeight:600 }}>
              ✓ You can apply for jobs
            </div>
          )}
        </div>

        <div className="sidebar-sec">Navigation</div>
        {MENU.map(m => (
          <div key={m.id} className={"s-item" + (tab===m.id?" active":"")}
            onClick={() => setTab(m.id)}>
            <span>{m.icon}</span>{m.label}
          </div>
        ))}
        <div style={{ marginTop:"auto", padding:"20px 0" }}>
          <div className="sidebar-sec">Account</div>
          <div className="s-item" onClick={() => setPage("home")}>🏠 Back to Site</div>
          <div className="s-item" onClick={logout}>🚪 Logout</div>
        </div>
      </div>

      {/* Main */}
      <div className="main">

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && (
          <div className="fadeUp">
            <div className="page-title">Welcome back, {(profile.full_name||user.name).split(" ")[0]} 👋</div>
            <div className="page-sub">Your job search at a glance</div>

            {/* Profile completion banner */}
            <div style={{ background: canApply ? "#ECFDF5" : "#FFF7ED", border:`1px solid ${canApply?"#A7F3D0":"#FDE68A"}`, borderRadius:14, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:15, color: canApply?"#065F46":"#92400E", marginBottom:6 }}>
                  {canApply ? "✅ Profile Ready — You can apply for jobs!" : "⚠️ Complete your profile to apply for jobs"}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, height:10, background:"#E5E7EB", borderRadius:5, maxWidth:300 }}>
                    <div style={{ height:10, borderRadius:5, background:progressColor, width:`${completion}%`, transition:"width .5s" }} />
                  </div>
                  <span style={{ fontWeight:800, fontSize:16, color:progressColor }}>{completion}%</span>
                </div>
                {!canApply && (
                  <div style={{ fontSize:12, color:"#92400E", marginTop:6 }}>
                    You need at least <strong>70%</strong> profile completion to apply. Currently at <strong>{completion}%</strong>.
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setTab("profile")}>
                {canApply ? "✏️ Edit Profile" : "Complete Profile →"}
              </button>
            </div>

            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:26 }}>
              {[["Applied","3","📋","#1A56DB"],["Shortlisted","1","⭐","#059669"],["Profile Views","28","👁️","#D97706"]].map(([l,v,i,c]) => (
                <div key={l} className="card kpi">
                  <div className="kpi-icon">{i}</div>
                  <div className="kpi-num" style={{ color:c }}>{v}</div>
                  <div className="kpi-lbl">{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:17, marginBottom:18 }}>Recent Applications</h3>
                {applications.slice(0,3).map((a,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<2?"1px solid #F3F4F6":"none" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{a.job}</div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>{a.school} · {a.date}</div>
                    </div>
                    <span className={"badge "+a.sClass}>{a.status}</span>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop:14, width:"100%" }} onClick={() => setTab("applications")}>View All →</button>
              </div>

              <div className="card" style={{ padding:24, borderTop:"3px solid #1A56DB" }}>
                <h3 style={{ fontSize:17, marginBottom:6 }}>🔥 Recommended For You</h3>
                <p style={{ color:"#9CA3AF", fontSize:12, marginBottom:16 }}>Based on your {profile.specialization||user.subject||"subject"} profile:</p>
                {MOCK_JOBS.slice(0,3).map(j => (
                  <div key={j.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F3F4F6" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ fontSize:18 }}>{j.logo}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:12, color:"#111827" }}>{j.title}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>{j.institute}</div>
                      </div>
                    </div>
                    {canApply
                      ? <button className="btn btn-primary btn-sm" onClick={() => setPage("jobs")}>Apply</button>
                      : <button className="btn btn-ghost btn-sm" title="Complete 70% profile to apply"
                          onClick={() => setTab("profile")} style={{ color:"#DC2626", borderColor:"#FECACA" }}>
                          🔒 {completion}%
                        </button>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ FULL PROFILE FORM ══ */}
        {tab==="profile" && (
          <div className="fadeUp">
            {profileLoading && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#6B7280" }}>
                <div style={{ width:40, height:40, border:"3px solid #E5E7EB", borderTopColor:"#1A56DB", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
                <div style={{ fontWeight:600 }}>Loading your profile...</div>
              </div>
            )}
            {!profileLoading && <>
            <div className="flexb" style={{ marginBottom:24 }}>
              <div>
                <div className="page-title">My Profile</div>
                <div className="page-sub" style={{ marginBottom:0 }}>
                  Complete your profile to unlock job applications
                  <span style={{ marginLeft:12, fontWeight:800, color:progressColor }}>{completion}% complete</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setEditMode(e => !e); setSaved(false); }}>
                  {editMode ? "✕ Cancel" : "✏️ Edit Profile"}
                </button>
                {editMode && (
                  <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes ✓"}
                  </button>
                )}
              </div>
            </div>

            {saved && <div className="alert a-ok" style={{ marginBottom:20 }}>✅ Profile saved to database! Completion: {completion}%{canApply?" — You can now apply for jobs! 🎉":""}</div>}
            {saveError && <div className="alert a-err" style={{ marginBottom:20 }}>❌ Save failed: {saveError}</div>}
            {!editMode && (
              <div className="alert a-info" style={{ marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span>👁 View mode — click <strong>Edit Profile</strong> to make changes</span>
                <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
              </div>
            )}

            {/* Completion bar */}
            <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"20px 24px", marginBottom:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontWeight:700 }}>
                <span style={{ color:"#111827" }}>Profile Completion</span>
                <span style={{ color:progressColor, fontSize:18 }}>{completion}%</span>
              </div>
              <div style={{ height:12, background:"#F3F4F6", borderRadius:6, overflow:"hidden", marginBottom:8 }}>
                <div style={{ height:12, borderRadius:6, background: completion>=70?"linear-gradient(90deg,#059669,#34D399)":completion>=40?"linear-gradient(90deg,#D97706,#FBBF24)":"linear-gradient(90deg,#DC2626,#F87171)", width:`${completion}%`, transition:"width .5s" }} />
              </div>
              <div style={{ display:"flex", gap:16, fontSize:12, color:"#6B7280" }}>
                <span style={{ color: completion>=70?"#059669":"#9CA3AF" }}>🟢 70% — Apply for jobs</span>
                <span style={{ color: completion>=90?"#059669":"#9CA3AF" }}>⭐ 90% — Featured profile</span>
                <span style={{ color: completion>=100?"#059669":"#9CA3AF" }}>🏆 100% — Top candidate</span>
              </div>
            </div>

            {/* ── Section 1: Basic Info ── */}
            <div className="card" style={{ padding:28, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:18, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>
                👤 Basic Information
              </div>

              {/* Profile Photo */}
              <div className="fg" style={{ marginBottom:20 }}>
                <label className="flabel">Profile Photo</label>
                <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:6 }}>
                  <div style={{ width:80, height:80, borderRadius:"50%", overflow:"hidden", border:"3px solid #BFDBFE", background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {profile.profile_photo
                      ? <img src={(process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api").replace("/api","") + profile.profile_photo} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontSize:36 }}>👤</span>}
                  </div>
                  {editMode && (
                    <div>
                      <input type="file" id="photo-upload" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }}
                        onChange={async e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("photo", file);
                          const token = localStorage.getItem("acadhr_token");
                          try {
                            const r = await fetch(
                              (process.env.REACT_APP_API_URL||"https://teacher-hiring-backend.onrender.com/api") + "/teacher/upload-photo",
                              { method:"POST", headers: token ? { Authorization:"Bearer "+token } : {}, body: fd }
                            );
                            const d = await r.json();
                            if (r.ok) { up("profile_photo", d.photo_url); }
                            else alert("Upload failed: " + d.message);
                          } catch(err) { alert("Upload error: " + err.message); }
                        }}
                      />
                      <label htmlFor="photo-upload" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", background:"#EBF5FF", border:"1.5px dashed #1A56DB", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:"#1A56DB" }}>
                        📷 Upload Photo
                      </label>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:5 }}>JPG / PNG / WEBP · Max 5MB</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid2">
                <div className="fg"><label className="flabel">Full Name *</label>
                  <input className="input" readOnly={!editMode} value={profile.full_name} onChange={e => up("full_name",e.target.value)} placeholder="Your full name" style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
                <div className="fg"><label className="flabel">Mobile Number *</label>
                  <input className="input" readOnly={!editMode} value={profile.mobile} onChange={e => up("mobile",e.target.value)} placeholder="+91 98765 43210" style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
              </div>
              <div className="grid2">
                <div className="fg"><label className="flabel">Email ID *</label>
                  <input className="input" readOnly value={profile.email} style={{ background:"#F9FAFB", color:"#6B7280" }} />
                </div>
                <div className="fg"><label className="flabel">Date of Birth *</label>
                  <input className="input" type="date" readOnly={!editMode} value={profile.dob} onChange={e => up("dob",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
              </div>

              {/* Gender — radio buttons */}
              <div className="fg">
                <label className="flabel">Gender *</label>
                <div style={{ display:"flex", gap:10, marginTop:6, flexWrap:"wrap" }}>
                  {["Male","Female","Prefer not to say"].map(g => (
                    <label key={g} onClick={() => editMode && up("gender",g)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:22, border:`2px solid ${profile.gender===g?"#1A56DB":"#D1D5DB"}`, background:profile.gender===g?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.gender===g?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${profile.gender===g?"#1A56DB":"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {profile.gender===g && <div style={{ width:6, height:6, borderRadius:"50%", background:"#1A56DB" }} />}
                      </div>
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid2">
                <div className="fg"><label className="flabel">Current Location (City) *</label>
                  <input className="input" readOnly={!editMode} value={profile.current_location} onChange={e => up("current_location",e.target.value)} placeholder="e.g. Hyderabad" style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
                <div className="fg"><label className="flabel">Preferred Locations</label>
                  <input className="input" readOnly={!editMode} value={profile.preferred_locations} onChange={e => up("preferred_locations",e.target.value)} placeholder="e.g. Hyderabad, Bangalore" style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Qualifications & Experience ── */}
            <div className="card" style={{ padding:28, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:18, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>
                🎓 Qualifications & Experience
              </div>

              {/* Qualification — pill radio */}
              <div className="fg">
                <label className="flabel">Qualification * (B.Sc / M.Sc / B.Tech etc)</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["B.Sc","M.Sc","B.Tech","M.Tech","B.Ed","M.Ed","M.Sc + B.Ed","B.Tech + B.Ed","PhD","Diploma"].map(q => (
                    <label key={q} onClick={() => editMode && up("qualification",q)}
                      style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${profile.qualification===q?"#1A56DB":"#D1D5DB"}`, background:profile.qualification===q?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:profile.qualification===q?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                      {profile.qualification===q?"✓ ":""}{q}
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialization — dropdown */}
              <div className="grid2">
                <div className="fg"><label className="flabel">Specialization / Subject *</label>
                  <select className="input" value={profile.specialization} onChange={e => editMode && up("specialization",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff", pointerEvents: editMode?"auto":"none" }}>
                    <option value="">Select subject</option>
                    {["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit","Telugu","Kannada","Tamil","History","Geography","Civics","Accountancy","Business Studies"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="flabel">Current Role *</label>
                  <select className="input" value={profile.current_role} onChange={e => editMode && up("current_role",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff", pointerEvents: editMode?"auto":"none" }}>
                    <option value="">Select role</option>
                    <option>Teacher</option><option>Faculty</option><option>Tutor</option><option>Lecturer</option><option>HOD</option><option>PGT</option><option>TGT</option><option>PRT</option><option>Fresher</option>
                  </select>
                </div>
              </div>

              {/* Total Experience — radio pills */}
              <div className="fg">
                <label className="flabel">Total Experience *</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["Fresher","Less than 1 Year","1–2 Years","2–3 Years","3–5 Years","5–8 Years","8–10 Years","10+ Years"].map(exp => (
                    <label key={exp} onClick={() => editMode && up("total_experience",exp)}
                      style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${profile.total_experience===exp?"#1A56DB":"#D1D5DB"}`, background:profile.total_experience===exp?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:profile.total_experience===exp?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                      {profile.total_experience===exp?"● ":"○ "}{exp}
                    </label>
                  ))}
                </div>
              </div>

              {/* Relevant Experience — radio pills */}
              <div className="fg">
                <label className="flabel">Relevant Teaching Experience *</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["Fresher","Less than 1 Year","1–2 Years","2–3 Years","3–5 Years","5–8 Years","8–10 Years","10+ Years"].map(exp => (
                    <label key={exp} onClick={() => editMode && up("relevant_experience",exp)}
                      style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${profile.relevant_experience===exp?"#059669":"#D1D5DB"}`, background:profile.relevant_experience===exp?"#ECFDF5":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:profile.relevant_experience===exp?"#059669":"#374151", transition:"all .15s", userSelect:"none" }}>
                      {profile.relevant_experience===exp?"● ":"○ "}{exp}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid2">
                <div className="fg"><label className="flabel">Current Organization</label>
                  <input className="input" readOnly={!editMode} value={profile.current_org} onChange={e => up("current_org",e.target.value)} placeholder="School / Coaching name" style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
                <div className="fg"><label className="flabel">Available From</label>
                  <input className="input" type="date" readOnly={!editMode} value={profile.available_from} onChange={e => up("available_from",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff" }} />
                </div>
              </div>

              {/* Current Salary — dropdown */}
              <div className="grid2">
                <div className="fg"><label className="flabel">Current Salary (Monthly)</label>
                  <select className="input" value={profile.current_salary} onChange={e => editMode && up("current_salary",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff", pointerEvents: editMode?"auto":"none" }}>
                    <option value="">Select range</option>
                    <option>Below ₹10,000</option><option>₹10,000–₹15,000</option><option>₹15,000–₹20,000</option>
                    <option>₹20,000–₹30,000</option><option>₹30,000–₹40,000</option><option>₹40,000–₹50,000</option>
                    <option>₹50,000–₹70,000</option><option>₹70,000–₹1,00,000</option><option>Above ₹1,00,000</option>
                  </select>
                </div>
                <div className="fg"><label className="flabel">Expected Salary (Monthly)</label>
                  <select className="input" value={profile.expected_salary} onChange={e => editMode && up("expected_salary",e.target.value)} style={{ background: !editMode?"#F9FAFB":"#fff", pointerEvents: editMode?"auto":"none" }}>
                    <option value="">Select range</option>
                    <option>Below ₹10,000</option><option>₹10,000–₹15,000</option><option>₹15,000–₹20,000</option>
                    <option>₹20,000–₹30,000</option><option>₹30,000–₹40,000</option><option>₹40,000–₹50,000</option>
                    <option>₹50,000–₹70,000</option><option>₹70,000–₹1,00,000</option><option>Above ₹1,00,000</option>
                  </select>
                </div>
              </div>

              {/* Notice Period — radio pills */}
              <div className="fg">
                <label className="flabel">Notice Period</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["Immediate","15 Days","30 Days","45 Days","60 Days","90 Days"].map(np => (
                    <label key={np} onClick={() => editMode && up("notice_period",np)}
                      style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${profile.notice_period===np?"#D97706":"#D1D5DB"}`, background:profile.notice_period===np?"#FFFBEB":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:profile.notice_period===np?"#D97706":"#374151", transition:"all .15s", userSelect:"none" }}>
                      {profile.notice_period===np?"● ":"○ "}{np}
                    </label>
                  ))}
                </div>
              </div>

              {/* Certifications — multi-select pills */}
              <div className="fg">
                <label className="flabel">Certifications</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["B.Ed","M.Ed","CTET","TET (State)","NET","SET","NTT","D.El.Ed","BTC","PGDCA","None"].map(c => {
                    const selected = profile.certifications.includes(c);
                    return (
                      <label key={c} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.certifications ? profile.certifications.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(c) ? cur.filter(x=>x!==c) : [...cur,c];
                        up("certifications", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${selected?"#6D28D9":"#D1D5DB"}`, background:selected?"#F5F3FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:selected?"#6D28D9":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {selected?"✓ ":""}{c}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Section 3: Teaching Preferences ── */}
            <div className="card" style={{ padding:28, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:18, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>
                📚 Teaching Preferences
              </div>

              {/* Work Mode — radio pills */}
              <div className="fg">
                <label className="flabel">Work Mode *</label>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
                  {["Full-time","Part-time","Online","Hybrid"].map(m => (
                    <label key={m} onClick={() => editMode && up("work_mode",m)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:22, border:`2px solid ${profile.work_mode===m?"#1A56DB":"#D1D5DB"}`, background:profile.work_mode===m?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.work_mode===m?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${profile.work_mode===m?"#1A56DB":"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {profile.work_mode===m && <div style={{ width:6, height:6, borderRadius:"50%", background:"#1A56DB" }} />}
                      </div>
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {/* Tutor Type — radio pills */}
              <div className="fg">
                <label className="flabel">Tutor Type</label>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
                  {["School Teacher","Coaching Faculty","Home Tutor","Online Tutor"].map(t => (
                    <label key={t} onClick={() => editMode && up("tutor_type",t)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:22, border:`2px solid ${profile.tutor_type===t?"#0EA5E9":"#D1D5DB"}`, background:profile.tutor_type===t?"#E0F2FE":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.tutor_type===t?"#0369A1":"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${profile.tutor_type===t?"#0EA5E9":"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {profile.tutor_type===t && <div style={{ width:6, height:6, borderRadius:"50%", background:"#0EA5E9" }} />}
                      </div>
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              {/* Subjects — multi-select pills */}
              <div className="fg">
                <label className="flabel">Subjects * (select all you teach)</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit","Telugu","Kannada","Tamil","Accountancy","Business Studies","History","Geography"].map(s => {
                    const sel = profile.subjects.includes(s);
                    return (
                      <label key={s} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.subjects ? profile.subjects.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(s) ? cur.filter(x=>x!==s) : [...cur,s];
                        up("subjects", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${sel?"#1A56DB":"#D1D5DB"}`, background:sel?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:sel?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {sel?"✓ ":""}{s}
                      </label>
                    );
                  })}
                </div>
                {profile.subjects && <div style={{ fontSize:11, color:"#6B7280", marginTop:5 }}>Selected: {profile.subjects}</div>}
              </div>

              {/* Grades — multi-select pills */}
              <div className="fg">
                <label className="flabel">Grades Handling * (select all applicable)</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["Pre-Primary (Nursery–KG)","Primary (1–5)","Upper Primary (6–8)","Secondary (9–10)","Senior Secondary (11–12)","All Grades","Degree Level","Diploma Level"].map(g => {
                    const sel = profile.grades_handling.includes(g);
                    return (
                      <label key={g} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.grades_handling ? profile.grades_handling.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(g) ? cur.filter(x=>x!==g) : [...cur,g];
                        up("grades_handling", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${sel?"#1A56DB":"#D1D5DB"}`, background:sel?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:sel?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {sel?"✓ ":""}{g}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Boards — multi-select pills */}
              <div className="fg">
                <label className="flabel">Boards Handled * (CBSE / ICSE / State)</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["CBSE","ICSE","State Board (AP)","State Board (TS)","State Board (KA)","State Board (MH)","IB","IGCSE","All Boards"].map(b => {
                    const sel = profile.boards_handled.includes(b);
                    return (
                      <label key={b} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.boards_handled ? profile.boards_handled.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(b) ? cur.filter(x=>x!==b) : [...cur,b];
                        up("boards_handled", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${sel?"#059669":"#D1D5DB"}`, background:sel?"#ECFDF5":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:sel?"#059669":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {sel?"✓ ":""}{b}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Competitive Exams — multi-select pills */}
              <div className="fg">
                <label className="flabel">Competitive Exams Handled</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["JEE (Mains)","JEE (Advanced)","NEET","EAMCET","Olympiad","NTSE","NDA","UPSC","CA Foundation","None"].map(ex => {
                    const sel = profile.competitive_exams.includes(ex);
                    return (
                      <label key={ex} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.competitive_exams ? profile.competitive_exams.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(ex) ? cur.filter(x=>x!==ex) : [...cur,ex];
                        up("competitive_exams", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${sel?"#6D28D9":"#D1D5DB"}`, background:sel?"#F5F3FF":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:sel?"#6D28D9":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {sel?"✓ ":""}{ex}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Teaching Mode — radio pills */}
              <div className="fg">
                <label className="flabel">Teaching Mode *</label>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
                  {["Offline","Online","Hybrid (Both)"].map(m => (
                    <label key={m} onClick={() => editMode && up("teaching_mode",m)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:22, border:`2px solid ${profile.teaching_mode===m?"#1A56DB":"#D1D5DB"}`, background:profile.teaching_mode===m?"#EBF5FF":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.teaching_mode===m?"#1A56DB":"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${profile.teaching_mode===m?"#1A56DB":"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {profile.teaching_mode===m && <div style={{ width:6, height:6, borderRadius:"50%", background:"#1A56DB" }} />}
                      </div>
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages — multi-select pills */}
              <div className="fg">
                <label className="flabel">Languages Known *</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {["English","Hindi","Telugu","Kannada","Tamil","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Urdu","Odia"].map(l => {
                    const sel = profile.languages.includes(l);
                    return (
                      <label key={l} onClick={() => {
                        if (!editMode) return;
                        const cur = profile.languages ? profile.languages.split(",").map(x=>x.trim()).filter(Boolean) : [];
                        const next = cur.includes(l) ? cur.filter(x=>x!==l) : [...cur,l];
                        up("languages", next.join(", "));
                      }}
                        style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${sel?"#D97706":"#D1D5DB"}`, background:sel?"#FFFBEB":"#fff", cursor:editMode?"pointer":"default", fontSize:12, fontWeight:700, color:sel?"#D97706":"#374151", transition:"all .15s", userSelect:"none" }}>
                        {sel?"✓ ":""}{l}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Section 4: Demo & Additional ── */}
            <div className="card" style={{ padding:28, marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#1A56DB", textTransform:"uppercase", letterSpacing:1, marginBottom:18, paddingBottom:8, borderBottom:"2px solid #EBF5FF" }}>
                🎥 Demo & Additional Details
              </div>

              {/* Demo Available — radio */}
              <div className="fg">
                <label className="flabel">Demo Available</label>
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  {["Yes","No"].map(v => (
                    <label key={v} onClick={() => editMode && up("demo_available",v)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 20px", borderRadius:22, border:`2px solid ${profile.demo_available===v?"#059669":"#D1D5DB"}`, background:profile.demo_available===v?"#ECFDF5":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.demo_available===v?"#059669":"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${profile.demo_available===v?"#059669":"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {profile.demo_available===v && <div style={{ width:6, height:6, borderRadius:"50%", background:"#059669" }} />}
                      </div>
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              <div className="fg"><label className="flabel">Demo Link (Video URL)</label>
                <input className="input" readOnly={!editMode} value={profile.demo_link} onChange={e => up("demo_link",e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ background: !editMode?"#F9FAFB":"#fff" }} />
              </div>

              {/* Yes/No radio group for 4 fields */}
              <div className="grid2">
                {[
                  ["Residential Preference","residential_pref","#1A56DB"],
                  ["Relocation Ready","relocation_ready","#1A56DB"],
                  ["Accommodation Required","accommodation_req","#DC2626"],
                  ["Aadhaar / ID Verified","aadhaar_verified","#059669"],
                ].map(([label, key, color]) => (
                  <div key={key} className="fg">
                    <label className="flabel">{label}</label>
                    <div style={{ display:"flex", gap:10, marginTop:6 }}>
                      {["Yes","No"].map(v => (
                        <label key={v} onClick={() => editMode && up(key,v)}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 18px", borderRadius:22, border:`2px solid ${profile[key]===v?color:"#D1D5DB"}`, background:profile[key]===v?color+"15":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile[key]===v?color:"#374151", transition:"all .15s", userSelect:"none" }}>
                          <div style={{ width:13, height:13, borderRadius:"50%", border:`2px solid ${profile[key]===v?color:"#9CA3AF"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {profile[key]===v && <div style={{ width:5, height:5, borderRadius:"50%", background:color }} />}
                          </div>
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Status — radio */}
              <div className="fg">
                <label className="flabel">Profile Status</label>
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  {[["Active","#059669"],["Inactive","#DC2626"]].map(([v,color]) => (
                    <label key={v} onClick={() => editMode && up("profile_status",v)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 20px", borderRadius:22, border:`2px solid ${profile.profile_status===v?color:"#D1D5DB"}`, background:profile.profile_status===v?color+"18":"#fff", cursor:editMode?"pointer":"default", fontSize:13, fontWeight:700, color:profile.profile_status===v?color:"#374151", transition:"all .15s", userSelect:"none" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:profile.profile_status===v?color:"#D1D5DB" }} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Resume Upload */}
              <div className="fg">
                <label className="flabel">Resume Upload / Link</label>
                {editMode ? (
                  <div>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} id="resume-upload"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) { up("resume_file_name", file.name); up("resume_link",""); }
                      }} />
                    <div style={{ display:"flex", gap:8, flexDirection:"column" }}>
                      <label htmlFor="resume-upload" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 16px", background:"#EBF5FF", border:"2px dashed #1A56DB", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13, color:"#1A56DB" }}>
                        📎 {profile.resume_file_name ? "✓ "+profile.resume_file_name : "Click to upload Resume (PDF / DOC / DOCX)"}
                      </label>
                      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#9CA3AF" }}>
                        <div style={{ flex:1, height:1, background:"#E5E7EB" }} /><span>OR paste Google Drive link</span><div style={{ flex:1, height:1, background:"#E5E7EB" }} />
                      </div>
                      <input className="input" value={profile.resume_link} onChange={e => { up("resume_link",e.target.value); up("resume_file_name",""); }} placeholder="https://drive.google.com/file/..." />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:"12px 14px", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, fontSize:13 }}>
                    {profile.resume_file_name
                      ? <span style={{ color:"#1A56DB", fontWeight:600 }}>📎 {profile.resume_file_name}</span>
                      : profile.resume_link
                        ? <a href={profile.resume_link} target="_blank" rel="noreferrer" style={{ color:"#1A56DB", fontWeight:600 }}>🔗 View Resume</a>
                        : <span style={{ color:"#9CA3AF" }}>No resume uploaded yet</span>}
                  </div>
                )}
              </div>

              <div className="fg"><label className="flabel">Remarks / Notes</label>
                <textarea className="input" readOnly={!editMode} rows={3} value={profile.remarks} onChange={e => up("remarks",e.target.value)} placeholder="Any additional information..." style={{ background: !editMode?"#F9FAFB":"#fff" }} />
              </div>
            </div>

            {editMode && (
              <div style={{ display:"flex", gap:10, marginBottom:40 }}>
                <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setEditMode(false); setSaved(false); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:2, justifyContent:"center" }} onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes ✓"}</button>
              </div>
            )}
            </>}
          </div>
        )}

        {/* ══ BROWSE JOBS (inline) ══ */}
        {tab==="browse" && (
          <div className="fadeUp">
            <div className="page-title">Browse Jobs</div>
            <div className="page-sub">All available teaching positions</div>
            {!canApply && (
              <div className="alert a-warn" style={{ marginBottom:16 }}>
                ⚠️ Complete <strong>70%</strong> of your profile to apply. Currently at <strong>{completion}%</strong>.
                <button className="btn btn-primary btn-sm" style={{ marginLeft:12 }} onClick={() => setTab("profile")}>Complete Profile</button>
              </div>
            )}
            <InlineBrowseJobs user={user} canApply={canApply}
              onApplyBlocked={() => { setTab("profile"); }} />
          </div>
        )}

        {/* ══ APPLICATIONS ══ */}
        {tab==="applications" && (
          <div className="fadeUp">
            <div className="page-title">My Applications</div>
            <div className="page-sub">Track all your job applications</div>
            {!canApply && (
              <div className="alert a-warn" style={{ marginBottom:20 }}>
                ⚠️ Your profile is only <strong>{completion}%</strong> complete. Complete at least <strong>70%</strong> to apply for new jobs.
                <button className="btn btn-primary btn-sm" style={{ marginLeft:16 }} onClick={() => setTab("profile")}>Complete Profile</button>
              </div>
            )}
            <FilterBar filters={appFilterT} setFilters={setAppFilterT} fields={[
              { key:"job",    type:"text",   placeholder:"🔍 Search position...",  width:220 },
              { key:"school", type:"text",   placeholder:"🏫 Institution...",       width:200 },
              { key:"status", type:"select", placeholder:"All Statuses",            width:170,
                options:["Shortlisted","Under Review","Not Selected"] },
            ]} />
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Position</th><th>Institution</th><th>Applied On</th><th>Status</th></tr></thead>
                  <tbody>{applications.filter(a =>
                      (!appFilterT.job    || a.job.toLowerCase().includes(appFilterT.job.toLowerCase())) &&
                      (!appFilterT.school || a.school.toLowerCase().includes(appFilterT.school.toLowerCase())) &&
                      (!appFilterT.status || a.status === appFilterT.status)
                    ).map((a,i) => (
                    <tr key={i}>
                      <td><strong style={{ color:"#111827" }}>{a.job}</strong></td>
                      <td>{a.school}</td>
                      <td style={{ color:"#9CA3AF" }}>{a.date}</td>
                      <td><span className={"badge "+a.sClass}>{a.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
