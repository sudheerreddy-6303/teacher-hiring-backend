import { useState } from "react";
import { Navbar } from "../components/common/Shared";

const PLANS = {
  school: [
    {
      name:     "Starter",
      price:    "Free",
      period:   "",
      color:    "#6B7280",
      bg:       "#F9FAFB",
      border:   "#E5E7EB",
      badge:    "",
      features: [
        "2 active job postings",
        "50 applicant views/month",
        "Basic candidate profiles",
        "Email support",
        "AcadHr branding",
      ],
      cta: "Get Started Free",
      ctaStyle: { background:"#F3F4F6", color:"#374151", border:"1px solid #D1D5DB" },
    },
    {
      name:     "Professional",
      price:    "₹2,499",
      period:   "/month",
      color:    "#1A56DB",
      bg:       "#EBF5FF",
      border:   "#93C5FD",
      badge:    "Most Popular",
      features: [
        "10 active job postings",
        "Unlimited applicant views",
        "Full candidate profiles + contact",
        "Resume download",
        "Priority listing in search",
        "WhatsApp + email support",
        "Analytics dashboard",
      ],
      cta: "Start Free Trial",
      ctaStyle: { background:"#1A56DB", color:"#fff" },
    },
    {
      name:     "Enterprise",
      price:    "₹7,999",
      period:   "/month",
      color:    "#6D28D9",
      bg:       "#F5F3FF",
      border:   "#C4B5FD",
      badge:    "Best Value",
      features: [
        "Unlimited job postings",
        "Unlimited applicant access",
        "Dedicated account manager",
        "Bulk hiring tools",
        "Campus connect program",
        "API access",
        "Custom branding",
        "SLA support",
      ],
      cta: "Contact Sales",
      ctaStyle: { background:"#6D28D9", color:"#fff" },
    },
  ],
  teacher: [
    {
      name:     "Free",
      price:    "Free",
      period:   "Forever",
      color:    "#6B7280",
      bg:       "#F9FAFB",
      border:   "#E5E7EB",
      badge:    "",
      features: [
        "Basic profile",
        "Apply to 5 jobs/month",
        "View job listings",
        "Email alerts",
      ],
      cta: "Sign Up Free",
      ctaStyle: { background:"#F3F4F6", color:"#374151", border:"1px solid #D1D5DB" },
    },
    {
      name:     "Pro Teacher",
      price:    "₹299",
      period:   "/month",
      color:    "#059669",
      bg:       "#ECFDF5",
      border:   "#6EE7B7",
      badge:    "Recommended",
      features: [
        "Unlimited job applications",
        "Priority profile visibility",
        "Direct contact from schools",
        "Resume builder",
        "Interview tips & resources",
        "Salary insights",
        "Career counselling session",
      ],
      cta: "Go Pro",
      ctaStyle: { background:"#059669", color:"#fff" },
    },
  ],
};

const FAQ = [
  { q:"Can I cancel anytime?",                    a:"Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period." },
  { q:"Is there a free trial?",                   a:"Yes! The Professional plan comes with a 14-day free trial. No credit card required." },
  { q:"How are payments processed?",              a:"We accept all major credit/debit cards and UPI via our secure Razorpay payment gateway." },
  { q:"Can I upgrade or downgrade my plan?",      a:"Absolutely. You can change your plan anytime from your account settings. Upgrades are instant." },
  { q:"Do you offer discounts for annual plans?", a:"Yes! Annual billing gives you 2 months free (saves up to 20%). Contact us for annual pricing." },
];

export default function PricingPage({ setPage }) {
  const [tab, setTab] = useState("school");
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB" }}>
      <Navbar setPage={setPage} />
      <div style={{ paddingTop:90 }}>

        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#111827,#1E3A8A)", padding:"60px 0 50px", textAlign:"center" }}>
          <div className="container">
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.1)", borderRadius:20, padding:"5px 16px", fontSize:13, color:"#93C5FD", fontWeight:600, marginBottom:16 }}>
              💳 Simple, Transparent Pricing
            </div>
            <h1 style={{ fontSize:42, fontWeight:900, color:"#fff", marginBottom:14 }}>Choose Your Plan</h1>
            <p style={{ color:"#9CA3AF", fontSize:16, maxWidth:500, margin:"0 auto 32px" }}>
              Whether you're a school hiring teachers or a teacher looking for opportunities — we have a plan for you
            </p>
            {/* Toggle */}
            <div style={{ display:"inline-flex", background:"rgba(255,255,255,.1)", borderRadius:12, padding:4, gap:4 }}>
              {[["school","🏫 For Schools"],["teacher","👩‍🏫 For Teachers"]].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding:"10px 24px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"Nunito,sans-serif", transition:"all .2s",
                    background: tab===id?"#fff":"transparent",
                    color:      tab===id?"#111827":"#9CA3AF",
                    boxShadow:  tab===id?"0 2px 8px rgba(0,0,0,.15)":"none" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="container" style={{ padding:"48px 0" }}>
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${PLANS[tab].length},1fr)`, gap:24, maxWidth: PLANS[tab].length===2 ? 800 : 1000, margin:"0 auto" }}>
            {PLANS[tab].map(plan => (
              <div key={plan.name}
                style={{ background:"#fff", borderRadius:20, border:`2px solid ${plan.border}`, padding:32, position:"relative", transition:"all .2s",
                  boxShadow: plan.badge ? "0 8px 32px rgba(26,86,219,.15)" : "0 2px 8px rgba(0,0,0,.06)" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; }}>

                {plan.badge && (
                  <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:plan.color, color:"#fff", borderRadius:20, padding:"4px 16px", fontSize:12, fontWeight:800, whiteSpace:"nowrap" }}>
                    ⭐ {plan.badge}
                  </div>
                )}

                <div style={{ background:plan.bg, borderRadius:12, padding:"6px 12px", display:"inline-block", marginBottom:16 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:plan.color, textTransform:"uppercase", letterSpacing:1 }}>{plan.name}</span>
                </div>

                <div style={{ marginBottom:24 }}>
                  <span style={{ fontSize:40, fontWeight:900, color:"#111827" }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize:16, color:"#6B7280", fontWeight:600 }}>{plan.period}</span>}
                </div>

                <ul style={{ listStyle:"none", padding:0, margin:"0 0 28px", display:"flex", flexDirection:"column", gap:10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:14, color:"#374151" }}>
                      <span style={{ color:"#059669", fontWeight:800, flexShrink:0, marginTop:1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button onClick={() => setPage("signup")}
                  style={{ width:"100%", padding:"13px 0", borderRadius:12, border:"none", cursor:"pointer", fontWeight:800, fontSize:15, fontFamily:"Nunito,sans-serif", transition:"all .15s", ...plan.ctaStyle }}>
                  {plan.cta} →
                </button>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display:"flex", justifyContent:"center", gap:32, flexWrap:"wrap", marginTop:48, padding:"28px 0", borderTop:"1px solid #E5E7EB", borderBottom:"1px solid #E5E7EB" }}>
            {["🔒 Secure Payment","📞 24/7 Support","↩️ 14-day Refund","🇮🇳 Made in India"].map(b => (
              <div key={b} style={{ fontSize:14, fontWeight:700, color:"#6B7280" }}>{b}</div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ maxWidth:680, margin:"48px auto 0" }}>
            <h2 style={{ fontSize:26, fontWeight:900, color:"#111827", textAlign:"center", marginBottom:32 }}>Frequently Asked Questions</h2>
            {FAQ.map((item, i) => (
              <div key={i} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, marginBottom:10, overflow:"hidden" }}>
                <div onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", cursor:"pointer", fontWeight:700, fontSize:15, color:"#111827" }}>
                  <span>{item.q}</span>
                  <span style={{ color:"#6B7280", fontSize:18, transition:"transform .2s", transform:openFaq===i?"rotate(180deg)":"none" }}>▾</span>
                </div>
                {openFaq===i && (
                  <div style={{ padding:"0 20px 16px", fontSize:14, color:"#6B7280", lineHeight:1.7, borderTop:"1px solid #F3F4F6" }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div style={{ background:"linear-gradient(135deg,#1E429F,#1A56DB)", borderRadius:20, padding:"40px 36px", marginTop:48, textAlign:"center" }}>
            <h2 style={{ fontSize:26, fontWeight:900, color:"#fff", marginBottom:10 }}>Ready to get started?</h2>
            <p style={{ color:"#93C5FD", fontSize:15, marginBottom:24 }}>Join 12,400+ educators and 3,200+ schools already on AcadHr</p>
            <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={() => setPage("signup")}
                style={{ background:"#fff", color:"#1A56DB", fontWeight:800 }}>
                Start Free Today →
              </button>
              <button onClick={() => setPage("howitworks")}
                style={{ background:"transparent", border:"2px solid rgba(255,255,255,.4)", color:"#fff", padding:"12px 24px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:15, fontFamily:"Nunito,sans-serif" }}>
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
