import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  updateProfile,
  changePassword,
  fetchProfile,
  type ParentProfile as ProfileData,
} from "../../api/portal.api";
import { Input } from "../../components/ui/FormFields";
import { Button } from "../../components/ui/Button";
import { Alert, Card, Spinner } from "../../components/ui/Card";
import { profileSchema, changePasswordSchema, validateWith } from "../../lib/validation";
import { apiErrorMessage, apiFieldErrors } from "../../api/client";

export default function ParentProfile() {
  const { user, refresh } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [profileServerError, setProfileServerError] = useState("");

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [pwdStatus, setPwdStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [pwdServerError, setPwdServerError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setProfileServerError("");
    const result = validateWith(profileSchema, {
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      emergencyContact: profile.emergencyContact ?? "",
    });
    if (!result.ok) {
      setProfileErrors(result.errors);
      return;
    }
    setProfileErrors({});
    setProfileStatus("saving");
    try {
      const updated = await updateProfile(result.data);
      setProfile((p) => (p ? { ...p, ...updated } : p));
      setProfileStatus("saved");
      await refresh();
    } catch (err) {
      setProfileStatus("idle");
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setProfileErrors(fieldErrs);
      else setProfileServerError(apiErrorMessage(err));
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdServerError("");
    const result = validateWith(changePasswordSchema, pwd);
    if (!result.ok) {
      setPwdErrors(result.errors);
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setPwdErrors({});
    setPwdStatus("saving");
    try {
      await changePassword(pwd.currentPassword, pwd.newPassword);
      setPwdStatus("saved");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwdStatus("idle");
      const fieldErrs = apiFieldErrors(err);
      if (Object.keys(fieldErrs).length > 0) setPwdErrors(fieldErrs);
      else setPwdServerError(apiErrorMessage(err));
    }
  }

  if (!profile) return <Spinner label="Loading profile" />;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Contact info */}
      <Card>
        <h2 className="text-xl font-extrabold">Contact Information</h2>
        <p className="mt-1 text-sm text-slate-500">Keep your details up to date so we can reach you quickly.</p>
        <form onSubmit={onSaveProfile} noValidate className="mt-4 space-y-4">
          {profileServerError && <Alert tone="error">{profileServerError}</Alert>}
          {profileStatus === "saved" && <Alert tone="success">Profile updated! ✔</Alert>}
          <Input
            label="Full name"
            required
            autoComplete="name"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            error={profileErrors.fullName}
          />
          <Input
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            error={profileErrors.phone}
          />
          <Input
            label="Address"
            required
            autoComplete="street-address"
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            error={profileErrors.address}
          />
          <Input
            label="Emergency contact"
            type="tel"
            value={profile.emergencyContact ?? ""}
            onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
            error={profileErrors.emergencyContact}
          />
          <p className="text-xs text-slate-400">
            Logged in as <strong>{user?.email}</strong> (email changes require office approval).
          </p>
          <Button type="submit" loading={profileStatus === "saving"}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="text-xl font-extrabold">Change Password</h2>
        <form onSubmit={onChangePassword} noValidate className="mt-4 space-y-4">
          {pwdServerError && <Alert tone="error">{pwdServerError}</Alert>}
          {pwdStatus === "saved" && <Alert tone="success">Password changed! Use it next time you log in.</Alert>}
          <Input
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={pwd.currentPassword}
            onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            error={pwdErrors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number"
            value={pwd.newPassword}
            onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            error={pwdErrors.newPassword}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={pwd.confirmPassword}
            onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
            error={pwdErrors.confirmPassword}
          />
          <Button type="submit" variant="secondary" loading={pwdStatus === "saving"}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
