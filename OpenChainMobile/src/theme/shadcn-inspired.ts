import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const colors = {
  background: {
    primary: '#000000',
    secondary: '#1A1A1A',
    card: '#1C1C1E',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  foreground: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    tertiary: '#6B6B6B',
  },
  border: {
    primary: '#3A3A3C',
    secondary: '#2A2A2C',
  },
  primary: {
    DEFAULT: '#3B82F6', // A vibrant blue
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#1C1C1E',
    foreground: '#FFFFFF',
  },
  destructive: {
    DEFAULT: '#EF4444', // A strong red
    foreground: '#FFFFFF',
  },
  muted: {
    DEFAULT: '#3A3A3C',
    foreground: '#A0A0A0',
  },
  accent: {
    DEFAULT: '#FBBF24', // A warm yellow/gold
    foreground: '#000000',
  },
  success: {
    DEFAULT: '#22C55E', // A clear green
    foreground: '#FFFFFF',
  },
  warning: {
    DEFAULT: '#F97316', // A bright orange
    foreground: '#FFFFFF',
  },
  info: {
    DEFAULT: '#0EA5E9', // A sky blue
    foreground: '#FFFFFF',
  },
  ring: '#3B82F6', // Consistent with primary blue
};

const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.foreground.primary,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground.primary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground.primary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground.primary,
  },
  body: {
    fontSize: 16,
    color: colors.foreground.secondary,
  },
  small: {
    fontSize: 14,
    color: colors.foreground.tertiary,
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};

const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  width,
  height,
};
