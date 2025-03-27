// app/constants/theme.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Define your color palette
export const Colors = {
  light: {
    primary: '#4f89c5',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    secondaryText: '#757575',
    border: '#e0e0e0',
    tabBar: '#ffffff',
    tabBarInactive: '#888888',
    recordButton: '#ffffff',
    recordButtonBorder: '#4f89c5',
  },
  dark: {
    primary: '#4f89c5',
    background: '#333333',
    card: '#424242',
    text: '#ffffff',
    secondaryText: '#bdbdbd',
    border: '#444444',
    tabBar: '#303030',
    tabBarInactive: '#888888',
    recordButton: '#333333',
    recordButtonBorder: '#5c5c5c',
  },
};

// Define theme context type
type ThemeContextType = {
  colors: typeof Colors.light;
  dark: boolean;
};

// Create a theme context
const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  dark: false,
});

// Define props interface for ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component with proper typing
export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    colors: isDark ? Colors.dark : Colors.light,
    dark: isDark,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

// Hook to use theme
export function useTheme() {
  return useContext(ThemeContext);
}

export default Colors;
