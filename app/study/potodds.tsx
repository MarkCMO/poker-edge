import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Field, Chip, ChipRow, Body, Row, Stat, SectionTitle, Banner } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { potOdds, equityFromOuts, ruleOfThumb, callEv, COMMON_DRAWS, pct1 } from '../../src/lib/potodds';
import { money } from '../../src/lib/format';

export default function PotOddsTool() {
  const [pot, setPot] = useState('100');
  const [call, setCall] = useState('50');
  const [outs, setOuts] = useState(9);
  const [streets, setStreets] = useState<1 | 2>(2);

  const potN = parseFloat(pot) || 0;
  const callN = parseFloat(call) || 0;
  const odds = potOdds(callN, potN);
  const equity = equityFromOuts(outs, streets);
  const rough = ruleOfThumb(outs, streets);
  const ev = callEv(equity, callN, potN);
  const profitable = equity * 100 >= odds.pct;

  return (
    <Screen>
      <Banner tone="info" text="Pot odds and outs math. Study tool - do not use at the table." />

      <SectionTitle>Pot odds</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Field label="Pot ($)" value={pot} onChangeText={setPot} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Bet to call ($)" value={call} onChangeText={setCall} keyboardType="decimal-pad" /></View>
        </Row>
        <Row>
          <Stat label="Pot odds" value={`${odds.pct.toFixed(1)}%`} />
          <Stat label="Ratio" value={odds.ratio} />
          <Stat label="Equity needed" value={`${odds.pct.toFixed(1)}%`} />
        </Row>
        <Body dim>You need at least {odds.pct.toFixed(1)}% equity to call profitably (before implied odds).</Body>
      </Card>

      <SectionTitle>Outs to equity</SectionTitle>
      <Card>
        <Text style={styles.lbl}>Common draws</Text>
        <ChipRow>
          {COMMON_DRAWS.map((d) => (
            <Chip key={d.label} label={`${d.label} (${d.outs})`} active={outs === d.outs} onPress={() => setOuts(d.outs)} />
          ))}
        </ChipRow>
        <Field label="Outs" value={String(outs)} onChangeText={(t) => setOuts(parseInt(t, 10) || 0)} keyboardType="numeric" />
        <ChipRow>
          <Chip label="Turn + river (2 cards)" active={streets === 2} onPress={() => setStreets(2)} />
          <Chip label="One card" active={streets === 1} onPress={() => setStreets(1)} />
        </ChipRow>
        <Row>
          <Stat label="Equity (exact)" value={pct1(equity)} tone={profitable ? 'win' : 'loss'} />
          <Stat label="Rule of 2/4" value={pct1(rough)} />
        </Row>
      </Card>

      <Card style={{ borderColor: profitable ? colors.win : colors.loss }}>
        <SectionTitle>Verdict</SectionTitle>
        <Text style={[styles.verdict, { color: profitable ? colors.win : colors.loss }]}>
          {profitable ? 'CALL is +EV' : 'FOLD (or need implied odds)'}
        </Text>
        <Body dim>
          Your {pct1(equity)} equity vs {odds.pct.toFixed(1)}% required. Call EV {money(ev)} per attempt on this street.
          {!profitable ? ' You need future bets (implied odds) to justify a call.' : ''}
        </Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lbl: { ...type.label, color: colors.textDim, textTransform: 'uppercase' },
  verdict: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 1, marginVertical: spacing.xs },
});
