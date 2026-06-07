import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import {
  Screen,
  Card,
  Field,
  Chip,
  ChipRow,
  Button,
  Body,
  Row,
  Pill,
  SectionTitle,
  EmptyState,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import {
  getPlayer,
  updatePlayer,
  deletePlayer,
  listShowdowns,
  addShowdown,
  deleteShowdown,
} from '../../src/db/players';
import { VILLAIN_TYPES } from '../../src/data/adviceMatrix';
import type { PlayerNote, ShowdownRecord, PlayerType, Position } from '../../src/types';
import { dayMonth } from '../../src/lib/format';

const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'NA'];

export default function VillainDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerNote | null>(null);
  const [showdowns, setShowdowns] = useState<ShowdownRecord[]>([]);

  // showdown form
  const [holeCards, setHoleCards] = useState('');
  const [position, setPosition] = useState<Position>('NA');
  const [action, setAction] = useState('');
  const [boardStr, setBoardStr] = useState('');
  const [tendency, setTendency] = useState('');

  // editable core fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const refresh = useCallback(() => {
    if (!id) return;
    setPlayer(getPlayer(id));
    setShowdowns(listShowdowns(id));
  }, [id]);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  useEffect(() => {
    if (player) {
      setEditName(player.displayName);
      setEditDesc(player.physicalDesc);
    }
  }, [player?.id]);

  if (!player) {
    return (
      <Screen>
        <EmptyState title="Player not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const villainMeta = VILLAIN_TYPES.find((v) => v.id === player.playerType);

  const saveShowdown = () => {
    if (!holeCards.trim()) return;
    addShowdown({
      playerNoteId: player.id,
      holeCards: holeCards.trim(),
      position,
      action: action.trim(),
      board: boardStr.trim() || null,
    });
    setHoleCards('');
    setAction('');
    setBoardStr('');
    refresh();
  };

  const addTendency = () => {
    if (!tendency.trim()) return;
    updatePlayer(player.id, { tendencies: [...player.tendencies, tendency.trim()] });
    setTendency('');
    refresh();
  };

  const onDelete = () => {
    Alert.alert('Delete player', 'This removes the player and their showdown history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlayer(player.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.title}>{player.displayName}</Text>
          <Pill label={villainMeta?.label ?? 'Unknown'} tone="info" />
        </Row>
        {player.physicalDesc ? <Body dim>{player.physicalDesc}</Body> : null}
        {player.roomNameCached ? <Body dim>{player.roomNameCached}</Body> : null}
        <Body dim>Want at table: {player.rating}/5 - last seen {dayMonth(player.lastSeen)}</Body>

        <Text style={styles.label}>Player type</Text>
        <ChipRow>
          {VILLAIN_TYPES.map((v) => (
            <Chip
              key={v.id}
              label={v.label}
              active={player.playerType === v.id}
              onPress={() => {
                updatePlayer(player.id, { playerType: v.id as PlayerType });
                refresh();
              }}
            />
          ))}
        </ChipRow>
      </Card>

      {villainMeta ? (
        <Card style={{ borderColor: colors.accent }}>
          <SectionTitle>Read</SectionTitle>
          <Body>{villainMeta.read}</Body>
        </Card>
      ) : null}

      <SectionTitle>Edit details</SectionTitle>
      <Card>
        <Field label="Name / label" value={editName} onChangeText={setEditName} placeholder="Blue hat, seat 4" />
        <Field label="Physical description" value={editDesc} onChangeText={setEditDesc} placeholder="60s, gold watch, drinks fast" />
        <Text style={styles.label}>Want at table</Text>
        <ChipRow>
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip
              key={n}
              label={String(n)}
              active={player.rating === n}
              onPress={() => {
                updatePlayer(player.id, { rating: n });
                refresh();
              }}
            />
          ))}
        </ChipRow>
        <Button
          title="Save details"
          variant="ghost"
          onPress={() => {
            updatePlayer(player.id, {
              displayName: editName.trim() || player.displayName,
              physicalDesc: editDesc.trim(),
            });
            refresh();
          }}
        />
      </Card>

      <SectionTitle>Tendencies</SectionTitle>
      <Card>
        {player.tendencies.length === 0 ? (
          <Body dim>No tendencies yet. Add structured reads like "3bets light" or "never folds top pair".</Body>
        ) : (
          <Row style={{ flexWrap: 'wrap', gap: spacing.sm }}>
            {player.tendencies.map((t, i) => (
              <Pressable
                key={i}
                onPress={() =>
                  Alert.alert('Remove tendency', `Remove "${t}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => {
                        updatePlayer(player.id, { tendencies: player.tendencies.filter((_, idx) => idx !== i) });
                        refresh();
                      },
                    },
                  ])
                }
              >
                <Pill label={`${t}  x`} tone="warn" />
              </Pressable>
            ))}
          </Row>
        )}
        <Body dim>Tap a tendency to remove it.</Body>
        <Field label="Add tendency" value={tendency} onChangeText={setTendency} placeholder="3bets light" />
        <Button title="Add tendency" variant="ghost" onPress={addTendency} />
      </Card>

      <SectionTitle>Showdown log</SectionTitle>
      <Card>
        <Field label="Hole cards" value={holeCards} onChangeText={setHoleCards} placeholder="AhKd" />
        <Text style={styles.label}>Position</Text>
        <ChipRow>
          {POSITIONS.map((p) => (
            <Chip key={p} label={p} active={position === p} onPress={() => setPosition(p)} />
          ))}
        </ChipRow>
        <Field
          label="Action"
          value={action}
          onChangeText={setAction}
          placeholder="Open-raised UTG, called 3bet, stacked off TPTK"
          multiline
        />
        <Field label="Board (optional)" value={boardStr} onChangeText={setBoardStr} placeholder="Ah 7c 2d / Ts / 9h" />
        <Button title="Log showdown" onPress={saveShowdown} />
      </Card>

      {showdowns.map((sd) => (
        <Card key={sd.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={styles.cards}>
              {sd.holeCards} ({sd.position})
            </Text>
            <Body dim>{dayMonth(sd.date)}</Body>
          </Row>
          {sd.action ? <Body>{sd.action}</Body> : null}
          {sd.board ? <Body dim>Board: {sd.board}</Body> : null}
          <Button
            title="Delete"
            variant="ghost"
            onPress={() => {
              deleteShowdown(sd.id);
              refresh();
            }}
          />
        </Card>
      ))}

      <View style={{ height: spacing.lg }} />
      <Button title="Delete player" variant="danger" onPress={onDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.section, fontSize: 20, color: colors.text, flex: 1, marginRight: 8 },
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  cards: { ...type.bodySemi, color: colors.accent, fontSize: 16 },
});
