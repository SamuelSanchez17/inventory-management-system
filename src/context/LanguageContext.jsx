import { createContext, useState, useCallback } from 'react';
import translations from '../translations';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app-language') || 'es';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = useCallback(
    (key) => {
      const dict = translations[language] || translations.es;
      return dict[key] !== undefined ? dict[key] : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
