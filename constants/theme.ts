export const colors = {
  // Base colors
  black: '#000000',
  white: '#FFFFFF', // Keeping white for pure contrast, but primarily using pink/blue for text/accents

  // High-fidelity palette
  skyBlue: '#00BFFF',
  babyPink: '#FFB6C1',

  // Mapped accents
  primary: '#00BFFF', // Sky Blue
  secondary: '#FFB6C1', // Baby Pink

  // Backgrounds
  background: '#000000',
  surface: '#0D0D0D',

  // Glassmorphic backgrounds (tinted with pink/blue)
  glass: {
    dark: 'rgba(0, 0, 0, 0.8)',
    medium: 'rgba(0, 217, 255, 0.1)', // Sky Blue tint
    light: 'rgba(255, 134, 181, 0.1)', // Baby Pink tint
    subtle: 'rgba(0, 0, 0, 0.9)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#00D9FF', // Sky Blue
    tertiary: '#FF86B5', // Baby Pink
  },

  // Status colors (mapped to palette)
  success: '#00D9FF', // Using Sky Blue
  error: '#FF86B5', // Using Baby Pink
  warning: '#FF86B5',

  // Border colors
  border: {
    subtle: 'rgba(0, 217, 255, 0.2)', // Sky Blue border
    medium: 'rgba(255, 134, 181, 0.3)', // Baby Pink border
    strong: 'rgba(0, 217, 255, 0.5)',
  },
};


export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1] as const,
    easeIn: [0.42, 0, 1, 1] as const,
    easeOut: [0, 0, 0.58, 1] as const,
    easeInOut: [0.42, 0, 0.58, 1] as const,
  },
};
