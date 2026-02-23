"use client";

import { useState, useEffect, useCallback } from "react";
import Toast from "@/components/Toast";

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
}

const emptyBatch = (): BatchForm => ({
  amount: "",
  dateReceived: new Date().toISOString().split("T")[0],
  receivingUserId: "",
  lotNumber: "",
  expirationDate: "",
});

export default function DrugManagementTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<BatchForm[]>([emptyBatch()]);
  const [otherDrugsNotes, setOtherDrugsNotes] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateBatch = (index: number, field: keyof BatchForm, value: string) => {
    const updated = [...batches];
    updated[index] = { ...updated[index], [field]: value };
    setBatches(updated);
  };

  const addBatch = () => {
    setBatches([...batches, emptyBatch()]);
  };

  const removeBatch = (index: number) => {
    if (batches.length > 1) {
      setBatches(batches.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    // Validate batches that have amounts
    const validBatches = batches.filter((b) => b.amount && parseInt(b.amount) > 0);

    for (const batch of validBatches) {
      if (!batch.receivingUserId) {
        setToast({ message: "Please select a receiving user for all batches", type: "error" });
        return;
      }
    }

    if (validBatches.length === 0 && !otherDrugsNotes.trim()) {
      setToast({ message: "Please add at least one batch or other drugs notes", type: "error" });
      return;
    }

    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batches: validBatches.length > 0 ? validBatches : undefined,
        otherDrugsNotes: otherDrugsNotes.trim() || undefined,
      }),
    });

    if (res.ok) {
      setToast({ message: "Inventory updated successfully", type: "success" });
      setBatches([emptyBatch()]);
      setOtherDrugsNotes("");
    } else {
      setToast({ message: "Failed to update inventory", type: "error" });
    }
    setSaving(false);
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Actiqs Section */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#5c6b3c] rounded-full"></span>
          Actiq Shipments
        </h2>

        {batches.map((batch, index) => (
          <div key={index} className="mb-4 p-4 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                Batch #{index + 1}
              </span>
              {batches.length > 1 && (
                <button
                  onClick={() => removeBatch(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
                  Amount of Actiqs <span className="text-red-500">*</span>
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
                  Receiving User <span className="text-red-500">*</span>
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
              <div className="sm:col-span-2">
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
            </div>
          </div>
        ))}

        <button
          onClick={addBatch}
          className="w-full py-2 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg text-sm text-stone-500 dark:text-stone-400 hover:border-[#5c6b3c] hover:text-[#5c6b3c] transition-colors"
        >
          + Add Another Batch
        </button>
      </div>

      {/* Other Drugs Section */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          Other Drugs
        </h2>
        <div>
          <label className="block text-xs font-medium mb-1 text-stone-500 dark:text-stone-400">
            General Inventory Notes
          </label>
          <textarea
            value={otherDrugsNotes}
            onChange={(e) => setOtherDrugsNotes(e.target.value)}
            rows={6}
            placeholder="Enter notes about other medical supplies received..."
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c] resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#5c6b3c] text-white rounded-xl text-sm font-medium hover:bg-[#4d5a32] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Inventory"}
      </button>
    </div>
  );
}
