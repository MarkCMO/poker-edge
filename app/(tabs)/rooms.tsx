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
} from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';
import { getRooms, sourceLabel, type DataSource } from '../../src/lib/api';
import type { Room } from '../../src/types';
import { structuralEv, scoreBand } from '../../src/lib/profitability';
import { money } from '../../src/lib/format';

const REGIONS = ['All', 'LV Strip', 'LV Off-Strip', 'Downtown LV', 'Atlantic City'];

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function RoomsTab() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [source, setSource] = useState<{ s: DataSource; ts: number | null }>({ s: 'seed', ts: null });
  const [region, setRegion] = useState('All');
  const [sort, setSort] = useState<'score' | 'distance'>('score');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getRooms().then((res) => {
        if (!alive) return;
        setRooms(res.data);
        setSource({ s: res.source, ts: res.lastFetched });
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  const enableDistance = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'Enable location access to sort rooms by distance.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setSort('distance');
  };

  const filtered = rooms.filter((r) => region === 'All' || r.region === region);

  const withMeta = filtered.map((r) => ({
    room: r,
    score: structuralEv(r).score,
    distance: coords && r.lat != null && r.lng != null
      ? haversineMiles(coords, { lat: r.lat, lng: r.lng })
      : null,
  }));

  withMeta.sort((a, b) => {
    if (sort === 'distance' && a.distance != null && b.distance != null) {
      return a.distance - b.distance;
    }
    return b.score - a.score;
  });

  return (
    <Screen>
      <ChipRow>
        {REGIONS.map((r) => (
          <Chip key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
        ))}
      </ChipRow>

      <Segmented
        value={sort}
        onChange={(v) => {
          if (v === 'distance' && !coords) enableDistance();
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
              {room.city}, {room.state} - {room.tableCount} tables
              {distance != null ? ` - ${distance.toFixed(0)} mi` : ''}
            </Body>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body dim>{room.stakesSpread}</Body>
            </Row>
            <Row style={{ gap: spacing.sm, flexWrap: 'wrap' }}>
              <Pill label={`Rake cap ${money(room.rake.cap)}`} tone={room.rake.cap <= 5 ? 'win' : 'warn'} />
              {room.rake.promoDrop === 0 ? (
                <Pill label="No promo drop" tone="win" />
              ) : (
                <Pill label={`Drop ${money(room.rake.promoDrop)}`} tone="warn" />
              )}
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
