/**
 * Poker Edge design system.
 * Carries the house brand from the playbook (Section 2).
 * Copy rule: direct instructional voice, no en/em dashes, hyphens only.
 */

// Red, white, and blue brand palette.
export const colors = {
  bg: '#0A1430', // deep navy blue background
  surface: '#14224A', // blue slate surface
  surfaceAlt: '#0F1B3C',
  accent: '#E23744', // red (primary brand accent)
  accentSoft: '#3A1A20',
  blue: '#3B82F6', // bright blue (secondary brand accent)
  text: '#FFFFFF', // white
  textDim: '#AEBCD6',
  textFaint: '#6E7DA0',
  border: '#26365E',
  win: '#37C871', // green for positive results
  loss: '#FF5A63', // red-coral for negative results
  warn: '#F0B429',
  info: '#3B82F6', // blue
  overlay: 'rgba(4, 8, 20, 0.80)',
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
