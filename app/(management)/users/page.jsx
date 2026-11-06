"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1";
const input =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const blank = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  address: "",
  date_of_birth: "",
  gender: "",
  role: "cashier",
  is_active: true,
};

function token() {
  try {
    return JSON.parse(localStorage.getItem("authTokens") || "{}")?.access || "";
  } catch {
    return "";
  }
}
function message(data) {
  if (!data) return "Request failed.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const value = Object.values(data)[0];
  return Array.isArray(value) ? value[0] : value || "Request failed.";
}

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [count, setCount] = useState(0);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(null);
  const [selfId, setSelfId] = useState(null);

  const api = useCallback(async (url, options = {}) => {
    const access = token();
    if (!access)
      throw new Error("Login session not found. Please log in again.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `JWT ${access}`);
    if (options.body) headers.set("Content-Type", "application/json");
    const res = await fetch(url, { ...options, headers });
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json() : await res.text();
    if (!res.ok) throw new Error(message(data));
    return data;
  }, []);

  const listUrl = useCallback(
    (p = 1) => {
      const q = new URLSearchParams({ page: String(p) });
      if (search.trim()) q.set("search", search.trim());
      if (role) q.set("role", role);
      if (active) q.set("is_active", active);
      return `${API}/users/?${q}`;
    },
    [search, role, active],
  );

  const load = useCallback(
    async (url = listUrl(1)) => {
      setLoading(true);
      try {
        const data = await api(url);
        const list = Array.isArray(data) ? data : data.results || [];
        setRows(list);
        setCount(
          Array.isArray(data) ? list.length : (data.count ?? list.length),
        );
        setNext(Array.isArray(data) ? null : data.next);
        setPrevious(Array.isArray(data) ? null : data.previous);
      } catch (e) {
        setError(true);
        setNotice(e.message);
      } finally {
        setLoading(false);
      }
    },
    [api, listUrl],
  );

  useEffect(() => {
    load(listUrl(1));
    api(`${API}/auth/users/me/`)
      .then((u) => setSelfId(u.id))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(listUrl(1));
    }, 300);
    return () => clearTimeout(t);
  }, [search, role, active]);

  const field = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const create = () => {
    setEditing(null);
    setForm(blank);
    setModal(true);
  };
  const edit = (u) => {
    setEditing(u);
    setForm({
      ...blank,
      ...u,
      password: "",
      date_of_birth: u.date_of_birth || "",
    });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (!payload.date_of_birth) payload.date_of_birth = null;
      if (!payload.gender) payload.gender = null;
      await api(editing ? `${API}/users/${editing.id}/` : `${API}/users/`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setModal(false);
      setError(false);
      setNotice(editing ? "User updated." : "User created.");
      await load(listUrl(page));
    } catch (e) {
      setError(true);
      setNotice(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (u) => {
    setBusy(u.id);
    setNotice("");
    try {
      await api(`${API}/users/${u.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      setError(false);
      setNotice(u.is_active ? "User deactivated." : "User activated.");
      await load(listUrl(page));
    } catch (e) {
      setError(true);
      setNotice(e.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await api(`${API}/users/${deleting.id}/`, { method: "DELETE" });
      setDeleting(null);
      setError(false);
      setNotice("User deleted.");
      await load(listUrl(page));
    } catch (e) {
      setError(true);
      setNotice(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">ADMINISTRATION</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create staff accounts and manage roles and access.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(listUrl(page))}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={create}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add user
          </button>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-xl border p-3 text-sm ${error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"}`}
        >
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Users className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xs text-muted-foreground">
            Total matching users
          </p>
          <p className="text-2xl font-bold text-foreground">{count}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <p className="mt-2 text-xs text-muted-foreground">
            Active on this page
          </p>
          <p className="text-2xl font-bold text-foreground">
            {rows.filter((x) => x.is_active).length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xs text-muted-foreground">
            Admins on this page
          </p>
          <p className="text-2xl font-bold text-foreground">
            {rows.filter((x) => x.role === "admin").length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              className={`${input} pl-9`}
              placeholder="Search name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={`${input} sm:w-40`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>
          <select
            className={`${input} sm:w-40`}
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading users...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const name =
                    `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                    "Unnamed user";
                  const self = u.id === selfId;
                  return (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">
                          {name}
                          {self && (
                            <span className="ml-2 text-xs text-primary">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs capitalize text-primary">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${u.is_active ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          {u.is_active ? "● Active" : "● Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.phone_number || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.date_joined
                          ? new Date(u.date_joined).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            title="Edit"
                            onClick={() => edit(u)}
                            className="rounded-lg border border-border p-2 hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title={u.is_active ? "Deactivate" : "Activate"}
                            disabled={self || busy === u.id}
                            onClick={() => toggle(u)}
                            className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-40"
                          >
                            {busy === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : u.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            title="Delete"
                            disabled={self || busy === u.id}
                            onClick={() => setDeleting(u)}
                            className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Showing {rows.length} of {count}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={!previous || loading}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                load(previous);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <button
              disabled={!next || loading}
              onClick={() => {
                setPage((p) => p + 1);
                load(next);
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !saving && setModal(false)
          }
        >
          <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <header className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <h2 className="font-semibold text-foreground">
                {editing ? "Edit user" : "Create new user"}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <form onSubmit={save} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["first_name", "First name"],
                  ["last_name", "Last name"],
                  ["email", "Email address"],
                  [
                    "password",
                    editing ? "New password (optional)" : "Password",
                  ],
                  ["phone_number", "Phone number"],
                ].map(([key, label]) => (
                  <label key={key} className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {label}
                    </span>
                    <input
                      required={
                        key === "email" || (key === "password" && !editing)
                      }
                      type={
                        key === "email"
                          ? "email"
                          : key === "password"
                            ? "password"
                            : "text"
                      }
                      className={input}
                      value={form[key] || ""}
                      onChange={(e) => field(key, e.target.value)}
                      placeholder={label}
                    />
                  </label>
                ))}
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Role
                  </span>
                  <select
                    className={input}
                    value={form.role}
                    onChange={(e) => field("role", e.target.value)}
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Date of birth
                  </span>
                  <input
                    type="date"
                    className={input}
                    value={form.date_of_birth || ""}
                    onChange={(e) => field("date_of_birth", e.target.value)}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Gender
                  </span>
                  <select
                    className={input}
                    value={form.gender || ""}
                    onChange={(e) => field("gender", e.target.value)}
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-foreground">
                    Address
                  </span>
                  <textarea
                    rows="2"
                    className={`${input} h-auto py-2`}
                    value={form.address || ""}
                    onChange={(e) => field("address", e.target.value)}
                  />
                </label>
                {editing && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!form.is_active}
                      onChange={(e) => field("is_active", e.target.checked)}
                    />
                    Account is active
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="h-10 rounded-xl border border-border px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Create user"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Delete user?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently delete{" "}
              <strong className="text-foreground">{deleting.email}</strong>?
              This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="h-10 rounded-xl border border-border px-4 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={busy === deleting.id}
                className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
