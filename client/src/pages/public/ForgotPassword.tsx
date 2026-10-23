import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema, validateWith } from "../../lib/validation";
import { Input } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card } from "../../components/ui/Card";
import { forgotPasswordRequest } from "../../api/auth.api";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const result = validateWith(forgotPasswordSchema, { email });
    if (!result.ok) {
      setError(result.errors.email ?? "Please enter a valid email");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await forgotPasswordRequest(result.data.email);
      setSent(true);
    } catch (err) {
      const fieldErrs = apiFieldErrors(err);
      if (fieldErrs.email) setError(fieldErrs.email);
      else setServerError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="mb-6 text-center">
        <span className="text-5xl" aria-hidden="true">🤔</span>
        <h1 className="mt-2 text-3xl font-extrabold">Forgot Password?</h1>
        <p className="mt-1 text-slate-500">
          No worries! Enter your email and we will send you a reset link.
        </p>
      </div>

      <Card>
        {sent ? (
          <Alert tone="success">
            If an account exists for <strong>{email}</strong>, a reset link has been sent. The
            link is valid for 1 hour. (In development, the email is printed in the server
            console.)
          </Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {serverError && <Alert tone="error">{serverError}</Alert>}
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
            <Button type="submit" loading={submitting} className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm font-bold">
          <Link className="text-brand-sky hover:underline" to="/login">
            ← Back to login
          </Link>
        </p>
      </Card>
    </section>
  );
}
