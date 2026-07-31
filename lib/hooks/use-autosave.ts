"use client";

import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

// Debounces `value` and calls `save` once it settles, only when it has
// actually changed from the value this hook mounted with — comparing against
// a fixed baseline (rather than an "is this the first render" flag) keeps
// this correct under React Strict Mode's double-invoked effects in dev.
export function useAutoSave<T>(value: T, save: (value: T) => Promise<void>, delay = 700) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const serialized = JSON.stringify(value);
  const baseline = useRef(serialized);

  useEffect(() => {
    if (serialized === baseline.current) return;

    setStatus("idle");
    const saveTimeout = setTimeout(() => {
      setStatus("saving");
      save(value)
        .then(() => {
          baseline.current = serialized;
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, delay);

    return () => clearTimeout(saveTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  useEffect(() => {
    if (status !== "saved") return;
    const idleTimeout = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(idleTimeout);
  }, [status]);

  return status;
}
