'use client';
import { useEffect, useState } from 'react';

/**
 * Bumps on every theme-related mutation (dark/light class, data-theme, custom
 * accent overrides on <html>). Canvas-based charts (Chart.js) can't resolve
 * CSS var() at draw time, so components that color a chart from a CSS custom
 * property must re-read getComputedStyle() on each bump instead of caching
 * a var() string.
 */
export function useThemeVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const obs = new MutationObserver(() => setVersion(v => v + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    return () => obs.disconnect();
  }, []);

  return version;
}
