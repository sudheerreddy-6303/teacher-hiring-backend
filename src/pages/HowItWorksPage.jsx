import { useState } from "react";
import { Divider, Brand, Navbar } from "../components/common/Shared";

function HowItWorksPage({ setPage }) {
  const TEACHER_STEPS = [
    { step:"01", icon:"📝", title:"Create Your Free Profile",    desc:"Sign up as a Teacher or Tutor. Add your name, subject specialisation, qualifications, city, and a short bio. It takes under 3 minutes." },
    { step:"02", icon:"🔍", title:"Browse Verified Job Listings", desc:"Explore hundreds of verified openings from CBSE, ICSE, and state-board schools across India. Filter by subject, city, job type, and salary." },
    { step:"03", icon:"📤", title:"Apply in One Click",           desc:"Found the right role? Hit Apply. Your profile is instantly shared with the hiring school — no resume uploads, no lengthy forms." },
    { step:"04", icon:"🔔", title:"Get Notified in Real Time",    desc:"Receive instant alerts when a school views your profile, shortlists you, or sends a message. Never miss an opportunity." },
    { step:"05", icon:"🤝", title:"Get Hired & Start Teaching",   desc:"Once selected, coordinate directly with the school. Accept the offer from your dashboard and begin your new teaching journey." },
  ];
  const SCHOOL_STEPS = [
    { step:"01", icon:"🏫", title:"Register Your Institution",    desc:"Create a verified school or institute account. Add details like board type, city, website, and a brief about your institution." },
    { step:"02", icon:"✍️", title:"Post a Vacancy",               desc:"Describe the role — subject, experience required, salary range, job type. Our team reviews and publishes your listing within 24 hours." },
    { step:"03", icon:"📥", title:"Receive Qualified Applications",desc:"Verified, pre-screened teacher profiles land directly in your dashboard. Browse applicants, read bios, and check qualifications." },
    { step:"04", icon:"⭐", title:"Shortlist & Interview",         desc:"Mark candidates as shortlisted or rejected with one click. Reach out directly to schedule interviews from within the platform." },
    { step:"05", icon:"✅", title:"Hire with Confidence",          desc:"Select your ideal candidate, extend an offer, and track their onboarding — all from your AcadHr school dashboard." },
  ];
  const FAQS = [
    { q:"Is AcadHr free for teachers?",            a:"Yes — completely free. Teachers and tutors can create profiles, browse jobs, and apply with no charges ever." },
    { q:"How are schools verified?",               a:"Every institution goes through a manual review by our team before listings are published. We check registration details and contact information." },
    { q:"How long does hiring take?",              a:"Most teachers receive a response within 3–7 days of applying. Schools can shortlist and contact you directly from the platform." },
    { q:"Can tutors find private students?",       a:"Yes. Tutors have a separate portal to list availability, subjects, and hourly rates so students and parents can find and request sessions." },
    { q:"Is there a mobile app?",                  a:"Our platform is fully mobile-responsive. A dedicated app is on our roadmap — stay tuned!" },
    { q:"What subjects and cities are covered?",   a:"We cover all major school subjects and 50+ cities across India, from metros like Hyderabad and Mumbai to tier-2 cities." },
  ];
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ paddingTop:90 }}>
      <Navbar setPage={setPage} />

      {/* ── Hero banner ── */}
      <section style={{ background:"linear-gradient(135deg,#1E429F 0%,#1A56DB 100%)", padding:"72px 0 80px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", zIndex:1, textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", borderRadius:30, padding:"6px 18px", marginBottom:24 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff", letterSpacing:.5 }}>SIMPLE · FAST · TRUSTED</span>
          </div>
          <h1 style={{ fontFamily:"Playfair Display,serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, color:"#fff", marginBottom:18, lineHeight:1.1 }}>
            How <em style={{ color:"#93C5FD" }}>AcadHr</em> Works
          </h1>
          <p style={{ fontSize:17, color:"#BFDBFE", maxWidth:560, margin:"0 auto 36px", lineHeight:1.8 }}>
            Whether you're a teacher looking for your next role or a school searching for the perfect educator — AcadHr makes the process simple, transparent, and fast.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn btn-lg" style={{ background:"#fff", color:"#1E429F", fontWeight:800 }} onClick={() => setPage("signup")}>Get Started Free</button>
            <button className="btn btn-lg" style={{ background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,.4)" }} onClick={() => setPage("jobs")}>Browse Jobs</button>
          </div>
        </div>
      </section>

      {/* ── For Teachers ── */}
      <section style={{ padding:"80px 0", background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>For Teachers & Tutors</div>
            <h2 className="sec-title">Land Your Dream <em style={{ color:"#1A56DB" }}>Teaching Role</em></h2>
            <p style={{ color:"#6B7280", fontSize:15, marginTop:10, maxWidth:520, margin:"10px auto 0" }}>5 simple steps from sign-up to your first day of class</p>
          </div>
          <div style={{ position:"relative" }}>
            {/* Connector line */}
            <div style={{ position:"absolute", left:"calc(50% - 1px)", top:40, bottom:40, width:2, background:"linear-gradient(#BFDBFE,#E0F2FE)", zIndex:0, display:"none" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {TEACHER_STEPS.map((s, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns: i%2===0 ? "1fr 80px 1fr" : "1fr 80px 1fr", gap:0, alignItems:"center", marginBottom:24 }}>
                  {/* Left content (even) or empty (odd) */}
                  <div style={{ padding:"0 32px 0 0", textAlign:"right", visibility: i%2===0 ? "visible":"hidden" }}>
                    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:18, padding:"24px 28px", boxShadow:"0 4px 16px rgba(26,86,219,.08)", display:"inline-block", textAlign:"left", maxWidth:380 }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
                      <div style={{ fontWeight:800, fontSize:16, color:"#111827", marginBottom:8 }}>{s.title}</div>
                      <div style={{ fontSize:14, color:"#6B7280", lineHeight:1.7 }}>{s.desc}</div>
                    </div>
                  </div>
                  {/* Centre step bubble */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", zIndex:1 }}>
                    <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#1E429F,#1A56DB)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, fontFamily:"Playfair Display,serif", boxShadow:"0 4px 14px rgba(26,86,219,.35)" }}>{s.step}</div>
                    {i < TEACHER_STEPS.length-1 && <div style={{ width:2, height:36, background:"#BFDBFE", marginTop:4 }} />}
                  </div>
                  {/* Right content (odd) or empty (even) */}
                  <div style={{ padding:"0 0 0 32px", visibility: i%2===1 ? "visible":"hidden" }}>
                    <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:18, padding:"24px 28px", boxShadow:"0 4px 16px rgba(26,86,219,.08)", display:"inline-block", maxWidth:380 }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
                      <div style={{ fontWeight:800, fontSize:16, color:"#111827", marginBottom:8 }}>{s.title}</div>
                      <div style={{ fontSize:14, color:"#6B7280", lineHeight:1.7 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:"center", marginTop:32 }}>
            <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")}>Join as Teacher / Tutor →</button>
          </div>
        </div>
      </section>

      {/* ── For Schools ── */}
      <section style={{ padding:"80px 0", background:"#F9FAFB", borderTop:"1px solid #E5E7EB" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>For Schools & Institutes</div>
            <h2 className="sec-title">Hire the <em style={{ color:"#1A56DB" }}>Right Teacher</em> Fast</h2>
            <p style={{ color:"#6B7280", fontSize:15, marginTop:10, maxWidth:520, margin:"10px auto 0" }}>Post, review, and hire quality educators in 5 easy steps</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16 }}>
            {SCHOOL_STEPS.map((s,i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:"24px 18px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", textAlign:"center", position:"relative" }}>
                {i < SCHOOL_STEPS.length-1 && (
                  <div style={{ position:"absolute", right:-16, top:"50%", transform:"translateY(-50%)", fontSize:20, color:"#BFDBFE", zIndex:1 }}>›</div>
                )}
                <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#EBF5FF,#E0F2FE)", border:"1px solid #BFDBFE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 14px" }}>{s.icon}</div>
                <div style={{ width:26, height:26, borderRadius:"50%", background:"#1A56DB", color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>{i+1}</div>
                <div style={{ fontWeight:800, fontSize:14, color:"#111827", marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:40 }}>
            <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")}>Register Your School →</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:"80px 0", background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div className="sec-eye" style={{ justifyContent:"center" }}>FAQs</div>
            <h2 className="sec-title">Common <em style={{ color:"#1A56DB" }}>Questions</em></h2>
          </div>
          <div style={{ maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:12 }}>
            {FAQS.map((f,i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid " + (openFaq===i?"#BFDBFE":"#E5E7EB"), borderRadius:14, overflow:"hidden", boxShadow: openFaq===i?"0 4px 16px rgba(26,86,219,.08)":"none", transition:"all .2s" }}>
                <div onClick={() => setOpenFaq(openFaq===i ? null : i)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", cursor:"pointer" }}>
                  <span style={{ fontWeight:700, fontSize:15, color:"#111827" }}>{f.q}</span>
                  <span style={{ fontSize:20, color:"#1A56DB", fontWeight:800, transition:"transform .2s", transform: openFaq===i?"rotate(45deg)":"none" }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding:"0 22px 18px", fontSize:14, color:"#4B5563", lineHeight:1.75, borderTop:"1px solid #EBF5FF" }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background:"#1E429F", padding:"72px 0" }}>
        <div className="container" style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", color:"#fff", marginBottom:14 }}>Ready to Get Started?</h2>
          <p style={{ color:"#BFDBFE", fontSize:16, marginBottom:36, maxWidth:460, margin:"0 auto 36px" }}>Join 15,000+ teachers and 3,000+ institutions already on AcadHr.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn btn-lg" style={{ background:"#fff", color:"#1E429F", fontWeight:800 }} onClick={() => setPage("signup")}>Create Free Account</button>
            <button className="btn btn-lg" style={{ background:"transparent", color:"#fff", border:"2px solid rgba(255,255,255,.4)" }} onClick={() => setPage("jobs")}>Browse Jobs</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="flexb" style={{ flexWrap:"wrap", gap:20 }}>
            <div>
              <Brand size={22} onClick={() => setPage("home")} />
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

export default HowItWorksPage;
