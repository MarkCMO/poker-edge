import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, Button, Card, H1, Body } from '../src/components/ui';
import { colors, fonts, spacing, type } from '../src/theme';
import { useStore } from '../src/store/useStore';

const POINTS = [
  {
    title: 'Track every session offline',
    body: 'Start a timer the moment you sit down. Log buy-ins, rebuys, and results. It all works with no signal, because casinos are dead zones.',
  },
  {
    title: 'Find your most profitable game',
    body: 'Your real hourly rate by room, stakes, and time of day - computed from your own results, not generic data.',
  },
  {
    title: 'Read your opponents',
    body: 'Tag a player, log the hands they show down, and build a read that follows you across sessions and rooms.',
  },
  {
    title: 'Study away from the table',
    body: 'Range charts, a player-type guide, a quiz trainer, and an equity calculator. Study mode only - never use electronic help at the table.',
  },
  {
    title: 'Record observations respectfully',
    body: 'Player notes are your private read on people in public card rooms. Use descriptive labels, not legal names. This is a strategy tool.',
  },
];

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  return (
    <Screen>
      <H1>Welcome to Poker Edge</H1>
      <Body dim>Data, not vibes. Here is what the app does.</Body>
      {POINTS.map((p) => (
        <Card key={p.title}>
          <Text style={styles.title}>{p.title}</Text>
          <Body dim>{p.body}</Body>
        </Card>
      ))}
      <Button title="Get started" onPress={completeOnboarding} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.accent },
});
