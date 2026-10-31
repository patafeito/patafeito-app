import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadReportData } from '../features/reports/application/load-report-data';
import { BarChart, LineChart, RadarChart } from '../features/reports/components/Charts';
import { byCategory, monthSummary, petEvolution, radar, totals, xpByDay } from '../features/reports/domain/aggregate';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Card } from '../shared/ui/Card';
import { IconButton } from '../shared/ui/IconButton';
import { Screen } from '../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

/** Relatórios avançados (Tela 12, HU26, HU27): mês escolhido, evolução de XP, categorias, desempenho e pet. */
export default function ReportsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data } = useLocalData(loadReportData);
  const [month, setMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

  if (!data) return <Screen edges={['left', 'right']}><Text style={styles.muted}>Carregando…</Text></Screen>;

  const summary = totals(data, data.xpTotal);
  const monthly = monthSummary(data, month.year, month.month);
  const categories = byCategory(data.tasks, new Date(month.year, month.month, 1), new Date(month.year, month.month + 1, 1));
  const evolution = petEvolution(data, data.xpTotal);
  const monthName = new Date(month.year, month.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const isCurrentMonth = month.year === new Date().getFullYear() && month.month === new Date().getMonth();
  const levelsGained = evolution.length ? evolution[evolution.length - 1].level - evolution[0].level : 0;

  function shiftMonth(delta: number) {
    setMonth(({ year, month: current }) => {
      const date = new Date(year, current + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return <Screen edges={['left', 'right']}>
    <View style={styles.grid}>
      <Metric label="XP total" value={String(summary.xpTotal)} />
      <Metric label="Nível atual" value={String(summary.level)} />
      <Metric label="Concluídas" value={String(summary.tasksCompleted)} />
    </View>

    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Evolução de XP</Text>
      <Text style={styles.caption}>XP estimado por dia nos últimos 7 dias (tarefas e foco, sem bônus).</Text>
      <LineChart title="XP por dia nos últimos 7 dias" data={xpByDay(data)} unit="XP" />
    </Card>

    <Card style={styles.card}>
      <View style={styles.monthHeader}>
        <IconButton icon="chevron-back" label="Mês anterior" tone="plain" onPress={() => shiftMonth(-1)} />
        <Text style={styles.cardTitle}>Relatório de {monthName}</Text>
        {isCurrentMonth ? <View style={styles.spacer} /> : <IconButton icon="chevron-forward" label="Próximo mês" tone="plain" onPress={() => shiftMonth(1)} />}
      </View>
      <View style={styles.grid}>
        <Metric label="Tarefas" value={String(monthly.tasksCompleted)} />
        <Metric label="Min. de foco" value={String(monthly.focusMinutes)} />
        <Metric label="XP" value={String(monthly.xp)} />
        <Metric label="Dias ativos" value={String(monthly.activeDays)} />
      </View>
      {monthly.bestDay ? <Text style={styles.caption}>Melhor dia: {monthly.bestDay.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}, com {monthly.bestDay.xp} XP.</Text> : <Text style={styles.caption}>Nenhuma atividade registrada neste mês.</Text>}
      <Text style={styles.subTitle}>Por categoria</Text>
      <BarChart title={`Tarefas por categoria em ${monthName}`} data={categories} unit="tarefas" height={110} />
    </Card>

    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Desempenho geral</Text>
      <Text style={styles.caption}>Semana atual, de 0 a 100: tarefas (meta de 21), hábitos (30 dias), foco (meta de 150 min), amigos e XP (meta diária).</Text>
      <RadarChart title="Desempenho geral da semana" axes={radar(data, new Date(), data.friends)} />
    </Card>

    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Evolução do pet</Text>
      <Text style={styles.caption}>XP acumulado nos últimos 30 dias{levelsGained > 0 ? `: subiu ${levelsGained} ${levelsGained === 1 ? 'nível' : 'níveis'}` : ''}.</Text>
      <LineChart title="XP acumulado do pet nos últimos 30 dias" data={evolution.map((point) => ({ label: point.label, value: point.xp }))} unit="XP" />
    </Card>
  </Screen>;
}

function Metric({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.body, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: { flexGrow: 1, flexBasis: '22%', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  metricValue: { ...typography.numeric, fontSize: 20, lineHeight: 26, color: colors.text },
  metricLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  card: { gap: spacing.sm },
  cardTitle: { ...typography.heading, color: colors.text, flexShrink: 1, textAlign: 'center' },
  subTitle: { ...typography.label, color: colors.text, marginTop: spacing.sm },
  caption: { ...typography.caption, color: colors.textSecondary },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  spacer: { width: 44 },
});
