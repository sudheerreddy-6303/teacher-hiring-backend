import { useState } from "react";
import "./index.css";
import { AuthContext } from "./context/AuthContext";

import HomePage           from "./pages/HomePage";
import HowItWorksPage     from "./pages/HowItWorksPage";
import JobsPage           from "./pages/JobsPage";
import BrowseTeachersPage from "./pages/BrowseTeachersPage";
import BrowseTutorsPage   from "./pages/BrowseTutorsPage";
import PricingPage        from "./pages/PricingPage";
import AuthPage           from "./components/auth/AuthPage";
import AdminDashboard     from "./components/admin/AdminDashboard";
import TeacherDashboard   from "./components/teacher/TeacherDashboard";
import TutorDashboard     from "./components/tutor/TutorDashboard";
import ParentDashboard    from "./components/parent/ParentDashboard";
import SchoolDashboard    from "./components/school/SchoolDashboard";

export default function App() {
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState("home");
  const [token, setToken] = useState(localStorage.getItem("acadhr_token") || "");

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("acadhr_token", jwt);
    localStorage.setItem("acadhr_user",  JSON.stringify(userData));
    setPage("dashboard");
  }

  function logout() {
    setUser(null); setToken("");
    localStorage.removeItem("acadhr_token");
    localStorage.removeItem("acadhr_user");
    setPage("home");
  }

  // Restore session on refresh
  if (!user) {
    const saved = localStorage.getItem("acadhr_user");
    if (saved && token) {
      try { const u = JSON.parse(saved); if (u?.id) setUser(u); } catch {}
    }
  }

  function DashboardRouter() {
    if (!user) { setPage("login"); return null; }
    if (user.role === "admin")   return <AdminDashboard   setPage={setPage} />;
    if (user.role === "teacher") return <TeacherDashboard user={user} setPage={setPage} />;
    if (user.role === "tutor")   return <TutorDashboard   user={user} setPage={setPage} />;
    if (user.role === "school")  return <SchoolDashboard  user={user} setPage={setPage} />;
    if (user.role === "parent")  return <ParentDashboard  user={user} setPage={setPage} />;
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {page === "home"       && <HomePage           setPage={setPage} />}
      {page === "howitworks" && <HowItWorksPage     setPage={setPage} />}
      {page === "jobs"       && <JobsPage           setPage={setPage} />}
      {page === "teachers"   && <BrowseTeachersPage setPage={setPage} />}
      {page === "tutors"     && <BrowseTutorsPage   setPage={setPage} />}
      {page === "pricing"    && <PricingPage        setPage={setPage} />}
      {page === "login"      && <AuthPage           mode="login"  setPage={setPage} />}
      {page === "signup"     && <AuthPage           mode="signup" setPage={setPage} />}
      {page === "dashboard"  && <DashboardRouter />}
    </AuthContext.Provider>
  );
}
