/**
 * App-wide settings and lightweight runtime state, persisted to AsyncStorage.
 * Holds the age-gate attestation (Section 10), welfare settings (Section 4.6),
 * notification preferences (Section 9), and the Pro entitlement (Section 11).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppState {
  // Onboarding / legal
  ageVerified: boolean;
  ageVerifiedAt: number | null;
  onboarded: boolean;

  // Welfare tools (Section 4.6)
  breakIntervalMin: number;
  breakRemindersOn: boolean;
  stopLoss: number | null;
  stopWin: number | null;
  fatigueThresholdHours: number;

  // Notifications (Section 9)
  notifTournaments: boolean;
  defaultReminderHours: number;

  // Preferences
  defaultRoomId: string | null;
  defaultStakes: string;

  // Monetization (Section 11) - set true by RevenueCat on successful purchase
  proUnlocked: boolean;

  // actions
  verifyAge: () => void;
  completeOnboarding: () => void;
  set: (patch: Partial<AppState>) => void;
  setPro: (v: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  ageVerified: false,
  ageVerifiedAt: null as number | null,
  onboarded: false,
  breakIntervalMin: 90,
  breakRemindersOn: true,
  stopLoss: null as number | null,
  stopWin: null as number | null,
  fatigueThresholdHours: 6,
  notifTournaments: true,
  defaultReminderHours: 2,
  defaultRoomId: null as string | null,
  defaultStakes: '1/3',
  proUnlocked: false,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      verifyAge: () => set({ ageVerified: true, ageVerifiedAt: Date.now() }),
      completeOnboarding: () => set({ onboarded: true }),
      set: (patch) => set(patch),
      setPro: (v) => set({ proUnlocked: v }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'pokeredge-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        // Persist everything except the action functions.
        const { verifyAge, completeOnboarding, set: _set, setPro, reset, ...rest } = s;
        return rest;
      },
    }
  )
);
