import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';
import { localProfile } from '../storage/local-profile';
import { darkPalette, lightPalette, type Palette } from './palette';

export type ColorScheme = 'light' | 'dark';
export type AppearancePreference = 'system' | ColorScheme;

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  /** 0 = só borda, 1 = card, 2 = sheet/modal. */
  elevation: Record<1 | 2, ViewStyle>;
};

const preferenceKey = 'appearance';

function buildTheme(scheme: ColorScheme): Theme {
  const colors = scheme === 'dark' ? darkPalette : lightPalette;
  // No claro, sombra marrom bem leve (madeira); no escuro, azul profundo.
  const opacity = scheme === 'dark' ? 0.24 : 0.1;
  return {
    scheme,
    colors,
    elevation: {
      1: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: opacity, shadowRadius: 10, elevation: 2 },
      2: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 12 }, shadowOpacity: opacity * 1.4, shadowRadius: 24, elevation: 8 },
    },
  };
}

const themes: Record<ColorScheme, Theme> = { light: buildTheme('light'), dark: buildTheme('dark') };

type ThemeContextValue = Theme & { preference: AppearancePreference; setPreference: (value: AppearancePreference) => void };

const ThemeContext = createContext<ThemeContextValue>({ ...themes.dark, preference: 'system', setPreference: () => undefined });

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');

  useEffect(() => {
    void localProfile.get(preferenceKey).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setPreferenceState(stored);
    }).catch(() => undefined);
  }, []);

  const setPreference = useCallback((value: AppearancePreference) => {
    setPreferenceState(value);
    void localProfile.set(preferenceKey, value).catch(() => undefined);
  }, []);

  const scheme: ColorScheme = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(() => ({ ...themes[scheme], preference, setPreference }), [scheme, preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

const styleCache = new WeakMap<object, Partial<Record<ColorScheme, unknown>>>();

/**
 * Estilos que dependem do tema: `const styles = useThemedStyles(makeStyles)`, com
 * `makeStyles = (theme) => StyleSheet.create({...})` declarado fora do componente. Calculado uma vez por esquema.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { scheme } = useTheme();
  let entry = styleCache.get(factory);
  if (!entry) styleCache.set(factory, entry = {});
  if (!(scheme in entry)) entry[scheme] = factory(themes[scheme]);
  return entry[scheme] as T;
}
