import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  Screen,
  Card,
  Chip,
  ChipRow,
  Body,
  Pill,
  Row,
  Button,
  Segmented,
  SectionTitle,
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { getRooms, getNearbyRooms, sourceLabel, type DataSource } from '../../src/lib/api';
import { listUserRooms } from '../../src/db/userRooms';
import type { Room, NearbyRoom } from '../../src/types';
import { structuralEv, scoreBand } from '../../src/lib/profitability';
import { money } from '../../src/lib/format';

const REGIONS = ['All', 'LV Strip', 'Atlantic City', 'Community'];

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function srcPill(source?: string) {
  if (source === 'user') return <Pill label="Yours" tone="win" />;
  if (source === 'community') return <Pill label="Community" tone="info" />;
  return <Pill label="Curated" tone="warn" />;
}

export default function RoomsTab() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [source, setSource] = useState<{ s: DataSource; ts: number | null }>({ s: 'seed', ts: null });
  const [region, setRegion] = useState('All');
  const [sort, setSort] = useState<'score' | 'distance'>('score');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<NearbyRoom[]>([]);
  const [findingNearby, setFindingNearby] = useState(false);

  const load = useCallback(() => {
    const userRooms = listUserRooms();
    getRooms().then((res) => {
      const byId = new Map<string, Room>();
      for (const r of res.data) byId.set(r.id, r);
      for (const r of userRooms) byId.set(r.id, r); // user rooms win/add
      setRooms([...byId.values()]);
      setSource({ s: res.source, ts: res.lastFetched });
    });
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const getCoords = async (): Promise<{ lat: number; lng: number } | null> => {
    if (coords) return coords;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'Enable location access to find and sort rooms near you.');
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(c);
    return c;
  };

  const findNearby = async () => {
    setFindingNearby(true);
    try {
      const c = await getCoords();
      if (!c) return;
      setSort('distance');
      const results = await getNearbyRooms(c.lat, c.lng);
      // hide ones already in our directory (by rough name match)
      const known = new Set(rooms.map((r) => r.name.toLowerCase()));
      setNearby(results.filter((n) => !known.has(n.name.toLowerCase())).slice(0, 30));
      if (results.length === 0) Alert.alert('No rooms found', 'No card rooms found nearby in OpenStreetMap. You can add one manually.');
    } finally {
      setFindingNearby(false);
    }
  };

  const addNearby = (n: NearbyRoom) => {
    router.push({
      pathname: '/room/add',
      params: { name: n.name, city: n.city, state: n.state, country: n.country, lat: String(n.lat ?? ''), lng: String(n.lng ?? '') },
    });
  };

  const filtered = rooms.filter((r) => region === 'All' || r.region === region);
  const withMeta = filtered.map((r) => ({
    room: r,
    score: structuralEv(r).score,
    distance: coords && r.lat != null && r.lng != null ? haversineMiles(coords, { lat: r.lat, lng: r.lng }) : null,
  }));
  withMeta.sort((a, b) => {
    if (sort === 'distance' && a.distance != null && b.distance != null) return a.distance - b.distance;
    return b.score - a.score;
  });

  return (
    <Screen>
      <Row>
        <Button title="+ Add a room" variant="ghost" style={{ flex: 1 }} onPress={() => router.push('/room/add')} />
        <Button title={findingNearby ? 'Searching...' : 'Find rooms near me'} style={{ flex: 1 }} disabled={findingNearby} onPress={findNearby} />
      </Row>

      {nearby.length > 0 ? (
        <>
          <SectionTitle>Nearby (OpenStreetMap)</SectionTitle>
          <Body dim>Tap a room to add it with rake and comp details.</Body>
          {nearby.map((n) => (
            <Card key={n.id} onPress={() => addNearby(n)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={styles.name}>{n.name}</Text>
                <Body dim>{n.distanceKm} km</Body>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body dim>{[n.city, n.state, n.country].filter(Boolean).join(', ') || 'Tap to add details'}</Body>
                <Pill label="Add" tone="win" />
              </Row>
            </Card>
          ))}
          <View style={{ height: spacing.sm }} />
        </>
      ) : null}

      <ChipRow>
        {REGIONS.map((r) => (
          <Chip key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
        ))}
      </ChipRow>

      <Segmented
        value={sort}
        onChange={(v) => {
          if (v === 'distance' && !coords) getCoords().then((c) => c && setSort('distance'));
          else setSort(v);
        }}
        options={[
          { value: 'score', label: 'Rake friendliness' },
          { value: 'distance', label: 'Distance' },
        ]}
      />
      <Body dim>{sourceLabel(source.s, source.ts)}. Rake and comps change often.</Body>

      {withMeta.map(({ room, score, distance }) => {
        const band = scoreBand(score);
        return (
          <Card key={room.id} onPress={() => router.push(`/room/${room.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={styles.name}>{room.name}</Text>
              <View style={styles.scoreBadge}>
                <Text style={[styles.scoreNum, { color: colors[band.tone] }]}>{score}</Text>
                <Text style={styles.scoreLbl}>{band.label}</Text>
              </View>
            </Row>
            <Body dim>
              {[room.city, room.state].filter(Boolean).join(', ')}
              {room.tableCount ? ` - ${room.tableCount} tables` : ''}
              {distance != null ? ` - ${distance.toFixed(0)} mi` : ''}
            </Body>
            <Row style={{ gap: spacing.sm, flexWrap: 'wrap' }}>
              {srcPill(room.source)}
              <Pill label={`Rake cap ${money(room.rake.cap)}`} tone={room.rake.cap <= 5 ? 'win' : 'warn'} />
              {room.rake.promoDrop === 0 ? <Pill label="No promo drop" tone="win" /> : <Pill label={`Drop ${money(room.rake.promoDrop)}`} tone="warn" />}
              {room.compPerHour > 0 ? <Pill label={`Comp ${money(room.compPerHour)}/hr`} tone="info" /> : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { ...type.bodySemi, color: colors.text, fontSize: 17, flex: 1, marginRight: 8 },
  scoreBadge: { alignItems: 'center', minWidth: 56 },
  scoreNum: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 1 },
  scoreLbl: { ...type.tiny, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
});
