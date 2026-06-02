import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MOCK_JOBS, SUBS } from "../../constants";
import { Toast, Spinner, JobCard, OtpBoxes, InlineBrowseJobs, FilterBar } from "../../components/common/Shared";
import './Auth.css';

function AuthPage({ mode, setPage }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"teacher", phone:"", city:"", subject:"", experience:"", qualification:"", bio:"", institute_type:"", est_year:"", student_count:"", website:"", hourly_rate:"", teaching_mode:"Both" });
  const [step, setStep]           = useState(1);
  const [err,  setErr]            = useState("");
  const [loading, setLoading]     = useState(false);

  // OTP state
  const [otpInput,    setOtpInput]    = useState(["","","","","",""]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpErr,      setOtpErr]      = useState("");
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent,     setOtpSent]     = useState(false);

  // Login OTP state (separate from signup OTP)
  const [loginStep,      setLoginStep]      = useState(1); // 1=credentials, 2=otp
  const [loginOtpInput,  setLoginOtpInput]  = useState(["","","","","",""]);
  const [loginOtpErr,    setLoginOtpErr]    = useState("");
  const [loginOtpLoading,setLoginOtpLoading]= useState(false);
  const [loginResendTimer,setLoginResendTimer] = useState(0);

  const [roleSelected, setRoleSelected] = useState(false);

  function up(k, v) { setForm(f => ({...f, [k]:v})); }

  // ── Resend countdown ────────────────────────────────────────────────────────
  function startResendTimer(setter) {
    setter(30);
    const t = setInterval(() => setter(s => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
  }

  // ── OTP input helpers (shared) ──────────────────────────────────────────────
  function handleOtpChange(val, idx, setter, arr) {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr]; next[idx] = val; setter(next);
    // Use setTimeout so DOM update completes before we shift focus
    if (val && idx < 5) {
      setTimeout(() => document.getElementById(`otp-${mode}-${idx+1}`)?.focus(), 0);
    }
  }
  function handleOtpKeyDown(e, idx, setter, arr) {
    if (e.key === "Backspace" && !arr[idx] && idx > 0) {
      setTimeout(() => document.getElementById(`otp-${mode}-${idx-1}`)?.focus(), 0);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN FLOW
  // ════════════════════════════════════════════════════════════════════════════
  async function handleSendLoginOtp(e) {
    e.preventDefault(); setErr(""); setLoginOtpLoading(true);
    try {
      const res = await import('../../api.js').then(m => m.authAPI.sendLoginOtp(form.email, form.password));
      setLoginStep(2);
      if (res.dev) setErr("⚠️ Dev mode: OTP is printed in the server console (no email configured).");
      startResendTimer(setLoginResendTimer);
    } catch (ex) { setErr(ex.message); }
    finally { setLoginOtpLoading(false); }
  }

  async function handleVerifyLoginOtp() {
    const otp = loginOtpInput.join("");
    if (otp.length < 6) { setLoginOtpErr("Please enter all 6 digits."); return; }
    setLoginOtpLoading(true); setLoginOtpErr("");
    try {
      const data = await import('../../api.js').then(m => m.authAPI.verifyLoginOtp(form.email, otp));
      login(data.user, data.token);
      setPage("dashboard");
    } catch (ex) {
      setLoginOtpErr(ex.message);
      setLoginOtpInput(["","","","","",""]);
      document.getElementById(`otp-login-0`)?.focus();
    } finally { setLoginOtpLoading(false); }
  }

  async function handleResendLoginOtp() {
    try {
      await import('../../api.js').then(m => m.authAPI.resendOtp(form.email, form.name || "", "login"));
      setLoginOtpInput(["","","","","",""]);
      setLoginOtpErr("");
      startResendTimer(setLoginResendTimer);
    } catch (ex) { setLoginOtpErr(ex.message); }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SIGNUP FLOW
  // ════════════════════════════════════════════════════════════════════════════
  async function handleSignupNext(e) {
    e.preventDefault(); setErr("");
    if (step === 1) {
      // Validate mandatory phone
      if (!form.phone.trim()) { setErr("Phone number is required."); return; }
      if (!form.email.trim()) { setErr("Email address is required."); return; }
      setStep(2); return;
    }
    if (step === 2) {
      // Validate parent-specific required fields
      if (form.role === "parent") {
        if (!form.student_name.trim()) { setErr("Please enter your child's name."); return; }
        if (!form.student_class)       { setErr("Please select your child's class."); return; }
        if (!form.subject_pref.trim()) { setErr("Please enter the subject(s) required."); return; }
      }
      // Send OTP to email
      setOtpLoading(true);
      try {
        const otpRes = await import('../../api.js').then(m => m.authAPI.sendSignupOtp(form.name, form.email, form.role));
        setOtpSent(true);
        setStep(3);
        startResendTimer(setResendTimer);
        if (otpRes.dev) setErr("⚠️ Dev mode: OTP is printed in the server console (no email configured).");
      } catch (ex) { setErr(ex.message); }
      finally { setOtpLoading(false); }
      return;
    }
  }

  async function handleVerifySignupOtp() {
    const otp = otpInput.join("");
    if (otp.length < 6) { setOtpErr("Please enter all 6 digits."); return; }
    setOtpLoading(true); setOtpErr("");
    try {
      // Just verify on backend by including OTP in signup call
      // First check OTP is correct by trying signup
      const payload = {
        ...form, otp,
        // parent fields mapping
        student_name:      form.student_name,
        student_class:     form.student_class,
        board:             form.board_pref,
        subject:           form.subject_pref,
        location:          form.location_pref,
        mode:              form.mode_pref,
        preferred_time:    form.preferred_time,
        budget:            form.budget,
        tutor_gender_pref: form.tutor_gender_pref,
        experience_req:    form.experience_req,
        notes:             form.lead_notes,
      };
      const data = await import('../../api.js').then(m => m.authAPI.signup(payload));
      login(data.user, data.token);
      setPage("dashboard");
    } catch (ex) {
      setOtpErr(ex.message);
      setOtpInput(["","","","","",""]);
      document.getElementById(`otp-signup-0`)?.focus();
    } finally { setOtpLoading(false); }
  }

  async function handleResendSignupOtp() {
    try {
      await import('../../api.js').then(m => m.authAPI.resendOtp(form.email, form.name, "signup"));
      setOtpInput(["","","","","",""]);
      setOtpErr("");
      startResendTimer(setResendTimer);
    } catch (ex) { setOtpErr(ex.message); }
  }

  const SUBS   = ["Mathematics","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science","Economics","Commerce","Physical Education","Sanskrit"];
  const EXPS   = ["Fresher (0-1 year)","1-3 years","3-5 years","5-10 years","10+ years"];
  const QUALS  = ["B.Ed","M.Ed","M.Sc + B.Ed","B.Tech + B.Ed","M.Tech + B.Ed","PhD","Diploma in Education"];
  const ITYPES = ["School (CBSE)","School (ICSE)","School (State Board)","Junior College","Degree College","Coaching Institute","Tuition Centre","Online Platform"];
  const stepLabels = ["Your Info","Details","Verify Email"];



  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>

      {/* ── Left panel ── */}
      <div style={{ flex:"0 0 420px", background:"linear-gradient(160deg,#1E429F 0%,#1A56DB 100%)", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 52px" }}>
        <div className="brand" style={{ cursor:"pointer", background:"#fff", display:"inline-block", padding:"10px 18px", borderRadius:12 }} onClick={() => setPage("home")}>
          <img src="/acadhr-logo.png" alt="AcadHr" style={{ height:64, objectFit:"contain", display:"block" }} />
        </div>
        <h2 style={{ fontSize:30, marginTop:30, marginBottom:12, color:"#fff" }}>{mode==="login" ? "Welcome back." : "Join AcadHr."}</h2>
        <p style={{ color:"#BFDBFE", lineHeight:1.85, fontSize:15, maxWidth:320 }}>
          {mode==="login" ? "Sign in to access your dashboard and continue your career journey." : "Create your free account and connect with India's best schools and educators."}
        </p>
        <div style={{ marginTop:40 }}>
          {[["🏫","3,200+ verified institutes"],["👩‍🏫","12,400+ active educators"],["✅","Moderated and trusted platform"],["🔒","Email-verified accounts only"]].map(([i,t]) => (
            <div key={t} style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14, color:"#BFDBFE", fontSize:14 }}>
              <span style={{ fontSize:18 }}>{i}</span>{t}
            </div>
          ))}
        </div>
        {mode==="login" && (
          <div style={{ marginTop:40, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)", borderRadius:12, padding:18, fontSize:12, color:"#BFDBFE", lineHeight:2 }}>
            <div style={{ fontWeight:800, marginBottom:5, color:"#fff", fontSize:13 }}>Demo Accounts</div>
            {[["admin@acadhr.com","admin123"],["teacher@test.com","test123"],["tutor@test.com","test123"],["school@test.com","test123"]].map(([e,p]) => (
              <div key={e}><span style={{ fontFamily:"Fira Code,monospace", color:"#93C5FD", fontWeight:500 }}>{e}</span> / {p}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 52px", background:"#F9FAFB", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:16, padding:36, boxShadow:"var(--shadow)" }}>

          {/* Back button */}
          <button
            onClick={() => {
              if (mode==="login" && loginStep===2) { setLoginStep(1); return; }
              if (mode==="signup" && step>1) { setStep(s => s-1); setErr(""); return; }
              if (mode==="signup" && step===1 && roleSelected) { setRoleSelected(false); setErr(""); return; }
              setPage("home");
            }}
            style={{ display:"inline-flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"#6B7280", fontSize:13, fontWeight:600, marginBottom:18, padding:0 }}
            onMouseEnter={e => e.currentTarget.style.color="#1A56DB"}
            onMouseLeave={e => e.currentTarget.style.color="#6B7280"}
          >
            <span style={{ fontSize:16 }}>←</span>
            {mode==="login" && loginStep===2 ? "Back to credentials" :
             mode==="signup" && step===2 ? "Back to basic info" :
             mode==="signup" && step===3 ? "Back to details" :
             mode==="signup" && roleSelected ? "Back to role selection" :
             "Back to Home"}
          </button>

          {/* Header */}
          {!(mode==="signup" && !roleSelected) && (
            <h3 style={{ fontSize:22, marginBottom:4, color:"#111827" }}>
              {mode==="login"
                ? (loginStep===1 ? "Sign In" : "Enter Verification Code")
                : (step===1 ? "Create Your Account" : step===2 ? "Professional Details" : "Verify Your Email")}
            </h3>
          )}
          {mode==="signup" && !roleSelected && (
            <h3 style={{ fontSize:22, marginBottom:4, color:"#111827" }}>Join AcadHr</h3>
          )}
          {!(mode==="signup" && !roleSelected) && (
            <p style={{ color:"#9CA3AF", marginBottom:20, fontSize:14 }}>
              {mode==="signup" ? `Step ${step} of 3 — ${stepLabels[step-1]}` : loginStep===1 ? "Enter your credentials to continue" : `Code sent to ${form.email}`}
            </p>
          )}

          {/* Progress bar (signup) */}
          {mode==="signup" && roleSelected && (
            <div style={{ display:"flex", gap:6, marginBottom:24 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex:1 }}>
                  <div style={{ height:4, borderRadius:2, background: step>=s?"#1A56DB":"#E5E7EB", transition:"background .3s" }} />
                  <div style={{ fontSize:10, color: step>=s?"#1A56DB":"#9CA3AF", fontWeight:700, marginTop:5, textAlign:"center" }}>{stepLabels[s-1]}</div>
                </div>
              ))}
            </div>
          )}

          {err && <div className={`alert ${err.startsWith('⚠️') ? 'a-warn' : 'a-err'}`}>{err}</div>}

          {/* ════════════════════════════════════════════════════════════════
              LOGIN MODE
          ════════════════════════════════════════════════════════════════ */}
          {mode==="login" && (
            <>
              {loginStep===1 && (
                <form onSubmit={handleSendLoginOtp}>
                  <div className="fg"><label className="flabel">Email Address</label>
                    <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => up("email", e.target.value)} required />
                  </div>
                  <div className="fg"><label className="flabel">Password</label>
                    <input className="input" type="password" placeholder="Enter password" value={form.password} onChange={e => up("password", e.target.value)} required />
                  </div>
                  <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"13px", marginTop:4 }} disabled={loginOtpLoading}>
                    {loginOtpLoading ? <Spinner /> : "Send Verification Code →"}
                  </button>
                </form>
              )}

              {loginStep===2 && (
                <div>
                  <div style={{ background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:12, padding:"14px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:22 }}>📧</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1E429F" }}>Check your inbox</div>
                      <div style={{ fontSize:13, color:"#1A56DB" }}>{form.email}</div>
                      <div style={{ fontSize:12, color:"#6B7280", marginTop:3 }}>Enter the 6-digit code to complete login.</div>
                    </div>
                  </div>

                  <div className="fg">
                    <label className="flabel">6-Digit Verification Code</label>
                    <OtpBoxes arr={loginOtpInput} setter={setLoginOtpInput} prefix="login" disabled={loginOtpLoading} onChangeFn={handleOtpChange} onKeyDownFn={handleOtpKeyDown} />
                  </div>

                  {loginOtpErr && <div className="alert a-err">{loginOtpErr}</div>}

                  <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"13px", marginBottom:12 }}
                    disabled={loginOtpLoading} onClick={handleVerifyLoginOtp}>
                    {loginOtpLoading ? <Spinner /> : "Verify & Sign In ✓"}
                  </button>

                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#9CA3AF" }}>
                    <span style={{ cursor:"pointer", color:"#374151" }} onClick={() => { setLoginStep(1); setLoginOtpInput(["","","","","",""]); setLoginOtpErr(""); }}>
                      ← Use different email
                    </span>
                    {loginResendTimer > 0
                      ? <span>Resend in {loginResendTimer}s</span>
                      : <span style={{ color:"#1A56DB", cursor:"pointer", fontWeight:700 }} onClick={handleResendLoginOtp}>Resend Code</span>
                    }
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SIGNUP MODE
          ════════════════════════════════════════════════════════════════ */}
          {mode==="signup" && !roleSelected && (
            /* ── Role selection screen ── */
            <div>
              <p style={{ color:"#6B7280", fontSize:14, marginBottom:24 }}>Choose how you want to use AcadHr</p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { val:"teacher", icon:"👩‍🏫", label:"Teacher / Faculty",     desc:"Looking for teaching jobs at schools, colleges or coaching institutes",  color:"#1A56DB", bg:"#EBF5FF", border:"#BFDBFE" },
                  { val:"tutor",   icon:"🧑‍🎓", label:"Private Tutor",         desc:"Offering home tuition or online tutoring to students",                   color:"#6D28D9", bg:"#F5F3FF", border:"#DDD6FE" },
                  { val:"school",  icon:"🏫",   label:"School / Institution",  desc:"Hiring teachers, faculty or staff for your school or coaching centre",    color:"#0EA5E9", bg:"#E0F2FE", border:"#BAE6FD" },
                  { val:"parent",  icon:"👨‍👩‍👧", label:"Parent / Guardian",    desc:"Looking for a qualified tutor for your child",                           color:"#059669", bg:"#ECFDF5", border:"#A7F3D0" },
                ].map(r => (
                  <div key={r.val}
                    onClick={() => { up("role", r.val); setRoleSelected(true); setErr(""); }}
                    style={{ display:"flex", alignItems:"center", gap:18, padding:"18px 20px", borderRadius:14, border:`2px solid ${r.border}`, background:r.bg, cursor:"pointer", transition:"all .18s", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.transform="translateX(4px)"; e.currentTarget.style.boxShadow=`0 4px 20px ${r.border}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)"; }}
                  >
                    <div style={{ width:52, height:52, borderRadius:14, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0, boxShadow:`0 2px 8px ${r.border}` }}>
                      {r.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:r.color, marginBottom:3 }}>{r.label}</div>
                      <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{r.desc}</div>
                    </div>
                    <span style={{ color:r.color, fontSize:20, flexShrink:0 }}>→</span>
                  </div>
                ))}
              </div>
              <p style={{ textAlign:"center", marginTop:24, fontSize:13, color:"#9CA3AF" }}>
                Already have an account?{" "}
                <span style={{ color:"#1A56DB", fontWeight:700, cursor:"pointer" }} onClick={() => setPage("login")}>Sign In →</span>
              </p>
            </div>
          )}

          {mode==="signup" && roleSelected && (
            <form onSubmit={handleSignupNext}>

              {/* Selected role badge */}
              {step===1 && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#F0FDF4", border:"1px solid #A7F3D0", borderRadius:10, padding:"10px 14px", marginBottom:18 }}>
                  <span style={{ fontSize:20 }}>
                    {form.role==="teacher"?"👩‍🏫":form.role==="tutor"?"🧑‍🎓":form.role==="school"?"🏫":"👨‍👩‍👧"}
                  </span>
                  <span style={{ fontWeight:700, fontSize:13, color:"#065F46" }}>
                    Registering as: {form.role==="teacher"?"Teacher / Faculty":form.role==="tutor"?"Private Tutor":form.role==="school"?"School / Institution":"Parent / Guardian"}
                  </span>
                  <button type="button" onClick={() => { setRoleSelected(false); setStep(1); }}
                    style={{ marginLeft:"auto", background:"none", border:"none", color:"#059669", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    Change
                  </button>
                </div>
              )}

              {/* Step 1 — Basic info */}
              {step===1 && (
                <>
                  <div className="fg"><label className="flabel">{form.role==="school"?"Institute Name":"Full Name"} *</label>
                    <input className="input" placeholder={form.role==="school"?"e.g. Delhi Public School":form.role==="tutor"?"e.g. Ananya Singh":form.role==="parent"?"e.g. Rajesh Sharma":"e.g. Priya Sharma"} value={form.name} onChange={e => up("name", e.target.value)} required />
                  </div>
                  <div className="fg"><label className="flabel">Email Address *</label>
                    <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => up("email", e.target.value)} required />
                  </div>
                  <div className="grid2">
                    <div className="fg">
                      <label className="flabel">Phone Number *</label>
                      <input className="input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => up("phone", e.target.value)} required pattern="[0-9+\s\-]{7,15}" title="Enter a valid phone number" />
                    </div>
                    <div className="fg"><label className="flabel">City</label><input className="input" placeholder="Hyderabad" value={form.city} onChange={e => up("city", e.target.value)} /></div>
                  </div>
                  <div className="fg"><label className="flabel">Password *</label>
                    <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => up("password", e.target.value)} required minLength={8} />
                  </div>
                </>
              )}

              {/* Step 2 — Professional details */}
              {step===2 && (form.role==="teacher" || form.role==="tutor") && (
                <>
                  <div className="fg"><label className="flabel">Subject Specialization</label>
                    <select className="input" value={form.subject} onChange={e => up("subject", e.target.value)} required>
                      <option value="">Select subject</option>{SUBS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Experience</label>
                      <select className="input" value={form.experience} onChange={e => up("experience", e.target.value)}>{EXPS.map(s => <option key={s}>{s}</option>)}</select>
                    </div>
                    <div className="fg"><label className="flabel">Qualification</label>
                      <select className="input" value={form.qualification} onChange={e => up("qualification", e.target.value)}>{QUALS.map(s => <option key={s}>{s}</option>)}</select>
                    </div>
                  </div>
                  {form.role==="tutor" && (
                    <div className="grid2">
                      <div className="fg"><label className="flabel">Hourly Rate</label><input className="input" placeholder="e.g. ₹800/hr" value={form.hourly_rate} onChange={e => up("hourly_rate", e.target.value)} /></div>
                      <div className="fg"><label className="flabel">Teaching Mode</label>
                        <select className="input" value={form.teaching_mode} onChange={e => up("teaching_mode", e.target.value)}>
                          <option>Online</option><option>Offline</option><option>Both</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="fg"><label className="flabel">Short Bio (Optional)</label>
                    <textarea className="input" rows={3} placeholder="Tell schools about yourself..." value={form.bio} onChange={e => up("bio", e.target.value)} />
                  </div>
                </>
              )}
              {step===2 && form.role==="school" && (
                <>
                  <div className="fg"><label className="flabel">Institute Type</label>
                    <select className="input" value={form.institute_type} onChange={e => up("institute_type", e.target.value)}>{ITYPES.map(s => <option key={s}>{s}</option>)}</select>
                  </div>
                  <div className="grid2">
                    <div className="fg"><label className="flabel">Est. Year</label><input className="input" type="number" placeholder="e.g. 1995" value={form.est_year} onChange={e => up("est_year", e.target.value)} /></div>
                    <div className="fg"><label className="flabel">No. of Students</label>
                      <select className="input" value={form.student_count} onChange={e => up("student_count", e.target.value)}>
                        <option>Under 500</option><option>500-1,000</option><option>1,000-3,000</option><option>3,000+</option>
                      </select>
                    </div>
                  </div>
                  <div className="fg"><label className="flabel">Website (Optional)</label><input className="input" placeholder="https://yourschool.edu.in" value={form.website} onChange={e => up("website", e.target.value)} /></div>
                </>
              )}

              {step===2 && form.role==="parent" && (
                <>
                  <div style={{ background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#1E429F", fontWeight:600 }}>
                    👨‍👩‍👧 Tell us about your child & tutor requirement
                  </div>

                  <div className="grid2">
                    <div className="fg"><label className="flabel">Student Name *</label>
                      <input className="input" placeholder="Child's full name" value={form.student_name} onChange={e => up("student_name",e.target.value)} required />
                    </div>
                    <div className="fg"><label className="flabel">Class / Grade *</label>
                      <select className="input" value={form.student_class} onChange={e => up("student_class",e.target.value)} required>
                        <option value="">Select class</option>
                        {["Pre-Primary (Nursery–KG)","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5",
                          "Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","Degree"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="fg"><label className="flabel">Board</label>
                      <select className="input" value={form.board_pref} onChange={e => up("board_pref",e.target.value)}>
                        <option value="">Select board</option>
                        <option>CBSE</option><option>ICSE</option><option>State Board (AP)</option>
                        <option>State Board (TS)</option><option>IB</option><option>IGCSE</option>
                      </select>
                    </div>
                    <div className="fg"><label className="flabel">Subject(s) Required *</label>
                      <input className="input" placeholder="e.g. Mathematics, Physics" value={form.subject_pref} onChange={e => up("subject_pref",e.target.value)} required />
                    </div>
                  </div>

                  <div className="fg"><label className="flabel">Location / Area</label>
                    <input className="input" placeholder="e.g. Banjara Hills, Hyderabad" value={form.location_pref} onChange={e => up("location_pref",e.target.value)} />
                  </div>

                  <div className="fg"><label className="flabel">Tutoring Mode</label>
                    <div style={{ display:"flex", gap:10, marginTop:6 }}>
                      {["Home","Online","Either"].map(m => (
                        <label key={m} onClick={() => up("mode_pref",m)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"9px 0", borderRadius:10, border:`2px solid ${form.mode_pref===m?"#1A56DB":"#E5E7EB"}`, background:form.mode_pref===m?"#EBF5FF":"#F9FAFB", cursor:"pointer", fontSize:13, fontWeight:700, color:form.mode_pref===m?"#1A56DB":"#6B7280", userSelect:"none" }}>
                          {m==="Home"?"🏠":m==="Online"?"💻":"🔄"} {m}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="fg"><label className="flabel">Preferred Time</label>
                      <select className="input" value={form.preferred_time} onChange={e => up("preferred_time",e.target.value)}>
                        <option value="">Select</option>
                        <option>Morning (6am–12pm)</option><option>Afternoon (12pm–4pm)</option>
                        <option>Evening (4pm–8pm)</option><option>Flexible</option>
                      </select>
                    </div>
                    <div className="fg"><label className="flabel">Monthly Budget (₹)</label>
                      <select className="input" value={form.budget} onChange={e => up("budget",e.target.value)}>
                        <option value="">Select range</option>
                        <option>Under ₹2,000</option><option>₹2,000–₹4,000</option>
                        <option>₹4,000–₹6,000</option><option>₹6,000–₹10,000</option>
                        <option>Above ₹10,000</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid2">
                    <div className="fg"><label className="flabel">Tutor Gender Preference</label>
                      <select className="input" value={form.tutor_gender_pref} onChange={e => up("tutor_gender_pref",e.target.value)}>
                        <option value="">No Preference</option>
                        <option>Male</option><option>Female</option>
                      </select>
                    </div>
                    <div className="fg"><label className="flabel">Experience Required</label>
                      <select className="input" value={form.experience_req} onChange={e => up("experience_req",e.target.value)}>
                        <option value="">Any</option>
                        <option>Fresher OK</option><option>1+ Years</option>
                        <option>2+ Years</option><option>3+ Years</option><option>5+ Years</option>
                      </select>
                    </div>
                  </div>

                  <div className="fg"><label className="flabel">Additional Notes</label>
                    <textarea className="input" rows={3} placeholder="Any special requirements or notes..." value={form.lead_notes} onChange={e => up("lead_notes",e.target.value)} />
                  </div>
                </>
              )}

              {/* Step 3 — OTP verification */}
              {step===3 && (
                <div>
                  <div style={{ background:"#EBF5FF", border:"1px solid #BFDBFE", borderRadius:12, padding:"14px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:22 }}>📧</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1E429F" }}>OTP sent to your email</div>
                      <div style={{ fontSize:13, color:"#1A56DB" }}>{form.email}</div>
                      <div style={{ fontSize:12, color:"#6B7280", marginTop:3 }}>Enter the 6-digit code to verify and create your account.</div>
                    </div>
                  </div>

                  <div className="fg">
                    <label className="flabel">6-Digit Verification Code</label>
                    <OtpBoxes arr={otpInput} setter={setOtpInput} prefix="signup" disabled={otpLoading} onChangeFn={handleOtpChange} onKeyDownFn={handleOtpKeyDown} />
                  </div>

                  {otpErr && <div className="alert a-err">{otpErr}</div>}

                  <button type="button" className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"13px", marginBottom:12, background:"#059669" }}
                    disabled={otpLoading} onClick={handleVerifySignupOtp}>
                    {otpLoading ? <Spinner /> : "Verify & Create Account 🎉"}
                  </button>

                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#9CA3AF" }}>
                    <span style={{ cursor:"pointer", color:"#374151" }} onClick={() => { setStep(2); setOtpInput(["","","","","",""]); setOtpErr(""); setOtpSent(false); }}>
                      ← Back
                    </span>
                    {resendTimer > 0
                      ? <span>Resend in {resendTimer}s</span>
                      : <span style={{ color:"#1A56DB", cursor:"pointer", fontWeight:700 }} onClick={handleResendSignupOtp}>Resend OTP</span>
                    }
                  </div>
                </div>
              )}

              {/* Nav buttons (steps 1 & 2) */}
              {step < 3 && (
                <div style={{ display:"flex", gap:10, marginTop:16 }}>
                  {step===2 && <button type="button" className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => { setStep(1); setErr(""); }}>← Back</button>}
                  <button className="btn btn-primary" style={{ flex:2, justifyContent:"center", padding:"13px" }} disabled={otpLoading || loading}>
                    {otpLoading ? <Spinner /> : step===1 ? "Continue →" : "Send OTP & Verify →"}
                  </button>
                </div>
              )}
            </form>
          )}

          <div style={{ textAlign:"center", marginTop:22, color:"#9CA3AF", fontSize:13 }}>
            {mode==="login"
              ? <span>New to AcadHr? <span style={{ color:"#1A56DB", cursor:"pointer", fontWeight:700 }} onClick={() => setPage("signup")}>Create free account</span></span>
              : <span>Already have an account? <span style={{ color:"#1A56DB", cursor:"pointer", fontWeight:700 }} onClick={() => setPage("login")}>Sign in</span></span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
════════════════════════════════════════════════════════════════════════════ */

// ── Reusable FilterBar component ─────────────────────────────────────────────

export default AuthPage;

