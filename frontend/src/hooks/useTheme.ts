import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const isDark = context.theme === 'dark' || (context.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const setIsDark = (val: boolean) => {
    context.setTheme(val ? 'dark' : 'light');
  };

  return { isDark, setIsDark, theme: context.theme, setTheme: context.setTheme };
};
