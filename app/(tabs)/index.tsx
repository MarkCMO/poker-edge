import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Card,
  Button,
  Chip,
  ChipRow,
  Field,
  Segmented,
  SectionTitle,
  Body,
  Pill,
  Banner,
  Row,
  EmptyState,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import {
  getActiveSession,
  listCompletedSessions,
  startSession,
  endSession,
  addRebuy,
  updateSession,
} from '../../src/db/sessions';
import type { SessionComputed, GameType, SessionFormat } from '../../src/types';
import { money, moneySigned, clock, duration, dayMonth, hourly } from '../../src/lib/format';
import { useStore } from '../../src/store/useStore';
import { SEED_ROOMS } from '../../src/data/seedRooms';
import { listUserRooms } from '../../src/db/userRooms';
import { scheduleBreakReminder, cancelBreakReminder } from '../../src/lib/notifications';

const GAME_TYPES: GameType[] = ['NLHE', 'PLO', 'LHE', 'Stud', 'Mixed', 'Tournament', 'Other'];
const STAKES = ['1/2', '1/3', '2/5', '5/10', '10/20'];

export default function SessionsTab() {
  const router = useRouter();
  const settings = useStore();
  const [active, setActive] = useState<SessionComputed | null>(null);
  const [history, setHistory] = useState<SessionComputed[]>([]);
  const [now, setNow] = useState(Date.now());

  // rooms available in the picker: curated seed + the user's own added rooms
  const pickerRooms = [...SEED_ROOMS, ...listUserRooms()];

  // form state
  const [game, setGame] = useState<GameType>('NLHE');
  const [format, setFormat] = useState<SessionFormat>('cash');
  const [stakes, setStakes] = useState(settings.defaultStakes);
  const [roomId, setRoomId] = useState<string | null>(settings.defaultRoomId);
  const [buyIn, setBuyIn] = useState('300');

  // active controls
  const [currentStack, setCurrentStack] = useState('');
  const [rebuyAmt, setRebuyAmt] = useState('');
  const [endOpen, setEndOpen] = useState(false);

  const refresh = useCallback(() => {
    const a = getActiveSession();
    setActive(a);
    setHistory(listCompletedSessions());
    if (a && currentStack === '') setCurrentStack(String(a.buyIn + a.rebuysTotal));
  }, [currentStack]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }, [refresh])
  );

  const onStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const room = pickerRooms.find((r) => r.id === roomId);
    const id = startSession({
      gameType: game,
      format,
      stakes,
      roomId: roomId,
      roomNameCached: room?.name ?? '',
      buyIn: parseFloat(buyIn) || 0,
    });
    if (settings.breakRemindersOn) scheduleBreakReminder(settings.breakIntervalMin);
    setCurrentStack(buyIn);
    refresh();
    router.setParams({});
    void id;
  };

  const onAddRebuy = () => {
    if (!active) return;
    const amt = parseFloat(rebuyAmt) || 0;
    if (amt <= 0) return;
    addRebuy(active.id, amt);
    setRebuyAmt('');
    Haptics.selectionAsync().catch(() => {});
    refresh();
  };

  const onEnd = () => {
    if (!active) return;
    const cashOut = parseFloat(currentStack) || 0;
    endSession(active.id, cashOut, {});
    cancelBreakReminder();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEndOpen(false);
    setCurrentStack('');
    refresh();
  };

  // Live result preview
  const liveCashOut = parseFloat(currentStack) || 0;
  const liveResult = active ? liveCashOut - active.buyIn - active.rebuysTotal : 0;
  const liveMinutes = active ? Math.round((now - active.startTime) / 60000) : 0;

  const stopLossHit =
    active && settings.stopLoss != null && liveResult <= -Math.abs(settings.stopLoss);
  const stopWinHit = active && settings.stopWin != null && liveResult >= Math.abs(settings.stopWin);

  return (
    <Screen>
      {active ? (
        <Card style={{ borderColor: colors.accent }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pill label="Live session" tone="win" />
            <Text style={styles.clock}>{clock(liveMinutes)}</Text>
          </Row>
          <Text style={styles.activeMeta}>
            {active.gameType} {active.stakes}
            {active.roomNameCached ? ` at ${active.roomNameCached}` : ''}
          </Text>

          <View style={styles.resultBox}>
            <Text
              style={[
                styles.liveResult,
                { color: liveResult >= 0 ? colors.win : colors.loss },
              ]}
            >
              {moneySigned(liveResult)}
            </Text>
            <Text style={styles.liveResultLabel}>Current result</Text>
          </View>

          <Field
            label="Current stack (what you would cash out now)"
            value={currentStack}
            onChangeText={setCurrentStack}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <Body dim>
            Buy-in {money(active.buyIn)}
            {active.rebuysTotal > 0 ? ` + rebuys ${money(active.rebuysTotal)}` : ''}
          </Body>

          {stopLossHit ? (
            <Banner
              tone="loss"
              text={`Stop-loss hit (${money(settings.stopLoss!)}). Consider ending the session. Discipline protects your roll.`}
            />
          ) : null}
          {stopWinHit ? (
            <Banner
              tone="info"
              text={`Win goal reached (${money(settings.stopWin!)}). Locking up a win is never wrong.`}
            />
          ) : null}

          <Row>
            <Field
              label="Rebuy"
              value={rebuyAmt}
              onChangeText={setRebuyAmt}
              keyboardType="decimal-pad"
              placeholder="200"
            />
          </Row>
          <Button title="Add rebuy" variant="ghost" onPress={onAddRebuy} />

          <Row style={{ marginTop: spacing.xs }}>
            <Button
              title="Tag player"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() =>
                router.push({ pathname: '/villain/new', params: { sessionId: active.id } })
              }
            />
            <Button
              title="Log hand"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() =>
                router.push({ pathname: '/hand/new', params: { sessionId: active.id } })
              }
            />
          </Row>

          {endOpen ? (
            <Button title={`Confirm cash-out ${money(liveCashOut)}`} variant="danger" onPress={onEnd} />
          ) : (
            <Button title="End session" onPress={() => setEndOpen(true)} />
          )}
        </Card>
      ) : (
        <Card>
          <SectionTitle>Start a session</SectionTitle>
          <Body dim>Tap start when you sit down. Fill in the rest while you play.</Body>

          <Segmented
            value={format}
            onChange={(v) => setFormat(v)}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'tournament', label: 'Tournament' },
              { value: 'sitngo', label: 'Sit and Go' },
            ]}
          />

          <Text style={styles.fieldLabel}>Game</Text>
          <ChipRow>
            {GAME_TYPES.map((g) => (
              <Chip key={g} label={g} active={game === g} onPress={() => setGame(g)} />
            ))}
          </ChipRow>

          <Text style={styles.fieldLabel}>Stakes</Text>
          <ChipRow>
            {STAKES.map((st) => (
              <Chip key={st} label={st} active={stakes === st} onPress={() => setStakes(st)} />
            ))}
          </ChipRow>

          <Text style={styles.fieldLabel}>Room</Text>
          <ChipRow>
            <Chip label="None" active={roomId === null} onPress={() => setRoomId(null)} />
            {pickerRooms.map((r) => (
              <Chip key={r.id} label={r.name} active={roomId === r.id} onPress={() => setRoomId(r.id)} />
            ))}
          </ChipRow>

          <Field label="Buy-in" value={buyIn} onChangeText={setBuyIn} keyboardType="decimal-pad" />
          <Button title="Start session" onPress={onStart} />
        </Card>
      )}

      <SectionTitle right={history.length > 0 ? <Pressable onPress={() => router.push('/analytics')}><Text style={styles.link}>Analytics</Text></Pressable> : undefined}>
        History
      </SectionTitle>

      <Button title="+ Add a past session" variant="ghost" onPress={() => router.push('/session/edit')} />

      {history.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          body="Your logged sessions appear here with result, duration, and hourly rate."
        />
      ) : (
        history.map((sshn) => (
          <Card key={sshn.id} onPress={() => router.push(`/session/${sshn.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.histTitle}>
                {sshn.gameType} {sshn.stakes}
              </Text>
              <Text
                style={[styles.histResult, { color: sshn.result >= 0 ? colors.win : colors.loss }]}
              >
                {moneySigned(sshn.result)}
              </Text>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body dim>
                {dayMonth(sshn.startTime)}
                {sshn.roomNameCached ? ` - ${sshn.roomNameCached}` : ''}
              </Body>
              <Body dim>
                {duration(sshn.durationMinutes)} - {hourly(sshn.hourlyRate)}
              </Body>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { fontFamily: fonts.display, fontSize: 30, color: colors.text, letterSpacing: 1 },
  activeMeta: { ...type.body, color: colors.textDim },
  resultBox: { alignItems: 'center', paddingVertical: spacing.sm },
  liveResult: { fontFamily: fonts.display, fontSize: 48, letterSpacing: 1 },
  liveResultLabel: { ...type.tiny, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  histTitle: { ...type.bodySemi, color: colors.text, fontSize: 16 },
  histResult: { fontFamily: fonts.bodySemi, fontSize: 16 },
  link: { ...type.small, color: colors.accent, fontFamily: fonts.bodySemi },
});
