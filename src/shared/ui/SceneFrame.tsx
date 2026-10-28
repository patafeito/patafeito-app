import { useState, type PropsWithChildren } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';

type SceneFrameProps = PropsWithChildren<{
  /** Cenário pixel art; sem ele, um "chão de lago" liso no tom da superfície. */
  scene?: ImageSourcePropType;
  /** Largura/altura da janela; a altura acompanha a largura disponível. */
  aspectRatio: number;
  style?: StyleProp<ViewStyle>;
  onHeightChange?: (height: number) => void;
}>;

/**
 * Janela para a camada ilustrativa: o cenário fica recortado aqui dentro e o texto fica fora,
 * sobre superfície sólida. Só selos pequenos com fundo próprio podem ficar por cima da cena.
 *
 * O cenário cobre a janela inteira ancorado embaixo (o chão e a água ficam sempre à vista; o corte cai no céu).
 */
export function SceneFrame({ scene, aspectRatio, style, onHeightChange, children }: SceneFrameProps) {
  const styles = useThemedStyles(makeStyles);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const source = scene ? Image.resolveAssetSource(scene) : undefined;
  const imageRatio = source?.width && source.height ? source.width / source.height : 1.25;

  let imageStyle: ImageStyle | undefined;
  if (size) {
    const coversByWidth = size.width / size.height >= imageRatio;
    const width = coversByWidth ? size.width : size.height * imageRatio;
    const height = coversByWidth ? size.width / imageRatio : size.height;
    imageStyle = { position: 'absolute', width, height, bottom: 0, left: (size.width - width) / 2 };
  }

  return <View
    style={[styles.frame, { aspectRatio }, style]}
    onLayout={({ nativeEvent }) => {
      const { width, height } = nativeEvent.layout;
      setSize({ width, height });
      onHeightChange?.(height);
    }}
  >
    {scene ? imageStyle ? <Image source={scene} style={imageStyle} resizeMode="stretch" fadeDuration={0} accessibilityIgnoresInvertColors /> : null
      : <View style={styles.water} />}
    <View style={styles.content}>{children}</View>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: colors.primarySoft, borderTopLeftRadius: 999, borderTopRightRadius: 999, transform: [{ scaleX: 1.6 }] },
  content: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
});
