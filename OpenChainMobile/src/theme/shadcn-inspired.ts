// Shadcn/ui inspired theme for React Native
// Dark theme with black background and white accents

const ShadcnColors = {
  // Base colors inspired by Shadcn/ui dark theme
  background: {
    primary: '#000000',        // Pure black background
    secondary: '#0a0a0a',      // Slightly lighter black
    tertiary: '#171717',       // Dark gray
    card: '#0a0a0a',          // Card background
    muted: '#171717',         // Muted background
    accent: '#1a1a1a',        // Accent background
    destructive: '#7f1d1d',   // Destructive background
  },
  
  foreground: {
    primary: '#ffffff',        // Pure white text
    secondary: '#a1a1aa',      // Gray text
    muted: '#71717a',         // Muted text
    accent: '#ffffff',        // Accent text
    destructive: '#fca5a5',   // Destructive text
  },
  
  border: {
    primary: '#27272a',       // Primary border
    secondary: '#3f3f46',     // Secondary border
    accent: '#52525b',        // Accent border
    destructive: '#991b1b',   // Destructive border
  },
  
  button: {
    primary: {
      background: '#ffffff',
      foreground: '#000000',
      hover: '#f4f4f5',
    },
    secondary: {
      background: '#27272a',
      foreground: '#ffffff',
      hover: '#3f3f46',
    },
    destructive: {
      background: '#dc2626',
      foreground: '#ffffff',
      hover: '#b91c1c',
    },
    outline: {
      background: 'transparent',
      foreground: '#ffffff',
      border: '#27272a',
      hover: '#0a0a0a',
    },
    ghost: {
      background: 'transparent',
      foreground: '#ffffff',
      hover: '#0a0a0a',
    },
  },
  
  input: {
    background: '#000000',
    foreground: '#ffffff',
    border: '#27272a',
    placeholder: '#71717a',
    focus: '#52525b',
  },
  
  status: {
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Network colors
  network: {
    ethereum: '#627eea',
    solana: '#9945ff',
    polygon: '#8247e5',
  }
};

const ShadcnTypography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const ShadcnSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

const ShadcnBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const theme = {
  colors: ShadcnColors,
  typography: ShadcnTypography,
  spacing: ShadcnSpacing,
  borderRadius: ShadcnBorderRadius,
};

export const ShadcnShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};
