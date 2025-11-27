/**
 * GemFitness Design System
 * Based on logo colors: Orange #FF6B00, Black, White
 * Design Philosophy: Bold, Energetic, Professional
 */

export const colors = {
  // Primary Colors (from logo)
  primary: {
    orange: '#FF6B00',      // Main brand color
    orangeLight: '#FF8A33', // Hover states, highlights
    orangeDark: '#CC5600',  // Pressed states
    orangePale: '#FFF4ED',  // Backgrounds, subtle highlights
  },
  
  // Neutral Colors
  neutral: {
    black: '#000000',       // Headers, text
    gray900: '#1A1A1A',     // Dark backgrounds
    gray800: '#2D2D2D',     // Cards on dark bg
    gray700: '#404040',     // Borders on dark
    gray600: '#666666',     // Secondary text
    gray500: '#808080',     // Disabled text
    gray400: '#B3B3B3',     // Borders
    gray300: '#CCCCCC',     // Dividers
    gray200: '#E5E5E5',     // Light borders
    gray100: '#F5F5F5',     // Light backgrounds
    white: '#FFFFFF',       // Primary background
  },
  
  // Semantic Colors
  success: {
    main: '#10B981',        // Green for success states
    light: '#D1FAE5',
    dark: '#065F46',
  },
  
  warning: {
    main: '#F59E0B',        // Yellow/amber for warnings
    light: '#FEF3C7',
    dark: '#92400E',
  },
  
  error: {
    main: '#EF4444',        // Red for errors
    light: '#FEE2E2',
    dark: '#991B1B',
  },
  
  info: {
    main: '#3B82F6',        // Blue for info
    light: '#DBEAFE',
    dark: '#1E40AF',
  },
} as const;

/**
 * Typography Scale
 * Using system fonts for performance + modern sans-serif stack
 */
export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  
  fontSize: {
    // Mobile-first, responsive sizes
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12-14px
    sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',        // 14-16px
    base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',      // 16-18px
    lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18-20px
    xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20-24px
    '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',           // 24-32px
    '3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',   // 30-40px
    '4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',       // 36-48px
    '5xl': 'clamp(3rem, 2rem + 5vw, 4rem)',               // 48-64px
    '6xl': 'clamp(3.75rem, 2.5rem + 6.25vw, 5rem)',       // 60-80px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Spacing Scale (8px base)
 * Consistent spacing creates rhythm
 */
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

/**
 * Border Radius
 * Soft corners for modern feel
 */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  base: '0.5rem',   // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  full: '9999px',   // Pill shape
} as const;

/**
 * Shadows
 * Elevation for depth
 */
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(255, 107, 0, 0.3)',    // Orange glow effect
  glowHover: '0 0 30px rgba(255, 107, 0, 0.5)',
} as const;

/**
 * Breakpoints
 * Mobile-first responsive design
 */
export const breakpoints = {
  xs: '375px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
} as const;

/**
 * Z-Index Scale
 * Prevent z-index wars
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
} as const;

/**
 * Animation
 * Smooth transitions
 */
export const animation = {
  duration: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

/**
 * Container Widths
 * Consistent content widths
 */
export const container = {
  xs: '20rem',      // 320px
  sm: '24rem',      // 384px
  md: '28rem',      // 448px
  lg: '32rem',      // 512px
  xl: '36rem',      // 576px
  '2xl': '42rem',   // 672px
  '3xl': '48rem',   // 768px
  '4xl': '56rem',   // 896px
  '5xl': '64rem',   // 1024px
  '6xl': '72rem',   // 1152px
  '7xl': '80rem',   // 1280px
  full: '100%',
} as const;
