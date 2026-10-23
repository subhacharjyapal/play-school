import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui/Card";

/**
 * Client-side role gate. The server enforces authorization independently on
 * every request — this only controls what the UI shows.
 */
export function ProtectedRoute({
  roles,
  children,
}: {
  roles: Array<"PARENT" | "TEACHER" | "ADMIN">;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="text-6xl" aria-hidden="true">🔒</div>
        <h1 className="mt-4 text-3xl font-extrabold">Access denied</h1>
        <p className="mt-2 text-slate-500">
          You are signed in as <strong>{user.role.toLowerCase()}</strong>, but this area requires
          a different role.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
