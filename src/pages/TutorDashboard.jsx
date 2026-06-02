import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MOCK_JOBS } from "../constants";
import { Toast, Divider, InlineBrowseJobs } from "../components/common/Shared";

function TutorDashboard({ user, setPage }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState({
    name: user.name, subject: user.subject || "Chemistry", city: "Mumbai",
    experience: "4 years", qualification: "B.Sc + B.Ed", phone: "+91 9876 543210",
    mode: "Both (Online & Offline)", rate: "₹800/hr",
    bio: "Experienced private tutor specialising in Chemistry for Grades 9–12. Patient, structured approach with proven results."
  });
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const [requests] = useState([
    { student:"Arjun Sharma",   grade:"Grade 12", subject:"Chemistry",    mode:"Online",  status:"Active",       sClass:"bgreen", since:"Apr 2025" },
    { student:"Meera Patel",    grade:"Grade 10", subject:"Chemistry",    mode:"Offline", status:"Active",       sClass:"bgreen", since:"Mar 2025" },
    { student:"Rohan Gupta",    grade:"Grade 11", subject:"Physics",      mode:"Online",  status:"Trial Pending",sClass:"bamber", since:"May 2025" },
    { student:"Sneha Reddy",    grade:"Grade 9",  subject:"Mathematics",  mode:"Offline", status:"Completed",    sClass:"bgray",  since:"Jan 2025" },
  ]);

  const MENU = [
    { id:"overview",  icon:"🏠", label:"Overview" },
    { id:"students",  icon:"🧑‍🎓", label:"My Students" },
    { id:"schedule",  icon:"📅", label:"Schedule" },
    { id:"earnings",  icon:"💰", label:"Earnings" },
    { id:"profile",   icon:"👤", label:"My Profile" },
  ];

  const earnings = [
    { month:"January",  amount:14400 },
    { month:"February", amount:16800 },
    { month:"March",    amount:12000 },
    { month:"April",    amount:19200 },
    { month:"May",      amount:22400 },
  ];

  return (
    <div style={{ display:"flex", width:"100vw", overflowX:"hidden", minHeight:"100vh" }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand" style={{ cursor:"pointer" }} onClick={() => setPage("home")}>
            <img src="/acadhr-logo.png" alt="AcadHr" style={{ height:52, objectFit:"contain" }} />
          </div>
          <div style={{ fontSize:11, color:"#6B7280", marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Tutor Portal</div>
        </div>
        <div className="sidebar-user">
          <div style={{ fontSize:34, marginBottom:6 }}>🧑‍🎓</div>
          <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>{user.name}</div>
          <div style={{ fontSize:12, color:"#059669", fontWeight:600, marginTop:2 }}>{profile.subject} Tutor</div>
          <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
            <span className="badge bgreen" style={{ fontSize:10 }}>✓ Verified</span>
            <span className="badge bamber" style={{ fontSize:10 }}>⭐ 4.9 Rating</span>
          </div>
        </div>
        <div className="sidebar-sec">Navigation</div>
        {MENU.map(m => (
          <div key={m.id} className={"s-item" + (tab === m.id ? " active" : "")} onClick={() => setTab(m.id)}>
            <span>{m.icon}</span>{m.label}
          </div>
        ))}
        <div style={{ marginTop:"auto", padding:"20px 0" }}>
          <div className="sidebar-sec">Account</div>
          <div className="s-item" onClick={() => setPage("home")}>🏠 Back to Site</div>
          <div className="s-item" onClick={logout}>🚪 Logout</div>
        </div>
      </div>

      {/* Main content */}
      <div className="main">

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="fadeUp">
            <div className="page-title">Welcome back, {user.name.split(" ")[0]} 👋</div>
            <div className="page-sub">Your tutoring activity at a glance</div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18, marginBottom:26 }}>
              {[
                ["Active Students","2","🧑‍🎓","#1A56DB"],
                ["Hours This Month","32","⏱️","#059669"],
                ["Earnings (May)","₹22,400","💰","#D97706"],
                ["Avg. Rating","4.9 ★","⭐","#6D28D9"],
              ].map(([l,v,i,c]) => (
                <div key={l} className="card kpi" style={{ padding:20, textAlign:"center" }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{i}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:"Playfair Display,serif" }}>{v}</div>
                  <div style={{ fontSize:12, color:"#6B7280", fontWeight:600, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {/* Active students */}
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:17, marginBottom:18 }}>Active Students</h3>
                {requests.filter(r => r.status === "Active").map((r,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F3F4F6" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🧑</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{r.student}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>{r.grade} · {r.mode}</div>
                      </div>
                    </div>
                    <span className={"badge " + r.sClass}>{r.status}</span>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop:14, width:"100%" }} onClick={() => setTab("students")}>All Students →</button>
              </div>

              {/* Earnings chart */}
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:17, marginBottom:18 }}>Monthly Earnings</h3>
                {earnings.map((e,i) => (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12, color:"#374151", fontWeight:600 }}>
                      <span>{e.month}</span><span style={{ color:"#059669" }}>₹{e.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ height:7, background:"#F3F4F6", borderRadius:4 }}>
                      <div style={{ height:7, borderRadius:4, background:"linear-gradient(90deg,#1A56DB,#0EA5E9)", width:`${(e.amount/25000)*100}%`, transition:"width .4s" }} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop:10, width:"100%" }} onClick={() => setTab("earnings")}>Full Report →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Students ── */}
        {tab === "students" && (
          <div className="fadeUp">
            <div className="page-title">My Students</div>
            <div className="page-sub">Manage all your tutoring relationships</div>
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Grade</th><th>Subject</th><th>Mode</th><th>Since</th><th>Status</th></tr></thead>
                  <tbody>{requests.map((r,i) => (
                    <tr key={i}>
                      <td><strong style={{ color:"#111827" }}>{r.student}</strong></td>
                      <td>{r.grade}</td>
                      <td>{r.subject}</td>
                      <td><span style={{ fontSize:11 }}>{r.mode === "Online" ? "💻 Online" : "🏠 Offline"}</span></td>
                      <td style={{ color:"#9CA3AF", fontSize:12 }}>{r.since}</td>
                      <td><span className={"badge " + r.sClass}>{r.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Schedule ── */}
        {tab === "schedule" && (
          <div className="fadeUp">
            <div className="page-title">My Schedule</div>
            <div className="page-sub">Weekly tutoring sessions</div>
            <div className="card" style={{ padding:24 }}>
              {[
                { day:"Monday",    time:"4:00 PM – 5:30 PM", student:"Arjun Sharma",   subject:"Chemistry",   mode:"Online",  color:"#EBF5FF", border:"#BFDBFE" },
                { day:"Tuesday",   time:"5:00 PM – 6:30 PM", student:"Meera Patel",    subject:"Chemistry",   mode:"Offline", color:"#ECFDF5", border:"#A7F3D0" },
                { day:"Wednesday", time:"6:00 PM – 7:00 PM", student:"Rohan Gupta",    subject:"Physics",     mode:"Online",  color:"#FFFBEB", border:"#FDE68A" },
                { day:"Friday",    time:"4:30 PM – 6:00 PM", student:"Arjun Sharma",   subject:"Chemistry",   mode:"Online",  color:"#EBF5FF", border:"#BFDBFE" },
                { day:"Saturday",  time:"10:00 AM – 12:00 PM", student:"Meera Patel",  subject:"Chemistry",   mode:"Offline", color:"#ECFDF5", border:"#A7F3D0" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", gap:16, alignItems:"center", padding:"14px 16px", background:s.color, border:`1px solid ${s.border}`, borderRadius:12, marginBottom:10 }}>
                  <div style={{ width:90, flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:"#111827" }}>{s.day}</div>
                    <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>{s.time}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{s.student}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{s.subject}</div>
                  </div>
                  <span className={"badge " + (s.mode==="Online"?"bblue":"bgreen")}>{s.mode==="Online"?"💻 Online":"🏠 Offline"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Earnings ── */}
        {tab === "earnings" && (
          <div className="fadeUp">
            <div className="page-title">Earnings</div>
            <div className="page-sub">Your tutoring income summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:26 }}>
              {[["This Month","₹22,400","#059669"],["Last Month","₹19,200","#1A56DB"],["Total (2025)","₹84,800","#D97706"]].map(([l,v,c]) => (
                <div key={l} className="card" style={{ padding:22, textAlign:"center" }}>
                  <div style={{ fontSize:26, fontWeight:800, color:c, fontFamily:"Playfair Display,serif", marginBottom:6 }}>{v}</div>
                  <div style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:17, marginBottom:20 }}>Monthly Breakdown</h3>
              {earnings.map((e,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
                  <div style={{ width:90, fontSize:13, fontWeight:600, color:"#374151" }}>{e.month}</div>
                  <div style={{ flex:1, height:10, background:"#F3F4F6", borderRadius:5 }}>
                    <div style={{ height:10, borderRadius:5, background:"linear-gradient(90deg,#1A56DB,#0EA5E9)", width:`${(e.amount/25000)*100}%` }} />
                  </div>
                  <div style={{ width:80, textAlign:"right", fontSize:13, fontWeight:700, color:"#059669" }}>₹{e.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile ── */}
        {tab === "profile" && (
          <div className="fadeUp">
            <div className="flexb" style={{ marginBottom:24 }}>
              <div>
                <div className="page-title">My Profile</div>
                <div className="page-sub" style={{ marginBottom:0 }}>Manage your public tutor profile</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditMode(e => !e); setSaved(false); }}>
                {editMode ? "✕ Cancel" : "✏️ Edit Profile"}
              </button>
            </div>
            {saved && <div className="alert a-ok">✓ Profile updated!</div>}
            <div className="card" style={{ padding:28, maxWidth:600 }}>
              <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:24 }}>
                <div style={{ width:70, height:70, borderRadius:18, background:"#EBF5FF", border:"2px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🧑‍🎓</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#111827" }}>{profile.name}</div>
                  <div style={{ fontSize:13, color:"#059669", fontWeight:600 }}>{profile.subject} Tutor · {profile.city}</div>
                  <div style={{ fontSize:12, color:"#D97706", fontWeight:700, marginTop:4 }}>{profile.rate} · {profile.mode}</div>
                </div>
              </div>
              <Divider />
              <div style={{ marginTop:20 }}>
                <div className="grid2">
                  <div className="fg"><label className="flabel">Subject</label><input className="input" disabled={!editMode} value={profile.subject} onChange={e => setProfile(p => ({...p, subject:e.target.value}))} /></div>
                  <div className="fg"><label className="flabel">City</label><input className="input" disabled={!editMode} value={profile.city} onChange={e => setProfile(p => ({...p, city:e.target.value}))} /></div>
                </div>
                <div className="grid2">
                  <div className="fg"><label className="flabel">Experience</label><input className="input" disabled={!editMode} value={profile.experience} onChange={e => setProfile(p => ({...p, experience:e.target.value}))} /></div>
                  <div className="fg"><label className="flabel">Hourly Rate</label><input className="input" disabled={!editMode} value={profile.rate} onChange={e => setProfile(p => ({...p, rate:e.target.value}))} /></div>
                </div>
                <div className="fg"><label className="flabel">Teaching Mode</label>
                  <select className="input" disabled={!editMode} value={profile.mode} onChange={e => setProfile(p => ({...p, mode:e.target.value}))}>
                    <option>Online Only</option><option>Offline Only</option><option>Both (Online & Offline)</option>
                  </select>
                </div>
                <div className="fg"><label className="flabel">Bio</label><textarea className="input" rows={4} disabled={!editMode} value={profile.bio} onChange={e => setProfile(p => ({...p, bio:e.target.value}))} /></div>
                {editMode && <button className="btn btn-primary" onClick={() => { setEditMode(false); setSaved(true); }}>Save Changes ✓</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorDashboard;
