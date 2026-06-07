import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Calendar from 'expo-calendar';
import {
  Screen,
  Card,
  SectionTitle,
  Stat,
  Row,
  Body,
  Button,
  Chip,
  ChipRow,
  Pill,
  EmptyState,
} from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { getTournaments } from '../../src/lib/api';
import type { Tournament } from '../../src/types';
import { money, isoDateTime, isoDayMonth } from '../../src/lib/format';
import {
  scheduleTournamentReminder,
  cancelTournamentReminder,
  isTournamentReminderSet,
} from '../../src/lib/notifications';
import { useStore } from '../../src/store/useStore';

const REMINDER_HOURS = [1, 2, 3, 6, 12];

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [t, setT] = useState<Tournament | null>(null);
  const [reminderSet, setReminderSet] = useState(false);
  const defaultHours = useStore((s) => s.defaultReminderHours);
  const [hours, setHours] = useState(defaultHours);

  useFocusEffect(
    useCallback(() => {
      getTournaments().then((res) => setT(res.data.find((x) => x.id === id) ?? null));
    }, [id])
  );

  useEffect(() => {
    if (id) isTournamentReminderSet(id).then(setReminderSet);
  }, [id]);

  if (!t) {
    return (
      <Screen>
        <EmptyState title="Tournament not found" body="It may have changed or been removed." />
      </Screen>
    );
  }

  const openMaps = () => {
    const query = encodeURIComponent(`${t.roomName} ${t.city}`);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  const addToCalendar = async () => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Calendar access needed', 'Enable calendar access in Settings to add events.');
      return;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications);
    if (!writable) {
      Alert.alert('No writable calendar', 'Could not find a calendar to add the event to.');
      return;
    }
    const start = new Date(t.startDateTime);
    const end = new Date(start.getTime() + 8 * 3600000);
    await Calendar.createEventAsync(writable.id, {
      title: t.name,
      startDate: start,
      endDate: end,
      location: `${t.roomName}, ${t.city}`,
      notes: `Buy-in ${money(t.buyIn)}. ${t.guarantee ? money(t.guarantee) + ' GTD. ' : ''}Late reg: ${t.lateRegLevel}.`,
    });
    Alert.alert('Added to calendar', `${t.name} on ${isoDayMonth(t.startDateTime)}.`);
  };

  const toggleReminder = async () => {
    if (reminderSet) {
      await cancelTournamentReminder(t.id);
      setReminderSet(false);
    } else {
      const result = await scheduleTournamentReminder(t.id, t.name, t.startDateTime, hours);
      if (result) {
        setReminderSet(true);
      } else {
        Alert.alert(
          'Could not set reminder',
          'Either the start time has passed or notifications are not enabled.'
        );
      }
    }
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.title}>{t.name}</Text>
          {t.tentative ? <Pill label="Tentative" tone="warn" /> : null}
        </Row>
        <Body dim>{isoDateTime(t.startDateTime)}</Body>
        <Body dim>{t.roomName} - {t.city}</Body>
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Buy-in" value={money(t.buyIn)} />
          <Stat label="Guarantee" value={t.guarantee ? money(t.guarantee) : '-'} />
          <Stat label="Game" value={t.gameType} />
        </Row>
        <Body dim>Late registration: {t.lateRegLevel}</Body>
      </Card>

      <SectionTitle>Remind me</SectionTitle>
      <Card>
        <Body dim>Get a local reminder before this event starts.</Body>
        <ChipRow>
          {REMINDER_HOURS.map((h) => (
            <Chip key={h} label={`${h}h before`} active={hours === h} onPress={() => setHours(h)} />
          ))}
        </ChipRow>
        <Button
          title={reminderSet ? 'Reminder set - tap to cancel' : `Remind me ${hours}h before`}
          variant={reminderSet ? 'ghost' : 'primary'}
          onPress={toggleReminder}
        />
      </Card>

      <Button title="Add to calendar" variant="ghost" onPress={addToCalendar} />
      <Button title="Get directions" variant="ghost" onPress={openMaps} />
      <Button
        title="Tournament structure"
        variant="ghost"
        onPress={() => Linking.openURL(t.structureUrl).catch(() => {})}
      />
      <Body dim>Verified {t.lastVerified}. Confirm with the organizer before you travel.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.section, fontSize: 20, color: colors.text, flex: 1, marginRight: 8 },
});
