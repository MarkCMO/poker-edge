import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Field, Body, Row, Stat, SectionTitle, Banner } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { computeVariance, recommendedBankroll } from '../../src/lib/variance';
import { money, moneySigned } from '../../src/lib/format';

export default function VarianceTool() {
  const [winRate, setWinRate] = useState('15');
  const [stdDev, setStdDev] = useState('100');
  const [hours, setHours] = useState('500');
  const [bankroll, setBankroll] = useState('5000');

  const wr = parseFloat(winRate) || 0;
  const sd = parseFloat(stdDev) || 0;
  const hrs = parseFloat(hours) || 0;
  const roll = parseFloat(bankroll) || 0;
  const r = computeVariance({ winRate: wr, stdDev: sd, hours: hrs, bankroll: roll });
  const ror = r.riskOfRuin * 100;
  const rec5 = recommendedBankroll(wr, sd, 0.05);
  const rec1 = recommendedBankroll(wr, sd, 0.01);

  return (
    <Screen>
      <Banner tone="info" text="Variance, confidence intervals, and risk of ruin for cash games. All figures per hour, in dollars." />

      <Card>
        <SectionTitle>Your numbers</SectionTitle>
        <Row>
          <View style={{ flex: 1 }}><Field label="Win rate $/hr" value={winRate} onChangeText={setWinRate} keyboardType="default" /></View>
          <View style={{ flex: 1 }}><Field label="Std dev $/hr" value={stdDev} onChangeText={setStdDev} keyboardType="decimal-pad" /></View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}><Field label="Hours" value={hours} onChangeText={setHours} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Bankroll $" value={bankroll} onChangeText={setBankroll} keyboardType="decimal-pad" /></View>
        </Row>
        <Body dim>Typical live NLHE std dev is about 80-120 $/hr at 1/2-2/5. Online runs higher per hour.</Body>
      </Card>

      <Card>
        <SectionTitle>Over {hrs.toFixed(0)} hours</SectionTitle>
        <Row>
          <Stat label="Expected" value={moneySigned(r.expected)} tone={r.expected >= 0 ? 'win' : 'loss'} />
          <Stat label="Std dev" value={money(r.sd)} />
        </Row>
        <Row>
          <Stat label="95% low" value={moneySigned(r.lower95)} tone="loss" />
          <Stat label="95% high" value={moneySigned(r.upper95)} tone="win" />
        </Row>
        <Body dim>
          95% of the time your result lands between {moneySigned(r.lower95)} and {moneySigned(r.upper95)}. Chance of being
          down after {hrs.toFixed(0)} hours: {(r.breakEvenProb * 100).toFixed(0)}%.
        </Body>
      </Card>

      <Card style={{ borderColor: ror <= 5 ? colors.win : ror <= 15 ? colors.warn : colors.loss }}>
        <SectionTitle>Risk of ruin</SectionTitle>
        <Text style={[styles.big, { color: ror <= 5 ? colors.win : ror <= 15 ? colors.warn : colors.loss }]}>
          {ror < 0.1 ? '<0.1' : ror.toFixed(1)}%
        </Text>
        <Body dim>
          Chance of losing your entire {money(roll)} bankroll before doubling, at this win rate and variance.
        </Body>
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Roll for 5% RoR" value={isFinite(rec5) ? money(rec5) : 'n/a'} />
          <Stat label="Roll for 1% RoR" value={isFinite(rec1) ? money(rec1) : 'n/a'} />
        </Row>
        {wr <= 0 ? <Body dim>A non-winning win rate means risk of ruin trends to 100% over time - no bankroll is enough.</Body> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontFamily: fonts.display, fontSize: 48, letterSpacing: 1, marginVertical: spacing.xs },
});
