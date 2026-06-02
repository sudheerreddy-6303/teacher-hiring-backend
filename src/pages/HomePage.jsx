import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MOCK_JOBS } from "../constants";
import { Navbar, HeroSchoolsCarousel, JobCard, Toast, Brand, Divider } from "../components/common/Shared";

function HomePage({ setPage }) {
  const FEATURES = [
    { i:"🎯", t:"Smart Job Matching",      d:"Intelligent matching connects teachers with relevant openings based on subject, city, and experience." },
    { i:"🔐", t:"Verified Profiles",       d:"Every teacher is reviewed. Every institute is verified. Hire and apply with complete confidence." },
    { i:"⚡", t:"Real-Time Notifications", d:"Instant alerts when schools post jobs or teachers apply — never miss a perfect opportunity." },
    { i:"📊", t:"Applicant Management",    d:"Manage applicants, shortlist candidates, and track hiring pipelines in one dashboard." },
    { i:"🌍", t:"Pan-India Reach",         d:"From metro cities to tier-2 towns, find teaching roles or talent across every corner of India." },
    { i:"💼", t:"All Engagement Types",    d:"Full-time, part-time, home tuitions, and online tutoring — every arrangement covered." },
  ];
  const TESTIMONIALS = [
    { n:"Priya Sharma",  r:"Mathematics Teacher", s:"Hired by DPS Hyderabad",    t:"Found my dream position in just three days. AcadHr matched me perfectly with a school looking for my exact profile.", a:"👩‍🏫" },
    { n:"Rajesh Kumar",  r:"Principal",           s:"St. Mary's School, Chennai", t:"We received 30+ qualified applications within a week. The candidate quality on AcadHr is outstanding.", a:"👨‍💼" },
    { n:"Ananya Singh",  r:"Physics Tutor",       s:"Working with 5 students",    t:"Four tutoring requests in my first week. The platform makes it genuinely easy to connect with students.", a:"👩‍🔬" },
  ];
  const HOW = [
    { step:"01", who:"Teachers",  icon:"👩‍🏫", items:["Create your free profile","List subjects and experience","Browse verified job listings","Apply in one click","Get hired and start teaching"] },
    { step:"02", who:"Institutes",icon:"🏫",   items:["Register your institution","Post a vacancy for review","Admin approves and publishes","Receive qualified applications","Shortlist, interview, hire"] },
  ];

  return (
    <div>
      <Navbar setPage={setPage} />
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"#fff", position:"relative", overflow:"hidden", paddingTop:90 }}>

        {/* Subtle background accents */}
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(26,86,219,.05),transparent 65%)", top:-200, right:-150, pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(14,165,233,.05),transparent 65%)", bottom:-100, left:-100, pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(26,86,219,.04) 1px,transparent 1px)", backgroundSize:"36px 36px", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", alignItems:"center", paddingTop:40, paddingBottom:60, paddingLeft:60, paddingRight:60, width:"100%", boxSizing:"border-box" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center", width:"100%" }}>

            {/* ── LEFT: Copy ── */}
            <div className="fadeUp">
              {/* Eyebrow badge */}
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:30, padding:"6px 16px", marginBottom:28 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#059669", display:"inline-block", boxShadow:"0 0 8px rgba(5,150,105,.5)" }} />
                <span style={{ fontSize:12, fontWeight:700, color:"#1A56DB", letterSpacing:.5 }}>LIVE · 3,200+ Schools Hiring Now</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"clamp(38px,4.5vw,64px)", fontWeight:800, lineHeight:1.1, color:"#0F172A", marginBottom:22 }}>
                India's Smartest<br />
                <span style={{ color:"#1A56DB", fontStyle:"italic" }}>Teacher Hiring</span><br />
                Platform
              </h1>

              <p style={{ fontSize:16, color:"#4B5563", lineHeight:1.85, maxWidth:440, marginBottom:36 }}>
                AcadHr connects verified educators with top schools, colleges and coaching institutes across India. Apply, post, and hire — faster than ever.
              </p>

              {/* Search */}
              <div style={{ display:"flex", background:"#fff", border:"1.5px solid #D1D5DB", borderRadius:12, overflow:"hidden", boxShadow:"0 4px 20px rgba(26,86,219,.1)", marginBottom:24, maxWidth:480 }}>
                <span style={{ padding:"0 16px", display:"flex", alignItems:"center", color:"#9CA3AF", fontSize:18 }}>🔍</span>
                <input
                  placeholder="Subject, city, or school..."
                  style={{ flex:1, border:"none", outline:"none", fontSize:14, color:"#111827", fontFamily:"Nunito,sans-serif", padding:"14px 0", background:"transparent" }}
                  onKeyDown={e => e.key==="Enter" && setPage("jobs")}
                />
                <button className="btn btn-primary" style={{ borderRadius:0, borderTopRightRadius:10, borderBottomRightRadius:10, padding:"0 24px", fontSize:14 }} onClick={() => setPage("jobs")}>
                  Search
                </button>
              </div>

              {/* Subject tag pills */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:44 }}>
                {["Mathematics","Physics","English","CS","Chemistry","Biology"].map(s => (
                  <span key={s} onClick={() => setPage("jobs")} style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB", transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background="#1A56DB"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="#1A56DB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#F3F4F6"; e.currentTarget.style.color="#374151"; e.currentTarget.style.borderColor="#E5E7EB"; }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* CTA row */}
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:48 }}>
                <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")} style={{ fontSize:15 }}>
                  Get Started Free →
                </button>
                <button onClick={() => setPage("jobs")} style={{ background:"#fff", border:"1.5px solid #D1D5DB", color:"#374151", borderRadius:10, padding:"13px 26px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"Nunito,sans-serif", transition:"all .18s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#1A56DB"; e.currentTarget.style.color="#1A56DB"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#D1D5DB"; e.currentTarget.style.color="#374151"; }}>
                  Browse Jobs
                </button>
              </div>

              {/* Trust avatars */}
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ display:"flex" }}>
                  {["👩‍🏫","👨‍🏫","👩‍🔬","👨‍💼","👩‍💻"].map((a,i) => (
                    <div key={i} style={{ width:34, height:34, borderRadius:"50%", background:`hsl(${210+i*20},70%,55%)`, border:"2px solid #fff", boxShadow:"0 0 0 1px #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginLeft: i===0?0:-10, zIndex:5-i }}>
                      {a}
                    </div>
                  ))}
                </div>
                {/* <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>12,400+ educators</div>
                  <div style={{ fontSize:11, color:"#6B7280" }}>already on AcadHr</div>
                </div> */}
              </div>
            </div>

            {/* ── RIGHT: App Showcase Card ── */}
            <div className="fadeUp" style={{ animationDelay:".15s" }}>
              {/* Main card */}
              <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:24, overflow:"hidden", boxShadow:"0 20px 60px rgba(26,86,219,.12)" }}>
                {/* Card topbar */}
                <div style={{ background:"linear-gradient(135deg,#1E429F,#1A56DB)", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE80" }} />
                    <span style={{ color:"#fff", fontWeight:800, fontSize:14 }}>🏫 Top Hiring Schools</span>
                  </div>
                  <span style={{ background:"rgba(255,255,255,.2)", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Updated Now</span>
                </div>

                {/* Schools carousel */}
                <HeroSchoolsCarousel setPage={setPage} />

                {/* Card footer stats */}
                {/* <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderTop:"1px solid #E5E7EB" }}>
                  {[["12.4k+","Educators"],["3.2k+","Schools"],["9.8k+","Placed"]].map(([n,l],i) => (
                    <div key={l} style={{ padding:"16px 0", textAlign:"center", borderRight: i<2?"1px solid #E5E7EB":"none" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"#1A56DB", fontFamily:"Playfair Display,serif" }}>{n}</div>
                      <div style={{ fontSize:11, color:"#6B7280", fontWeight:600, marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div> */}
              </div>

              {/* Feature pills below card */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:16 }}>
                {[
                  { icon:"🎯", t:"Smart Matching",    bg:"#EBF5FF", border:"#BFDBFE", color:"#1E429F" },
                  { icon:"🔐", t:"Verified Profiles", bg:"#ECFDF5", border:"#A7F3D0", color:"#065F46" },
                  { icon:"⚡", t:"Instant Alerts",    bg:"#FFFBEB", border:"#FDE68A", color:"#92400E" },
                  { icon:"📊", t:"Live Dashboard",    bg:"#F5F3FF", border:"#DDD6FE", color:"#4C1D95" },
                ].map(f => (
                  <div key={f.t} style={{ background:f.bg, border:`1px solid ${f.border}`, borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"transform .18s, box-shadow .18s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                    <span style={{ fontSize:18 }}>{f.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:f.color }}>{f.t}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ALL JOBS SECTION */}
      <section style={{ background:"#F9FAFB", borderTop:"1px solid #E5E7EB", padding:"72px 0" }}>
        <div className="container">
          {/* Section header */}
          <div className="flexb" style={{ marginBottom:36, flexWrap:"wrap", gap:16 }}>
            <div>
              <div className="sec-eye">All Positions</div>
              <h2 className="sec-title" style={{ marginBottom:6 }}>Browse All Teaching Jobs</h2>
              <p style={{ color:"#6B7280", fontSize:15 }}>
                {MOCK_JOBS.length} verified positions across India — updated daily
              </p>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700 }}>🟢 {MOCK_JOBS.length} Active Jobs</span>
              <button className="btn btn-primary" onClick={() => setPage("jobs")}>View All & Filter →</button>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display:"flex", gap:8, marginBottom:32, flexWrap:"wrap" }}>
            {["All","Full-Time","Part-Time","Home Tuition"].map((t,i) => (
              <span key={t} style={{ padding:"6px 16px", borderRadius:20, fontSize:13, fontWeight:700, cursor:"pointer", background: i===0 ? "#1A56DB" : "#fff", color: i===0 ? "#fff" : "#374151", border: i===0 ? "none" : "1px solid #D1D5DB", boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>{t}</span>
            ))}
          </div>

          {/* Jobs grid — all 9 */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {MOCK_JOBS.map((job, i) => (
              <div key={job.id} onClick={() => setPage("jobs")} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, padding:"20px", cursor:"pointer", transition:"all .2s", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(26,86,219,.12)"; e.currentTarget.style.borderColor="#93C5FD"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)"; e.currentTarget.style.borderColor="#E5E7EB"; }}>
                {/* Card top row */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ width:46, height:46, background:"linear-gradient(135deg,#EBF5FF,#E0F2FE)", border:"1px solid #BFDBFE", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{job.logo}</div>
                  <span style={{ background: job.type==="Full-Time"?"#EBF5FF": job.type==="Part-Time"?"#E0F2FE":"#FFFBEB", color: job.type==="Full-Time"?"#1A56DB": job.type==="Part-Time"?"#0369A1":"#D97706", border:"1px solid "+ (job.type==="Full-Time"?"#BFDBFE": job.type==="Part-Time"?"#BAE6FD":"#FDE68A"), borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>{job.type}</span>
                </div>
                {/* Title & org */}
                <div style={{ fontFamily:"Playfair Display,serif", fontWeight:700, fontSize:15, color:"#111827", marginBottom:3, lineHeight:1.3 }}>{job.title}</div>
                <div style={{ fontSize:12, color:"#1A56DB", fontWeight:600, marginBottom:10 }}>{job.institute}</div>
                {/* Meta pills */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                  <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 8px" }}>📍 {job.location}</span>
                  <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"2px 8px" }}>🎓 {job.experience}</span>
                </div>
                {/* Footer */}
                <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#059669" }}>{job.salary}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:"#9CA3AF" }}>👥 {job.applicants}</span>
                    <span style={{ fontSize:11, color:"#9CA3AF" }}>· {job.posted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign:"center", marginTop:44 }}>
            <div style={{ background:"linear-gradient(135deg,#EBF5FF,#E0F2FE)", border:"1px solid #BFDBFE", borderRadius:16, padding:"32px 40px", display:"inline-block", maxWidth:560 }}>
              <div style={{ fontSize:20, marginBottom:8 }}>🎓</div>
              <h3 style={{ fontSize:20, marginBottom:8 }}>Can't find the right position?</h3>
              <p style={{ color:"#6B7280", fontSize:14, marginBottom:20 }}>Create a free profile and let schools come to you. Over 3,200 institutes are actively hiring on AcadHr.</p>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                <button className="btn btn-primary" onClick={() => setPage("signup")}>Create Free Profile</button>
                <button className="btn btn-outline" onClick={() => setPage("jobs")}>Browse with Filters</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED TEACHERS */}
      <section className="section" style={{ background:"#fff", borderTop:"1px solid #E5E7EB" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>Meet Our Educators</div>
            <h2 className="sec-title">Top Teachers <em style={{ color:"#1A56DB" }}>Available to Hire</em></h2>
            <p style={{ color:"#6B7280", fontSize:15, marginTop:10 }}>Verified, experienced educators ready to join your institution</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
            {[
              { name:"Priya Sharma",   role:"Mathematics Teacher",  exp:"5 Years", city:"Hyderabad", qual:"M.Sc + B.Ed", subjects:["Algebra","Calculus","Statistics"],      emoji:"👩‍🏫", rating:4.9, avail:"Immediate", color:"#EBF5FF", accent:"#1A56DB" },
              { name:"Ravi Kumar",     role:"Physics Teacher",       exp:"3 Years", city:"Bangalore", qual:"M.Sc + B.Ed", subjects:["Mechanics","Optics","Thermodynamics"],  emoji:"👨‍🔬", rating:4.8, avail:"2 Weeks",   color:"#ECFDF5", accent:"#059669" },
              { name:"Ananya Singh",   role:"Chemistry Tutor",       exp:"4 Years", city:"Mumbai",    qual:"B.Sc + B.Ed", subjects:["Organic","Inorganic","Physical"],        emoji:"👩‍🔬", rating:5.0, avail:"Immediate", color:"#FFF7ED", accent:"#C2410C" },
              { name:"Deepak Verma",   role:"English Instructor",    exp:"7 Years", city:"Delhi",     qual:"M.A. + B.Ed", subjects:["Grammar","Literature","Writing"],        emoji:"👨‍🏫", rating:4.7, avail:"1 Month",   color:"#F5F3FF", accent:"#6D28D9" },
              { name:"Sunita Rao",     role:"Biology Teacher",       exp:"6 Years", city:"Chennai",   qual:"M.Sc + B.Ed", subjects:["Botany","Zoology","Genetics"],           emoji:"👩‍🏫", rating:4.9, avail:"Immediate", color:"#ECFDF5", accent:"#059669" },
              { name:"Arun Mehta",     role:"Computer Science",      exp:"5 Years", city:"Pune",      qual:"B.Tech + B.Ed",subjects:["Python","Java","Data Structures"],      emoji:"👨‍💻", rating:4.8, avail:"2 Weeks",   color:"#EFF6FF", accent:"#1D4ED8" },
            ].map((t,i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:18, padding:"24px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", transition:"all .22s", cursor:"pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(26,86,219,.12)"; e.currentTarget.style.borderColor="#BFDBFE"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor="#E5E7EB"; }}>

                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:t.color, border:`1px solid ${t.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{t.emoji}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:"#111827" }}>{t.name}</div>
                      <div style={{ fontSize:12, color:t.accent, fontWeight:600, marginTop:2 }}>{t.role}</div>
                    </div>
                  </div>
                  <div style={{ background:t.color, border:`1px solid ${t.accent}40`, borderRadius:8, padding:"4px 10px" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:t.accent }}>★ {t.rating}</div>
                  </div>
                </div>

                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                  <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"3px 9px" }}>📍 {t.city}</span>
                  <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"3px 9px" }}>🎓 {t.exp}</span>
                  <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:6, padding:"3px 9px" }}>📜 {t.qual}</span>
                </div>

                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                  {t.subjects.map(s => (
                    <span key={s} style={{ fontSize:11, fontWeight:600, color:t.accent, background:t.color, borderRadius:20, padding:"2px 10px", border:`1px solid ${t.accent}30` }}>{s}</span>
                  ))}
                </div>

                <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background: t.avail==="Immediate"?"#059669":"#D97706", display:"inline-block" }} />
                    <span style={{ fontSize:11, color:"#6B7280", fontWeight:600 }}>{t.avail==="Immediate"?"Available Now":`Avail. in ${t.avail}`}</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setPage("signup")}>View Profile</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:40 }}>
            <button className="btn btn-outline btn-lg" onClick={() => setPage("signup")} style={{ fontSize:14 }}>
              Browse All Teachers →
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-strip">
        <div className="container">
          {/* <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
            {[["12,400+","Active Teachers","#1A56DB"],["3,200+","Institutes Hiring","#0EA5E9"],["48,000+","Jobs Placed","#059669"],["94%","Placement Rate","#D97706"]].map(([n,l,c]) => (
              <div key={l} className="stat-item">
                <div className="stat-num" style={{ color:c }}>{n}</div>
                <div className="stat-lbl">{l}</div>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* FOR WHOM */}
      <section className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>Who Is It For</div>
            <h2 className="sec-title">Designed for Every Education Professional</h2>
          </div>
          <div className="grid2">
            <div className="card" style={{ padding:42, borderTop:"4px solid #1A56DB" }}>
              <div style={{ fontSize:48, marginBottom:18 }}>👩‍🏫</div>
              <h2 style={{ fontSize:26, marginBottom:10 }}>Are You a Teacher?</h2>
              <p style={{ color:"#6B7280", lineHeight:1.8, marginBottom:26, fontSize:15 }}>Build your verified profile, showcase qualifications, and apply to hundreds of teaching positions across India. Free for all educators.</p>
              <ul style={{ listStyle:"none", marginBottom:30 }}>
                {["Free profile — always","Apply to unlimited jobs","Get discovered by top schools","Track all applications live"].map(f => (
                  <li key={f} style={{ color:"#374151", padding:"7px 0", fontSize:14, borderBottom:"1px solid #F3F4F6", display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ color:"#1A56DB", fontWeight:800, fontSize:16 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")}>Join as Educator →</button>
            </div>
            <div className="card" style={{ padding:42, borderTop:"4px solid #0EA5E9" }}>
              <div style={{ fontSize:48, marginBottom:18 }}>🏫</div>
              <h2 style={{ fontSize:26, marginBottom:10 }}>Hiring for Your Institute?</h2>
              <p style={{ color:"#6B7280", lineHeight:1.8, marginBottom:26, fontSize:15 }}>Post vacancies, review vetted applications, and find the perfect educators for your school, college, or coaching institute.</p>
              <ul style={{ listStyle:"none", marginBottom:30 }}>
                {["Post unlimited vacancies","Access verified teacher profiles","Manage all applications","Moderated and trusted listings"].map(f => (
                  <li key={f} style={{ color:"#374151", padding:"7px 0", fontSize:14, borderBottom:"1px solid #F3F4F6", display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ color:"#0EA5E9", fontWeight:800, fontSize:16 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className="btn btn-sky btn-lg" onClick={() => setPage("signup")}>Register Institute →</button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>Process</div>
            <h2 className="sec-title">How <em style={{ color:"#1A56DB" }}>AcadHr</em> Works</h2>
            <p className="sec-sub" style={{ margin:"0 auto" }}>A streamlined hiring process built for education professionals.</p>
          </div>
          <div className="grid2">
            {HOW.map(h => (
              <div key={h.who} className="card" style={{ padding:36 }}>
                <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:24 }}>
                  <div style={{ width:56, height:56, borderRadius:14, background:"#EBF5FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{h.icon}</div>
                  <div>
                    <div style={{ fontSize:11, color:"#1A56DB", fontWeight:800, textTransform:"uppercase", letterSpacing:2 }}>Step {h.step}</div>
                    <h3 style={{ fontSize:20, marginTop:2 }}>For {h.who}</h3>
                  </div>
                </div>
                <ol style={{ paddingLeft:20 }}>
                  {h.items.map((item,i) => (
                    <li key={i} style={{ color:"#374151", padding:"8px 0", fontSize:14, borderBottom:i < h.items.length - 1 ? "1px solid #F3F4F6" : "none" }}>{item}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>Platform Features</div>
            <h2 className="sec-title">Built for the Education Sector</h2>
          </div>
          <div className="grid3">
            {FEATURES.map((f,i) => (
              <div key={i} className="card card-hover" style={{ padding:26 }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{f.i}</div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:10, color:"#111827" }}>{f.t}</h3>
                <p style={{ color:"#6B7280", lineHeight:1.8, fontSize:13 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST JOBS */}
      <section className="section" style={{ background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
        <div className="container">
          <div className="flexb" style={{ marginBottom:38 }}>
            <div>
              <div className="sec-eye">Latest Openings</div>
              <h2 className="sec-title" style={{ marginBottom:0 }}>Fresh Teaching Positions</h2>
            </div>
            <button className="btn btn-outline" onClick={() => setPage("jobs")}>View All Positions →</button>
          </div>
          <div className="grid3">
            {MOCK_JOBS.slice(0,3).map(j => <JobCard key={j.id} job={j} onApply={() => setPage("jobs")} />)}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>Success Stories</div>
            <h2 className="sec-title">Trusted by Educators <em style={{ color:"#1A56DB" }}>Across India</em></h2>
          </div>
          <div className="grid3">
            {TESTIMONIALS.map((t,i) => (
              <div key={i} className="card card-hover" style={{ padding:28 }}>
                <div style={{ color:"#D97706", fontSize:16, marginBottom:10, letterSpacing:3 }}>★★★★★</div>
                <p style={{ color:"#374151", lineHeight:1.85, marginBottom:22, fontStyle:"italic", fontSize:14 }}>"{t.t}"</p>
                <Divider />
                <div style={{ display:"flex", gap:14, alignItems:"center", marginTop:16 }}>
                  <div style={{ fontSize:40 }}>{t.a}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#111827" }}>{t.n}</div>
                    <div style={{ fontSize:12, color:"#1A56DB", fontWeight:600 }}>{t.r}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF" }}>{t.s}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background:"#1E429F" }}>
        <div className="container" style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,50px)", marginBottom:14, color:"#fff" }}>Begin Your Journey with <em style={{ color:"#93C5FD" }}>AcadHr</em></h2>
          <p style={{ color:"#BFDBFE", fontSize:17, marginBottom:40, maxWidth:460, margin:"0 auto 40px" }}>Join 15,000+ teachers and 3,000+ institutions already on the platform.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn btn-lg" style={{ background:"#fff", color:"#1E429F", fontWeight:800 }} onClick={() => setPage("signup")}>Create Free Account</button>
            <button className="btn btn-lg" style={{ background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,.5)" }} onClick={() => setPage("jobs")}>Browse Positions</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="flexb" style={{ flexWrap:"wrap", gap:20 }}>
            <div>
              <Brand size={22} />
              <p style={{ color:"#6B7280", fontSize:13, marginTop:6 }}>India's Premier Education Hiring Platform</p>
            </div>
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              {["Privacy Policy","Terms of Service","Contact Us","About"].map(l => (
                <span key={l} style={{ fontSize:13, color:"#6B7280", cursor:"pointer" }}>{l}</span>
              ))}
            </div>
          </div>
          <Divider />
          <p style={{ color:"#9CA3AF", fontSize:12, textAlign:"center" }}>© 2025 AcadHr. All rights reserved. Made with ❤️ in Hyderabad, India.</p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOBS PAGE
════════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS PAGE
════════════════════════════════════════════════════════════════════════════ */

export default HomePage;
