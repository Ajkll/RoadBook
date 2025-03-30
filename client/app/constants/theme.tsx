// app/constants/theme.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Define your color palette
export const Colors = {
  light: {
    background: '#ffffff',
    backgroundText: '#6A6A6A',
    backgroundTextSoft: '#919191',
    backgroundIcon: '#6A6A6A',
    border: '#3A3A3A',
    primary: '#7CA7D8',
    primaryDark: '#73A3DA',
    primaryDarker: '#6B98CC',
    primaryText: '#ffffff',
    primaryTextSoft: '#D9D9D9',
    primaryIcon: '#D9D9D9',
    secondary: '#D9D9D9',
    secondaryDark: '#D0CFCF',
    secondaryDarker: '#BFBFBF',
    secondaryText: '#6A6A6A',
    secondaryIcon: '#7CA7D8',
    activeItem: '#5F5F5F',
    inactiveItem: '#7CA7D8',
    red: '#e57373',
    test: '#ff0000',
  },
  dark: {
    background: '#5F5F5F',
    backgroundText: '#ffffff',
    backgroundTextSoft: '#D9D9D9',
    backgroundIcon: '#D9D9D9',
    border: '#3A3A3A',
    primary: '#7CA7D8',
    primaryDark: '#73A3DA',
    primaryDarker: '#6B98CC',
    primaryText: '#ffffff',
    primaryTextSoft: '#D9D9D9',
    primaryIcon: '#D9D9D9',
    secondary: '#D9D9D9',
    secondaryDark: '#D0CFCF',
    secondaryDarker: '#BFBFBF',
    secondaryText: '#6A6A6A',
    secondaryIcon: '#7CA7D8',
    activeItem: '#7CA7D8',
    inactiveItem: '#D9D9D9',
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
