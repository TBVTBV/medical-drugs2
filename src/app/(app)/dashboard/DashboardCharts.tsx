"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface DashboardData {
  totalActiqs: number;
  assignedActiqs: number;
  availableActiqs: number;
  usedActiqs: number;
  roleDistribution: Record<string, { count: number; totalActiqs: number }>;
  otherDrugsRoleDistribution: Record<string, number>;
}

const COLORS = ["#5c6b3c", "#c3b091", "#7a8c56", "#8b7355", "#a3b18a", "#d4c5a9"];
const ACTIQ_COLORS = ["#5c6b3c", "#d97706", "#7a8c56"];

export default function DashboardCharts({
  dashData,
  onRoleClick,
  activeFilter,
}: {
  dashData: DashboardData;
  onRoleClick: (job: string) => void;
  activeFilter: string;
}) {
  const actiqPieData = [
    { name: "Available", value: Math.max(0, dashData.availableActiqs) },
    { name: "Assigned", value: dashData.assignedActiqs },
    { name: "Used/Lost", value: dashData.usedActiqs },
  ].filter((d) => d.value > 0);

  const otherDrugsPieData = Object.entries(dashData.otherDrugsRoleDistribution).map(
    ([name, value]) => ({ name, value })
  );

  const roleGridData = Object.entries(dashData.roleDistribution);

  return (
    <div className="space-y-4">
      {/* Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Actiq Pie Chart */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">Actiq Distribution</h3>
          {actiqPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={actiqPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {actiqPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ACTIQ_COLORS[index % ACTIQ_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-stone-400">
              No inventory data
            </div>
          )}
        </div>

        {/* Other Drugs Role Distribution */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">Other Drugs by Role</h3>
          {otherDrugsPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={otherDrugsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {otherDrugsPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-stone-400">
              No other drug assignments
            </div>
          )}
        </div>
      </div>

      {/* Role Grid */}
      {roleGridData.length > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Actiq Assignments by Role</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {roleGridData.map(([job, data]) => (
              <button
                key={job}
                onClick={() => onRoleClick(job)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  activeFilter === job
                    ? "bg-[#5c6b3c] text-white"
                    : "bg-stone-50 dark:bg-stone-700/50 hover:bg-stone-100 dark:hover:bg-stone-700"
                }`}
              >
                <p className="text-xs font-medium opacity-70">{job}</p>
                <p className="text-lg font-bold">{data.count}</p>
                <p className="text-[10px] opacity-60">
                  {data.totalActiqs} Actiq{data.totalActiqs !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
