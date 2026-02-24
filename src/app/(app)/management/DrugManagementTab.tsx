"use client";

import { useState, useEffect, useCallback } from "react";
import Toast from "@/components/Toast";
import { formatDate } from "@/lib/constants";

interface User {
  id: string;
  fullName: string;
  militaryId: string;
}

interface BatchForm {
  amount: string;
  dateReceived: string;
  receivingUserId: string;
  lotNumber: string;
  expirationDate: string;
  otherDrugsNotes: string;
}

interface SavedBatch {
  id: string;
  amountReceived: number;
  dateReceived: string;
  lotNumber: string | null;
  expirationDate: string | null;
  otherDrugsNotes: string | null;
  receivingAdmin: { fullName: string; militaryId: string };
}

const emptyBatch = (): BatchForm => ({
  amount: "",
  dateReceived: new Date().toISOString().split("T")[0],
  receivingUserId: "",
  lotNumber: "",
  expirationDate: "",
  otherDrugsNotes: "",
});

export default function DrugManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<BatchForm[]>([emptyBatch()]);
  const [savedBatches, setSavedBatches] = useState<SavedBatch[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchSavedBatches = useCallback(async () => {
    const res = await fetch("/api/inventory");
    if (res.ok) setSavedBatches(await res.json());
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSavedBatches();
  }, [fetchUsers, fetchSavedBatches]);

  const handleDeleteBatch = async (id: string) => {
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      setToast({ message: "Shipment deleted", type: "success" });
      fetchSavedBatches();
    } else {
      setToast({ message: "Failed to delete shipment", type: "error" });
    }
    setDeleteConfirmId(null);
  };

  const updateBatch = (index: number, field: keyof BatchForm, value: string) => {
    const updated = [...batches];
    updated[index] = { ...updated[index], [field]: value };
    setBatches(updated);
  };


  const handleSave = async () => {
    const validBatches = batches.filter(
      (b) => (b.amount && parseInt(b.amount) > 0) || b.otherDrugsNotes.trim()
    );

    if (validBatches.length === 0) {
      setToast({ message: "Please fill in at least one field", type: "error" });
      return;
    }

    for (const batch of validBatches) {
      if (!batch.receivingUserId) {
        setToast({ message: "Please select a receiving user for all entries", type: "error" });
        return;
      }
    }

    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batches: validBatches }),
    });

    if (res.ok) {
      setToast({ message: "Shipment recorded successfully", type: "success" });
      setBatches([emptyBatch()]);
      fetchSavedBatches();
    } else {
      setToast({ message: "Failed to save shipment", type: "error" });
    }
    setSaving(false);
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#5c6b3c] rounded-full"></span>
          Shipments
        </h2>

        {/* Recorded shipments */}
        {savedBatches.length > 0 && (
          <div className="mb-5 space-y-2">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Recorded Shipments
            </p>
            {savedBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-start justify-between gap-3 px-4 py-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg"
              >
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm min-w-0">
                  <span className="font-medium">{formatDate(batch.dateReceived)}</span>
                  {batch.amountReceived > 0 && (
                    <span className="text-stone-600 dark:text-stone-300">{batch.amountReceived} Actiqs</span>
                  )}
                  <span className="text-stone-500 dark:text-stone-400">
                    Received by {batch.receivingAdmin.fullName}
                  </span>
                  {batch.lotNumber && (
                    <span className="text-stone-500 dark:text-stone-400">Lot: {batch.lotNumber}</span>
                  )}
                  {batch.expirationDate && (
                    <span className="text-stone-500 dark:text-stone-400">
                      Exp: {formatDate(batch.expirationDate)}
                    </span>
                  )}
                  {batch.otherDrugsNotes && (
                    <span className="text-stone-500 dark:text-stone-400">{batch.otherDrugsNotes}</span>
                  )}
                </div>
                {deleteConfirmId === batch.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-stone-500">Delete?</span>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs px-2 py-1 bg-stone-200 dark:bg-stone-600 rounded hover:bg-stone-300 dark:hover:bg-stone-500 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(batch.id)}
                    className="shrink-0 text-stone-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-600"
                    title="Delete shipment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <div className="border-t border-stone-200 dark:border-stone-700 mt-3 mb-4" />
          </div>
        )}

        {/* New shipment form */}
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
          Add New Shipment
        </p>

        {batches.map((batch, index) => (
          <div key={index} className="mb-4 p-4 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Amount of Actiqs
                </label>
                <input
                  type="number"
                  min="0"
                  value={batch.amount}
                  onChange={(e) => updateBatch(index, "amount", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Date Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={batch.dateReceived}
                  onChange={(e) => updateBatch(index, "dateReceived", e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Receiving Soldier <span className="text-red-500">*</span>
                </label>
                <select
                  value={batch.receivingUserId}
                  onChange={(e) => updateBatch(index, "receivingUserId", e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.militaryId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Lot / Batch Number
                </label>
                <input
                  type="text"
                  value={batch.lotNumber}
                  onChange={(e) => updateBatch(index, "lotNumber", e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={batch.expirationDate}
                  onChange={(e) => updateBatch(index, "expirationDate", e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Other Drugs Notes
                </label>
                <textarea
                  value={batch.otherDrugsNotes}
                  onChange={(e) => updateBatch(index, "otherDrugsNotes", e.target.value)}
                  rows={3}
                  placeholder="Notes about other medical supplies received..."
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c] resize-none"
                />
              </div>
            </div>
          </div>
        ))}

      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#5c6b3c] text-white rounded-xl text-sm font-medium hover:bg-[#4d5a32] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Shipment"}
      </button>
    </div>
  );
}
