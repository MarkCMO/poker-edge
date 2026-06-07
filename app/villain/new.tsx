import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Card, Field, Chip, ChipRow, Button, Body, SectionTitle } from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { addPlayer } from '../../src/db/players';
import { getActiveSession } from '../../src/db/sessions';
import { VILLAIN_TYPES } from '../../src/data/adviceMatrix';
import type { PlayerType } from '../../src/types';

const RATINGS = [1, 2, 3, 4, 5];

export default function NewVillain() {
  const router = useRouter();
  useLocalSearchParams<{ sessionId?: string }>();
  const active = getActiveSession();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<PlayerType>('unknown');
  const [rating, setRating] = useState(3);

  const save = () => {
    if (!name.trim() && !desc.trim()) {
      router.back();
      return;
    }
    addPlayer({
      displayName: name.trim() || desc.trim().slice(0, 24),
      physicalDesc: desc.trim(),
      playerType: type,
      rating,
      roomId: active?.roomId ?? null,
      roomNameCached: active?.roomNameCached ?? '',
    });
    router.back();
  };

  return (
    <Screen>
      <SectionTitle>Tag a player</SectionTitle>
      <Body dim>Use a descriptive label, not a legal name. This is your private read.</Body>

      <Card>
        <Field label="Label" value={name} onChangeText={setName} placeholder="Seat 4 reg" />
        <Field
          label="Physical description"
          value={desc}
          onChangeText={setDesc}
          placeholder="Older guy, blue Yankees hat, seat 4"
          multiline
        />

        <Text style={styles.label}>Player type</Text>
        <ChipRow>
          {VILLAIN_TYPES.map((v) => (
            <Chip key={v.id} label={v.label} active={type === v.id} onPress={() => setType(v.id)} />
          ))}
        </ChipRow>

        <Text style={styles.label}>Want them at your table</Text>
        <ChipRow>
          {RATINGS.map((r) => (
            <Chip key={r} label={`${r}`} active={rating === r} onPress={() => setRating(r)} />
          ))}
        </ChipRow>

        <Button title="Save player" onPress={save} />
      </Card>
      {active ? <Body dim>Linked to your current session at {active.roomNameCached || 'this room'}.</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase', marginTop: spacing.xs },
});
