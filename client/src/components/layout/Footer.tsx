import { Link } from "react-router-dom";
import { SCHOOL } from "../../lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 bg-brand-ink text-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-bold text-white">
            <span aria-hidden="true">⭐</span> {SCHOOL.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            A safe, joyful and play-based early learning home in {SCHOOL.city}, caring for
            children from 1.5 to 5.5 years.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h3 className="font-display text-lg font-bold text-white">Quick Links</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><Link className="hover:text-brand-sun" to="/about">About Us</Link></li>
            <li><Link className="hover:text-brand-sun" to="/admissions">Admissions</Link></li>
            <li><Link className="hover:text-brand-sun" to="/gallery">Gallery</Link></li>
            <li><Link className="hover:text-brand-sun" to="/login">Parent Login</Link></li>
            <li><Link className="hover:text-brand-sun" to="/contact">Contact</Link></li>
          </ul>
        </nav>
        <div>
          <h3 className="font-display text-lg font-bold text-white">Reach Us</h3>
          <address className="mt-2 space-y-1.5 text-sm not-italic text-slate-300">
            <p>{SCHOOL.address}</p>
            <p>
              <a className="hover:text-brand-sun" href={`tel:${SCHOOL.phone.replace(/[^+0-9]/g, "")}`}>
                {SCHOOL.phone}
              </a>
            </p>
            <p>
              <a className="hover:text-brand-sun" href={`mailto:${SCHOOL.email}`}>{SCHOOL.email}</a>
            </p>
            <p>{SCHOOL.hours}</p>
          </address>
        </div>
      </div>
      <div className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {SCHOOL.name}. Made with 💖 for little learners.
      </div>
    </footer>
  );
}
