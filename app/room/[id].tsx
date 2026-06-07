import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  Screen,
  Card,
  SectionTitle,
  Stat,
  Row,
  Body,
  Button,
  Pill,
  Divider,
  EmptyState,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { getRooms } from '../../src/lib/api';
import type { Room } from '../../src/types';
import { getUserRoom } from '../../src/db/userRooms';
import { structuralEv, scoreBand } from '../../src/lib/profitability';
import { listCompletedSessions } from '../../src/db/sessions';
import { byRoom } from '../../src/lib/analytics';
import { money, moneySigned, hourly } from '../../src/lib/format';

export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [personal, setPersonal] = useState<{ sessions: number; hours: number; net: number; hourly: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      // user-added rooms live on-device; check there first, then the API
      const local = id ? getUserRoom(id) : null;
      getRooms().then((res) => {
        const r = local ?? res.data.find((x) => x.id === id) ?? null;
        setRoom(r);
        if (r) {
          const mine = byRoom(listCompletedSessions()).find((a) => a.key === r.name);
          setPersonal(mine ? { sessions: mine.sessions, hours: mine.hours, net: mine.net, hourly: mine.hourly } : null);
        }
      });
    }, [id])
  );

  if (!room) {
    return (
      <Screen>
        <EmptyState title="Room not found" body="It may have closed or been removed." />
      </Screen>
    );
  }

  const ev = structuralEv(room);
  const band = scoreBand(ev.score);

  const openMaps = () => {
    const query = encodeURIComponent(`${room.name} ${room.city} ${room.state}`);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{room.name}</Text>
            <Body dim>{room.casino}</Body>
            <Body dim>{room.city}, {room.state}</Body>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.scoreNum, { color: colors[band.tone] }]}>{ev.score}</Text>
            <Text style={styles.scoreLbl}>{band.label}</Text>
          </View>
        </Row>
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Tables" value={String(room.tableCount)} />
          <Stat label="Rake cap" value={money(room.rake.cap)} />
          <Stat label="Comp" value={`${money(room.compPerHour)}/hr`} />
        </Row>
      </Card>

      {/* Personal room score (Section 7) - private, from the user's own sessions. */}
      {personal && personal.sessions > 0 ? (
        <Card style={{ borderColor: colors.accent }}>
          <SectionTitle>Your results here</SectionTitle>
          <Row>
            <Stat label="Sessions" value={String(personal.sessions)} />
            <Stat label="Net" value={moneySigned(personal.net)} tone={personal.net >= 0 ? 'win' : 'loss'} />
            <Stat label="Per hour" value={hourly(personal.hourly)} tone={personal.hourly >= 0 ? 'win' : 'loss'} />
          </Row>
          <Body dim>This is your realized rate here, the most honest measure of the room for you.</Body>
        </Card>
      ) : null}

      <SectionTitle>Rake structure</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Percent</Body>
          <Body>{room.rake.percent}% in ${room.rake.increments} increments</Body>
        </Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Cap</Body>
          <Body>{money(room.rake.cap)} per pot</Body>
        </Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>No flop, no drop</Body>
          <Pill label={room.rake.noFlopNoDrop ? 'Yes' : 'No'} tone={room.rake.noFlopNoDrop ? 'win' : 'loss'} />
        </Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <Body>Promo / jackpot drop</Body>
          {room.rake.promoDrop > 0 ? (
            <Pill label={`${money(room.rake.promoDrop)} (dead money)`} tone="warn" />
          ) : (
            <Pill label="None" tone="win" />
          )}
        </Row>
        {room.rake.buyInCap != null ? (
          <>
            <Divider />
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>Buy-in cap</Body>
              <Body>{money(room.rake.buyInCap)}</Body>
            </Row>
          </>
        ) : null}
      </Card>

      <SectionTitle>Rake friendliness breakdown</SectionTitle>
      <Card>
        <Body dim>How the {ev.score} score is built. This rates rake and comp structure, not guaranteed profit.</Body>
        {ev.lines.map((line, i) => (
          <Row key={i} style={{ justifyContent: 'space-between' }}>
            <Body style={{ flex: 1 }}>{line.label}</Body>
            <Text
              style={{
                fontFamily: fonts.bodySemi,
                color: line.delta > 0 ? colors.win : line.delta < 0 ? colors.loss : colors.textDim,
              }}
            >
              {line.delta > 0 ? '+' : ''}
              {line.delta}
            </Text>
          </Row>
        ))}
      </Card>

      <SectionTitle>Details</SectionTitle>
      <Card>
        <Body>Game spread: {room.stakesSpread}</Body>
        <Body dim>Hours: {room.hoursOpen}</Body>
        <Body dim>Loyalty: {room.loyalty}</Body>
        {room.notes ? <Body style={{ marginTop: spacing.xs }}>{room.notes}</Body> : null}
      </Card>

      <Button title="Get directions" variant="ghost" onPress={openMaps} />
      <Button title="Room website" variant="ghost" onPress={() => Linking.openURL(room.sourceUrl).catch(() => {})} />
      <Body dim>Verified {room.lastVerified}. Rake, comps, and whether a room is open change constantly.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.section, fontSize: 22, color: colors.text },
  scoreNum: { fontFamily: fonts.display, fontSize: 40, letterSpacing: 1 },
  scoreLbl: { ...type.tiny, color: colors.textDim, textTransform: 'uppercase' },
});
