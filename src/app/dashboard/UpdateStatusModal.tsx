"use client";

import { useState, useRef } from "react";
import Modal from "@/components/Modal";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";

interface Assignment {
  id: string;
  soldierId: string;
  actiqBalance: number;
  otherDrugsText: string | null;
  soldier: {
    id: string;
    fullName: string;
    job: string;
    militaryId: string;
  };
}

const ACTION_OPTIONS = [
  { value: "Administered", label: "Administered", description: "Used on a casualty (removed from inventory)" },
  { value: "Lost/Damaged", label: "Lost / Damaged", description: "Wasted (removed from inventory)" },
  { value: "Returned", label: "Returned", description: "Handed back (returned to available inventory)" },
];

export default function UpdateStatusModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [actionType, setActionType] = useState("");
  const [actiqAmount, setActiqAmount] = useState("1");
  const [includeOtherDrugs, setIncludeOtherDrugs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sigRef = useRef<SignaturePadHandle>(null);

  const handleSubmit = async () => {
    if (!actionType) {
      setError("Please select an action");
      return;
    }

    const actiqCount = parseInt(actiqAmount) || 0;
    if (actiqCount <= 0 && !includeOtherDrugs) {
      setError("Please specify items to update");
      return;
    }

    if (actiqCount > assignment.actiqBalance) {
      setError(`Cannot process more than ${assignment.actiqBalance} Actiqs`);
      return;
    }

    // Signature required for returns
    if (actionType === "Returned" && sigRef.current?.isEmpty()) {
      setError("Signature is required for returns");
      return;
    }

    setSaving(true);
    setError("");

    const signatureData = actionType === "Returned" ? sigRef.current?.toDataURL() : null;

    const res = await fetch("/api/assignments/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soldierId: assignment.soldierId,
        actionType,
        actiqAmount: actiqCount,
        otherDrugsText: includeOtherDrugs ? assignment.otherDrugsText : null,
        signatureData,
      }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update status");
    }
    setSaving(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Update Drug Status" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Soldier Info */}
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3">
          <p className="text-sm font-medium">{assignment.soldier.fullName}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {assignment.soldier.job} | ID: {assignment.soldier.militaryId}
          </p>
        </div>

        {/* Current Holdings */}
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Current Holdings</p>
          <div className="flex gap-4">
            <div>
              <span className="text-lg font-bold">{assignment.actiqBalance}</span>
              <span className="text-xs text-stone-500 ml-1">Actiqs</span>
            </div>
            {assignment.otherDrugsText && (
              <div className="text-sm text-stone-600 dark:text-stone-400">
                + Other drugs assigned
              </div>
            )}
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Action</label>
          <div className="space-y-2">
            {ACTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActionType(opt.value)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  actionType === opt.value
                    ? "border-[#5c6b3c] bg-[#5c6b3c]/5"
                    : "border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500"
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        {assignment.actiqBalance > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Actiq Amount</label>
            <input
              type="number"
              min="0"
              max={assignment.actiqBalance}
              value={actiqAmount}
              onChange={(e) => setActiqAmount(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
            />
            <p className="text-xs text-stone-400 mt-1">Max: {assignment.actiqBalance}</p>
          </div>
        )}

        {/* Include other drugs */}
        {assignment.otherDrugsText && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOtherDrugs}
              onChange={(e) => setIncludeOtherDrugs(e.target.checked)}
              className="rounded border-stone-300 text-[#5c6b3c] focus:ring-[#5c6b3c]"
            />
            <span className="text-sm">Include other drugs in this action</span>
          </label>
        )}

        {/* Signature for Returns */}
        {actionType === "Returned" && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Soldier Signature <span className="text-red-500">*</span>
            </label>
            <SignaturePad ref={sigRef} />
          </div>
        )}

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
            disabled={saving || !actionType}
            className="flex-1 px-4 py-2.5 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
