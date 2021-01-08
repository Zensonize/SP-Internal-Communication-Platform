import { useEffect, useState } from 'react';

const useDarkMode = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const isDarkMode = colorScheme.matches;

    if (isDarkMode) {
      setTheme('dark');
    }

    colorScheme.onchange = (e) => {
      if (e.matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    };
    return () => (colorScheme.onchange = null);
  }, []);

  return [theme, setTheme];
};

export { useDarkMode };
