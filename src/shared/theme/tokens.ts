export const colors = {
  background: '#10233A',
  surface: '#1C3651',
  surfaceRaised: '#284864',
  surfaceMuted: '#162D46',
  primary: '#42B9D4',
  primaryDark: '#2386A6',
  primarySoft: '#1B506B',
  experience: '#F7C948',
  success: '#56B98A',
  warning: '#F7C948',
  danger: '#F0846B',
  text: '#F3F8FC',
  textMuted: '#B9CAD9',
  border: '#365B76',
  borderSubtle: '#284B66',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 } as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const typography = {
  display: { fontFamily: 'System', fontWeight: '800' as const },
  heading: { fontFamily: 'System', fontWeight: '700' as const },
  body: { fontFamily: 'System', fontWeight: '400' as const },
  label: { fontFamily: 'System', fontWeight: '700' as const },
  numeric: { fontFamily: 'monospace', fontWeight: '700' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: '#081624',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
