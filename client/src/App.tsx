import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Spinner } from "./components/ui/Card";

// Public pages — lazy loaded for code splitting
const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const Gallery = lazy(() => import("./pages/public/Gallery"));
const Admissions = lazy(() => import("./pages/public/Admissions"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Login = lazy(() => import("./pages/public/Login"));
const ForgotPassword = lazy(() => import("./pages/public/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/public/ResetPassword"));

// Portals — lazy loaded so parents never download the admin bundle
const ParentPortal = lazy(() => import("./pages/parent/ParentPortal"));
const TeacherPanel = lazy(() => import("./pages/teacher/TeacherPanel"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/parent/*" element={<ParentPortal />} />
            <Route path="/teacher/*" element={<TeacherPanel />} />
            <Route path="/admin/*" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
