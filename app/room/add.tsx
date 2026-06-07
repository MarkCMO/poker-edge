import React, { useState } from 'react';
import { View, Switch, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen, Card, Field, Button, Body, Row, SectionTitle, Banner } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { addUserRoom } from '../../src/db/userRooms';
import { submitRoom } from '../../src/lib/api';

export default function AddRoom() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string; city?: string; state?: string; country?: string; lat?: string; lng?: string;
  }>();

  const [name, setName] = useState(params.name ?? '');
  const [city, setCity] = useState(params.city ?? '');
  const [state, setState] = useState(params.state ?? '');
  const [stakes, setStakes] = useState('1/2, 1/3, 2/5');
  const [percent, setPercent] = useState('10');
  const [cap, setCap] = useState('5');
  const [increments, setIncrements] = useState('1');
  const [noFlopNoDrop, setNoFlopNoDrop] = useState(true);
  const [promoDrop, setPromoDrop] = useState('0');
  const [comp, setComp] = useState('0');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState<number | null>(params.lat ? parseFloat(params.lat) : null);
  const [lng, setLng] = useState<number | null>(params.lng ? parseFloat(params.lng) : null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Enable location access to tag this room with coordinates.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give the room a name.');
      return;
    }
    setSaving(true);
    const rake = {
      percent: parseFloat(percent) || 10,
      cap: parseFloat(cap) || 5,
      increments: parseFloat(increments) || 1,
      noFlopNoDrop,
      promoDrop: parseFloat(promoDrop) || 0,
      buyInCap: null as number | null,
    };
    const room = {
      name: name.trim(),
      casino: name.trim(),
      city: city.trim(),
      state: state.trim(),
      region: 'Community',
      stakesSpread: stakes.trim(),
      rake,
      compPerHour: parseFloat(comp) || 0,
      lat,
      lng,
      notes: notes.trim(),
    };
    addUserRoom(room); // local, instant, offline
    submitRoom(room).catch(() => {}); // crowdsource, best-effort
    setSaving(false);
    Alert.alert('Room added', 'Saved to your rooms and shared to the community directory.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <Screen>
      <Banner tone="info" text="Add any poker room. It is saved on your device (works offline) and shared to the community directory." />
      <Card>
        <Field label="Room name" value={name} onChangeText={setName} placeholder="Bestbet Jacksonville" />
        <Row>
          <View style={{ flex: 1 }}><Field label="City" value={city} onChangeText={setCity} placeholder="Jacksonville" /></View>
          <View style={{ flex: 1 }}><Field label="State" value={state} onChangeText={setState} placeholder="FL" /></View>
        </Row>
        <Field label="Stakes spread" value={stakes} onChangeText={setStakes} placeholder="1/2, 2/5, 5/10" />
        <Button
          title={lat != null ? `Location set (${lat.toFixed(3)}, ${lng?.toFixed(3)})` : locating ? 'Locating...' : 'Use my current location'}
          variant="ghost"
          onPress={useMyLocation}
          disabled={locating}
        />
      </Card>

      <SectionTitle>Rake</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Field label="Percent" value={percent} onChangeText={setPercent} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Cap ($)" value={cap} onChangeText={setCap} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Increment" value={increments} onChangeText={setIncrements} keyboardType="decimal-pad" /></View>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Body>No flop, no drop</Body>
          <Switch value={noFlopNoDrop} onValueChange={setNoFlopNoDrop} trackColor={{ true: colors.accent, false: colors.border }} />
        </Row>
        <Row>
          <View style={{ flex: 1 }}><Field label="Promo drop ($)" value={promoDrop} onChangeText={setPromoDrop} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Comp ($/hr)" value={comp} onChangeText={setComp} keyboardType="decimal-pad" /></View>
        </Row>
      </Card>

      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Game runs nightly, soft 2/5..." multiline />
      <Button title={saving ? 'Saving...' : 'Add room'} onPress={save} disabled={saving} />
    </Screen>
  );
}
