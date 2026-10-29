import type { PropsWithChildren, ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Screen } from '../../../shared/ui/Screen';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';

const banner = require('../../../../assets/banner-prepared.png') as number;
const resolved = Image.resolveAssetSource(banner);
const bannerAspectRatio = resolved?.width && resolved?.height ? resolved.width / resolved.height : 2.5;

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  error?: string;
  /** Troca entre entrar e criar conta, abaixo do cartão. */
  footer: ReactNode;
}>;

/**
 * Moldura das telas de entrada: os três patos no topo (camada ilustrativa), marca, e o formulário num
 * cartão sólido logo abaixo. Em telas largas, a coluna fica estreita e centralizada.
 */
export function AuthLayout({ title, subtitle, error, footer, children }: AuthLayoutProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  // O Screen abre espaço e rola até o campo focado quando o teclado aparece, nas duas plataformas.
  return <Screen edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
    <View style={styles.column}>
      <View style={[styles.hero, { aspectRatio: bannerAspectRatio }]}>
        <Image source={banner} style={styles.heroImage} resizeMode="contain" fadeDuration={0} accessibilityIgnoresInvertColors />
      </View>
      <Text style={styles.brand} accessibilityRole="header">Patafeito</Text>

      <View style={styles.card}>
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {children}
        {error ? <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={18} color={colors.onDangerSoft} />
          <Text style={styles.errorText}>{error}</Text>
        </View> : null}
      </View>

      <View style={styles.footer}>{footer}</View>
    </View>
  </Screen>;
}

const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({
  content: { justifyContent: 'center' },
  column: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: spacing.md },
  hero: { width: '100%', borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  heroImage: { width: '100%', height: '100%' },
  brand: { ...typography.display, color: colors.text, textAlign: 'center', marginTop: -spacing.xs },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, ...elevation[1] },
  titles: { gap: spacing.xs },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.bodySm, color: colors.textSecondary },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.ms, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  errorText: { ...typography.bodySm, color: colors.onDangerSoft, flex: 1 },
  footer: { alignItems: 'center', gap: spacing.sm },
});
