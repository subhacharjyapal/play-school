import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginSchema, validateWith } from "../../lib/validation";
import { Input } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card } from "../../components/ui/Card";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

function dashboardPathFor(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/parent";
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = validateWith(loginSchema, { email, password });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const user = await login(result.data.email, result.data.password);
      navigate(from ?? dashboardPathFor(user.role), { replace: true });
    } catch (err) {
      setSubmitting(false);
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err, "Login failed. Please try again."));
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">🔑</span>
        <h1 className="mt-2 text-3xl font-extrabold">Welcome Back!</h1>
        <p className="mt-1 text-slate-500">
          Parents, teachers and admins — log in to your portal.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" loading={submitting} className="w-full">
            Log In
          </Button>
        </form>

        <div className="mt-4 flex justify-between text-sm font-bold">
          <Link className="text-brand-sky hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="text-brand-coral hover:underline" to="/admissions">
            New admission? Register
          </Link>
        </div>
      </Card>

      <p className="mt-6 rounded-2xl bg-sky-50 p-4 text-center text-sm text-slate-600 ring-1 ring-sky-100">
        <strong>Demo accounts</strong> (see README for passwords): parent1@littlestars.example ·
        teacher1@littlestars.example · admin@littlestars.example
      </p>
    </section>
  );
}
