"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";
import Papa from "papaparse";
import AssignDrugModal from "./AssignDrugModal";
import UpdateStatusModal from "./UpdateStatusModal";
import DashboardCharts from "./DashboardCharts";
import { formatDate } from "@/lib/constants";

interface Assignment {
  id: string;
  soldierId: string;
  actiqBalance: number;
  otherDrugsText: string | null;
  lastAssignedDate: string;
  lastAssignedBy: string;
  soldier: {
    id: string;
    fullName: string;
    job: string;
    militaryId: string;
  };
  assignedBy: {
    fullName: string;
  };
}

interface DashboardData {
  totalActiqs: number;
  assignedActiqs: number;
  availableActiqs: number;
  usedActiqs: number;
  roleDistribution: Record<string, { count: number; totalActiqs: number }>;
  otherDrugsRoleDistribution: Record<string, number>;
}

export default function DashboardPage() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [updateStatusSoldier, setUpdateStatusSoldier] = useState<Assignment | null>(null);
  const [viewOtherDrugs, setViewOtherDrugs] = useState<string | null>(null);
  const [filterJob, setFilterJob] = useState<string>("");
  const importRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    const [dashRes, assignRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/assignments"),
    ]);
    if (dashRes.ok) setDashData(await dashRes.json());
    if (assignRes.ok) setAssignments(await assignRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportAssignments = () => {
    const csvData = assignments.map((a) => ({
      "Military ID": a.soldier.militaryId,
      "Soldier Name": a.soldier.fullName,
      Job: a.soldier.job,
      Actiqs: a.actiqBalance,
      "Other Drugs": a.otherDrugsText || "",
      "Last Assigned Date": a.lastAssignedDate,
      "Assigned By": a.assignedBy.fullName,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assignments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAssignments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch("/api/assignments/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: results.data }),
        });
        const data = await res.json();
        if (data.imported > 0) {
          setToast({ message: `${data.imported} assignments imported successfully`, type: "success" });
          fetchData();
        }
        if (data.errors?.length > 0) {
          setToast({ message: data.errors.join("; "), type: "error" });
        }
      },
    });
    if (importRef.current) importRef.current.value = "";
  };

  const filteredAssignments = filterJob
    ? assignments.filter((a) => a.soldier.job === filterJob)
    : assignments;

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
    <div className="flex items-center justify-between py-3">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <button
        onClick={() => setShowAssignModal(true)}
        className="px-4 py-2 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors"
      >
        + Assign Drug
      </button>
    </div>
  );

  return (
    <AppShell stickyHeader={stickyHeader}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm min-w-0">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 truncate">Total Actiqs</p>
          <p className="text-2xl font-bold truncate">{dashData?.totalActiqs || 0}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm min-w-0">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 truncate">Available</p>
          <p className="text-2xl font-bold text-[#5c6b3c] truncate">{dashData?.availableActiqs || 0}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm min-w-0">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1 truncate">Assigned</p>
          <p className="text-2xl font-bold text-amber-600 truncate">{dashData?.assignedActiqs || 0}</p>
        </div>
      </div>

      {/* Charts */}
      {dashData && (
        <DashboardCharts
          dashData={dashData}
          onRoleClick={(job) => setFilterJob(filterJob === job ? "" : job)}
          activeFilter={filterJob}
        />
      )}

      {/* Assigned Drugs */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Assigned Drugs</h2>
          <div className="flex items-center gap-2">
            {filterJob && (
              <button onClick={() => setFilterJob("")} className="text-xs text-[#5c6b3c] hover:underline">
                Clear filter: {filterJob}
              </button>
            )}
            <button
              onClick={handleExportAssignments}
              className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              Export CSV
            </button>
            <label className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-xs font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors cursor-pointer">
              Import CSV
              <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportAssignments} />
            </label>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredAssignments.length === 0 && (
            <p className="text-center py-12 text-stone-500 dark:text-stone-400 text-sm">No active drug assignments</p>
          )}
          {filteredAssignments.map((a) => (
            <div key={a.id} className="bg-white dark:bg-stone-800 rounded-xl shadow-sm px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{a.soldier.fullName}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{a.soldier.militaryId}</p>
                </div>
                <button
                  onClick={() => setUpdateStatusSoldier(a)}
                  className="shrink-0 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                >
                  Update Status
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                <span><span className="text-stone-400 dark:text-stone-500">Job </span>{a.soldier.job}</span>
                <span><span className="text-stone-400 dark:text-stone-500">Actiqs </span><strong>{a.actiqBalance}</strong></span>
                <span><span className="text-stone-400 dark:text-stone-500">Date </span>{formatDate(a.lastAssignedDate)}</span>
                <span><span className="text-stone-400 dark:text-stone-500">By </span>{a.assignedBy.fullName}</span>
              </div>
              {a.otherDrugsText && (
                <button
                  onClick={() => setViewOtherDrugs(a.otherDrugsText)}
                  className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50"
                >
                  View Other Drugs
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white dark:bg-stone-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Soldier</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Job</th>
                <th className="text-center px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Actiqs</th>
                <th className="text-center px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Other</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Date</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Assigned By</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                  <td className="px-4 py-3 font-medium">{a.soldier.fullName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded text-xs font-medium">
                      {a.soldier.job}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{a.actiqBalance}</td>
                  <td className="px-4 py-3 text-center">
                    {a.otherDrugsText ? (
                      <button
                        onClick={() => setViewOtherDrugs(a.otherDrugsText)}
                        className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-stone-300 dark:text-stone-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{formatDate(a.lastAssignedDate)}</td>
                  <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{a.assignedBy.fullName}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setUpdateStatusSoldier(a)}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-500 dark:text-stone-400">
                    No active drug assignments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Drug Modal */}
      {showAssignModal && (
        <AssignDrugModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            setToast({ message: "Drugs assigned successfully", type: "success" });
            fetchData();
          }}
        />
      )}

      {/* Update Status Modal */}
      {updateStatusSoldier && (
        <UpdateStatusModal
          assignment={updateStatusSoldier}
          onClose={() => setUpdateStatusSoldier(null)}
          onSuccess={() => {
            setUpdateStatusSoldier(null);
            setToast({ message: "Status updated successfully", type: "success" });
            fetchData();
          }}
        />
      )}

      {/* View Other Drugs Modal */}
      <Modal isOpen={!!viewOtherDrugs} onClose={() => setViewOtherDrugs(null)} title="Other Assigned Drugs">
        <div className="whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          {viewOtherDrugs}
        </div>
      </Modal>
    </AppShell>
  );
}
