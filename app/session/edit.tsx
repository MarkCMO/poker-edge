import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Card, Field, Chip, ChipRow, Button, Segmented, SectionTitle, Body, Row, Banner } from '../../src/components/ui';
import { spacing } from '../../src/theme';
import { getSession, addCompletedSession, updateSession } from '../../src/db/sessions';
import { SEED_ROOMS } from '../../src/data/seedRooms';
import { listUserRooms } from '../../src/db/userRooms';
import type { GameType, SessionFormat } from '../../src/types';

const GAME_TYPES: GameType[] = ['NLHE', 'PLO', 'LHE', 'Stud', 'Mixed', 'Tournament', 'Other'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SessionEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getSession(id) : null;
  const rooms = [...SEED_ROOMS, ...listUserRooms()];

  const [format, setFormat] = useState<SessionFormat>(existing?.format ?? 'cash');
  const [game, setGame] = useState<GameType>(existing?.gameType ?? 'NLHE');
  const [stakes, setStakes] = useState(existing?.stakes ?? '1/3');
  const [roomId, setRoomId] = useState<string | null>(existing?.roomId ?? null);
  const [buyIn, setBuyIn] = useState(existing ? String(existing.buyIn) : '300');
  const [rebuys, setRebuys] = useState(existing ? String(existing.rebuysTotal) : '0');
  const [cashOut, setCashOut] = useState(existing ? String(existing.cashOut) : '0');
  const [date, setDate] = useState(existing ? new Date(existing.startTime).toISOString().slice(0, 10) : todayStr());
  const [durationMin, setDurationMin] = useState(existing ? String(existing.durationMinutes) : '180');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const result =
    (parseFloat(cashOut) || 0) - (parseFloat(buyIn) || 0) - (parseFloat(rebuys) || 0);

  const save = () => {
    const room = rooms.find((r) => r.id === roomId);
    const parsedDate = new Date((date || todayStr()) + 'T18:00:00');
    const startTime = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
    const endTime = startTime + (parseFloat(durationMin) || 0) * 60000;
    const common = {
      gameType: game,
      format,
      stakes: stakes.trim(),
      roomId,
      roomNameCached: room?.name ?? '',
      buyIn: parseFloat(buyIn) || 0,
      rebuysTotal: parseFloat(rebuys) || 0,
      cashOut: parseFloat(cashOut) || 0,
      notes: notes.trim(),
    };
    if (id && existing) {
      updateSession(id, { ...common, startTime, endTime });
    } else {
      addCompletedSession({ ...common, startTime, endTime });
    }
    router.back();
  };

  return (
    <Screen>
      <Banner tone="info" text={id ? 'Edit this session. Result recalculates from buy-in, rebuys, and cash-out.' : 'Add a past session you did not track live.'} />

      <Card>
        <Segmented
          value={format}
          onChange={(v) => setFormat(v)}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'tournament', label: 'Tournament' },
            { value: 'sitngo', label: 'Sit and Go' },
          ]}
        />
        <SectionTitle>Game</SectionTitle>
        <ChipRow>
          {GAME_TYPES.map((g) => (
            <Chip key={g} label={g} active={game === g} onPress={() => setGame(g)} />
          ))}
        </ChipRow>
        <Field label="Stakes" value={stakes} onChangeText={setStakes} placeholder="1/3" />
      </Card>

      <Card>
        <SectionTitle>Room</SectionTitle>
        <ChipRow>
          <Chip label="None" active={roomId === null} onPress={() => setRoomId(null)} />
          {rooms.map((r) => (
            <Chip key={r.id} label={r.name} active={roomId === r.id} onPress={() => setRoomId(r.id)} />
          ))}
        </ChipRow>
      </Card>

      <Card>
        <SectionTitle>Money</SectionTitle>
        <Row>
          <View style={{ flex: 1 }}><Field label="Buy-in $" value={buyIn} onChangeText={setBuyIn} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Rebuys $" value={rebuys} onChangeText={setRebuys} keyboardType="decimal-pad" /></View>
        </Row>
        <Field label="Cash-out $" value={cashOut} onChangeText={setCashOut} keyboardType="decimal-pad" />
        <Body dim>Result: {result >= 0 ? '+' : ''}{result.toFixed(0)}</Body>
      </Card>

      <Card>
        <SectionTitle>When</SectionTitle>
        <Row>
          <View style={{ flex: 1 }}><Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder={todayStr()} /></View>
          <View style={{ flex: 1 }}><Field label="Minutes played" value={durationMin} onChangeText={setDurationMin} keyboardType="decimal-pad" /></View>
        </Row>
      </Card>

      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Soft table, ran bad in 3 big pots..." multiline />
      <View style={{ height: spacing.sm }} />
      <Button title={id ? 'Save changes' : 'Add session'} onPress={save} />
    </Screen>
  );
}
