"use client";

import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

// Debounces `value` and calls `save` once it settles, only when it has
// actually changed from the value this hook mounted with — comparing against
// a fixed baseline (rather than an "is this the first render" flag) keeps
// this correct under React Strict Mode's double-invoked effects in dev.
//
// An edit still inside the debounce window is not dropped: it is saved
// straight away when the component unmounts (navigating to another page) or
// the page is hidden (closing the tab), since auto-save is the only save.
export function useAutoSave<T>(value: T, save: (value: T) => Promise<void>, delay = 700) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const serialized = JSON.stringify(value);
  const baseline = useRef(serialized);
  const saveRef = useRef(save);
  const pending = useRef<{ value: T; serialized: string } | null>(null);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (serialized === baseline.current) {
      pending.current = null;
      return;
    }

    setStatus("idle");
    pending.current = { value, serialized };
    const saveTimeout = setTimeout(() => {
      pending.current = null;
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
    const flush = () => {
      const next = pending.current;
      if (!next) return;
      pending.current = null;
      baseline.current = next.serialized;
      saveRef.current(next.value).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    if (status !== "saved") return;
    const idleTimeout = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(idleTimeout);
  }, [status]);

  return status;
}
