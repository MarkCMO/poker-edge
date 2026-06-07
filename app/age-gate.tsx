import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Screen, Button, Body } from '../src/components/ui';
import { colors, fonts, spacing, type } from '../src/theme';
import { useStore } from '../src/store/useStore';

export default function AgeGate() {
  const verifyAge = useStore((s) => s.verifyAge);

  return (
    <Screen scroll={false} style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text style={styles.logo}>POKER EDGE</Text>
        <Text style={styles.tag}>The serious live player's companion</Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text style={styles.heading}>You must be 21 or older</Text>
        <Body dim>
          Poker Edge is a tracking and study tool for live poker players. No real-money gambling
          happens in this app. By continuing you confirm you are at least 21 years old.
        </Body>
        <Body dim>
          If gambling stops being fun, help is available. Call 1-800-GAMBLER any time.
        </Body>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button title="I am 21 or older" onPress={verifyAge} />
        <Button
          title="Responsible gaming resources"
          variant="ghost"
          onPress={() => Linking.openURL('https://www.1800gambler.net').catch(() => {})}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { fontFamily: fonts.display, fontSize: 52, color: colors.accent, letterSpacing: 2 },
  tag: { ...type.body, color: colors.textDim },
  heading: { fontFamily: fonts.display, fontSize: 28, color: colors.text, letterSpacing: 0.5 },
});
