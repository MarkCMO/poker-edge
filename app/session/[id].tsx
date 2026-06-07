import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import {
  Screen,
  Card,
  SectionTitle,
  Stat,
  Row,
  Body,
  Button,
  Pill,
  EmptyState,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { getSession, deleteSession } from '../../src/db/sessions';
import { listHands, toggleReview, deleteHand } from '../../src/db/hands';
import type { SessionComputed, HandNote } from '../../src/types';
import { money, moneySigned, duration, fullDate, hourly } from '../../src/lib/format';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionComputed | null>(null);
  const [hands, setHands] = useState<HandNote[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setSession(getSession(id));
      setHands(listHands(id));
    }, [id])
  );

  if (!session) {
    return (
      <Screen>
        <EmptyState title="Session not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const onDelete = () => {
    Alert.alert('Delete session', 'This also removes its bankroll entry and logged hands.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={styles.title}>
            {session.gameType} {session.stakes}
          </Text>
          <Pill
            label={moneySigned(session.result)}
            tone={session.result >= 0 ? 'win' : 'loss'}
          />
        </Row>
        <Body dim>{fullDate(session.startTime)}</Body>
        {session.roomNameCached ? <Body dim>{session.roomNameCached}</Body> : null}
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Result" value={moneySigned(session.result)} tone={session.result >= 0 ? 'win' : 'loss'} />
          <Stat label="Duration" value={duration(session.durationMinutes)} />
          <Stat label="Per hour" value={hourly(session.hourlyRate)} tone={session.hourlyRate >= 0 ? 'win' : 'loss'} />
        </Row>
        <Row style={{ marginTop: spacing.sm }}>
          <Stat label="Buy-in" value={money(session.buyIn)} />
          <Stat label="Rebuys" value={money(session.rebuysTotal)} />
          <Stat label="Cash-out" value={money(session.cashOut)} />
        </Row>
      </Card>

      <Row>
        <Button
          title="Edit session"
          variant="ghost"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/session/edit', params: { id: session.id } })}
        />
        <Button
          title="Log hand"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/hand/new', params: { sessionId: session.id } })}
        />
      </Row>

      <SectionTitle>Hands logged</SectionTitle>
      {hands.length === 0 ? (
        <Body dim>No hands logged for this session.</Body>
      ) : (
        hands.map((h) => (
          <Card key={h.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.hand}>
                {h.holeCards} ({h.position})
              </Text>
              <Text style={{ color: h.result >= 0 ? colors.win : colors.loss, fontFamily: fonts.bodySemi }}>
                {moneySigned(h.result)}
              </Text>
            </Row>
            {h.streetActions ? <Body dim>{h.streetActions}</Body> : null}
            {h.selfNote ? <Body>{h.selfNote}</Body> : null}
            <Row>
              <Button
                title={h.reviewFlag ? 'Unflag' : 'Flag for review'}
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => {
                  toggleReview(h.id, !h.reviewFlag);
                  setHands(listHands(id));
                }}
              />
              <Button
                title="Delete"
                variant="danger"
                style={{ flex: 1 }}
                onPress={() => {
                  Alert.alert('Delete hand', 'Remove this logged hand?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        deleteHand(h.id);
                        setHands(listHands(id));
                      },
                    },
                  ]);
                }}
              />
            </Row>
          </Card>
        ))
      )}

      <View style={{ height: spacing.lg }} />
      <Button title="Delete session" variant="danger" onPress={onDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...type.section, fontSize: 22, color: colors.text },
  hand: { ...type.bodySemi, color: colors.accent, fontSize: 16 },
});
