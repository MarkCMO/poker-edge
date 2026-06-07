import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { colors, fonts, type } from '../theme';

/** Bankroll-over-time line chart (Section 4.2). */
export function LineChart({
  data,
  width = 320,
  height = 160,
  positive = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (data.length < 2) {
    return (
      <View style={[styles.placeholder, { width: '100%', height }]}>
        <Text style={styles.placeholderText}>Log a couple of sessions to see your trend.</Text>
      </View>
    );
  }
  const pad = 10;
  const w = width;
  const h = height;
  const min = Math.min(...data, 0);
  const max = Math.max(...data, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const yOf = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const points = data.map((v, i) => `${pad + i * stepX},${yOf(v)}`).join(' ');
  const areaPoints = `${pad},${yOf(min)} ${points} ${pad + (data.length - 1) * stepX},${yOf(min)}`;
  const stroke = positive ? colors.win : colors.loss;
  const zeroY = yOf(0);

  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stroke} stopOpacity="0.28" />
          <Stop offset="1" stopColor={stroke} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke={colors.border} strokeWidth={1} strokeDasharray="4 4" />
      <Polygon points={areaPoints} fill="url(#grad)" />
      <Polyline points={points} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx={pad + (data.length - 1) * stepX} cy={yOf(data[data.length - 1])} r={4} fill={stroke} />
    </Svg>
  );
}

/** Horizontal bars for aggregates (hourly by room/stakes/day). */
export function HBars({
  data,
  format,
}: {
  data: { key: string; value: number }[];
  format: (n: number) => string;
}) {
  if (data.length === 0) {
    return <Text style={styles.placeholderText}>No data yet.</Text>;
  }
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <View style={{ gap: 10 }}>
      {data.map((d) => {
        const pct = (Math.abs(d.value) / maxAbs) * 100;
        const positive = d.value >= 0;
        return (
          <View key={d.key} style={{ gap: 3 }}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {d.key}
              </Text>
              <Text style={[styles.barValue, { color: positive ? colors.win : colors.loss }]}>
                {format(d.value)}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={{
                  width: `${pct}%`,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: positive ? colors.win : colors.loss,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Equity bar: hero vs villain split. */
export function EquityBar({ heroPct }: { heroPct: number }) {
  const hero = Math.max(0, Math.min(100, heroPct));
  return (
    <View style={styles.equityWrap}>
      <View style={[styles.equityHero, { width: `${hero}%` }]} />
      <View style={styles.equityLabels}>
        <Text style={styles.equityText}>{hero.toFixed(1)}%</Text>
        <Text style={[styles.equityText, { color: colors.textDim }]}>{(100 - hero).toFixed(1)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { ...type.small, color: colors.textDim, textAlign: 'center' },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { ...type.small, color: colors.text, flex: 1, marginRight: 8 },
  barValue: { ...type.small, fontFamily: fonts.bodySemi },
  barTrack: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  equityWrap: { height: 34, borderRadius: 8, backgroundColor: colors.loss, overflow: 'hidden', justifyContent: 'center' },
  equityHero: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.win },
  equityLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  equityText: { ...type.small, fontFamily: fonts.bodySemi, color: '#fff' },
});
