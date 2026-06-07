import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Card, Button, Body, Row, Pill, SectionTitle, EmptyState } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { ensureBaseDrills, listDrills, listDueDrills, reviewDrill, type StudyDrill } from '../../src/db/study';
import { makeQuestion, type QuizQuestion } from '../../src/data/quizSpots';
import { dayMonth } from '../../src/lib/format';

export default function Drills() {
  const [all, setAll] = useState<StudyDrill[]>([]);
  const [queue, setQueue] = useState<StudyDrill[]>([]);
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState<QuizQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  const refresh = useCallback(() => {
    ensureBaseDrills();
    setAll(listDrills());
  }, []);

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const start = () => {
    const due = listDueDrills();
    if (due.length === 0) return;
    setQueue(due);
    setIdx(0);
    setQ(makeQuestion());
    setPicked(null);
  };

  const answer = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    const correct = i === q.correctIndex;
    reviewDrill(queue[idx].id, correct);
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  const next = () => {
    const n = idx + 1;
    if (n >= queue.length) {
      setQueue([]);
      setQ(null);
      refresh();
      return;
    }
    setIdx(n);
    setQ(makeQuestion());
    setPicked(null);
  };

  const due = all.filter((d) => d.nextDue <= Date.now());

  // Active review session
  if (q && queue.length) {
    const drill = queue[idx];
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <SectionTitle>{drill.label}</SectionTitle>
          <Text style={styles.prog}>{idx + 1}/{queue.length}</Text>
        </Row>
        <Card><Text style={styles.prompt}>{q.prompt}</Text></Card>
        {q.options.map((opt, i) => {
          const ok = picked !== null && i === q.correctIndex;
          const bad = picked === i && i !== q.correctIndex;
          return (
            <Pressable key={i} onPress={() => answer(i)} style={[styles.opt, ok && { borderColor: colors.win, backgroundColor: colors.win + '1A' }, bad && { borderColor: colors.loss, backgroundColor: colors.loss + '1A' }]}>
              <Text style={styles.optText}>{opt}</Text>
            </Pressable>
          );
        })}
        {picked !== null ? (
          <Card style={{ borderColor: picked === q.correctIndex ? colors.win : colors.loss }}>
            <Text style={[styles.verdict, { color: picked === q.correctIndex ? colors.win : colors.loss }]}>
              {picked === q.correctIndex ? 'Correct' : 'Review this'}
            </Text>
            <Body>{q.explanation}</Body>
            <View style={{ height: spacing.sm }} />
            <Button title={idx + 1 >= queue.length ? 'Finish' : 'Next drill'} onPress={next} />
          </Card>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ borderColor: colors.accent }}>
        <SectionTitle>Spaced repetition</SectionTitle>
        <Body dim>Drills resurface on a schedule based on how well you know them. Leaks you import jump to the front of the queue.</Body>
        <Row><Text style={styles.big}>{due.length}</Text><Body dim>drills due now</Body></Row>
        <Button title={due.length ? `Start review (${due.length})` : 'Nothing due - check back later'} onPress={start} disabled={due.length === 0} />
      </Card>

      <SectionTitle>All drills</SectionTitle>
      {all.length === 0 ? (
        <EmptyState title="No drills yet" body="Import hands to generate leak-based drills, or start a review of the base set." />
      ) : (
        all.map((d) => (
          <Card key={d.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.label}>{d.label}</Text>
              {d.nextDue <= Date.now() ? <Pill label="Due" tone="warn" /> : <Pill label={`Due ${dayMonth(d.nextDue)}`} tone="info" />}
            </Row>
            <Body dim>Reps {d.reps} - interval {d.intervalDays}d - ease {d.easeFactor.toFixed(2)}</Body>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  prog: { fontFamily: fonts.display, fontSize: 26, color: colors.accent },
  prompt: { ...type.body, fontSize: 17, color: colors.text, lineHeight: 24 },
  opt: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
  optText: { ...type.bodySemi, fontSize: 16, color: colors.text },
  verdict: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5 },
  big: { fontFamily: fonts.display, fontSize: 48, color: colors.accent, letterSpacing: 1 },
  label: { ...type.bodySemi, fontSize: 16, color: colors.text },
});
