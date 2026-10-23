import { useState, type FormEvent } from "react";
import { PageHero } from "../../components/layout/PageHero";
import { Input, Select, Textarea } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card } from "../../components/ui/Card";
import { applicationSchema, validateWith } from "../../lib/validation";
import { PROGRAMS, PROGRAM_LABELS, GENDERS } from "../../lib/constants";
import { submitApplication, type ApplicationInput } from "../../api/applications.api";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

const emptyForm: ApplicationInput = {
  childFullName: "",
  dob: "",
  gender: "" as ApplicationInput["gender"],
  program: "" as ApplicationInput["program"],
  parentName: "",
  relationship: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  medicalNotes: "",
  message: "",
};

const genderOptions = GENDERS.map((g) => ({
  value: g,
  label: g.charAt(0) + g.slice(1).toLowerCase(),
}));

const programOptions = PROGRAMS.map((p) => ({ value: p, label: PROGRAM_LABELS[p] }));

const relationshipOptions = ["Mother", "Father", "Grandparent", "Guardian", "Other"];

export default function Admissions() {
  const [form, setForm] = useState<ApplicationInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function update<K extends keyof ApplicationInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = validateWith(applicationSchema, form);
    if (!result.ok) {
      setErrors(result.errors);
      // Focus the first invalid field for keyboard/screen-reader users
      const firstField = Object.keys(result.errors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const response = await submitApplication({
        ...result.data,
        medicalNotes: result.data.medicalNotes || undefined,
        message: result.data.message || undefined,
      });
      setConfirmation(response.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setErrors(fieldErrs);
      else setServerError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        emoji="📝"
        title="Admissions"
        subtitle="Register your child for Playgroup, Nursery, LKG or UKG — it only takes a few minutes."
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3">
        {/* Sidebar info */}
        <aside className="space-y-4 lg:col-span-1">
          <Card>
            <h2 className="text-xl font-extrabold">What happens next?</h2>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky text-xs font-bold text-white">1</span>
                Submit the form — you will get an instant confirmation.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky text-xs font-bold text-white">2</span>
                Our team reviews it within 2–3 working days.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky text-xs font-bold text-white">3</span>
                Once approved, parent portal login details are emailed to you.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-sky text-xs font-bold text-white">4</span>
                Visit us for a campus tour and welcome day!
              </li>
            </ol>
          </Card>
          <Card className="bg-amber-50 ring-amber-100">
            <h2 className="text-lg font-extrabold">Need help?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Call us at <a className="font-bold text-brand-sky hover:underline" href="tel:+15125550147">+1 (512) 555-0147</a> or
              visit the <a className="font-bold text-brand-sky hover:underline" href="/contact">contact page</a>.
            </p>
          </Card>
        </aside>

        {/* Form */}
        <div className="lg:col-span-2">
          {confirmation ? (
            <Card>
              <div className="py-6 text-center">
                <div className="text-6xl" aria-hidden="true">🎉</div>
                <h2 className="mt-4 text-3xl font-extrabold text-emerald-600">Application Submitted!</h2>
                <Alert>
                  <p className="mt-2">{confirmation}</p>
                </Alert>
                <div className="mt-6">
                  <Button variant="outline" onClick={() => { setConfirmation(null); setForm(emptyForm); }}>
                    Submit another application
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-2xl font-extrabold">Admission Application Form</h2>
              <p className="mt-1 text-sm text-slate-500">Fields marked with <span className="text-coral-500">*</span> are required.</p>

              <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
                {serverError && <Alert tone="error">{serverError}</Alert>}

                <fieldset className="space-y-4">
                  <legend className="mb-1 font-display text-lg font-bold text-brand-sky">👤 Child Details</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="childFullName"
                      label="Child's full name"
                      required
                      autoComplete="off"
                      value={form.childFullName}
                      onChange={(e) => update("childFullName", e.target.value)}
                      error={errors.childFullName}
                    />
                    <Input
                      id="dob"
                      label="Date of birth"
                      type="date"
                      required
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.dob}
                      onChange={(e) => update("dob", e.target.value)}
                      error={errors.dob}
                    />
                    <Select
                      id="gender"
                      label="Gender"
                      required
                      placeholder="Select…"
                      options={genderOptions}
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                      error={errors.gender}
                    />
                    <Select
                      id="program"
                      label="Program applying for"
                      required
                      placeholder="Select…"
                      options={programOptions}
                      value={form.program}
                      onChange={(e) => update("program", e.target.value)}
                      error={errors.program}
                    />
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="mb-1 font-display text-lg font-bold text-brand-sky">👪 Parent / Guardian</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="parentName"
                      label="Parent/guardian name"
                      required
                      autoComplete="name"
                      value={form.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      error={errors.parentName}
                    />
                    <Select
                      id="relationship"
                      label="Relationship to child"
                      required
                      placeholder="Select…"
                      options={relationshipOptions.map((r) => ({ value: r, label: r }))}
                      value={form.relationship}
                      onChange={(e) => update("relationship", e.target.value)}
                      error={errors.relationship}
                    />
                    <Input
                      id="phone"
                      label="Phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      error={errors.phone}
                    />
                    <Input
                      id="email"
                      label="Email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      error={errors.email}
                    />
                  </div>
                  <Textarea
                    id="address"
                    label="Home address"
                    required
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    error={errors.address}
                  />
                  <Input
                    id="emergencyContact"
                    label="Emergency contact number"
                    type="tel"
                    required
                    hint="A relative, neighbor or babysitter we can call"
                    value={form.emergencyContact}
                    onChange={(e) => update("emergencyContact", e.target.value)}
                    error={errors.emergencyContact}
                  />
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="mb-1 font-display text-lg font-bold text-brand-sky">🩺 Health & Notes</legend>
                  <Textarea
                    id="medicalNotes"
                    label="Medical notes / allergies (optional)"
                    placeholder="e.g. mild dust allergy, carries an inhaler"
                    value={form.medicalNotes}
                    onChange={(e) => update("medicalNotes", e.target.value)}
                    error={errors.medicalNotes}
                  />
                  <Textarea
                    id="message"
                    label="Anything you would like us to know? (optional)"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    error={errors.message}
                  />
                </fieldset>

                <Button type="submit" size="lg" loading={submitting} className="w-full">
                  Submit Application ✨
                </Button>
              </form>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
