"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  UserRound,
  ShieldCheck,
  Camera,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  VenusAndMars,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  BriefcaseBusiness,
  ImagePlus,
  X,
} from "lucide-react";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1";

const EMPTY_PROFILE = {
  first_name: "",
  last_name: "",
  email: "",
  address: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  role: "",
  profile_image: "",
};

function getAccessToken() {
  try {
    const stored = localStorage.getItem("authTokens");
    if (!stored) return "";
    const parsed = JSON.parse(stored);
    return parsed?.access || "";
  } catch {
    return "";
  }
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0] || fallback;
  if (typeof first === "string") return first;
  return fallback;
}

function Field({ label, icon: Icon, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;
  const success = notice.type === "success";
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
        success
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }`}
      role="status"
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{notice.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-0.5 opacity-70 transition hover:opacity-100"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    re_new_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const fileInputRef = useRef(null);

  const authFetch = useCallback(async (path, options = {}) => {
    const token = getAccessToken();
    if (!token) throw new Error("Login session not found. Please log in again.");

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `JWT ${token}`);
    if (!(options.body instanceof FormData) && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "Request failed."));
    }
    return data;
  }, []);

  const loadProfile = useCallback(async () => {
    setInitialLoading(true);
    try {
      const data = await authFetch("/auth/users/me/");
      setProfile({
        ...EMPTY_PROFILE,
        ...data,
        date_of_birth: data?.date_of_birth || "",
        profile_image:
          typeof data?.profile_image === "string" ? data.profile_image : "",
      });
      setImagePreview(
        typeof data?.profile_image === "string" ? data.profile_image : ""
      );
      setSelectedImage(null);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setInitialLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const updateField = (name, value) => {
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", message: "Please select an image file." });
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: "error", message: "Image size must not exceed 5 MB." });
      event.target.value = "";
      return;
    }
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice(null);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setNotice(null);
    try {
      let data;
      if (selectedImage) {
        const formData = new FormData();
        [
          "first_name",
          "last_name",
          "address",
          "phone_number",
          "date_of_birth",
          "gender",
        ].forEach((key) => formData.append(key, profile[key] || ""));
        formData.append("profile_image", selectedImage);
        data = await authFetch("/auth/users/me/", {
          method: "PATCH",
          body: formData,
        });
      } else {
        const payload = {
          first_name: profile.first_name,
          last_name: profile.last_name,
          address: profile.address,
          phone_number: profile.phone_number,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender || null,
        };
        data = await authFetch("/auth/users/me/", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      setProfile((current) => ({
        ...current,
        ...data,
        profile_image:
          typeof data?.profile_image === "string"
            ? data.profile_image
            : current.profile_image,
      }));
      if (typeof data?.profile_image === "string") {
        setImagePreview(data.profile_image);
      }
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice({ type: "success", message: "Profile successfully updated." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePasswordField = (name, value) => {
    setPasswords((current) => ({ ...current, [name]: value }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (passwords.new_password.length < 8) {
      setNotice({
        type: "error",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (passwords.new_password !== passwords.re_new_password) {
      setNotice({ type: "error", message: "New passwords do not match." });
      return;
    }

    setChangingPassword(true);
    try {
      await authFetch("/auth/users/set_password/", {
        method: "POST",
        body: JSON.stringify(passwords),
      });
      setPasswords({
        current_password: "",
        new_password: "",
        re_new_password: "",
      });
      setNotice({ type: "success", message: "Password successfully changed." });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const initials =
    `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() ||
    profile.email?.[0]?.toUpperCase() ||
    "U";

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "Your profile";

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">PREFERENCES</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal information and account security.
          </p>
        </div>
        <button
          type="button"
          onClick={loadProfile}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-24 bg-linear-to-r from-primary/20 via-primary/10 to-transparent sm:h-28" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-7">
          <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-2xl font-bold text-primary shadow-sm">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Profile"
                className="h-full w-full object-cover"
                width={96}
                height={96}
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {fullName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium capitalize text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {profile.role || "User"} account
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <form onSubmit={saveProfile} className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <SectionHeading
                icon={UserRound}
                title="Personal information"
                description="Update the personal details associated with your account."
              />

              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <ImagePlus className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Profile photo
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG or WebP. Maximum file size 5 MB.
                  </p>
                  {selectedImage ? (
                    <p className="mt-1 truncate text-xs text-primary">
                      {selectedImage.name}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <Camera className="h-4 w-4" />
                    Change
                  </button>
                  {selectedImage ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (imagePreview.startsWith("blob:"))
                          URL.revokeObjectURL(imagePreview);
                        setSelectedImage(null);
                        setImagePreview(profile.profile_image || "");
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name">
                  <input
                    className={inputClass}
                    value={profile.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Last name">
                  <input
                    className={inputClass}
                    value={profile.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                  />
                </Field>
                <Field label="Email address" icon={Mail} hint="Email cannot be changed here.">
                  <input
                    className={inputClass}
                    type="email"
                    value={profile.email}
                    disabled
                    readOnly
                  />
                </Field>
                <Field label="Phone number" icon={Phone}>
                  <input
                    className={inputClass}
                    value={profile.phone_number || ""}
                    onChange={(e) =>
                      updateField("phone_number", e.target.value)
                    }
                    placeholder="e.g. 01XXXXXXXXX"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Date of birth" icon={CalendarDays}>
                  <input
                    className={inputClass}
                    type="date"
                    value={profile.date_of_birth || ""}
                    onChange={(e) =>
                      updateField("date_of_birth", e.target.value)
                    }
                  />
                </Field>
                <Field label="Gender" icon={VenusAndMars}>
                  <select
                    className={inputClass}
                    value={profile.gender || ""}
                    onChange={(e) => updateField("gender", e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address" icon={MapPin}>
                    <textarea
                      className={`${inputClass} min-h-24 resize-y py-3`}
                      value={profile.address || ""}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </Field>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Your changes are saved to your account.
                </p>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </section>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={changePassword}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <SectionHeading
              icon={LockKeyhole}
              title="Change password"
              description="Use a strong password to keep your account secure."
            />

            <div className="mt-5 space-y-4">
              {[
                {
                  key: "current_password",
                  label: "Current password",
                  show: "current",
                  placeholder: "Enter current password",
                },
                {
                  key: "new_password",
                  label: "New password",
                  show: "next",
                  placeholder: "Enter new password",
                },
                {
                  key: "re_new_password",
                  label: "Confirm new password",
                  show: "confirm",
                  placeholder: "Re-enter new password",
                },
              ].map((item) => (
                <Field key={item.key} label={item.label}>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-11`}
                      type={showPasswords[item.show] ? "text" : "password"}
                      value={passwords[item.key]}
                      onChange={(e) =>
                        updatePasswordField(item.key, e.target.value)
                      }
                      placeholder={item.placeholder}
                      autoComplete={
                        item.key === "current_password"
                          ? "current-password"
                          : "new-password"
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((current) => ({
                          ...current,
                          [item.show]: !current[item.show],
                        }))
                      }
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                      aria-label={
                        showPasswords[item.show]
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPasswords[item.show] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>
              ))}

              <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <KeyRound className="h-4 w-4" />
                  Password tip
                </div>
                <p className="mt-1">
                  Use at least 8 characters. A mix of letters, numbers and
                  symbols is recommended.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  changingPassword ||
                  !passwords.current_password ||
                  !passwords.new_password ||
                  !passwords.re_new_password
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                {changingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <SectionHeading
              icon={BriefcaseBusiness}
              title="Account information"
              description="Your account details and access level."
            />
            <div className="mt-5 divide-y divide-border">
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-muted-foreground">Account role</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                  {profile.role || "User"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-muted-foreground">Account ID</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {profile.id ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-muted-foreground">Email status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Registered
                </span>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              Your role and email are managed by an administrator. Contact your
              administrator if either detail needs to be changed.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
