import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SCHOOL } from "../../lib/constants";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/gallery", label: "Gallery" },
  { to: "/admissions", label: "Admissions" },
  { to: "/contact", label: "Contact" },
];

function dashboardPathFor(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/parent";
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-full px-4 py-2 font-bold transition-colors",
      isActive ? "bg-brand-sun-soft text-amber-900" : "text-slate-700 hover:bg-sky-100"
    );

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/90 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="text-3xl animate-wiggle" aria-hidden="true">⭐</span>
          <span className="font-display text-xl font-extrabold leading-tight text-brand-ink sm:text-2xl">
            {SCHOOL.name}
            <span className="block text-xs font-bold text-brand-sky sm:text-sm">{SCHOOL.city}</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass} end={l.to === "/"}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to={dashboardPathFor(user.role)}>
                <Button variant="secondary" size="sm">My Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">Parent Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-xl p-2 text-slate-700 hover:bg-sky-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-sky-100 bg-white px-4 pb-4 lg:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {navLinks.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={linkClass} end={l.to === "/"} onClick={() => setOpen(false)}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link to={dashboardPathFor(user.role)} onClick={() => setOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">My Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">Parent Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
