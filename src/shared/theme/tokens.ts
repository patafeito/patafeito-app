import type { TextStyle } from 'react-native';

export const spacing = { xs: 4, sm: 8, ms: 12, md: 16, lg: 24, xl: 32, xxl: 40, xxxl: 56 } as const;

export const radius = { xs: 6, sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

/** Áreas de toque mínimas. */
export const touch = { min: 44, button: 52 } as const;

/**
 * Famílias carregadas no layout raiz. No Android, peso vem da família (não de `fontWeight`),
 * por isso cada peso é uma família própria.
 */
export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  display: 'Fredoka_600SemiBold',
  pixel: 'PixelifySans_500Medium',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** Escala tipográfica: Fredoka só em títulos, Pixelify só em recompensas, Nunito no resto. */
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24 },
  subheading: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodySm: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  button: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20 },
  numeric: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20, fontVariant: tabular },
  timer: { fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 72, fontVariant: tabular },
  reward: { fontFamily: fonts.pixel, fontSize: 16, lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;

/** Durações em ms. Com movimento reduzido: sem deslocamento ou escala, só fade `fast`. */
export const motion = { fast: 120, base: 200, slow: 320, celebrate: 600 } as const;
