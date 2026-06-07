import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Card, Button, Body, Row, Banner, SectionTitle } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { makeQuestion, type QuizQuestion } from '../../src/data/quizSpots';
import { recordQuiz } from '../../src/db/hands';

export default function Quiz() {
  const [q, setQ] = useState<QuizQuestion>(() => makeQuestion());
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === q.correctIndex;
    recordQuiz(q.spotType, correct);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
  };

  const next = () => {
    setPicked(null);
    setQ(makeQuestion());
  };

  return (
    <Screen>
      <Banner tone="warn" text="Study mode. Do not use at the table." />

      <Row style={{ justifyContent: 'space-between' }}>
        <SectionTitle>Trainer</SectionTitle>
        <Text style={styles.score}>
          {score.correct}/{score.total}
        </Text>
      </Row>

      <Card>
        <Text style={styles.prompt}>{q.prompt}</Text>
      </Card>

      {q.options.map((opt, i) => {
        const isCorrect = picked !== null && i === q.correctIndex;
        const isWrongPick = picked === i && i !== q.correctIndex;
        return (
          <Pressable
            key={i}
            onPress={() => answer(i)}
            style={[
              styles.option,
              isCorrect && { borderColor: colors.win, backgroundColor: colors.win + '1A' },
              isWrongPick && { borderColor: colors.loss, backgroundColor: colors.loss + '1A' },
            ]}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        );
      })}

      {picked !== null ? (
        <Card style={{ borderColor: picked === q.correctIndex ? colors.win : colors.loss }}>
          <Text
            style={[
              styles.verdict,
              { color: picked === q.correctIndex ? colors.win : colors.loss },
            ]}
          >
            {picked === q.correctIndex ? 'Correct' : 'Not quite'}
          </Text>
          <Body>{q.explanation}</Body>
          <View style={{ height: spacing.sm }} />
          <Button title="Next spot" onPress={next} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: { fontFamily: fonts.display, fontSize: 26, color: colors.accent, letterSpacing: 1 },
  prompt: { ...type.body, fontSize: 17, color: colors.text, lineHeight: 24 },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  optionText: { ...type.bodySemi, fontSize: 16, color: colors.text },
  verdict: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5 },
});
