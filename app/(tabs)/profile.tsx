import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Switch, Linking, Share, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
  Stat,
  SectionTitle,
  Divider,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { listAccounts, accountBalance, totalBankroll } from '../../src/db/bankroll';
import { listCompletedSessions } from '../../src/db/sessions';
import { listPlayers } from '../../src/db/players';
import { listHands } from '../../src/db/hands';
import { wipeAllData } from '../../src/db/database';
import { SEED_ROOMS } from '../../src/data/seedRooms';
import { money, moneySigned } from '../../src/lib/format';
import { restorePurchases } from '../../src/lib/purchases';
import type { BankrollAccount, PlayerNote } from '../../src/types';

export default function ProfileTab() {
  const router = useRouter();
  const s = useStore();
  const [accounts, setAccounts] = useState<BankrollAccount[]>([]);
  const [players, setPlayers] = useState<PlayerNote[]>([]);
  const [total, setTotal] = useState(0);

  // local editable mirrors for numeric settings
  const [stopLoss, setStopLoss] = useState(s.stopLoss != null ? String(s.stopLoss) : '');
  const [stopWin, setStopWin] = useState(s.stopWin != null ? String(s.stopWin) : '');
  const [breakInterval, setBreakInterval] = useState(String(s.breakIntervalMin));

  const refresh = useCallback(() => {
    setAccounts(listAccounts());
    setPlayers(listPlayers());
    setTotal(totalBankroll());
  }, []);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const exportData = async (fmt: 'json' | 'csv') => {
    const sessions = listCompletedSessions();
    if (fmt === 'json') {
      const payload = {
        exportedAt: new Date().toISOString(),
        sessions,
        players,
        hands: listHands(),
      };
      await Share.share({ message: JSON.stringify(payload, null, 2) });
    } else {
      const header = 'date,game,format,stakes,room,buyIn,rebuys,cashOut,result,minutes,hourly';
      const rows = sessions.map((x) =>
        [
          new Date(x.startTime).toISOString(),
          x.gameType,
          x.format,
          x.stakes,
          x.roomNameCached,
          x.buyIn,
          x.rebuysTotal,
          x.cashOut,
          x.result,
          x.durationMinutes,
          x.hourlyRate.toFixed(2),
        ].join(',')
      );
      await Share.share({ message: [header, ...rows].join('\n') });
    }
  };

  const confirmWipe = () => {
    Alert.alert('Delete all data', 'This permanently erases your sessions, bankroll, and notes.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () => {
          wipeAllData();
          refresh();
          Alert.alert('Done', 'All local data has been deleted.');
        },
      },
    ]);
  };

  const saveNumbers = () => {
    s.set({
      stopLoss: stopLoss.trim() ? Math.abs(parseFloat(stopLoss)) : null,
      stopWin: stopWin.trim() ? Math.abs(parseFloat(stopWin)) : null,
      breakIntervalMin: Math.max(15, parseInt(breakInterval, 10) || 90),
    });
    Alert.alert('Saved', 'Your welfare settings are updated.');
  };

  return (
    <Screen>
      {/* Subscription (Section 11) */}
      <Card style={{ borderColor: s.proUnlocked ? colors.win : colors.accent }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <SectionTitle>Poker Edge {s.proUnlocked ? 'Pro' : 'Free'}</SectionTitle>
          <Pill label={s.proUnlocked ? 'Active' : 'Free'} tone={s.proUnlocked ? 'win' : 'info'} />
        </Row>
        {s.proUnlocked ? (
          <Body dim>Full analytics, unlimited notes, the full range library, and the trainer are unlocked.</Body>
        ) : (
          <>
            <Body dim>Unlock full analytics, the full range library, the quiz trainer, and data export.</Body>
            <Button title="See Poker Edge Pro" onPress={() => router.push('/paywall')} />
          </>
        )}
        <Button
          title="Restore purchases"
          variant="ghost"
          onPress={async () => {
            const ok = await restorePurchases();
            s.setPro(ok);
            Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Pro is active.' : 'No active subscription found.');
          }}
        />
      </Card>

      {/* Bankroll */}
      <SectionTitle>Bankroll</SectionTitle>
      <Card>
        <Stat label="Total bankroll" value={moneySigned(total)} tone={total >= 0 ? 'win' : 'loss'} />
        <Divider />
        {accounts.map((a) => (
          <Row key={a.id} style={{ justifyContent: 'space-between' }}>
            <Body>{a.name}</Body>
            <Body>{money(accountBalance(a.id))}</Body>
          </Row>
        ))}
      </Card>

      {/* Players */}
      <SectionTitle right={<Text style={styles.count}>{players.length}</Text>}>Players</SectionTitle>
      {players.length === 0 ? (
        <Body dim>Tag players during a session to build cross-session reads.</Body>
      ) : (
        players.slice(0, 8).map((p) => (
          <Card key={p.id} onPress={() => router.push(`/villain/${p.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.playerName}>{p.displayName}</Text>
              <Pill label={`${p.rating}/5`} tone="info" />
            </Row>
            {p.physicalDesc ? <Body dim numberOfLines={1}>{p.physicalDesc}</Body> : null}
          </Card>
        ))
      )}

      {/* Welfare tools (Section 4.6) */}
      <SectionTitle>Long-session welfare</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Break reminders</Body>
          <Switch
            value={s.breakRemindersOn}
            onValueChange={(v) => s.set({ breakRemindersOn: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </Row>
        <Field label="Break interval (minutes)" value={breakInterval} onChangeText={setBreakInterval} keyboardType="numeric" />
        <Field label="Session stop-loss ($)" value={stopLoss} onChangeText={setStopLoss} keyboardType="decimal-pad" placeholder="Optional" />
        <Field label="Session win goal ($)" value={stopWin} onChangeText={setStopWin} keyboardType="decimal-pad" placeholder="Optional" />
        <Button title="Save welfare settings" onPress={saveNumbers} />
      </Card>

      {/* Notifications (Section 9) */}
      <SectionTitle>Notifications</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Tournament reminders</Body>
          <Switch
            value={s.notifTournaments}
            onValueChange={(v) => s.set({ notifTournaments: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </Row>
      </Card>

      {/* Preferences */}
      <SectionTitle>Defaults</SectionTitle>
      <Card>
        <Text style={styles.label}>Default stakes</Text>
        <ChipRow>
          {['1/2', '1/3', '2/5', '5/10'].map((st) => (
            <Chip key={st} label={st} active={s.defaultStakes === st} onPress={() => s.set({ defaultStakes: st })} />
          ))}
        </ChipRow>
        <Text style={styles.label}>Default room</Text>
        <ChipRow>
          <Chip label="None" active={s.defaultRoomId === null} onPress={() => s.set({ defaultRoomId: null })} />
          {SEED_ROOMS.slice(0, 8).map((r) => (
            <Chip key={r.id} label={r.name} active={s.defaultRoomId === r.id} onPress={() => s.set({ defaultRoomId: r.id })} />
          ))}
        </ChipRow>
      </Card>

      {/* Data ownership (Section 10) */}
      <SectionTitle>Your data</SectionTitle>
      <Card>
        <Body dim>You own your bankroll and notes. Export them any time.</Body>
        <Row>
          <Button title="Export JSON" variant="ghost" style={{ flex: 1 }} onPress={() => exportData('json')} />
          <Button title="Export CSV" variant="ghost" style={{ flex: 1 }} onPress={() => exportData('csv')} />
        </Row>
        <Button title="Delete all data" variant="danger" onPress={confirmWipe} />
      </Card>

      {/* Responsible gaming (Section 10) */}
      <Card>
        <SectionTitle>Responsible gaming</SectionTitle>
        <Body dim>If gambling stops being fun, help is available 24/7.</Body>
        <Button title="Call 1-800-GAMBLER" onPress={() => Linking.openURL('tel:18004262537').catch(() => {})} />
        <Button title="Visit 1800gambler.net" variant="ghost" onPress={() => Linking.openURL('https://www.1800gambler.net').catch(() => {})} />
      </Card>

      <Body dim>
        Age verified{s.ageVerifiedAt ? ` on ${new Date(s.ageVerifiedAt).toLocaleDateString()}` : ''}. Poker Edge is a
        tracking and study tool. No real-money gambling happens in this app.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { ...type.section, color: colors.textDim },
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  playerName: { ...type.bodySemi, color: colors.text, fontSize: 16 },
});
