"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { RANKS, JOBS, SYSTEM_ROLES } from "@/lib/constants";

export default function NewUserPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    militaryId: "",
    rank: "",
    job: "",
    phoneNumber: "",
    systemRole: "General",
    email: "",
    roleExpirationDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (form.fullName.trim().split(/\s+/).length < 2) {
      setToast({ message: "Full name must contain at least two words", type: "error" });
      return;
    }
    if (!/^\d{7}$/.test(form.militaryId)) {
      setToast({ message: "Military ID must be exactly 7 digits", type: "error" });
      return;
    }
    if (!form.rank) {
      setToast({ message: "Please select a rank", type: "error" });
      return;
    }
    if (!form.job) {
      setToast({ message: "Please select a job", type: "error" });
      return;
    }
    if (!/^05\d{8}$/.test(form.phoneNumber.replace(/\D/g, ""))) {
      setToast({ message: "Phone number must be in format 05#-#######", type: "error" });
      return;
    }
    if ((form.systemRole === "Admin" || form.systemRole === "Temp_Admin") && !form.email) {
      setToast({ message: "Email is required for Admin/Temp Admin", type: "error" });
      return;
    }

    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/management");
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Failed to create user", type: "error" });
    }
    setSaving(false);
  };

  return (
    <AppShell>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Add New User</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="First Last"
              required
              className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
            />
            <p className="text-xs text-stone-400 mt-1">Must contain at least two words</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Military ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.militaryId}
              onChange={(e) => setForm({ ...form, militaryId: e.target.value.replace(/\D/g, "").slice(0, 7) })}
              placeholder="1234567"
              required
              maxLength={7}
              className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
            />
            <p className="text-xs text-stone-400 mt-1">Exactly 7 digits</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Rank <span className="text-red-500">*</span>
              </label>
              <select
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
              >
                <option value="">Select rank...</option>
                {RANKS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Job <span className="text-red-500">*</span>
              </label>
              <select
                value={form.job}
                onChange={(e) => setForm({ ...form, job: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
              >
                <option value="">Select job...</option>
                {JOBS.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="0501234567"
              required
              maxLength={10}
              className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
            />
            <p className="text-xs text-stone-400 mt-1">Format: 05#-#######</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">System Role</label>
            <select
              value={form.systemRole}
              onChange={(e) => setForm({ ...form, systemRole: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
            >
              {SYSTEM_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {(form.systemRole === "Admin" || form.systemRole === "Temp_Admin") && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                required
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
              />
              <p className="text-xs text-stone-400 mt-1">Required for Google SSO login</p>
            </div>
          )}

          {form.systemRole === "Temp_Admin" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Role Expiration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.roleExpirationDate}
                onChange={(e) => setForm({ ...form, roleExpirationDate: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
