// app/constants/theme.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { blue, red } from 'react-native-reanimated/lib/typescript/Colors';

// Define your color palette
export const Colors = {
  light: {
    background: '#ffffff',
    card: '#7CA7D8',
    darkerBlue: '#7CA7D8',
    text: '#FFFFFF',
    secondaryText: '#5F5F5F',
    icon: '#D9D9D9',
    secondaryIcon: '#FFFFFF',
    tabBar: '#7CA7D8',
    drawerIcon: '#5F5F5F',
    activeItem: '#5F5F5F',
    border: '#444444',
    separation: '#444444',
    red: '#e57373',
    test: '#ff0000',
  },
  dark: {
    background: '#5F5F5F',
    card: '#7CA7D8',
    darkerBlue: '#7CA7D8',
    text: '#ffffff',
    secondaryText: '#D9D9D9',
    icon: '#D9D9D9',
    secondaryIcon: '#D9D9D9',
    tabBar: '#D9D9D9',
    drawerIcon: '#D9D9D9',
    activeItem: '#7CA7D8',
    border: '#444444',
    separation: '#444444',
    red: '#e57373',
    test: '#ff0000',
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
