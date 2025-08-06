// Professional theme colors for OpenChain Mobile
export const Colors = {
  // Background colors
  background: {
    primary: '#0A1128',      // Deep navy blue background
    secondary: '#111827',    // Slightly lighter secondary background
    card: '#1F2937',         // Dark card background for dark theme
    cardLight: '#FFFFFF',    // White cards for light theme or contrast
    cardGradientStart: '#1F2937', // Dark gradient start for dark theme
    cardGradientEnd: '#111827',   // Dark gradient end for dark theme
    cardLightGradientStart: '#FCFCFD', // Light gradient start for light elements
    cardLightGradientEnd: '#F9FAFB',   // Light gradient end for light elements
    accent: '#EEF2FF',       // Subtle accent color
    overlay: 'rgba(17, 24, 39, 0.8)', // Dark overlay with transparency
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',    // White text on dark backgrounds
    secondary: '#94A3B8',  // Refined gray for secondary info
    onCard: '#F1F5F9',     // Light text on dark cards
    onCardLight: '#0F172A',// Dark text on light cards
    accent: '#4F46E5',     // Accent text color (indigo)
    muted: '#64748B',      // Subtle muted text
    darkMuted: '#334155',  // Darker muted text for dark theme
  },
  
  // Button colors
  button: {
    primary: '#3B82F6',    // Bright blue primary button
    primaryHover: '#2563EB',
    secondary: '#10B981',  // Green secondary button
    secondaryHover: '#059669',
    danger: '#EF4444',     // Red danger button
    dangerHover: '#DC2626',
    warning: '#F59E0B',    // Orange warning button
    warningHover: '#D97706',
    onCard: '#1E40AF',     // Deep blue button on white cards
    onCardHover: '#1E3A8A',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Border colors
  border: {
    primary: '#1F2937',    // Dark border for dark theme
    light: '#E5E7EB',      // Light border for cards
    accent: '#818CF8',     // Indigo accent border
    highlight: '#4F46E5',  // Highlight border
  },
  
  // Network specific colors (from website)
  network: {
    ethereum: '#627EEA',
    polygon: '#8247E5',
    solana: '#9945FF',
    bitcoin: '#F7931A',
  },
  
  // Gradients
  gradients: {
    card: ['#1F2937', '#111827'],           // Dark card gradient
    cardLight: ['#F9FAFB', '#F3F4F6'],      // Light card gradient
    accentCard: ['#F9DDC7', '#FEF3C7'],     // Accent card gradient
    accentDark: ['#6B21A8', '#4C1D95'],     // Dark accent gradient
    primary: ['#031138', '#1E293B'],         // Primary dark gradient
    charts: ['#3B82F6', '#1E40AF'],         // Blue gradient for charts
    risk: ['#F43F5E', '#BE123C']            // Red gradient for risk indicators
  }
};

// Font configuration matching website
export const Typography = {
  fontFamily: {
    primary: 'System', // Use system font for React Native
    bold: 'System',    // System bold
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  }
};

// Spacing configuration
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadow configuration
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
