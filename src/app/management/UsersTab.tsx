"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatPhone, getRankLabel, JOBS, RANKS, SYSTEM_ROLES } from "@/lib/constants";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";
import Papa from "papaparse";

interface User {
  id: string;
  militaryId: string;
  fullName: string;
  rank: string;
  job: string;
  phoneNumber: string;
  systemRole: string;
  email: string | null;
  roleExpirationDate: string | null;
}

export default function UsersTab() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [editModal, setEditModal] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJob, setFilterJob] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (user: User) => {
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setToast({ message: `${user.fullName} deleted successfully`, type: "success" });
      fetchUsers();
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Failed to delete user", type: "error" });
    }
    setDeleteModal(null);
  };

  const handleExport = () => {
    const csvData = users.map((u) => ({
      "Military ID": u.militaryId,
      "Full Name": u.fullName,
      Rank: u.rank,
      Job: u.job,
      "Phone Number": u.phoneNumber,
      "System Role": u.systemRole,
      Email: u.email || "",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch("/api/users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ users: results.data }),
        });
        const data = await res.json();
        if (data.imported > 0) {
          setToast({ message: `${data.imported} users imported successfully`, type: "success" });
        }
        if (data.errors?.length > 0) {
          setToast({ message: data.errors.join("; "), type: "error" });
        }
        fetchUsers();
      },
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    const res = await fetch(`/api/users/${editModal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editModal),
    });
    if (res.ok) {
      setToast({ message: "User updated successfully", type: "success" });
      fetchUsers();
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Failed to update", type: "error" });
    }
    setEditModal(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.militaryId.includes(searchQuery);
    const matchesJob = !filterJob || u.job === filterJob;
    return matchesSearch && matchesJob;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c6b3c]"></div>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => router.push("/management/users/new")}
          className="px-4 py-2 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors"
        >
          + Add User
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
        >
          Export CSV
        </button>
        <label className="px-4 py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors cursor-pointer">
          Import CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        />
        <select
          value={filterJob}
          onChange={(e) => setFilterJob(e.target.value)}
          className="px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        >
          <option value="">All Jobs</option>
          {JOBS.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-700">
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Name</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Military ID</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Rank</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Job</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden lg:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden lg:table-cell">Role</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                <td className="px-4 py-3 font-medium">{user.fullName}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{user.militaryId}</td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 hidden md:table-cell">{getRankLabel(user.rank)}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-xs font-medium">
                    {user.job}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-400 hidden lg:table-cell">
                  {formatPhone(user.phoneNumber)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user.systemRole === "Admin"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                      : user.systemRole === "Temp_Admin"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400"
                  }`}>
                    {user.systemRole === "Temp_Admin" ? "Temp Admin" : user.systemRole}
                  </span>
                </td>
                <td className="px-4 py-3 text-right relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                  </button>
                  {openMenuId === user.id && (
                    <div className="absolute right-4 top-full z-10 bg-white dark:bg-stone-700 rounded-lg shadow-lg border border-stone-200 dark:border-stone-600 py-1 min-w-[120px]">
                      <button
                        onClick={() => { setEditModal(user); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setDeleteModal(user); setOpenMenuId(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-500 dark:text-stone-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirm Delete">
        <p className="mb-4">
          Are you sure you want to delete <strong>{deleteModal?.fullName}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeleteModal(null)}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteModal && handleDelete(deleteModal)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit User">
        {editModal && <EditUserForm user={editModal} onChange={setEditModal} onSave={handleEditSave} />}
      </Modal>
    </div>
  );
}

function EditUserForm({
  user,
  onChange,
  onSave,
}: {
  user: User;
  onChange: (u: User) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={user.fullName}
          onChange={(e) => onChange({ ...user, fullName: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Military ID</label>
        <input
          type="text"
          value={user.militaryId}
          onChange={(e) => onChange({ ...user, militaryId: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rank</label>
          <select
            value={user.rank}
            onChange={(e) => onChange({ ...user, rank: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
          >
            {RANKS.map((r: { value: string; label: string }) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job</label>
          <select
            value={user.job}
            onChange={(e) => onChange({ ...user, job: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
          >
            {JOBS.map((j: string) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          type="text"
          value={user.phoneNumber}
          onChange={(e) => onChange({ ...user, phoneNumber: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">System Role</label>
        <select
          value={user.systemRole}
          onChange={(e) => onChange({ ...user, systemRole: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        >
          {SYSTEM_ROLES.map((r: { value: string; label: string }) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      {(user.systemRole === "Admin" || user.systemRole === "Temp_Admin") && (
        <div>
          <label className="block text-sm font-medium mb-1">Email (for SSO)</label>
          <input
            type="email"
            value={user.email || ""}
            onChange={(e) => onChange({ ...user, email: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
          />
        </div>
      )}
      {user.systemRole === "Temp_Admin" && (
        <div>
          <label className="block text-sm font-medium mb-1">Expiration Date</label>
          <input
            type="date"
            value={user.roleExpirationDate ? new Date(user.roleExpirationDate).toISOString().split("T")[0] : ""}
            onChange={(e) => onChange({ ...user, roleExpirationDate: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
          />
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
