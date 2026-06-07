import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Screen,
  Card,
  Button,
  Field,
  Chip,
  ChipRow,
  Body,
  Row,
  Stat,
  Segmented,
  Banner,
  SectionTitle,
} from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { EquityBar } from '../../src/components/charts';
import { parseHand, expandRange, randomRange, simulate, type EquityResult } from '../../src/lib/equity';
import { parseCards } from '../../src/lib/cards';
import { postflopStrategy } from '../../src/lib/postflop';
import { explainSpot } from '../../src/lib/aiExplain';

const PRESETS: { id: string; label: string; range: string }[] = [
  { id: 'random', label: 'Random hand', range: '' },
  { id: 'tight', label: 'Tight', range: 'TT+, AQs+, AKo' },
  { id: 'standard', label: 'Standard', range: '22+, ATs+, KJs+, QJs, AJo+, KQo' },
  { id: 'loose', label: 'Loose', range: '22+, A2s+, K9s+, Q9s+, JTs, T9s, A8o+, KTo+, QJo' },
];

export default function Equity() {
  const [hero, setHero] = useState('AhKh');
  const [mode, setMode] = useState<'hand' | 'range'>('hand');
  const [villainHand, setVillainHand] = useState('QsQd');
  const [preset, setPreset] = useState('tight');
  const [board, setBoard] = useState('');
  const [result, setResult] = useState<EquityResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const boardCards = parseCards(board);
  const flop = boardCards.length >= 3 ? postflopStrategy(board) : null;

  const explain = async () => {
    if (!result) return;
    setAiBusy(true);
    setExplanation('');
    const res = await explainSpot({
      kind: 'equity',
      numbers: {
        heroEquityPct: +(result.equity * 100).toFixed(1),
        winPct: +((result.win / result.samples) * 100).toFixed(1),
        tiePct: +((result.tie / result.samples) * 100).toFixed(1),
        exact: result.exact,
      },
      assumptions: 'All-in equity, no further betting. Rake-unaware.',
      question: 'Explain what this equity means and how to play the spot.',
    });
    setAiBusy(false);
    setExplanation(res.explanation ?? res.error ?? 'Could not generate an explanation.');
  };

  const run = () => {
    setError('');
    const heroCards = parseHand(hero);
    if (heroCards.length !== 2) {
      setError('Enter a valid hero hand, for example AhKh.');
      return;
    }
    const boardCards = parseCards(board).slice(0, 5);

    let villainCombos;
    if (mode === 'hand') {
      const v = parseHand(villainHand);
      if (v.length !== 2) {
        setError('Enter a valid villain hand, for example QsQd.');
        return;
      }
      villainCombos = [v];
    } else {
      const rangeStr = PRESETS.find((p) => p.id === preset)?.range ?? '';
      villainCombos = rangeStr ? expandRange(rangeStr) : randomRange();
    }

    setBusy(true);
    setResult(null);
    // Defer so the busy state paints before the synchronous simulation.
    setTimeout(() => {
      const res = simulate({ hero: heroCards, villainCombos, board: boardCards, iterations: 10000 });
      setResult(res);
      setBusy(false);
    }, 30);
  };

  const heroPct = result ? result.equity * 100 : 0;

  return (
    <Screen>
      <Banner tone="warn" text="Study tool. Local compute, no network. Not table assistance." />

      <Card>
        <Field label="Your hand" value={hero} onChangeText={setHero} placeholder="AhKh" />

        <Text style={styles.label}>Villain</Text>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v)}
          options={[
            { value: 'hand', label: 'Specific hand' },
            { value: 'range', label: 'Range' },
          ]}
        />

        {mode === 'hand' ? (
          <Field label="Villain hand" value={villainHand} onChangeText={setVillainHand} placeholder="QsQd" />
        ) : (
          <ChipRow>
            {PRESETS.map((p) => (
              <Chip key={p.id} label={p.label} active={preset === p.id} onPress={() => setPreset(p.id)} />
            ))}
          </ChipRow>
        )}

        <Field
          label="Board (optional)"
          value={board}
          onChangeText={setBoard}
          placeholder="Ah 7c 2d"
        />

        <Button title={busy ? 'Calculating...' : 'Run equity'} onPress={run} disabled={busy} />
        {error ? <Body style={{ color: colors.loss }}>{error}</Body> : null}
      </Card>

      {result ? (
        <Card>
          <SectionTitle>Result</SectionTitle>
          <EquityBar heroPct={heroPct} />
          <Row style={{ marginTop: spacing.sm }}>
            <Stat label="Your equity" value={`${heroPct.toFixed(1)}%`} tone={heroPct >= 50 ? 'win' : 'loss'} />
            <Stat label="Win" value={`${((result.win / result.samples) * 100).toFixed(1)}%`} />
            <Stat label="Tie" value={`${((result.tie / result.samples) * 100).toFixed(1)}%`} />
          </Row>
          <Body dim>
            {result.exact
              ? `${result.samples.toLocaleString()} exact runouts enumerated`
              : `${result.samples.toLocaleString()} simulations (+/- ${(result.ci95 * 100).toFixed(2)}%)`}
          </Body>
          <Button title={aiBusy ? 'Explaining...' : 'AI explain this spot'} variant="ghost" disabled={aiBusy} onPress={explain} />
        </Card>
      ) : null}

      {explanation ? (
        <Card style={{ borderColor: colors.accent }}>
          <SectionTitle>AI explanation</SectionTitle>
          <Body>{explanation}</Body>
          <Body dim>Study only. Constrained to the equity numbers above.</Body>
        </Card>
      ) : null}

      {flop ? (
        <Card>
          <SectionTitle>Flop strategy (approximate)</SectionTitle>
          <Body dim>{flop.cluster.label}</Body>
          <Row style={{ marginTop: spacing.sm }}>
            <Stat label="C-bet freq" value={`${flop.cluster.cbetFreq}%`} />
            <Stat label="Sizing" value={flop.cluster.sizing} />
          </Row>
          <Body>{flop.cluster.note}</Body>
          <Body dim>
            Nearest solved texture, not an exact solve. {flop.assumptions} Tree: {flop.betSizingTree}
          </Body>
        </Card>
      ) : null}

      <Body dim>
        Card format: rank then suit. Ranks 2-9, T, J, Q, K, A. Suits s, h, d, c. Example: AhKh, QsQd.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase' },
});
