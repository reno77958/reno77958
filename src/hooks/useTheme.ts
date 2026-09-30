import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('chordjitu_dark_mode') || localStorage.getItem('chordtela_dark_mode');
      return stored ? JSON.parse(stored) : false; // Default to classic clean light theme
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chordjitu_dark_mode', JSON.stringify(isDarkMode));
    } catch (e) {
      console.error(e);
    }

    // Toggle the 'dark' class on <html> element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-950');
      document.body.classList.remove('bg-slate-100');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-slate-100');
      document.body.classList.remove('bg-slate-950');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return { isDarkMode, toggleTheme };
}
