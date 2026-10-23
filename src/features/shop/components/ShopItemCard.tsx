import { Image, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { colors, radius, spacing, typography } from '../../../shared/theme/tokens';
import { coinIcon, itemImage, type ShopItem } from '../domain/catalog';

type ShopItemCardProps = {
  item: ShopItem;
  /** Preço mostrado na loja; a mochila mostra a quantidade. */
  price?: number;
  quantity?: number;
  equipped?: boolean;
  actionLabel: string;
  actionVariant?: 'primary' | 'secondary';
  disabled?: boolean;
  onAction: () => void;
};

export function CoinAmount({ value, size = 18 }: { value: number; size?: number }) {
  return <View style={styles.coin}>
    <Image source={coinIcon} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
    <Text style={[styles.coinValue, { fontSize: size - 3 }]}>{value}</Text>
  </View>;
}

export function ShopItemCard({ item, price, quantity, equipped, actionLabel, actionVariant = 'primary', disabled, onAction }: ShopItemCardProps) {
  const scene = item.slot === 'background';
  const image = itemImage(item.sku);
  return <Card style={[styles.card, scene && styles.sceneCard]}>
    {image ? <Image source={image} style={scene ? styles.scene : styles.icon} resizeMode={scene ? 'cover' : 'contain'} accessibilityIgnoresInvertColors /> : null}
    <View style={styles.header}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {quantity !== undefined && item.consumable ? <Badge tone="neutral">x{quantity}</Badge> : null}
      {equipped ? <Badge tone="primary">Em uso</Badge> : null}
    </View>
    <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
    <View style={[styles.footer, scene && styles.sceneFooter]}>
      {price !== undefined ? <CoinAmount value={price} /> : null}
      <View style={scene ? styles.sceneAction : styles.action}>
        <Button label={actionLabel} variant={actionVariant} onPress={onAction} disabled={disabled} />
      </View>
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  // flexShrink e minWidth: sem eles a largura própria da imagem empurra o card para fora da tela.
  card: { flexBasis: '47%', flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacing.sm, padding: spacing.md },
  sceneCard: { flexBasis: '100%' },
  icon: { width: 72, height: 72, alignSelf: 'center' },
  scene: { width: '100%', height: undefined, aspectRatio: 2, borderRadius: radius.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { ...typography.heading, color: colors.text, fontSize: 15, flexShrink: 1 },
  description: { ...typography.body, color: colors.textMuted, fontSize: 13, lineHeight: 18, flexGrow: 1 },
  footer: { gap: spacing.sm },
  sceneFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sceneAction: { flexGrow: 1, maxWidth: 200 },
  action: { alignSelf: 'stretch' },
  coin: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinValue: { ...typography.numeric, color: colors.experience },
});
