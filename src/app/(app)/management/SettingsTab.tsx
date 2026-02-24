"use client";

import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SettingsTab() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Theme */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-5">
        <h2 className="text-base font-semibold mb-4">Theme</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
              theme === "light"
                ? "border-[#5c6b3c] bg-stone-50"
                : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-stone-200 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Light</p>
                <p className="text-xs text-stone-500">Default theme</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
              theme === "dark"
                ? "border-[#5c6b3c] bg-stone-700/50"
                : "border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-800 border border-stone-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Dark</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Low light mode</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm p-5">
        <h2 className="text-base font-semibold mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500 dark:text-stone-400">Signed in as</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500 dark:text-stone-400">Name</span>
            <span className="font-medium">{session?.user?.name}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}
