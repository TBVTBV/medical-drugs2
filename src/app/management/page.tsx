"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import UsersTab, { type UsersTabHandle } from "./UsersTab";
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
  const router = useRouter();
  const usersTabRef = useRef<UsersTabHandle>(null);

  const stickyHeader = (
    <div>
      <div className="flex items-center justify-between pt-3 pb-2">
        <h1 className="text-xl font-bold">Management</h1>
        <div className="flex gap-2">
          {activeTab === "users" && (
            <>
              <button
                onClick={() => router.push("/management/users/new")}
                className="px-3 py-1.5 bg-[#5c6b3c] text-white rounded-lg text-sm font-medium hover:bg-[#4d5a32] transition-colors"
              >
                + Add User
              </button>
              <button
                onClick={() => usersTabRef.current?.export()}
                className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              >
                Export CSV
              </button>
            </>
          )}
        </div>
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
      {activeTab === "users" && <UsersTab ref={usersTabRef} />}
      {activeTab === "drugs" && <DrugManagementTab />}
      {activeTab === "settings" && <SettingsTab />}
    </AppShell>
  );
}
