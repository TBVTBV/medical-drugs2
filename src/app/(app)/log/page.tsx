"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import Papa from "papaparse";
import { formatDateTime } from "@/lib/constants";

interface ActionLog {
  id: string;
  actionType: string;
  actiqAmount: number;
  otherDrugsText: string | null;
  timestamp: string;
  signatureImageUrl: string | null;
  admin: {
    fullName: string;
  };
  soldier: {
    fullName: string;
    militaryId: string;
    job: string;
  };
}

const actionColors: Record<string, string> = {
  Received: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  "Shipment Removed": "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  Given: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  Administered: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  Returned: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  "Lost/Damaged": "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

const actionLabels: Record<string, string> = {
  Received: "Shipment Received",
  "Shipment Removed": "Shipment Removed",
  Given: "Was Given",
  Administered: "Administered",
  Returned: "Returned",
  "Lost/Damaged": "Lost / Damaged",
};

export default function LogPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSignature, setViewSignature] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/action-logs");
    if (res.ok) {
      setLogs(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    const csvData = logs.map((log) => ({
      "Action Type": actionLabels[log.actionType] || log.actionType,
      "Actiq Amount": log.actiqAmount,
      "Other Drugs": log.otherDrugsText || "",
      Timestamp: formatDateTime(log.timestamp),
      Admin: log.admin.fullName,
      Soldier: log.soldier.fullName,
      "Soldier ID": log.soldier.militaryId,
      "Has Signature": log.signatureImageUrl ? "Yes" : "No",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `action_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueUsers = Array.from(
    new Map(logs.map((l) => [l.soldier.militaryId, l.soldier])).values()
  ).sort((a, b) => a.fullName.localeCompare(b.fullName));

  const filteredLogs = logs.filter((l) => {
    if (filterType && l.actionType !== filterType) return false;
    if (filterUser && l.soldier.militaryId !== filterUser) return false;
    return true;
  });

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c6b3c]"></div>
        </div>
      </AppShell>
    );
  }

  const stickyHeader = (
    <div>
      <div className="flex items-center justify-between py-3">
        <h1 className="text-xl font-bold">Log</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
        >
          Export CSV
        </button>
      </div>
      <div className="flex gap-2 pb-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        >
          <option value="">All Actions</option>
          {Object.entries(actionLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-[#5c6b3c]"
        >
          <option value="">All Soldiers</option>
          {uniqueUsers.map((u) => (
            <option key={u.militaryId} value={u.militaryId}>{u.fullName}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <AppShell stickyHeader={stickyHeader}>
      {/* Log Feed */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.actionType] || "bg-stone-100"}`}>
                {actionLabels[log.actionType] || log.actionType}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {formatDateTime(log.timestamp)}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              {log.actiqAmount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500 dark:text-stone-400">Actiq:</span>
                  <span className="font-semibold">{log.actiqAmount}</span>
                </div>
              )}
              {log.otherDrugsText && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-stone-500 dark:text-stone-400 shrink-0">Other:</span>
                  <span className="text-stone-700 dark:text-stone-300">{log.otherDrugsText}</span>
                </div>
              )}
              {(log.actionType === "Received" || log.actionType === "Shipment Removed") ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-stone-500 dark:text-stone-400">
                    {log.actionType === "Received" ? "Received by:" : "Removed by:"}
                  </span>
                  <span className="font-medium">{log.admin.fullName}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-500 dark:text-stone-400">By:</span>
                    <span className="font-medium">{log.admin.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-stone-500 dark:text-stone-400">To:</span>
                    <span className="font-medium">{log.soldier.fullName}</span>
                    <span className="text-xs text-stone-400">({log.soldier.militaryId})</span>
                  </div>
                </>
              )}
            </div>

            {log.signatureImageUrl && (
              <button
                onClick={() => setViewSignature(log.signatureImageUrl)}
                className="mt-3 text-xs text-[#5c6b3c] dark:text-[#7a8c56] hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                View Signature
              </button>
            )}
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-stone-500 dark:text-stone-400">
            <p>No log entries found</p>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      <Modal isOpen={!!viewSignature} onClose={() => setViewSignature(null)} title="Signature">
        {viewSignature && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewSignature} alt="Signature" className="max-w-full border rounded-lg dark:invert" />
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
