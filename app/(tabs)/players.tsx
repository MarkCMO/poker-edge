import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Card, Button, Body, Row, Pill, SectionTitle, EmptyState, Field } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { listPlayers, listShowdowns } from '../../src/db/players';
import { VILLAIN_TYPES } from '../../src/data/adviceMatrix';
import type { PlayerNote } from '../../src/types';
import { dayMonth } from '../../src/lib/format';

const typeLabel = (id: string) => VILLAIN_TYPES.find((v) => v.id === id)?.label ?? 'Unknown';

export default function PlayersTab() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerNote[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState('');

  useFocusEffect(
    useCallback(() => {
      const list = listPlayers();
      setPlayers(list);
      const c: Record<string, number> = {};
      for (const p of list) c[p.id] = listShowdowns(p.id).length;
      setCounts(c);
    }, [])
  );

  const filtered = q.trim()
    ? players.filter((p) => (p.displayName + ' ' + p.physicalDesc).toLowerCase().includes(q.toLowerCase()))
    : players;

  // quick distribution by type
  const dist = players.reduce<Record<string, number>>((a, p) => ((a[p.playerType] = (a[p.playerType] || 0) + 1), a), {});

  return (
    <Screen>
      <Card style={{ borderColor: colors.accent }}>
        <SectionTitle>Opponent intelligence</SectionTitle>
        <Body dim>Tag players, log the hands they show down, and build reads that follow you across sessions and rooms.</Body>
        <Row><Text style={styles.big}>{players.length}</Text><Body dim>players tracked</Body></Row>
        <Button title="+ Add a player" onPress={() => router.push('/villain/new')} />
      </Card>

      {players.length > 0 ? (
        <Card>
          <SectionTitle>By type</SectionTitle>
          <Row style={{ flexWrap: 'wrap', gap: spacing.sm }}>
            {Object.entries(dist).map(([t, n]) => (
              <Pill key={t} label={`${typeLabel(t)} ${n}`} tone="info" />
            ))}
          </Row>
        </Card>
      ) : null}

      {players.length > 3 ? (
        <Field label="Search players" value={q} onChangeText={setQ} placeholder="blue hat, seat 4..." />
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No players yet"
          body="Tag a villain during a session (the Tag player button) or add one here. Log the hands they show to build a read."
        />
      ) : (
        filtered.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/villain/${p.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.name}>{p.displayName}</Text>
              <Pill label={typeLabel(p.playerType)} tone="info" />
            </Row>
            {p.physicalDesc ? <Body dim numberOfLines={1}>{p.physicalDesc}</Body> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Body dim>{p.roomNameCached || 'Unknown room'}</Body>
              <Body dim>{counts[p.id] ?? 0} showdowns - want {p.rating}/5 - {dayMonth(p.lastSeen)}</Body>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontFamily: fonts.display, fontSize: 40, color: colors.accent, letterSpacing: 1 },
  name: { ...type.bodySemi, fontSize: 17, color: colors.text, flex: 1, marginRight: 8 },
});
