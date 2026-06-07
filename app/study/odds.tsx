import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Card, Field, Button, Chip, ChipRow, Body, Row, Stat, SectionTitle, Banner } from '../../src/components/ui';
import { EquityBar } from '../../src/components/charts';
import { colors, fonts, spacing, type } from '../../src/theme';
import { DEALT_ODDS, prob, oneIn, expectedHandsUntil, atLeastOnce, pct } from '../../src/lib/odds';
import { simulateMultiway, parseHand } from '../../src/lib/equity';
import { parseCards } from '../../src/lib/cards';

const PLAYERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Odds() {
  const [hand, setHand] = useState('AhKh');
  const [opps, setOpps] = useState(8);
  const [board, setBoard] = useState('');
  const [win, setWin] = useState<{ equity: number; win: number; tie: number; samples: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [horizon, setHorizon] = useState(25);

  const runWin = () => {
    const h = parseHand(hand);
    if (h.length !== 2) return;
    setBusy(true);
    setWin(null);
    setTimeout(() => {
      const r = simulateMultiway(h, opps, parseCards(board).slice(0, 5), 8000);
      setWin({ equity: r.equity, win: r.win, tie: r.tie, samples: r.samples });
      setBusy(false);
    }, 25);
  };

  return (
    <Screen>
      <Banner tone="info" text="Dealt-hand odds and multiway win probability. Study tool, exact combinatorics plus on-device simulation." />

      <SectionTitle>Win odds by players to the flop</SectionTitle>
      <Card>
        <Field label="Your hand" value={hand} onChangeText={setHand} placeholder="AhKh" />
        <Text style={styles.lbl}>Players seeing the flop (opponents)</Text>
        <ChipRow>
          {PLAYERS.map((n) => (
            <Chip key={n} label={`${n + 1}-way`} active={opps === n} onPress={() => setOpps(n)} />
          ))}
        </ChipRow>
        <Field label="Board (optional)" value={board} onChangeText={setBoard} placeholder="Ah 7c 2d" />
        <Button title={busy ? 'Calculating...' : 'Win odds'} onPress={runWin} disabled={busy} />
        {win ? (
          <View style={{ marginTop: spacing.sm }}>
            <EquityBar heroPct={win.equity * 100} />
            <Row style={{ marginTop: spacing.sm }}>
              <Stat label={`Win vs ${opps}`} value={`${(win.equity * 100).toFixed(1)}%`} tone={win.equity * (opps + 1) >= 1 ? 'win' : 'loss'} />
              <Stat label="Outright win" value={`${((win.win / win.samples) * 100).toFixed(1)}%`} />
              <Stat label="Fair share" value={`${(100 / (opps + 1)).toFixed(0)}%`} />
            </Row>
            <Body dim>
              You win {pct(win.equity)} of the time {opps + 1}-handed. Fair share is {(100 / (opps + 1)).toFixed(0)}% - anything above it is profitable equity. {win.samples.toLocaleString()} simulations.
            </Body>
          </View>
        ) : null}
      </Card>

      <SectionTitle>Dealt-hand odds</SectionTitle>
      <Card>
        <Text style={styles.lbl}>Chance over the next</Text>
        <ChipRow>
          {[9, 25, 50, 100].map((n) => (
            <Chip key={n} label={n === 9 ? '1 orbit (9)' : `${n} hands`} active={horizon === n} onPress={() => setHorizon(n)} />
          ))}
        </ChipRow>
      </Card>
      {DEALT_ODDS.map((d) => (
        <Card key={d.label}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.name}>{d.label}</Text>
            <Text style={styles.big}>1 in {Math.round(oneIn(d.combos)).toLocaleString()}</Text>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Body dim>{pct(prob(d.combos))} per hand</Body>
            <Body dim>~{expectedHandsUntil(d.combos)} hands on average</Body>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body dim>{d.note}</Body>
            <Body style={{ color: colors.accent }}>{pct(atLeastOnce(d.combos, horizon))} in {horizon === 9 ? 'an orbit' : horizon + ' hands'}</Body>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lbl: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  name: { ...type.bodySemi, fontSize: 16, color: colors.text, flex: 1, marginRight: 8 },
  big: { fontFamily: fonts.display, fontSize: 28, color: colors.accent, letterSpacing: 0.5 },
});
