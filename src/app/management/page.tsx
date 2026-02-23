"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import UsersTab from "./UsersTab";
import DrugManagementTab from "./DrugManagementTab";
import SettingsTab from "./SettingsTab";

const tabs = [
  { id: "users", label: "Users" },
  { id: "drugs", label: "Drug Management" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-4">Management</h1>
        <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "users" && <UsersTab />}
      {activeTab === "drugs" && <DrugManagementTab />}
      {activeTab === "settings" && <SettingsTab />}
    </AppShell>
  );
}
