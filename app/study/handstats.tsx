import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Body, Row, Stat, SectionTitle, Banner, EmptyState, Pill } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { computeHandStats, type HandStats } from '../../src/lib/handStats';
import { moneySigned } from '../../src/lib/format';

export default function HandStatsScreen() {
  const [s, setS] = useState<HandStats | null>(null);

  useFocusEffect(useCallback(() => setS(computeHandStats()), []));

  if (!s || s.total === 0) {
    return (
      <Screen>
        <EmptyState
          title="No hands logged yet"
          body="Log hands during sessions (the Log hand button) to build your personal starting-hand stats and see how each hand class performs for you."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Banner tone="info" text="Stats from the hands you have logged. This is a chosen sample, not true deal odds - see the Odds tool for deal probability." />

      <Card>
        <SectionTitle>Overview</SectionTitle>
        <Row>
          <Stat label="Hands logged" value={String(s.total)} />
          <Stat label="Net result" value={moneySigned(s.net)} tone={s.net >= 0 ? 'win' : 'loss'} />
          <Stat label="Win rate" value={`${s.winRate.toFixed(0)}%`} tone={s.winRate >= 50 ? 'win' : 'loss'} />
        </Row>
      </Card>

      <Card>
        <SectionTitle>Hand mix</SectionTitle>
        <Row>
          <Stat label="Pairs" value={`${s.pairsPct.toFixed(0)}%`} />
          <Stat label="Premium" value={`${s.premiumPct.toFixed(0)}%`} />
          <Stat label="Suited" value={`${s.suitedPct.toFixed(0)}%`} />
          <Stat label="Broadway" value={`${s.broadwayPct.toFixed(0)}%`} />
        </Row>
        <Body dim>Of {s.classified} classified hands. Lots of offsuit, low-broadway hands logged can signal loose preflop selection.</Body>
      </Card>

      <SectionTitle>By hand class</SectionTitle>
      {s.byClass.slice(0, 14).map((c) => (
        <Card key={c.label}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.name}>{c.label}</Text>
            <Row style={{ gap: spacing.sm }}>
              <Pill label={`${c.count}x`} tone="info" />
              <Text style={[styles.net, { color: c.net >= 0 ? colors.win : colors.loss }]}>{moneySigned(c.net)}</Text>
            </Row>
          </Row>
        </Card>
      ))}

      <SectionTitle>By position</SectionTitle>
      <Card>
        {s.byPosition.map((p) => (
          <Row key={p.position} style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <Body>{p.position}</Body>
            <Row style={{ gap: spacing.sm }}>
              <Body dim>{p.count}x</Body>
              <Text style={[styles.net, { color: p.net >= 0 ? colors.win : colors.loss }]}>{moneySigned(p.net)}</Text>
            </Row>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { ...type.bodySemi, fontSize: 18, color: colors.text },
  net: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
