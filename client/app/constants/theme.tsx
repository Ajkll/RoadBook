import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export type ThemeColors = {
  // Couleurs de base
  background: string;
  backgroundText: string;
  backgroundTextSoft: string;
  backgroundIcon: string;
  border: string;

  // Couleurs primaires
  primary: string;
  primaryDark: string;
  primaryDarker: string;
  primaryText: string;
  primaryTextSoft: string;
  primaryIcon: string;

  // Alert bouttons
  danger: string;
  dangerText: string;

  // Couleurs secondaires
  secondary: string;
  secondaryDark: string;
  secondaryDarker: string;
  secondaryText: string;
  secondaryIcon: string;

  // Eléments interface
  activeItem: string;
  inactiveItem: string;

  // Etats et alertes
  success: string;
  error: string;
  warning: string;
  info: string;

  // destructive elements
  destructive: string;
  destructiveText: string;

  // loading
  loadingIndicator: {
    text: string;
    background: string;
    activityIndicator: string;
  }

  // Autres
  red: string;
  test: string;

  //  groupes organiser
  ui: {
    progressBar: {
      background: string;
      fill: string;
    };
    cleanupButton: {
      background: string;
      text: string;
      border: string;
    };
    card: {
      background: string;
      border: string;
    };
    button: {
      primary: string;
      primaryText: string;
      secondary: string;
      secondaryText: string;
      danger: string;
      dangerText: string;
    };
    status: {
      success: string;
      error: string;
      warning: string;
      info: string;
    };
    map: {
      polyline: {
        default: string;
        options: Array<{
          color: string;
          label: string;
        }>;
      };
      timerBackground: string;
      timerText: string;
      recenterButton: string;
      recenterIcon: string;
    };
    modal: {
      overlay: string;
      background: string;
    };
    tabBar: {
      background: string;
      active: string;
      inactive: string;
    };
  };
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: { // Couleurs plus vifs
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
    success: '#7bdb7e',
    error: '#c26b64',
    warning: '#ffb74d',
    info: '#64b5f6',
    red: '#e57373',
    test: '#ff0000',
    destructive: '#e53935',
    destructiveText: '#ffffff',
    danger: '#e53935',
    dangerText: '#ffffff',
    loadingIndicator: {
      text: '#666666',
      background: '#f5f5f5',
      activityIndicator: '#7CA7D8',
    },
    ui: {
      progressBar: {
        background: '#e0e0e0',
        fill: '#7CA7D8',
      },
      cleanupButton: {
        background: '#e53935',
        text: '#ffffff',
        border: '#b71c1c',
      },
      map: {
        polyline: {
          default: 'rgba(0, 122, 255, 0.8)',
          options: [
            { color: 'rgba(0, 122, 255, 0.8)', label: 'Classique' },
            { color: 'rgba(255, 0, 0, 0.8)', label: 'Contraste' },
            { color: 'rgba(255, 255, 0, 0.8)', label: 'Daltonien' },
          ]
        },
        timerBackground: 'rgba(0, 0, 0, 0.7)',
        timerText: '#ffffff',
        recenterButton: 'rgba(200, 200, 255, 0.7)',
        recenterIcon: '#007AFF'
      },
      modal: {
        overlay: '#000000',
        background: '#ffffff'
      },
      card: {
        background: '#ffffff',
        border: '#e0e0e0',
      },
      button: {
        primary: '#7CA7D8',
        primaryText: '#ffffff',
        secondary: '#D9D9D9',
        secondaryText: '#6A6A6A',
        danger: '#e57373',
        dangerText: '#ffffff',
      },
      status: {
        success: '#7bdb7e',
        error: '#e57373',
        warning: '#ffb74d',
        info: '#64b5f6',
      },
      tabBar: {
        background: '#ffffff',
        active: '#7CA7D8',
        inactive: '#919191',
      },
    },
  },
  dark: { // Couleurs plus tèrnes
    background: '#1E1E1E',
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
    secondary: '#2E2E2E',
    secondaryDark: '#3E3E3E',
    secondaryDarker: '#4E4E4E',
    secondaryText: '#D9D9D9',
    secondaryIcon: '#fff',
    activeItem: '#7CA7D8',
    inactiveItem: '#D9D9D9',
    success: '#81c784',
    error: '#e57373',
    warning: '#ffb74d',
    danger: '#c62828',
    dangerText: '#ffffff',
    info: '#64b5f6',
    red: '#e57373',
    test: '#ff0000',
    destructive: '#c62828',
    destructiveText: '#ffffff',
    loadingIndicator: {
      text: '#aaaaaa',
      background: '#2a2a2a',
      activityIndicator: '#7CA7D8',
    },
    ui: {
      progressBar: {
        background: '#424242',
        fill: '#7CA7D8',
      },
      card: {
        background: '#2E2E2E',
        border: '#3A3A3A',
      },
      button: {
        primary: '#7CA7D8',
        primaryText: '#ffffff',
        secondary: '#3E3E3E',
        secondaryText: '#D9D9D9',
        danger: '#d32f2f',
        dangerText: '#ffffff',
      },
      cleanupButton: {
        background: '#c62828',
        text: '#ffffff',
        border: '#8e0000',
      },
      map: {
        polyline: {
          default: 'rgba(100, 200, 255, 0.8)',
          options: [
            { color: 'rgba(100, 200, 255, 0.8)', label: 'Classique' },
            { color: 'rgba(255, 100, 100, 0.8)', label: 'Contraste' },
            { color: 'rgba(255, 255, 100, 0.8)', label: 'Daltonien' },
          ]
        },
        timerBackground: 'rgba(255, 255, 255, 0.2)',
        timerText: '#ffffff',
        recenterButton: 'rgba(100, 100, 150, 0.7)',
        recenterIcon: '#7CA7D8'
      },

      modal: {
        overlay: '#000000',
        background: '#2E2E2E'
      },
      status: {
        success: '#81c784',
        error: '#e57373',
        warning: '#ffb74d',
        info: '#64b5f6',
      },
      tabBar: {
        background: '#1E1E1E',
        active: '#7CA7D8',
        inactive: '#757575',
      },
    },
  },
};

export type Theme = {
  colors: ThemeColors;
  dark: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  shadow: {
    sm: any;
    md: any;
    lg: any;
    xl: any;
  };
  typography: {
    header: {
      fontSize: number;
      fontWeight: FontWeight;
    };
    title: {
      fontSize: number;
      fontWeight: FontWeight;
    };
    subtitle: {
      fontSize: number;
      fontWeight: FontWeight;
    };
    body: {
      fontSize: number;
      fontWeight: FontWeight;
    };
    caption: {
      fontSize: number;
      fontWeight: FontWeight;
    };
    button: {
      fontSize: number;
      fontWeight: FontWeight;
      textTransform: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    };
  };
};

const ThemeContext = createContext<Theme>({
  colors: Colors.light,
  dark: false,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 74,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
  },
  typography: {
    header: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
    },
    body: {
      fontSize: 14,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
    },
    button: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  },
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme: Theme = {
    colors: isDark ? Colors.dark : Colors.light,
    dark: isDark,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 74,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      xlarge: 16,
    },
    shadow: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      },
      xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 12,
      },
    },
    typography: {
      header: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      title: {
        fontSize: 20,
        fontWeight: '600',
      },
      subtitle: {
        fontSize: 16,
        fontWeight: '500',
      },
      body: {
        fontSize: 14,
        fontWeight: 'normal',
      },
      caption: {
        fontSize: 12,
        fontWeight: 'normal',
      },
      button: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
      },
    },
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// Helper pour les ombres
export const getShadowStyle = (theme: Theme) => ({
  shadowColor: theme.colors.border,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: theme.dark ? 0.3 : 0.2,
  shadowRadius: theme.dark ? 4 : 3,
  elevation: theme.dark ? 5 : 4,
});

// Helper pour les bordures
export const getBorderStyle = (theme: Theme, size: 'small' | 'medium' | 'large' = 'small') => ({
  borderColor: theme.colors.border,
  borderWidth: size === 'small' ? 1 : size === 'medium' ? 1.5 : 2,
  borderRadius: theme.borderRadius.medium,
});