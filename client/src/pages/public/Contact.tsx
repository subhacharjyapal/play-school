import { useState, type FormEvent } from "react";
import { PageHero } from "../../components/layout/PageHero";
import { SCHOOL } from "../../lib/constants";
import { Input, Textarea } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card } from "../../components/ui/Card";
import { contactSchema, validateWith } from "../../lib/validation";
import { submitContact, type ContactInput } from "../../api/public.api";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function Contact() {
  const [form, setForm] = useState<ContactInput>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState("");

  function update<K extends keyof ContactInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const result = validateWith(contactSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      await submitContact(result.data);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    }
  }

  return (
    <>
      <PageHero
        emoji="💌"
        title="Contact Us"
        subtitle="Questions about admissions or a campus tour? We would love to hear from you!"
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        {/* Info + map */}
        <div>
          <Card>
            <h2 className="text-2xl font-extrabold">Visit Our Campus</h2>
            <address className="mt-4 space-y-3 not-italic text-slate-600">
              <p className="flex items-start gap-3">
                <span aria-hidden="true">📍</span>
                <span>{SCHOOL.address}</span>
              </p>
              <p className="flex items-center gap-3">
                <span aria-hidden="true">📞</span>
                <a className="font-bold text-brand-sky hover:underline" href={`tel:${SCHOOL.phone.replace(/[^+0-9]/g, "")}`}>
                  {SCHOOL.phone}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span aria-hidden="true">✉️</span>
                <a className="font-bold text-brand-sky hover:underline" href={`mailto:${SCHOOL.email}`}>
                  {SCHOOL.email}
                </a>
              </p>
              <p className="flex items-center gap-3">
                <span aria-hidden="true">🕐</span>
                <span>{SCHOOL.hours}</span>
              </p>
            </address>
          </Card>

          <div className="mt-6 overflow-hidden rounded-3xl shadow-sm ring-1 ring-slate-100">
            <iframe
              title={`Map showing ${SCHOOL.name} location`}
              src={SCHOOL.mapEmbedUrl}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Contact form */}
        <Card>
          <h2 className="text-2xl font-extrabold">Send Us a Message</h2>
          {status === "sent" ? (
            <div className="mt-6">
              <Alert tone="success">
                🎉 Thank you! Your message has been received. We usually reply within one working day.
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setForm({ name: "", email: "", phone: "", message: "" });
                    setStatus("idle");
                  }}
                >
                  Send another message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
              {serverError && <Alert tone="error">{serverError}</Alert>}
              <Input
                label="Your name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                error={errors.name}
              />
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                error={errors.phone}
              />
              <Textarea
                label="Message"
                required
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                error={errors.message}
              />
              <Button type="submit" loading={status === "sending"} className="w-full">
                Send Message 💌
              </Button>
            </form>
          )}
        </Card>
      </section>
    </>
  );
}
