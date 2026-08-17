"use client";

import { useEffect, useRef } from "react";

export function useAutoScroll<T extends HTMLElement>(dependency: unknown) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [dependency]);

  return containerRef;
}
