"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";
import AssignDrugModal from "./AssignDrugModal";
import UpdateStatusModal from "./UpdateStatusModal";
import DashboardCharts from "./DashboardCharts";

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

  return (
    <AppShell>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors"
        >
          + Assign Drug
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Total Actiqs</p>
          <p className="text-2xl font-bold">{dashData?.totalActiqs || 0}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Available</p>
          <p className="text-2xl font-bold text-[#5c6b3c]">{dashData?.availableActiqs || 0}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Assigned</p>
          <p className="text-2xl font-bold text-amber-600">{dashData?.assignedActiqs || 0}</p>
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

      {/* Assigned Drugs Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm mt-4">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h2 className="text-sm font-semibold">Assigned Drugs</h2>
          {filterJob && (
            <button
              onClick={() => setFilterJob("")}
              className="text-xs text-[#5c6b3c] hover:underline"
            >
              Clear filter: {filterJob}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Soldier</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden sm:table-cell">Job</th>
                <th className="text-center px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Actiqs</th>
                <th className="text-center px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Other</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 dark:text-stone-400 hidden lg:table-cell">Assigned By</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50 dark:hover:bg-stone-700/30">
                  <td className="px-4 py-3 font-medium">{a.soldier.fullName}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
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
                  <td className="px-4 py-3 text-stone-500 dark:text-stone-400 hidden md:table-cell">
                    {new Date(a.lastAssignedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-stone-500 dark:text-stone-400 hidden lg:table-cell">
                    {a.assignedBy.fullName}
                  </td>
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
