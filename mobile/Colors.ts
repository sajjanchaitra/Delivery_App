/**
 * App Theme Colors
 * Centralized color palette for consistent styling across the app
 */

export const Colors = {
  // Primary Colors
  primary: {
    50: "#F0F7FF",
    100: "#E6F4FE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#4A90FF", // Main primary color
    600: "#357ABD",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },

  // Neutral Colors (Slate)
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  // Background Colors
  background: {
    primary: "#F8FBFF",
    secondary: "#FFFFFF",
    tertiary: "#F1F5F9",
  },

  // Text Colors
  text: {
    primary: "#1E293B",
    secondary: "#64748B",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },

  // Status Colors
  success: {
    light: "#DCFCE7",
    main: "#22C55E",
    dark: "#16A34A",
  },

  error: {
    light: "#FEE2E2",
    main: "#EF4444",
    dark: "#DC2626",
  },

  warning: {
    light: "#FEF3C7",
    main: "#F59E0B",
    dark: "#D97706",
  },

  info: {
    light: "#DBEAFE",
    main: "#3B82F6",
    dark: "#2563EB",
  },

  // Gradients (for LinearGradient)
  gradients: {
    primary: ["#4A90FF", "#357ABD"] as const,
    success: ["#22C55E", "#16A34A"] as const,
    warning: ["#F59E0B", "#D97706"] as const,
    error: ["#EF4444", "#DC2626"] as const,
    dark: ["#334155", "#1E293B"] as const,
  },

  // Shadows
  shadow: {
    light: "#64748B",
    primary: "#4A90FF",
  },

  // Border Colors
  border: {
    light: "#E2E8F0",
    medium: "#CBD5E1",
    dark: "#94A3B8",
  },

  // Overlay
  overlay: {
    light: "rgba(0, 0, 0, 0.3)",
    medium: "rgba(0, 0, 0, 0.5)",
    dark: "rgba(0, 0, 0, 0.7)",
  },
};

// Typography sizes
export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 40,
  },
  weight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.3,
    wider: 0.5,
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
};

// Common shadow styles
export const Shadows = {
  sm: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: Colors.shadow.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default Colors;