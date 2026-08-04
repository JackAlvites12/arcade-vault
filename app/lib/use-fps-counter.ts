"use client";

import { useEffect, useState } from "react";

export function useFpsCounter(enabled: boolean): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let frames = 0;
    let lastSample = performance.now();

    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - lastSample;
      if (elapsed >= 500) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastSample = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return fps;
}
