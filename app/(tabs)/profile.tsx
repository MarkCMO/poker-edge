import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Switch, Linking, Share, Alert, Pressable } from 'react-native';
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
  Segmented,
  SectionTitle,
  Divider,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { listAccounts, accountBalance, totalBankroll, addTxn, createAccount, bankrollSeries, listTxns, deleteTxn } from '../../src/db/bankroll';
import { LineChart } from '../../src/components/charts';
import type { TxnType } from '../../src/types';
import { listCompletedSessions } from '../../src/db/sessions';
import { listPlayers } from '../../src/db/players';
import { listHands } from '../../src/db/hands';
import { wipeAllData } from '../../src/db/database';
import { SEED_ROOMS } from '../../src/data/seedRooms';
import { money, moneySigned, dayMonth } from '../../src/lib/format';
import { restorePurchases } from '../../src/lib/purchases';
import type { BankrollAccount, PlayerNote } from '../../src/types';

export default function ProfileTab() {
  const router = useRouter();
  const s = useStore();
  const [accounts, setAccounts] = useState<BankrollAccount[]>([]);
  const [players, setPlayers] = useState<PlayerNote[]>([]);
  const [total, setTotal] = useState(0);

  // bankroll editing
  const [txnType, setTxnType] = useState<TxnType>('deposit');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNote, setTxnNote] = useState('');
  const [txnAccountId, setTxnAccountId] = useState<string | null>(null);
  const [newAcct, setNewAcct] = useState('');

  const saveTxn = () => {
    const amt = parseFloat(txnAmount);
    if (!amt || isNaN(amt)) {
      Alert.alert('Enter an amount', 'Type how much to add, remove, or adjust.');
      return;
    }
    let acct = txnAccountId ?? accounts[0]?.id ?? null;
    if (!acct) acct = createAccount('Main');
    const signed = txnType === 'withdrawal' ? -Math.abs(amt) : txnType === 'deposit' ? Math.abs(amt) : amt;
    addTxn({ accountId: acct, type: txnType, amount: signed, note: txnNote.trim() });
    setTxnAmount('');
    setTxnNote('');
    refresh();
  };

  const addAccount = () => {
    if (!newAcct.trim()) return;
    const id = createAccount(newAcct.trim());
    setTxnAccountId(id);
    setNewAcct('');
    refresh();
  };

  const balanceSeries = bankrollSeries().map((p) => p.balance);
  const recentTxns = listTxns().slice(0, 15);

  const removeTxn = (txnId: string) => {
    Alert.alert('Delete entry', 'Remove this bankroll transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTxn(txnId); refresh(); } },
    ]);
  };

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
        {balanceSeries.length >= 2 ? (
          <View style={{ marginTop: spacing.sm }}>
            <LineChart data={balanceSeries} positive={total >= 0} />
            <Body dim>Bankroll over {balanceSeries.length} transactions.</Body>
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Adjust bankroll</SectionTitle>
        <Segmented
          value={txnType}
          onChange={(v) => setTxnType(v as TxnType)}
          options={[
            { value: 'deposit', label: 'Deposit' },
            { value: 'withdrawal', label: 'Withdraw' },
            { value: 'adjustment', label: 'Adjust' },
          ]}
        />
        {accounts.length > 1 ? (
          <ChipRow>
            {accounts.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                active={(txnAccountId ?? accounts[0]?.id) === a.id}
                onPress={() => setTxnAccountId(a.id)}
              />
            ))}
          </ChipRow>
        ) : null}
        <Field
          label={txnType === 'adjustment' ? 'Amount (use minus to reduce)' : 'Amount'}
          value={txnAmount}
          onChangeText={setTxnAmount}
          keyboardType={txnType === 'adjustment' ? 'default' : 'decimal-pad'}
          placeholder="500"
        />
        <Field label="Note (optional)" value={txnNote} onChangeText={setTxnNote} placeholder="Top-up, cash-out, correction..." />
        <Button title="Save entry" onPress={saveTxn} />
        <Divider />
        <Row style={{ gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Field label="New account" value={newAcct} onChangeText={setNewAcct} placeholder="Online roll" />
          </View>
        </Row>
        <Button title="Add account" variant="ghost" onPress={addAccount} />
      </Card>

      {recentTxns.length > 0 ? (
        <>
          <SectionTitle>Recent transactions</SectionTitle>
          <Card>
            {recentTxns.map((t) => (
              <Pressable key={t.id} onPress={() => removeTxn(t.id)}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Body>{t.type}{t.note ? ` - ${t.note}` : ''}</Body>
                    <Body dim>{dayMonth(t.date)}</Body>
                  </View>
                  <Text style={{ color: t.amount >= 0 ? colors.win : colors.loss, fontFamily: fonts.bodySemi }}>
                    {moneySigned(t.amount)}
                  </Text>
                </Row>
              </Pressable>
            ))}
            <Body dim>Tap an entry to delete it.</Body>
          </Card>
        </>
      ) : null}

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
