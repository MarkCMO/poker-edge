import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Screen, Card, Button, Body, Row, SectionTitle } from '../src/components/ui';
import { colors, fonts, spacing, type } from '../src/theme';
import { getCurrentOffering, purchasePackageById, restorePurchases } from '../src/lib/purchases';
import { useStore } from '../src/store/useStore';

const BENEFITS = [
  'Full analytics: hourly by room, stakes, day, and time',
  'Your personal most-profitable room and game',
  'Variance and downswing tracking',
  'Unlimited villain notes and showdown log',
  'Full preflop range library',
  'Quiz trainer with accuracy tracking',
  'Tournament schedule-change alerts',
  'Export your data any time',
];

export default function Paywall() {
  const router = useRouter();
  const setPro = useStore((s) => s.setPro);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentOffering().then((o) => {
      setOffering(o);
      setLoading(false);
    });
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    setBusy(true);
    const ok = await purchasePackageById(pkg.identifier);
    setBusy(false);
    if (ok) {
      setPro(true);
      Alert.alert('Welcome to Pro', 'Everything is unlocked. Thank you.');
      router.back();
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
        <Text style={styles.logo}>POKER EDGE PRO</Text>
        <Body dim>Data, not vibes. Get the full edge.</Body>
      </View>

      <Card>
        {BENEFITS.map((b) => (
          <Row key={b}>
            <Ionicons name="checkmark-circle" size={20} color={colors.win} />
            <Body style={{ flex: 1 }}>{b}</Body>
          </Row>
        ))}
      </Card>

      {loading ? (
        <Body dim>Loading plans...</Body>
      ) : offering && offering.availablePackages.length > 0 ? (
        offering.availablePackages.map((pkg) => (
          <Card key={pkg.identifier} onPress={() => buy(pkg)} style={{ borderColor: colors.accent }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.planTitle}>{pkg.product.title || pkg.identifier}</Text>
                <Body dim>{pkg.product.description}</Body>
              </View>
              <Text style={styles.price}>{pkg.product.priceString}</Text>
            </Row>
          </Card>
        ))
      ) : (
        <Card>
          <SectionTitle>Plans not available yet</SectionTitle>
          <Body dim>
            In-app purchases are configured in App Store Connect and RevenueCat. Once the keys and
            products are set, monthly and annual plans appear here. Pricing is managed in App Store
            Connect, never hardcoded.
          </Body>
        </Card>
      )}

      <Button
        title={busy ? 'Working...' : 'Restore purchases'}
        variant="ghost"
        disabled={busy}
        onPress={async () => {
          const ok = await restorePurchases();
          setPro(ok);
          Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Pro is active.' : 'No active subscription found.');
          if (ok) router.back();
        }}
      />

      <Row style={{ justifyContent: 'center', gap: spacing.lg }}>
        <Pressable onPress={() => Linking.openURL('https://pokeredge.app/terms').catch(() => {})}>
          <Text style={styles.legal}>Terms</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL('https://pokeredge.app/privacy').catch(() => {})}>
          <Text style={styles.legal}>Privacy</Text>
        </Pressable>
      </Row>
      <Body dim>
        Subscriptions are billed through your Apple ID and auto-renew until cancelled. Manage or cancel
        in your App Store account settings.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { fontFamily: fonts.display, fontSize: 40, color: colors.accent, letterSpacing: 2 },
  planTitle: { ...type.bodySemi, fontSize: 17, color: colors.text },
  price: { fontFamily: fonts.display, fontSize: 26, color: colors.accent, letterSpacing: 0.5 },
  legal: { ...type.small, color: colors.textDim, textDecorationLine: 'underline' },
});
