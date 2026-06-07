import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDb } from '../src/db/database';
import { useStore } from '../src/store/useStore';
import { configurePurchases, refreshEntitlement } from '../src/lib/purchases';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydration() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });
  const hydrated = useHydration();
  const [dbReady, setDbReady] = useState(false);

  const ageVerified = useStore((s) => s.ageVerified);
  const onboarded = useStore((s) => s.onboarded);
  const setPro = useStore((s) => s.setPro);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    try {
      initDb();
    } finally {
      setDbReady(true);
    }
    // Configure IAP and sync entitlement (fails soft if keys not set yet).
    if (configurePurchases()) {
      refreshEntitlement().then((pro) => {
        if (pro) setPro(true);
      });
    }
  }, [setPro]);

  const ready = fontsLoaded && hydrated && dbReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Route guard (Section 10 age gate + onboarding).
  useEffect(() => {
    if (!ready) return;
    const top = segments[0];
    const onGate = top === 'age-gate' || top === 'onboarding';
    if (!ageVerified) {
      if (top !== 'age-gate') router.replace('/age-gate');
    } else if (!onboarded) {
      if (top !== 'onboarding') router.replace('/onboarding');
    } else if (onGate) {
      router.replace('/');
    }
  }, [ready, ageVerified, onboarded, segments, router]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'Barlow_600SemiBold' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitle: 'Back',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="age-gate" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
          <Stack.Screen name="paywall" options={{ title: 'Poker Edge Pro', presentation: 'modal' }} />
          <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
          <Stack.Screen name="villain/[id]" options={{ title: 'Player' }} />
          <Stack.Screen name="villain/new" options={{ title: 'Tag player', presentation: 'modal' }} />
          <Stack.Screen name="hand/new" options={{ title: 'Log hand', presentation: 'modal' }} />
          <Stack.Screen name="tournament/[id]" options={{ title: 'Tournament' }} />
          <Stack.Screen name="room/[id]" options={{ title: 'Room' }} />
          <Stack.Screen name="room/add" options={{ title: 'Add a room', presentation: 'modal' }} />
          <Stack.Screen name="study/ranges" options={{ title: 'Range charts' }} />
          <Stack.Screen name="study/matrix" options={{ title: 'Player-type guide' }} />
          <Stack.Screen name="study/quiz" options={{ title: 'Trainer' }} />
          <Stack.Screen name="study/equity" options={{ title: 'Equity calculator' }} />
          <Stack.Screen name="study/odds" options={{ title: 'Odds & probabilities' }} />
          <Stack.Screen name="study/potodds" options={{ title: 'Pot odds & outs' }} />
          <Stack.Screen name="study/handstats" options={{ title: 'My hand stats' }} />
          <Stack.Screen name="study/variance" options={{ title: 'Variance & risk of ruin' }} />
          <Stack.Screen name="study/import" options={{ title: 'Import hands' }} />
          <Stack.Screen name="study/drills" options={{ title: 'Drills' }} />
          <Stack.Screen name="study/icm" options={{ title: 'ICM calculator' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
