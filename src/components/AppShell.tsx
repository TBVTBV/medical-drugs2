"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "./BottomNav";

export default function AppShell({
  children,
  stickyHeader,
}: {
  children: React.ReactNode;
  stickyHeader?: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c6b3c]"></div>
      </div>
    );
  }

  if (!session) return null;

  const userRole = (session.user as Record<string, unknown>)?.systemRole as string;
  if (userRole !== "Admin" && userRole !== "Temp_Admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-stone-500 dark:text-stone-400">
            You do not have admin privileges to access this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {stickyHeader && (
        <div className="sticky top-0 z-30 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4">
            {stickyHeader}
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
