export const colors = {
  primary: '#C72C41',
  primaryDark: '#A50034',
  white: '#FFFFFF',
  background: '#F5F5F5',
  border: '#D9D9D9',
  text: '#202124',
  textMuted: '#6B7280',
  success: '#237A57',
  warning: '#B86A00',
  danger: '#B42318',
  info: '#2563EB',
  black: '#111827',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;
