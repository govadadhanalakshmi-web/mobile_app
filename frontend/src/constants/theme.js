export const THEMES = {
  dark: {
    name: 'dark',
    background: '#090d16',
    surface: '#131b2e',
    surfaceBorder: '#23304e',
    surfaceActive: '#1c2844',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    danger: '#ef4444',
    dangerBg: '#451a1a',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    statusBar: 'light-content',
  },
  light: {
    name: 'light',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceBorder: '#e2e8f0',
    surfaceActive: '#f1f5f9',
    primary: '#4f46e5',
    primaryLight: '#6366f1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    danger: '#dc2626',
    dangerBg: '#fee2e2',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    statusBar: 'dark-content',
  },
};

export const STATUS_COLORS = {
  pending: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#d97706',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  in_progress: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#2563eb',
    border: 'rgba(59, 130, 246, 0.35)',
  },
  completed: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#059669',
    border: 'rgba(16, 185, 129, 0.35)',
  },
};

export const COMMON = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999,
  },
};

// Safe fallback for backward compatibility
export const THEME = {
  colors: THEMES.dark,
  spacing: COMMON.spacing,
  borderRadius: COMMON.borderRadius,
  statusColors: STATUS_COLORS,
};
