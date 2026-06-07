import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Field, Button, Body, Row, Stat, SectionTitle, Banner } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { icmEquities, winProbabilities } from '../../src/lib/icm';
import { money } from '../../src/lib/format';

export default function IcmCalc() {
  const [stacksStr, setStacksStr] = useState('5000, 3000, 1500, 500');
  const [payoutsStr, setPayoutsStr] = useState('500, 300, 200');
  const [rows, setRows] = useState<{ stack: number; eq: number; win: number }[] | null>(null);

  const compute = () => {
    const stacks = stacksStr.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n) && n > 0);
    const payouts = payoutsStr.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    if (stacks.length < 2 || payouts.length < 1) {
      setRows(null);
      return;
    }
    const eq = icmEquities(stacks, payouts);
    const win = winProbabilities(stacks);
    setRows(stacks.map((s, i) => ({ stack: s, eq: eq[i], win: win[i] * 100 })));
  };

  return (
    <Screen>
      <Banner tone="info" text="ICM finish-place equity (Malmuth-Harville). Study tool for deals and bubble decisions." />
      <Card>
        <Field label="Stacks (chips, comma separated)" value={stacksStr} onChangeText={setStacksStr} />
        <Field label="Payouts (comma separated, largest first)" value={payoutsStr} onChangeText={setPayoutsStr} />
        <Button title="Calculate ICM" onPress={compute} />
      </Card>

      {rows ? (
        <Card>
          <SectionTitle>ICM equity</SectionTitle>
          {rows.map((r, i) => (
            <View key={i}>
              <Row style={{ justifyContent: 'space-between', marginTop: i ? spacing.sm : 0 }}>
                <Text style={styles.seat}>Seat {i + 1}</Text>
                <Text style={styles.eq}>{money(r.eq)}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body dim>{r.stack.toLocaleString()} chips</Body>
                <Body dim>{r.win.toFixed(1)}% to win</Body>
              </Row>
            </View>
          ))}
          <Body dim style={{ marginTop: spacing.sm }}>
            Note how the chip leader's $ equity is less than their chip share. That gap is why you
            play tighter near pay jumps.
          </Body>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seat: { ...type.bodySemi, fontSize: 16, color: colors.text },
  eq: { fontFamily: fonts.bodySemi, fontSize: 18, color: colors.win },
});
