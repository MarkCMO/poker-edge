import React, { useCallback, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Banner, Body, Row, Pill, SectionTitle } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { quizAccuracy } from '../../src/db/hands';
import { useStore } from '../../src/store/useStore';

interface Tool {
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  pro?: boolean;
}

const TOOLS: Tool[] = [
  {
    href: '/study/ranges',
    icon: 'grid',
    title: 'Preflop range charts',
    body: 'Solver-derived opening, 3bet, and push ranges by position, depth, and format.',
  },
  {
    href: '/study/matrix',
    icon: 'people',
    title: 'Player-type guide',
    body: 'How to play your hand class against a nit, TAG, LAG, station, or maniac.',
  },
  {
    href: '/study/quiz',
    icon: 'help-circle',
    title: 'Quiz trainer',
    body: 'Score yourself on preflop spots and player-type decisions. Tracks accuracy over time.',
    pro: true,
  },
  {
    href: '/study/equity',
    icon: 'calculator',
    title: 'Equity calculator',
    body: 'Hand vs hand and hand vs range. Exact enumeration or Monte Carlo, plus flop strategy and AI explain.',
  },
  {
    href: '/study/odds',
    icon: 'stats-chart',
    title: 'Odds & probabilities',
    body: 'Win % by players to the flop, odds of being dealt AA/KK, and how many hands until a premium.',
  },
  {
    href: '/study/import',
    icon: 'cloud-upload',
    title: 'Import hands + find leaks',
    body: 'Paste your hand history. Get VPIP, PFR, 3-bet and more, with leaks ranked by EV cost.',
    pro: true,
  },
  {
    href: '/study/drills',
    icon: 'repeat',
    title: 'Drills (spaced repetition)',
    body: 'Your worst spots resurface on a schedule until you fix them. Leaks jump to the front.',
    pro: true,
  },
  {
    href: '/study/icm',
    icon: 'trophy',
    title: 'ICM calculator',
    body: 'Finish-place equity for deals and bubble decisions. See why you tighten near pay jumps.',
    pro: true,
  },
];

export default function StudyTab() {
  const router = useRouter();
  const pro = useStore((s) => s.proUnlocked);
  const [acc, setAcc] = useState({ total: 0, correct: 0, pct: 0 });

  useFocusEffect(
    useCallback(() => {
      setAcc(quizAccuracy());
    }, [])
  );

  return (
    <Screen>
      <Banner
        tone="warn"
        text="Study mode. Do not use at the table. Live electronic assistance violates house rules and can forfeit your action."
      />

      {acc.total > 0 ? (
        <Card>
          <SectionTitle>Trainer accuracy</SectionTitle>
          <Row>
            <Text style={styles.accNum}>{acc.pct.toFixed(0)}%</Text>
            <Body dim>
              {acc.correct} of {acc.total} spots correct
            </Body>
          </Row>
        </Card>
      ) : null}

      {TOOLS.map((tool) => {
        const locked = tool.pro && !pro;
        return (
          <Card
            key={tool.href}
            onPress={() => (locked ? router.push('/paywall') : router.push(tool.href as never))}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Row style={{ flex: 1 }}>
                <Ionicons name={tool.icon} size={22} color={colors.accent} />
                <Text style={styles.toolTitle}>{tool.title}</Text>
              </Row>
              {locked ? <Pill label="Pro" tone="warn" /> : null}
            </Row>
            <Body dim>{tool.body}</Body>
          </Card>
        );
      })}

      <Body dim>
        The real edge over long sessions is not tilting and not playing fatigued. The welfare tools
        in your Profile use your own data to protect that edge.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accNum: { fontFamily: fonts.display, fontSize: 40, color: colors.accent, letterSpacing: 1 },
  toolTitle: { ...type.bodySemi, fontSize: 17, color: colors.text },
});
