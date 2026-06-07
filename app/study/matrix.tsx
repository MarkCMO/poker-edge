import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Screen, Card, Chip, ChipRow, Body, SectionTitle } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import {
  HAND_CLASSES,
  VILLAIN_TYPES,
  adviceFor,
  type HandClass,
} from '../../src/data/adviceMatrix';
import type { PlayerType } from '../../src/types';

// Only the five primary archetypes for the matrix selector.
const MATRIX_VILLAINS = VILLAIN_TYPES.filter((v) =>
  ['nit', 'tag', 'lag', 'calling_station', 'maniac'].includes(v.id)
);

export default function Matrix() {
  const [hand, setHand] = useState<HandClass>('premium');
  const [villain, setVillain] = useState<PlayerType>('calling_station');

  const handMeta = HAND_CLASSES.find((h) => h.id === hand)!;
  const villainMeta = VILLAIN_TYPES.find((v) => v.id === villain)!;

  return (
    <Screen>
      <Text style={styles.fieldLabel}>Your hand class</Text>
      <ChipRow>
        {HAND_CLASSES.map((h) => (
          <Chip key={h.id} label={h.label} active={hand === h.id} onPress={() => setHand(h.id)} />
        ))}
      </ChipRow>

      <Text style={styles.fieldLabel}>Villain type</Text>
      <ChipRow>
        {MATRIX_VILLAINS.map((v) => (
          <Chip key={v.id} label={v.label} active={villain === v.id} onPress={() => setVillain(v.id)} />
        ))}
      </ChipRow>

      <Card style={{ borderColor: colors.accent }}>
        <SectionTitle>
          {handMeta.label} vs {villainMeta.label}
        </SectionTitle>
        <Body dim>{handMeta.examples}</Body>
        <Text style={styles.advice}>{adviceFor(hand, villain)}</Text>
      </Card>

      <SectionTitle>Read on a {villainMeta.label}</SectionTitle>
      <Card>
        <Body>{villainMeta.read}</Body>
      </Card>

      <Body dim>
        Study content only. Build reads from your villain notes and review them away from the table.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
  advice: { ...type.body, color: colors.text, fontSize: 16, lineHeight: 23 },
});
