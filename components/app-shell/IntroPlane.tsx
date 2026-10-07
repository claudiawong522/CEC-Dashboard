"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/app-shell/BrandMark";

const KEY = "cec-intro-seen";

/**
 * cornellec.com opens on a black plane carrying the mark, which then lifts
 * away (introLift, 500ms). Here it plays once per browser session on the
 * first full page load and never on in-app navigation, since AppShell stays
 * mounted. Server-rendered visible, so the first paint is the plane rather
 * than a flash of the page; the effect removes it at once when it has
 * already been seen or motion is reduced.
 */
export function IntroPlane() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      if (!seen) sessionStorage.setItem(KEY, "1");
    } catch {
      seen = false;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(false), 1150);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black animate-introLift [animation-delay:650ms]"
    >
      <div className="flex items-center gap-4 animate-introMark">
        <BrandMark className="h-[44px] w-12" />
        <span className="t-display text-[22px] text-white">
          Cornell
          <br />
          Entrepreneurship Club
        </span>
      </div>
    </div>
  );
}
