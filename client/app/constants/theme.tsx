import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  backgroundText: string;
  backgroundTextSoft: string;
  backgroundIcon: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryDarker: string;
  primaryText: string;
  primaryTextSoft: string;
  primaryIcon: string;
  secondary: string;
  secondaryDark: string;
  secondaryDarker: string;
  secondaryText: string;
  secondaryIcon: string;
  activeItem: string;
  inactiveItem: string;
  red: string;
  test: string;
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
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
    secondaryIcon: '#fff',
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
    secondaryIcon: '#fff',
    activeItem: '#7CA7D8',
    inactiveItem: '#D9D9D9',
    red: '#e57373',
    test: '#ff0000',
  },
};

// Définition du contexte avec un typage explicite
type ThemeContextType = {
  colors: ThemeColors;
  dark: boolean;
};

// Création du contexte
const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  dark: false,
});

// Props du ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

// ThemeProvider avec détection du mode clair/sombre
export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme: ThemeContextType = {
    colors: isDark ? Colors.dark : Colors.light,
    dark: isDark,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

// Hook pour récupérer le thème
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

// Créer un objet pour l'export
const theme = {
  Colors,
  ThemeContext,
  ThemeProvider,
  useTheme
};

export default theme;
