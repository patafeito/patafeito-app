import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import type { HeatmapCell, RadarAxis } from '../domain/aggregate';

/**
 * Gráficos simples, sem biblioteca: barras e mapa de calor em Views, linha e radar em SVG.
 * Cada gráfico tem `accessibilityLabel` com todos os valores, para leitor de tela (RNF06).
 */

type Point = { label: string; value: number };

function useWidth(initial = 300) {
  const [width, setWidth] = useState(initial);
  return { width, onLayout: (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width) };
}

function describe(title: string, points: Point[], unit: string) {
  return `${title}. ${points.map((point) => `${point.label}: ${point.value} ${unit}`).join('; ')}.`;
}

export function BarChart({ title, data, unit, height = 120, highlightLast = false }: { title: string; data: Point[]; unit: string; height?: number; highlightLast?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const max = Math.max(1, ...data.map((point) => point.value));
  return <View accessible accessibilityLabel={describe(title, data, unit)} style={styles.chart}>
    <View style={[styles.bars, { height }]}>
      {data.map((point, index) => <View key={`${point.label}-${index}`} style={styles.barColumn}>
        <Text style={styles.barValue}>{point.value || ''}</Text>
        <View style={[styles.bar, highlightLast && index === data.length - 1 && styles.barHighlight, { height: Math.max(2, (point.value / max) * (height - 18)) }]} />
      </View>)}
    </View>
    <View style={styles.labels}>
      {data.map((point, index) => <Text key={`${point.label}-${index}`} style={styles.axisLabel} numberOfLines={1}>{point.label}</Text>)}
    </View>
  </View>;
}

export function LineChart({ title, data, unit, height = 140 }: { title: string; data: Point[]; unit: string; height?: number }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const padding = 16;
  const max = Math.max(1, ...data.map((point) => point.value));
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const coords = data.map((point, index) => ({
    x: padding + index * step,
    y: padding + (1 - point.value / max) * (height - padding * 2),
  }));
  // Muitos pontos (30 dias): só alguns rótulos para não amontoar.
  const labelEvery = Math.ceil(data.length / 7);
  return <View accessible accessibilityLabel={describe(title, data, unit)} style={styles.chart} onLayout={onLayout}>
    <Svg width={width} height={height}>
      <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.border} strokeWidth={1} />
      <Polyline points={coords.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(({ x, y }, index) => (data.length <= 10 || index === data.length - 1 ? <Circle key={index} cx={x} cy={y} r={4} fill={colors.primary} /> : null))}
      <SvgText x={width - padding} y={12} fontSize={11} fill={colors.textSecondary} textAnchor="end">{`máx. ${max} ${unit}`}</SvgText>
    </Svg>
    <View style={styles.labels}>
      {data.map((point, index) => <Text key={`${point.label}-${index}`} style={styles.axisLabel} numberOfLines={1}>{index % labelEvery === 0 || index === data.length - 1 ? point.label : ''}</Text>)}
    </View>
  </View>;
}

const heatmapWeekdays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function Heatmap({ title, weeks }: { title: string; weeks: HeatmapCell[][] }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const days = weeks.flat().filter((cell) => cell.inMonth);
  const active = days.filter((cell) => cell.count > 0).length;
  const intensity = (count: number) => (count === 0 ? 0 : count === 1 ? 0.35 : count === 2 ? 0.6 : count <= 4 ? 0.8 : 1);
  return <View accessible accessibilityLabel={`${title}. ${active} de ${days.length} dias com tarefas concluídas. ${days.filter((cell) => cell.count).map((cell) => `dia ${cell.date.getDate()}: ${cell.count}`).join('; ')}.`} style={styles.chart}>
    <View style={styles.heatRow}>
      {heatmapWeekdays.map((label, index) => <Text key={index} style={styles.heatHeader}>{label}</Text>)}
    </View>
    {weeks.map((week, row) => <View key={row} style={styles.heatRow}>
      {week.map((cell) => <View key={cell.date.toDateString()} style={[styles.heatCell, { backgroundColor: cell.inMonth ? colors.surfaceMuted : 'transparent' }]}>
        {cell.inMonth && cell.count ? <View style={[StyleSheet.absoluteFill, styles.heatFill, { opacity: intensity(cell.count) }]} /> : null}
        {cell.inMonth ? <Text style={styles.heatDay}>{cell.date.getDate()}</Text> : null}
      </View>)}
    </View>)}
    <View style={styles.legend}>
      <Text style={styles.axisLabel}>menos</Text>
      {[0, 1, 2, 3, 5].map((count) => <View key={count} style={[styles.legendCell, { backgroundColor: colors.surfaceMuted }]}>
        {count ? <View style={[StyleSheet.absoluteFill, styles.heatFill, { opacity: intensity(count) }]} /> : null}
      </View>)}
      <Text style={styles.axisLabel}>mais</Text>
    </View>
  </View>;
}

export function RadarChart({ title, axes, size = 240 }: { title: string; axes: RadarAxis[]; size?: number }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const center = size / 2;
  const radiusMax = size / 2 - 34;
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axes.length;
    const distance = (value / 100) * radiusMax;
    return { x: center + Math.cos(angle) * distance, y: center + Math.sin(angle) * distance };
  };
  const ring = (value: number) => axes.map((_, index) => point(index, value)).map(({ x, y }) => `${x},${y}`).join(' ');
  return <View accessible accessibilityLabel={describe(title, axes, 'de 100')} style={[styles.chart, styles.center]}>
    <Svg width={size} height={size}>
      {[25, 50, 75, 100].map((value) => <Polygon key={value} points={ring(value)} fill="none" stroke={colors.border} strokeWidth={1} />)}
      {axes.map((_, index) => {
        const end = point(index, 100);
        return <Line key={index} x1={center} y1={center} x2={end.x} y2={end.y} stroke={colors.border} strokeWidth={1} />;
      })}
      <Polygon points={axes.map((axis, index) => point(index, axis.value)).map(({ x, y }) => `${x},${y}`).join(' ')} fill={colors.primary} fillOpacity={0.3} stroke={colors.primary} strokeWidth={2} />
      {axes.map((axis, index) => {
        const label = point(index, 122);
        return <SvgText key={axis.label} x={label.x} y={label.y + 4} fontSize={12} fontWeight="bold" fill={colors.text} textAnchor="middle">{`${axis.label} ${axis.value}`}</SvgText>;
      })}
    </Svg>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  chart: { gap: spacing.xs },
  center: { alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  bar: { width: '70%', borderRadius: radius.xs, backgroundColor: colors.primary },
  barHighlight: { backgroundColor: colors.reward },
  barValue: { ...typography.caption, fontSize: 11, color: colors.textSecondary },
  labels: { flexDirection: 'row', gap: spacing.xs },
  axisLabel: { ...typography.caption, flex: 1, textAlign: 'center', color: colors.textSecondary },
  heatRow: { flexDirection: 'row', gap: 4 },
  heatHeader: { ...typography.caption, flex: 1, textAlign: 'center', color: colors.textSecondary },
  heatCell: { flex: 1, aspectRatio: 1, borderRadius: radius.xs, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  heatFill: { backgroundColor: colors.success },
  heatDay: { ...typography.caption, fontSize: 10, color: colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: spacing.xs },
  legendCell: { width: 14, height: 14, borderRadius: 3, overflow: 'hidden' },
});
