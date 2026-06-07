import React, { useState } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Card, Field, Chip, ChipRow, Button, Body, SectionTitle } from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { addHand } from '../../src/db/hands';
import { listPlayers } from '../../src/db/players';
import type { Position } from '../../src/types';

const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'NA'];

export default function NewHand() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const players = listPlayers();

  const [holeCards, setHoleCards] = useState('');
  const [position, setPosition] = useState<Position>('NA');
  const [actions, setActions] = useState('');
  const [resultStr, setResultStr] = useState('');
  const [note, setNote] = useState('');
  const [reviewFlag, setReviewFlag] = useState(true);
  const [villainIds, setVillainIds] = useState<string[]>([]);

  const toggleVillain = (id: string) =>
    setVillainIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const save = () => {
    if (!sessionId || !holeCards.trim()) {
      router.back();
      return;
    }
    addHand({
      sessionId,
      holeCards: holeCards.trim(),
      position,
      streetActions: actions.trim(),
      result: parseFloat(resultStr) || 0,
      selfNote: note.trim(),
      reviewFlag,
      villainIds,
    });
    router.back();
  };

  return (
    <Screen>
      <SectionTitle>Log a hand</SectionTitle>
      <Card>
        <Field label="Your hole cards" value={holeCards} onChangeText={setHoleCards} placeholder="AhKd" />
        <Text style={styles.label}>Position</Text>
        <ChipRow>
          {POSITIONS.map((p) => (
            <Chip key={p} label={p} active={position === p} onPress={() => setPosition(p)} />
          ))}
        </ChipRow>
        <Field
          label="Street actions"
          value={actions}
          onChangeText={setActions}
          placeholder="Raised CO, called by BB, c-bet flop, check-raised turn"
          multiline
        />
        <Field label="Result (this hand)" value={resultStr} onChangeText={setResultStr} keyboardType="decimal-pad" placeholder="0" />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="Should I have folded the turn?" multiline />

        {players.length > 0 ? (
          <>
            <Text style={styles.label}>Villains involved</Text>
            <ChipRow>
              {players.map((p) => (
                <Chip
                  key={p.id}
                  label={p.displayName}
                  active={villainIds.includes(p.id)}
                  onPress={() => toggleVillain(p.id)}
                />
              ))}
            </ChipRow>
          </>
        ) : null}

        <Pressable onPress={() => setReviewFlag((v) => !v)} style={styles.toggle}>
          <View style={[styles.box, reviewFlag && styles.boxOn]} />
          <Body>Flag for later study</Body>
        </Pressable>

        <Button title="Save hand" onPress={save} />
      </Card>
      {!sessionId ? <Body dim>Start a session first to attach hands to it.</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
