import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type BrandBannerProps = {
  subtitle?: string;
};

const banner = require('../../../assets/banner-prepared.png') as number;
const resolved = Image.resolveAssetSource(banner);
const bannerAspectRatio = resolved?.width && resolved?.height ? resolved.width / resolved.height : 2.5;

export function BrandBanner({ subtitle }: BrandBannerProps) {
  return <View style={styles.container}>
    <View style={[styles.frame, { aspectRatio: bannerAspectRatio }]}>
      <Image accessibilityIgnoresInvertColors source={banner} style={styles.image} resizeMode="contain" />
    </View>
    <Text style={styles.title}>Patafeito</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  frame: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  image: { width: '100%', height: '100%' },
  title: { ...typography.display, color: colors.text, fontSize: 32, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
