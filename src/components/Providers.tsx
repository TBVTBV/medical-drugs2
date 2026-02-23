"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import SplashScreen from "./SplashScreen";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <SplashScreen />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
