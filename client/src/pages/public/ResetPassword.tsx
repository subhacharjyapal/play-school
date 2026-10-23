import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordSchema, passwordSchema, validateWith } from "../../lib/validation";
import { Input } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card } from "../../components/ui/Card";
import { resetPasswordRequest } from "../../api/auth.api";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = validateWith(
      resetPasswordSchema.extend({ confirm: passwordSchema }),
      { token: tokenFromUrl, password, confirm }
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await resetPasswordRequest(tokenFromUrl, password);
      navigate("/login", { replace: true });
    } catch (err) {
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!tokenFromUrl) {
    return (
      <section className="mx-auto max-w-md px-4 py-16">
        <Card>
          <Alert tone="error">
            This password reset link is missing its token. Please request a new link.
          </Alert>
          <p className="mt-4 text-center">
            <Link className="font-bold text-brand-sky hover:underline" to="/forgot-password">
              Request a new reset link
            </Link>
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">🔐</span>
        <h1 className="mt-2 text-3xl font-extrabold">Set a New Password</h1>
      </div>

      <Card>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <Button type="submit" loading={submitting} className="w-full">
            Update Password
          </Button>
        </form>
      </Card>
    </section>
  );
}
