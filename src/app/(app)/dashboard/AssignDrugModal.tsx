"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Modal from "@/components/Modal";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";

interface User {
  id: string;
  fullName: string;
  militaryId: string;
  job: string;
}

export default function AssignDrugModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [soldierId, setSoldierId] = useState("");
  const [actiqAmount, setActiqAmount] = useState("2");
  const [otherDrugsText, setOtherDrugsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const sigRef = useRef<SignaturePadHandle>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.militaryId.includes(searchQuery)
  );

  const handleSubmit = async () => {
    if (!soldierId) {
      setError("Please select a soldier");
      return;
    }
    if (!actiqAmount && !otherDrugsText.trim()) {
      setError("Please specify drugs to assign");
      return;
    }
    if (sigRef.current?.isEmpty()) {
      setError("Signature is required");
      return;
    }

    setSaving(true);
    setError("");

    const signatureData = sigRef.current?.toDataURL();

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soldierId,
        actiqAmount: actiqAmount || "0",
        otherDrugsText: otherDrugsText.trim() || null,
        signatureData,
      }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to assign drugs");
    }
    setSaving(false);
  };

  const selectedUser = users.find((u) => u.id === soldierId);

  return (
    <Modal isOpen={true} onClose={onClose} title="Assign Drugs" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Soldier selection */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Select Soldier</label>
          {!soldierId ? (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or Military ID..."
                className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c] mb-2"
              />
              <div className="max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-600 rounded-lg">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSoldierId(u.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-700 border-b border-stone-100 dark:border-stone-700/50 last:border-0"
                  >
                    <span className="font-medium">{u.fullName}</span>
                    <span className="text-stone-500 ml-2">({u.militaryId})</span>
                    <span className="text-xs text-stone-400 ml-2">{u.job}</span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-3 py-4 text-sm text-stone-400 text-center">No users found</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg px-3 py-2">
              <div>
                <span className="font-medium text-sm">{selectedUser?.fullName}</span>
                <span className="text-stone-500 text-sm ml-2">({selectedUser?.militaryId})</span>
              </div>
              <button
                onClick={() => setSoldierId("")}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Actiq amount */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Number of Actiqs</label>
          <input
            type="number"
            min="0"
            value={actiqAmount}
            onChange={(e) => setActiqAmount(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
          />
        </div>

        {/* Other drugs */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Other Drugs (optional)</label>
          <textarea
            value={otherDrugsText}
            onChange={(e) => setOtherDrugsText(e.target.value)}
            rows={3}
            placeholder="Free text for other drugs..."
            className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c] resize-none"
          />
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Soldier Signature <span className="text-red-500">*</span>
          </label>
          <SignaturePad ref={sigRef} />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
