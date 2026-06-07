import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Screen,
  Card,
  Chip,
  ChipRow,
  Body,
  Pill,
  Row,
  SectionTitle,
  Segmented,
  EmptyState,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { getSeries, getTournaments, sourceLabel, type DataSource } from '../../src/lib/api';
import type { Series, Tournament } from '../../src/types';
import { money } from '../../src/lib/format';
import { isoDateTime } from '../../src/lib/format';

type Filter = 'all' | 'week' | 'month' | 'wsop' | 'wpt' | 'vegas' | 'ac';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'wsop', label: 'WSOP' },
  { id: 'wpt', label: 'WPT' },
  { id: 'vegas', label: 'Vegas' },
  { id: 'ac', label: 'Atlantic City' },
];

export default function ScheduleTab() {
  const router = useRouter();
  const [series, setSeries] = useState<Series[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [source, setSource] = useState<{ s: DataSource; ts: number | null }>({ s: 'seed', ts: null });
  const [year, setYear] = useState<'2026' | '2027'>('2026');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'upcoming' | 'results'>('upcoming');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([getSeries(), getTournaments()]).then(([se, to]) => {
        if (!alive) return;
        setSeries(se.data);
        setTournaments(to.data);
        setSource({ s: to.source, ts: to.lastFetched });
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const seriesById = new Map(series.map((s) => [s.id, s]));

  const now = Date.now();
  const weekEnd = now + 7 * 86400000;
  const monthEnd = now + 30 * 86400000;

  const filtered = tournaments
    .filter((t) => new Date(t.startDateTime).getFullYear().toString() === year)
    .filter((t) => {
      const start = new Date(t.startDateTime).getTime();
      const org = seriesById.get(t.seriesId ?? '')?.organizer ?? '';
      switch (filter) {
        case 'week':
          return start >= now && start <= weekEnd;
        case 'month':
          return start >= now && start <= monthEnd;
        case 'wsop':
          return org.includes('WSOP');
        case 'wpt':
          return org.includes('World Poker') || org.includes('WPT');
        case 'vegas':
          return t.city.includes('Las Vegas') || t.city.includes('NV');
        case 'ac':
          return t.city.includes('Atlantic City') || t.city.includes('NJ');
        default:
          return true;
      }
    })
    .filter((t) => {
      const start = new Date(t.startDateTime).getTime();
      const past = t.status === 'completed' || (start < now && t.status !== 'running');
      return view === 'results' ? past : !past;
    })
    .sort((a, b) =>
      view === 'results'
        ? new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
        : new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

  // The current or next upcoming event, surfaced at the top.
  const running = tournaments.find((t) => t.status === 'running');
  const upcomingAll = tournaments
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .filter((t) => new Date(t.startDateTime).getFullYear().toString() === year)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  const nextUp = running ?? upcomingAll.find((t) => new Date(t.startDateTime).getTime() >= now) ?? upcomingAll[0] ?? null;

  // Group by series
  const groups = new Map<string, Tournament[]>();
  for (const t of filtered) {
    const key = t.seriesId ?? 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <Screen>
      <Segmented
        value={view}
        onChange={(v) => setView(v)}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'results', label: 'Results' },
        ]}
      />

      {view === 'upcoming' && nextUp ? (
        <Card style={{ borderColor: colors.accent }} onPress={() => router.push(`/tournament/${nextUp.id}`)}>
          <Pill label={nextUp.status === 'running' ? 'Happening now' : 'Next up'} tone="win" />
          <Text style={[styles.name, { fontSize: 18, marginTop: spacing.xs }]}>{nextUp.name}</Text>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body dim>{isoDateTime(nextUp.startDateTime)}</Body>
            <Text style={styles.buyin}>{money(nextUp.buyIn)}</Text>
          </Row>
          <Body dim>
            {nextUp.roomName} - {nextUp.city}
            {nextUp.guarantee ? ` - ${money(nextUp.guarantee)} GTD` : ''}
          </Body>
        </Card>
      ) : null}

      <Segmented
        value={year}
        onChange={(v) => setYear(v)}
        options={[
          { value: '2026', label: '2026' },
          { value: '2027', label: '2027 (tentative)' },
        ]}
      />
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ChipRow>
      <Body dim>{sourceLabel(source.s, source.ts)}. Verify dates against the organizer before you travel.</Body>

      {groups.size === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          body="No events match this filter. Try a different filter or year."
        />
      ) : (
        [...groups.entries()].map(([seriesId, list]) => {
          const se = seriesById.get(seriesId);
          return (
            <View key={seriesId} style={{ gap: spacing.sm }}>
              <SectionTitle>{se?.name ?? 'Other events'}</SectionTitle>
              {se ? (
                <Body dim>
                  {se.organizer} - {se.venueRoomName} - {se.city}
                </Body>
              ) : null}
              {list.map((t) => (
                <Card key={t.id} onPress={() => router.push(`/tournament/${t.id}`)}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={styles.name} numberOfLines={2}>
                      {t.name}
                    </Text>
                    {t.tentative ? <Pill label="Tentative" tone="warn" /> : null}
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Body dim>{isoDateTime(t.startDateTime)}</Body>
                    <Text style={styles.buyin}>{money(t.buyIn)}</Text>
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Body dim>{t.roomName}</Body>
                    {t.guarantee ? <Body dim>{money(t.guarantee)} GTD</Body> : null}
                  </Row>
                  {t.status === 'completed' && (t.winnerPrize || t.entrants || t.prizePool) ? (
                    <Row style={{ justifyContent: 'space-between', marginTop: spacing.xs }}>
                      <Pill label="Final" tone="info" />
                      <Body dim>
                        {t.entrants ? `${t.entrants.toLocaleString()} entries` : ''}
                        {t.prizePool ? ` - ${money(t.prizePool)} pool` : ''}
                        {t.winnerPrize ? ` - top ${money(t.winnerPrize)}` : ''}
                      </Body>
                    </Row>
                  ) : t.status !== 'scheduled' ? (
                    <Pill
                      label={t.status}
                      tone={t.status === 'running' ? 'win' : t.status === 'completed' ? 'info' : 'loss'}
                    />
                  ) : null}
                </Card>
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { ...type.bodySemi, color: colors.text, fontSize: 16, flex: 1, marginRight: 8 },
  buyin: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.accent },
});
