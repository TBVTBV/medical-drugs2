"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("splashShown");
    if (shown) return;

    sessionStorage.setItem("splashShown", "1");
    setVisible(true);

    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#5c6b3c" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Badge_of_the_Israel_Defense_Forces.svg"
        alt="IDF Badge"
        width={160}
        height={160}
        className="mb-8 drop-shadow-lg"
      />
      <h1 className="text-white text-3xl font-bold tracking-wide">MedTrack</h1>
      <p className="text-white/60 text-sm mt-2 tracking-widest uppercase">
        Medical Drugs Distribution
      </p>
    </div>
  );
}
