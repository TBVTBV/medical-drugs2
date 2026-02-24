"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import UsersTab from "./UsersTab";
import DrugManagementTab from "./DrugManagementTab";
import SettingsTab from "./SettingsTab";

const tabs = [
  { id: "users", label: "Soldiers" },
  { id: "drugs", label: "Drug Management" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  const stickyHeader = (
    <div>
      <div className="flex items-center justify-between pt-3 pb-2">
        <h1 className="text-xl font-bold">Management</h1>
        <div className="flex gap-2"></div>
      </div>
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[#5c6b3c] text-[#5c6b3c] dark:text-[#8fa55a] dark:border-[#8fa55a]"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell stickyHeader={stickyHeader}>
      {activeTab === "users" && <UsersTab />}
      {activeTab === "drugs" && <DrugManagementTab />}
      {activeTab === "settings" && <SettingsTab />}
    </AppShell>
  );
}
