import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { Navbar } from "../components/common/Shared";


const INSTITUTES = [
  { name: "Infinity Podar Learn School", type: "CBSE School", location: "Sillod, Maharashtra", tag: "Day Campus", featured: true },
  { name: "Sree Swamy Vivekananda School", type: "State Board School", location: "Pulivendla, Andhra Pradesh", tag: "Day Campus", featured: true },
  { name: "Vantage Hall", type: "CBSE School", location: "Dehradun, Uttarakhand", tag: "Boarding", featured: true },
  { name: "Narayana ETechno Schools Mumbai", type: "CBSE School", location: "Mumbai, Maharashtra", tag: "", featured: true },
  { name: "Happy Valley Schools", type: "CBSE School", location: "Bhagalpur, Bihar", tag: "", featured: false },
  { name: "SETH ANANDRAM JAIPURIA SCHOOL", type: "CBSE School", location: "Varanasi, Uttar Pradesh", tag: "Day school", featured: false },
  { name: "Janapriya Schools", type: "CBSE & State Board", location: "Hyderabad, Telangana", tag: "Day Campus", featured: false },
  { name: "Delhi Public School", type: "CBSE School", location: "Hyderabad, Telangana", tag: "Day Campus", featured: false },
];

export default function InstitutesPage({ setPage }) {
  return (
    <>
      <Navbar setPage={setPage} />
      <div className="institutes-page">
        <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
          <h1 className="page-title">Schools & Institutes</h1>
          <p className="page-desc">Explore verified hiring schools and institutions on EduHire</p>
          <div className="institutes-grid">
            {INSTITUTES.map((inst) => (
              <div key={inst.name} className="institute-card">
                {inst.featured && <span className="institute-card__featured">★ Featured</span>}
                <div className="institute-card__logo">🏫</div>
                <h3>{inst.name}</h3>
                <p className="institute-card__type">{inst.type}</p>
                <p className="institute-card__loc">{inst.location}</p>
                {inst.tag && <span className="badge bgray">{inst.tag}</span>}
                <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 14 }} onClick={() => setPage("jobs")}>
                  View Jobs →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
