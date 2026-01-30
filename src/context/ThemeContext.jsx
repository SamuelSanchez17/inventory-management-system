import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('app-theme') || 'sistema';
    return saved;
  });

  const [accentColor, setAccentColorState] = useState(() => {
    const saved = localStorage.getItem('app-accentColor') || 'rose';
    return saved;
  });

  const [textSize, setTextSizeState] = useState(() => {
    const saved = localStorage.getItem('app-textSize') || 'normal';
    return saved;
  });

  const [isSaved, setIsSaved] = useState(true);

  // Detectar preferencia del sistema
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  };

  const getActiveTheme = () => {
    if (theme === 'sistema') {
      return getSystemTheme();
    }
    return theme;
  };

  // Aplicar tema al documento
  useEffect(() => {
    const activeTheme = getActiveTheme();
    const root = document.documentElement;

    if (activeTheme === 'oscuro') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
      // Variables CSS para modo oscuro
      root.style.setProperty('--bg-primary', '#111827'); // gray-900
      root.style.setProperty('--bg-secondary', '#1f2937'); // gray-800
      root.style.setProperty('--bg-tertiary', '#374151'); // gray-700
      root.style.setProperty('--text-primary', '#f3f4f6'); // gray-100
      root.style.setProperty('--text-secondary', '#d1d5db'); // gray-300
      root.style.setProperty('--border-color', '#4b5563'); // gray-600
      root.style.setProperty('--sidebar-bg', '#1f2937');
      root.style.setProperty('--sidebar-border', '#374151');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
      // Variables CSS para modo claro
      root.style.setProperty('--bg-primary', '#fdf2f8'); // rose-50
      root.style.setProperty('--bg-secondary', '#fbecf8'); // rose-100
      root.style.setProperty('--bg-tertiary', '#f8dce9'); // rose-200
      root.style.setProperty('--text-primary', '#1f1f1f'); // casi negro
      root.style.setProperty('--text-secondary', '#666666'); // gris
      root.style.setProperty('--border-color', '#f8dce9'); // rose-200
      root.style.setProperty('--sidebar-bg', '#fce7f3'); // rose-100/80
      root.style.setProperty('--sidebar-border', '#fbcfe8'); // rose-200
    }
  }, [theme]);

  // Aplicar tamaño de texto
  useEffect(() => {
    if (textSize === 'grande') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [textSize]);

  // Aplicar color de acento como variable CSS
  useEffect(() => {
    const colorMap = {
      rose: 'rgb(244, 114, 182)',
      pink: 'rgb(236, 64, 122)',
      fuchsia: 'rgb(217, 70, 239)',
      purple: 'rgb(168, 85, 247)',
    };
    document.documentElement.style.setProperty('--accent-color', colorMap[accentColor]);
  }, [accentColor]);

  const savePreferences = () => {
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-accentColor', accentColor);
    localStorage.setItem('app-textSize', textSize);
    setIsSaved(true);
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    setIsSaved(false);
  };

  const setAccentColor = (newColor) => {
    setAccentColorState(newColor);
    setIsSaved(false);
  };

  const setTextSize = (newSize) => {
    setTextSizeState(newSize);
    setIsSaved(false);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      accentColor,
      setAccentColor,
      textSize,
      setTextSize,
      getActiveTheme,
      savePreferences,
      isSaved,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
