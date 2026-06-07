import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Screen,
  Card,
  SectionTitle,
  Stat,
  Row,
  Body,
  Banner,
  Button,
  EmptyState,
} from '../src/components/ui';
import { LineChart, HBars } from '../src/components/charts';
import { colors, spacing, type } from '../src/theme';
import { listCompletedSessions } from '../src/db/sessions';
import { bankrollSeries } from '../src/db/bankroll';
import {
  totals,
  byRoom,
  byStakes,
  byDayOfWeek,
  byTimeOfDay,
  byGame,
  variance,
  fatigueTrend,
  type Aggregate,
} from '../src/lib/analytics';
import type { SessionComputed } from '../src/types';
import { money, moneySigned, hourly } from '../src/lib/format';
import { useStore } from '../src/store/useStore';

export default function Analytics() {
  const router = useRouter();
  const pro = useStore((s) => s.proUnlocked);
  const fatigueThreshold = useStore((s) => s.fatigueThresholdHours);
  const [sessions, setSessions] = useState<SessionComputed[]>([]);
  const [series, setSeries] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      setSessions(listCompletedSessions());
      setSeries(bankrollSeries().map((p) => p.balance));
    }, [])
  );

  if (sessions.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No data yet"
          body="Log a few sessions and your analytics build automatically from your own results."
        />
      </Screen>
    );
  }

  const t = totals(sessions);
  const v = variance(sessions);
  const fatigue = fatigueTrend(sessions, fatigueThreshold);
  const lastBalance = series.length ? series[series.length - 1] : 0;

  const toBars = (agg: Aggregate[]) => agg.map((a) => ({ key: a.key, value: a.hourly }));

  return (
    <Screen>
      <Card>
        <SectionTitle>Bankroll</SectionTitle>
        <LineChart data={series} positive={lastBalance >= 0} />
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Net" value={moneySigned(t.net)} tone={t.net >= 0 ? 'win' : 'loss'} />
          <Stat label="Hours" value={t.hours.toFixed(1)} />
          <Stat label="Per hour" value={hourly(t.hourly)} tone={t.hourly >= 0 ? 'win' : 'loss'} />
        </Row>
      </Card>

      <Card>
        <Row>
          <Stat label="Sessions" value={String(t.sessions)} />
          <Stat label="Win rate" value={`${t.winRate.toFixed(0)}%`} />
          <Stat
            label="bb/100 (cash)"
            value={t.bb100Cash.toFixed(1)}
            tone={t.bb100Cash >= 0 ? 'win' : 'loss'}
          />
        </Row>
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Best" value={moneySigned(t.bestSession)} tone="win" />
          <Stat label="Worst" value={moneySigned(t.worstSession)} tone="loss" />
          <Stat
            label="ROI (MTT)"
            value={`${t.roiTournament.toFixed(0)}%`}
            tone={t.roiTournament >= 0 ? 'win' : 'loss'}
          />
        </Row>
      </Card>

      {/* Welfare signal (Section 4.6) - honest, data-driven, personal. */}
      {fatigue.bleeds ? (
        <Banner
          tone="warn"
          text={`Your results after hour ${fatigueThreshold} average ${moneySigned(
            fatigue.overAvg
          )} across ${fatigue.overCount} sessions. Consider a shorter session or a break.`}
        />
      ) : null}

      {!pro ? (
        <Card style={{ borderColor: colors.accent }}>
          <SectionTitle>Unlock full analytics</SectionTitle>
          <Body dim>
            Pro adds your hourly rate by room, stakes, day, and time of day, plus variance and your
            personal most-profitable room and game.
          </Body>
          <Button title="See Poker Edge Pro" onPress={() => router.push('/paywall')} />
          <View style={{ height: spacing.sm }} />
          <Body dim>Most profitable room (preview)</Body>
          <Text style={styles.preview}>
            {byRoom(sessions)[0]?.key ?? '-'} at {hourly(byRoom(sessions)[0]?.hourly ?? 0)}
          </Text>
        </Card>
      ) : (
        <>
          <Card>
            <SectionTitle>Hourly by room</SectionTitle>
            <Body dim>Your realized rate at each room. This is your most honest edge metric.</Body>
            <HBars data={toBars(byRoom(sessions))} format={hourly} />
          </Card>
          <Card>
            <SectionTitle>Hourly by stakes</SectionTitle>
            <HBars data={toBars(byStakes(sessions))} format={hourly} />
          </Card>
          <Card>
            <SectionTitle>Hourly by game</SectionTitle>
            <HBars data={toBars(byGame(sessions))} format={hourly} />
          </Card>
          <Card>
            <SectionTitle>Hourly by day of week</SectionTitle>
            <HBars data={toBars(byDayOfWeek(sessions))} format={hourly} />
          </Card>
          <Card>
            <SectionTitle>Hourly by time of day</SectionTitle>
            <HBars data={toBars(byTimeOfDay(sessions))} format={hourly} />
          </Card>
          <Card>
            <SectionTitle>Variance</SectionTitle>
            <Row>
              <Stat label="Max drawdown" value={money(v.maxDrawdown)} tone="loss" />
              <Stat label="Longest break-even" value={`${v.longestBreakEvenSessions} sessions`} />
            </Row>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { ...type.section, color: colors.accent },
});
