import { useState, useCallback, useEffect } from 'react';
import type { Theme } from '../lib/types';

const THEME_KEY = 'nomina-clara-theme';

/**
 * Theme toggle hook synced with the inline <script> in index.html.
 * The inline script reads localStorage and sets data-theme before React
 * hydrates, preventing FOUC. This hook reads the current data-theme
 * attribute and toggles it, keeping localStorage in sync.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.getAttribute('data-theme');
    return current === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Storage unavailable — silently skip
      }
      return next;
    });
  }, []);

  // Sync if data-theme changes outside React (e.g. from another tab)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark' || current === 'light') {
        setTheme(current);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return { theme, toggleTheme };
}
