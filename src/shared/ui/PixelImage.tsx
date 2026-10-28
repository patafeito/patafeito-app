import { Image, PixelRatio, type ImageProps, type ImageSourcePropType } from 'react-native';

type PixelImageProps = Omit<ImageProps, 'source' | 'style'> & {
  source: ImageSourcePropType;
  size: number;
  /** Largura/altura; padrão 1 (itens quadrados de 256px). */
  aspectRatio?: number;
  style?: ImageProps['style'];
};

/**
 * Pixel art da camada ilustrativa (itens, moedas, comidas). O tamanho cai num pixel físico inteiro
 * para a borda não ficar meio-pixel borrada. Nunca use em ícones funcionais: esses são Ionicons.
 */
export function PixelImage({ source, size, aspectRatio = 1, style, ...props }: PixelImageProps) {
  const height = PixelRatio.roundToNearestPixel(size);
  const width = PixelRatio.roundToNearestPixel(size * aspectRatio);
  return <Image accessibilityIgnoresInvertColors fadeDuration={0} resizeMode="contain" {...props} source={source} style={[{ width, height }, style]} />;
}
