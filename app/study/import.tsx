import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Field, Button, Body, Row, Stat, Pill, SectionTitle, Banner, EmptyState } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { parseHandHistory } from '../../src/lib/handHistory';
import { computeStats, detectLeaks, type StatSummary, type LeakReport } from '../../src/lib/leaks';
import { enqueueLeakDrills } from '../../src/db/study';
import { explainSpot } from '../../src/lib/aiExplain';

export default function ImportHands() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [stats, setStats] = useState<StatSummary | null>(null);
  const [leaks, setLeaks] = useState<LeakReport[]>([]);
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);

  const analyze = () => {
    const hands = parseHandHistory(text);
    if (hands.length === 0) {
      Alert.alert('No hands found', 'Paste hand-history text exported from your poker site.');
      return;
    }
    setStats(computeStats(hands));
    setLeaks(detectLeaks(hands));
    setExplanation('');
  };

  const buildDrills = () => {
    if (leaks.length === 0) return;
    enqueueLeakDrills(leaks.map((l) => ({ drillRef: l.drillRef, label: l.label })));
    Alert.alert('Drills queued', 'Your top leaks were added to the trainer. Open Drills to start.', [
      { text: 'Later', style: 'cancel' },
      { text: 'Open Drills', onPress: () => router.push('/study/drills') },
    ]);
  };

  const explainTopLeak = async () => {
    if (!leaks.length) return;
    setBusy(true);
    setExplanation('');
    const top = leaks[0];
    const res = await explainSpot({
      kind: 'leak',
      numbers: { stat: top.label, yourValue: top.userValue, baseline: top.baselineValue, deviation: top.deviation, evCostBb100: top.evCostEst },
      assumptions: '6-max cash baseline, rake-unaware. Advise tighter in high-rake live games.',
      question: 'Explain this leak and how to fix it.',
    });
    setBusy(false);
    if (res.explanation) setExplanation(res.explanation);
    else setExplanation(res.error ?? 'Could not generate an explanation.');
  };

  return (
    <Screen>
      <Banner tone="info" text="Paste hand-history text from your poker site. Parsing and analysis run on device." />
      <Card>
        <Field label="Hand history" value={text} onChangeText={setText} placeholder="PokerStars Hand #..." multiline />
        <Button title="Analyze" onPress={analyze} />
      </Card>

      {stats ? (
        <Card>
          <SectionTitle>Your stats ({stats.hands} hands)</SectionTitle>
          <Row><Stat label="VPIP" value={`${stats.vpip.toFixed(0)}%`} /><Stat label="PFR" value={`${stats.pfr.toFixed(0)}%`} /><Stat label="3-bet" value={`${stats.threeBet.toFixed(1)}%`} /></Row>
          <Row style={{ marginTop: spacing.sm }}><Stat label="Fold to 3-bet" value={`${stats.foldToThreeBet.toFixed(0)}%`} /><Stat label="C-bet" value={`${stats.cbet.toFixed(0)}%`} /><Stat label="WTSD" value={`${stats.wtsd.toFixed(0)}%`} /></Row>
        </Card>
      ) : null}

      {stats && leaks.length === 0 ? (
        <EmptyState title="No major leaks flagged" body="Either your frequencies are in healthy bands or the sample is too small. Import more hands for sharper detection." />
      ) : null}

      {leaks.length > 0 ? (
        <>
          <SectionTitle>Top leaks (ranked by EV cost)</SectionTitle>
          {leaks.map((l) => (
            <Card key={l.stat}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={styles.leak}>{l.label}</Text>
                <Pill label={`-${l.evCostEst} bb/100`} tone="loss" />
              </Row>
              <Body dim>You: {l.userValue}%  -  Baseline: {l.baselineValue}%  ({l.deviation > 0 ? '+' : ''}{l.deviation})</Body>
              <Body>{l.note}</Body>
            </Card>
          ))}
          <Row>
            <Button title="Queue drills" style={{ flex: 1 }} onPress={buildDrills} />
            <Button title={busy ? 'Explaining...' : 'AI explain'} variant="ghost" style={{ flex: 1 }} disabled={busy} onPress={explainTopLeak} />
          </Row>
          {explanation ? (
            <Card style={{ borderColor: colors.accent }}>
              <SectionTitle>AI explanation</SectionTitle>
              <Body>{explanation}</Body>
              <Body dim>Study only. The explanation is constrained to the numbers above.</Body>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  leak: { ...type.bodySemi, fontSize: 17, color: colors.text },
});
