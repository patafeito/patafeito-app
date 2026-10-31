import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PixelImage } from '../../../shared/ui/PixelImage';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import { celebrate } from '../../pet/application/pet-mood';
import { itemImage, type InventoryRow, type ShopItem } from '../domain/catalog';
import { consumeItem } from '../infrastructure/shop-repository';

type FoodTrayProps = {
  foods: { item: ShopItem; row: InventoryRow }[];
  onFed: () => void;
  /** `food` alimenta (Alimentar); `energy` recarrega a energia (Curar). */
  kind?: 'food' | 'energy';
};

/** Itens da mochila, prontos para dar ao pato com um toque: comidas (Alimentar) ou energia (Curar). */
export function FoodTray({ foods, onFed, kind = 'food' }: FoodTrayProps) {
  const styles = useThemedStyles(makeStyles);
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function feed(item: ShopItem) {
    setBusy(item.id);
    try {
      await consumeItem(item.id);
      if (kind === 'food') celebrate('eating', { message: 'Nhac! Que delícia.' });
      else celebrate('happy', { message: 'Ufa, energia lá em cima!' });
      setMessage(undefined);
      onFed();
    } catch (error) {
      if (error instanceof NetworkError) setMessage('Precisamos de conexão para alimentar o pato.');
      else setMessage(error instanceof ApiError ? error.message : 'Não foi possível alimentar agora.');
    } finally {
      setBusy(undefined);
    }
  }

  if (!foods.length) return <Text style={styles.muted}>{kind === 'food' ? 'Sem comida na mochila. Compre na loja.' : 'Sem itens de energia na mochila. O Café energético está na loja.'}</Text>;

  return <View style={styles.container}>
    <View style={styles.row}>
      {foods.map(({ item, row }) => {
        const image = itemImage(item.sku);
        return <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`${kind === 'food' ? 'Dar' : 'Usar'} ${item.name}, ${row.quantity} na mochila`}
          disabled={busy !== undefined}
          onPress={() => void feed(item)}
          style={({ pressed }) => [styles.food, pressed && styles.pressed, busy === item.id && styles.busy]}
        >
          {image ? <PixelImage source={image} size={44} /> : null}
          <Text style={styles.quantity}>x{row.quantity}</Text>
        </Pressable>;
      })}
    </View>
    {message ? <Text style={styles.error}>{message}</Text> : null}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  food: { alignItems: 'center', padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, minWidth: 64 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  busy: { opacity: 0.5 },
  quantity: { ...typography.caption, color: colors.text, fontVariant: ["tabular-nums"] },
  muted: { ...typography.bodySm, color: colors.textSecondary },
  error: { ...typography.bodySm, color: colors.danger },
});
