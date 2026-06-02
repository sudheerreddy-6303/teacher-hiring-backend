import { useState } from "react";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { Navbar } from "../components/common/Shared";


const FAQ_SECTIONS = [
  {
    id: "general",
    title: "General",
    items: [
      { q: "What is EduHire?", a: "EduHire is an online job portal for the education sector. It connects schools and institutions with qualified teachers across India." },
      { q: "How does EduHire work?", a: "Schools post vacancies and access teacher profiles. Teachers create profiles, browse jobs, and apply. Applications are shared directly with schools for faster hiring." },
      { q: "Is EduHire a consultancy?", a: "No. EduHire is a job portal, not a consultancy. Teachers and schools connect directly on the platform." },
    ],
  },
  {
    id: "seekers",
    title: "For Job Seekers",
    items: [
      { q: "Is it free for teachers?", a: "Registration is free. Complete your profile to at least 70% to apply for jobs and receive suggestions." },
      { q: "How do I apply for jobs?", a: "Create your profile, upload your resume, browse jobs, and click Apply. Your profile is shared with the school instantly." },
      { q: "Why can't I apply yet?", a: "You need at least 70% profile completion. Add resume, job role, and location preferences from your dashboard." },
      { q: "Can I track applications?", a: "Yes. View all applications under Applied Jobs in your dashboard with status updates." },
    ],
  },
  {
    id: "schools",
    title: "For Schools",
    items: [
      { q: "How can a school post a job?", a: "Register as an employer, complete your institute profile, post job details, and manage applicants from your dashboard." },
      { q: "How do schools receive applications?", a: "When a teacher applies, their profile and resume are shared with your registered contact for direct follow-up." },
      { q: "Can schools search teachers?", a: "Yes. Use Search Educators to filter by subject, experience, qualification, and location." },
    ],
  },
];

export default function FaqPage({ setPage }) {
  const [activeTab, setActiveTab] = useState("general");
  const [open, setOpen] = useState(null);
  const section = FAQ_SECTIONS.find((s) => s.id === activeTab);

  return (
    <>
      <Navbar setPage={setPage} />
      <div className="faq-page">
        <div className="container" style={{ maxWidth: 800, paddingTop: 100, paddingBottom: 60 }}>
          <h1 className="faq-page__title">Frequently Asked Questions</h1>
          <p className="faq-page__sub">Find answers to common questions about EduHire</p>
          <div className="faq-tabs">
            {FAQ_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`faq-tab ${activeTab === s.id ? "active" : ""}`}
                onClick={() => { setActiveTab(s.id); setOpen(null); }}
              >
                {s.title}
              </button>
            ))}
          </div>
          <div className="faq-list">
            {section.items.map((item, i) => (
              <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
                <button type="button" className="faq-item__q" onClick={() => setOpen(open === i ? null : i)}>
                  {item.q}
                  <span>{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <div className="faq-item__a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
