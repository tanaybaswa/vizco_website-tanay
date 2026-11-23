"use client";

import { useEffect, useState, type ReactNode } from "react";
import { STAGE_EVENT } from "@/components/compass/CompassGame";

/** The landing sections below the game. They step aside while someone plays, and come back when they exit. */
export default function HideWhilePlaying({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setPlaying(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(STAGE_EVENT, on);
    return () => window.removeEventListener(STAGE_EVENT, on);
  }, []);
  return <div hidden={playing}>{children}</div>;
}
