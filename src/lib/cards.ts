/** Card primitives shared by the equity engine and range parser. */

export const RANKS = '23456789TJQKA';
export const SUITS = 'shdc';

export interface Card {
  rank: number; // 2-14
  suit: number; // 0-3
}

export function rankVal(ch: string): number {
  const i = RANKS.indexOf(ch.toUpperCase());
  return i < 0 ? -1 : i + 2;
}

export function suitVal(ch: string): number {
  return SUITS.indexOf(ch.toLowerCase());
}

export function parseCard(str: string): Card | null {
  if (str.length < 2) return null;
  const rank = rankVal(str[0]);
  const suit = suitVal(str[1]);
  if (rank < 0 || suit < 0) return null;
  return { rank, suit };
}

/** Parse "AhKd" or "Ah Kd Qs" into cards. Ignores junk gracefully. */
export function parseCards(str: string): Card[] {
  const cleaned = str.replace(/[^2-9TJQKAtjqka shdcSHDC]/g, '');
  const tokens = cleaned.includes(' ')
    ? cleaned.split(/\s+/).filter(Boolean)
    : cleaned.match(/.{1,2}/g) ?? [];
  const out: Card[] = [];
  for (const t of tokens) {
    const c = parseCard(t);
    if (c) out.push(c);
  }
  return out;
}

export function cardStr(c: Card): string {
  return `${RANKS[c.rank - 2]}${SUITS[c.suit]}`;
}

export function cardId(c: Card): number {
  return c.rank * 4 + c.suit; // unique 0..55-ish
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (let r = 2; r <= 14; r++) {
    for (let s = 0; s < 4; s++) deck.push({ rank: r, suit: s });
  }
  return deck;
}
