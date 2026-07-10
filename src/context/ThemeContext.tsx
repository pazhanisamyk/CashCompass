import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types/types';
import { storage } from '../utils/storage';


interface ThemeContextProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currency: string;
  setCurrency: (currency: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  formatCurrency: (amount: number) => string;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = storage.getItem('app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      theme: 'light',
      currency: 'USD',
      language: 'en',
    };
  });

  useEffect(() => {
    storage.setItem('app_settings', JSON.stringify(settings));
    
    const root = window.document.documentElement;

    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  const setTheme = (theme: 'light' | 'dark') => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setCurrency = (currency: string) => {
    setSettings((prev) => ({ ...prev, currency }));
  };

  const setLanguage = (language: string) => {
    setSettings((prev) => ({ ...prev, language }));
  };

  const formatCurrency = (amount: number) => {
    const currencyObj = currencies.find(c => c.code === settings.currency) || currencies[0];
    try {
      return new Intl.NumberFormat(settings.language === 'zh' ? 'zh-CN' : settings.language, {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${currencyObj.symbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        setTheme,
        currency: settings.currency,
        setCurrency,
        language: settings.language,
        setLanguage,
        formatCurrency,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
