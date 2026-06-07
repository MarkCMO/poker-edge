/**
 * Poker Edge design system.
 * Carries the house brand from the playbook (Section 2).
 * Copy rule: direct instructional voice, no en/em dashes, hyphens only.
 */

export const colors = {
  bg: '#0B1120', // near-black background
  surface: '#1E2D45', // slate surface
  surfaceAlt: '#16223A',
  accent: '#C8A84E', // gold
  accentSoft: '#3A3320',
  text: '#F5F7FA',
  textDim: '#9AA7BD',
  textFaint: '#6B7894',
  border: '#27374F',
  win: '#3FB477', // green for positive results
  loss: '#E2574C', // red for negative results
  warn: '#E8B339',
  info: '#5B8DEF',
  overlay: 'rgba(5, 9, 18, 0.78)',
} as const;

export const fonts = {
  // Loaded in app/_layout.tsx via @expo-google-fonts
  display: 'BebasNeue_400Regular',
  body: 'Barlow_400Regular',
  bodyMed: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const type = {
  // Display sizes use Bebas (condensed, all-caps feel)
  hero: { fontFamily: fonts.display, fontSize: 44, letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 30, letterSpacing: 0.5 },
  section: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 0.5 },
  // Body sizes use Barlow
  body: { fontFamily: fonts.body, fontSize: 15 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15 },
  small: { fontFamily: fonts.body, fontSize: 13 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 0.5 },
  tiny: { fontFamily: fonts.body, fontSize: 11 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;
