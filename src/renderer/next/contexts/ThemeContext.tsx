import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDarkState] = useState(false);

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');
    const initTheme = async () => {
      const savedTheme = await ipcRenderer.invoke('get-setting', 'theme-mode');
      const dark = savedTheme === 'dark';
      setIsDarkState(dark);
      updateDOM(dark);
    };
    initTheme();

    const handleThemeChange = (e: any) => {
      const dark = e.detail === 'dark';
      setIsDarkState(dark);
      updateDOM(dark);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const updateDOM = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const setIsDark = async (dark: boolean) => {
    const { ipcRenderer } = window.require('electron');
    await ipcRenderer.invoke('set-setting', {
      key: 'theme-mode',
      value: dark ? 'dark' : 'light',
    });
    window.dispatchEvent(new CustomEvent('theme-change', { detail: dark ? 'dark' : 'light' }));
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
