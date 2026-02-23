"use client";

import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { useTheme } from "next-themes";

export interface SignaturePadHandle {
  toDataURL: () => string;
  isEmpty: () => boolean;
  clear: () => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ width = 400, height = 200 }, ref) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sigRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [SigCanvas, setSigCanvas] = useState<any>(null);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    useEffect(() => {
      setMounted(true);
      import("react-signature-canvas").then((mod) => {
        setSigCanvas(() => mod.default);
      });
    }, []);

    useImperativeHandle(ref, () => ({
      toDataURL: () => sigRef.current?.toDataURL("image/png") || "",
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      clear: () => sigRef.current?.clear(),
    }));

    if (!mounted || !SigCanvas) {
      return (
        <div
          className="signature-canvas inline-block bg-stone-50 dark:bg-stone-700/50 flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-xs text-stone-400">Loading signature pad...</span>
        </div>
      );
    }

    return (
      <div>
        <div className="signature-canvas inline-block">
          <SigCanvas
            ref={sigRef}
            canvasProps={{
              width,
              height,
              className: "rounded-lg",
              style: { background: isDark ? "#292524" : "#ffffff" },
            }}
            backgroundColor={isDark ? "#292524" : "#ffffff"}
            penColor={isDark ? "#ffffff" : "#1a1a1a"}
          />
        </div>
        <div>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="mt-2 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          >
            Clear signature
          </button>
        </div>
      </div>
    );
  }
);

export default SignaturePad;
