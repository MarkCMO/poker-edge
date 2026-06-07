/**
 * Local notifications (Section 9): tournament reminders (N hours before a saved
 * event) and break reminders during an active session (Section 4.6).
 * All scheduled locally on-device - no server push required for the core loop.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Poker Edge',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#C8A84E',
    });
  }
}

/** Schedule a one-off reminder a given number of hours before a tournament. */
export async function scheduleTournamentReminder(
  tournamentId: string,
  tournamentName: string,
  startIso: string,
  hoursBefore: number
): Promise<string | null> {
  const granted = await ensurePermission();
  if (!granted) return null;
  await ensureAndroidChannel();

  const start = new Date(startIso).getTime();
  const fireAt = start - hoursBefore * 3600_000;
  if (fireAt <= Date.now()) return null; // do not schedule in the past

  return Notifications.scheduleNotificationAsync({
    identifier: `tourney-${tournamentId}`,
    content: {
      title: 'Tournament starting soon',
      body: `${tournamentName} starts in ${hoursBefore}h. Time to head in.`,
      data: { tournamentId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fireAt),
    },
  });
}

export async function cancelTournamentReminder(tournamentId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`tourney-${tournamentId}`).catch(() => {});
}

/** Recurring break reminder while a session is live (stand, hydrate, walk). */
export async function scheduleBreakReminder(intervalMinutes: number): Promise<string | null> {
  const granted = await ensurePermission();
  if (!granted) return null;
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    identifier: 'session-break',
    content: {
      title: 'Take a break',
      body: 'Stand up, hydrate, and walk. Fresh focus protects your edge.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, intervalMinutes * 60),
      repeats: true,
    },
  });
}

export async function cancelBreakReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('session-break').catch(() => {});
}

export async function isTournamentReminderSet(tournamentId: string): Promise<boolean> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.some((n) => n.identifier === `tourney-${tournamentId}`);
}
