import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Chip, ChipRow, Body, Pill, Row, SectionTitle } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { RANGE_CHARTS, gridHands, GRID_RANKS } from '../../src/data/ranges';
import { useStore } from '../../src/store/useStore';

const GRID = gridHands();
const FREE_CHARTS = 2;

export default function Ranges() {
  const router = useRouter();
  const pro = useStore((s) => s.proUnlocked);
  const [index, setIndex] = useState(0);
  const chart = RANGE_CHARTS[index];
  const inRange = new Set(chart.hands);

  const selectChart = (i: number) => {
    if (i >= FREE_CHARTS && !pro) {
      router.push('/paywall');
      return;
    }
    setIndex(i);
  };

  return (
    <Screen>
      <ChipRow>
        {RANGE_CHARTS.map((c, i) => (
          <Chip
            key={c.id}
            label={i >= FREE_CHARTS && !pro ? `${c.label} (Pro)` : c.label}
            active={index === i}
            onPress={() => selectChart(i)}
          />
        ))}
      </ChipRow>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.title}>{chart.label}</Text>
          <Pill label={chart.format === 'cash' ? 'Cash' : 'Tournament'} tone="info" />
        </Row>
        <Body dim>
          {chart.stackDepth} - {chart.action}
        </Body>

        <View style={styles.grid}>
          {GRID.map((row, r) => (
            <View key={r} style={styles.gridRow}>
              {row.map((hand, c) => {
                const on = inRange.has(hand);
                const isPair = r === c;
                return (
                  <View
                    key={c}
                    style={[
                      styles.cell,
                      on ? styles.cellOn : styles.cellOff,
                      isPair && !on ? styles.cellPair : null,
                    ]}
                  >
                    <Text style={[styles.cellText, on ? { color: colors.bg } : null]}>
                      {hand.replace('s', '').replace('o', '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <Row style={{ justifyContent: 'space-between', marginTop: spacing.xs }}>
          <Body dim>{GRID_RANKS[0]} high to {GRID_RANKS[12]} low. Upper right is suited.</Body>
          <Body dim>{chart.hands.length} combos in range</Body>
        </Row>
      </Card>

      <Card>
        <SectionTitle>Why this range</SectionTitle>
        <Body>{chart.notes}</Body>
        <Body dim>Solver-derived baseline for study. Not a live solver and not table assistance.</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.section, fontSize: 20, color: colors.text },
  grid: { marginTop: spacing.sm, gap: 2 },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  cellOn: { backgroundColor: colors.accent },
  cellOff: { backgroundColor: colors.surfaceAlt },
  cellPair: { backgroundColor: '#243352' },
  cellText: { fontSize: 9, fontFamily: fonts.bodyMed, color: colors.textDim },
});
