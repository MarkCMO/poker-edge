/**
 * Hand-history import (Phase 9, Section E.1). Pluggable parsers map raw text
 * into a normalized ParsedHand with the per-hand flags the leak engine needs.
 * Ships with a PokerStars-format parser (also handles most GG/ACR text exports,
 * which follow the same shape). Add a parser by registering it in PARSERS.
 */
import type { Position } from '../types';

export interface ParsedHand {
  id: string;
  site: string;
  gameType: string; // NLHE etc
  stakes: string; // "1/3"
  date: number; // epoch ms
  tableSize: number;
  heroPosition: Position;
  heroCards: string; // "AhKd"
  board: string; // "Ah 7c 2d Ts 9h"
  heroNet: number; // chips won minus invested this hand

  // Preflop flags
  vpip: boolean; // voluntarily put money in (call/raise, not blind)
  pfr: boolean; // raised first/over a limp preflop
  threeBet: boolean; // hero reraised a preflop raise
  facedThreeBet: boolean; // hero's open was 3bet
  foldedToThreeBet: boolean;

  // Postflop flags
  sawFlop: boolean;
  cbetFlop: boolean; // hero was PF aggressor and bet flop
  couldCbet: boolean; // hero was PF aggressor and saw flop
  facedCbet: boolean;
  foldedToCbet: boolean;
  wentToShowdown: boolean;
  wonAtShowdown: boolean;
}

const POS_BY_SIZE: Record<number, Position[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'UTG'],
  5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'MP', 'HJ', 'CO'],
  9: ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'MP', 'LJ', 'HJ', 'CO'],
  10: ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'MP', 'LJ', 'HJ', 'CO', 'NA'],
};

function num(s: string | undefined): number {
  if (!s) return 0;
  const m = s.replace(/[, ]/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/** PokerStars-style parser. Splits on blank-line-separated hands. */
function parsePokerStars(text: string): ParsedHand[] {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => /Hand #|Hand#|Hold'?em/.test(b));
  const hands: ParsedHand[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim());
    const head = lines[0] || '';

    const idMatch = head.match(/Hand #?(\w+)/i);
    const id = idMatch ? idMatch[1] : `${hands.length}`;
    const stakesM = head.match(/\(?\$?([\d.]+)\/\$?([\d.]+)/);
    const stakes = stakesM ? `${num(stakesM[1])}/${num(stakesM[2])}` : '';
    const dateM = block.match(/(\d{4}\/\d{2}\/\d{2}|\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
    const date = dateM ? Date.parse(dateM[1].replace(/\//g, '-') + 'T' + dateM[2]) : Date.now();
    const gameType = /Omaha/i.test(head) ? 'PLO' : 'NLHE';

    // Seats and button
    const seatLines = lines.filter((l) => /^Seat \d+:/.test(l));
    const tableSize = seatLines.length || 6;
    const buttonM = block.match(/Seat #(\d+) is the button/);
    const buttonSeat = buttonM ? parseInt(buttonM[1], 10) : 0;
    const seatNums = seatLines.map((l) => parseInt(l.match(/^Seat (\d+):/)![1], 10));

    // Hero
    const heroM = block.match(/Dealt to (.+?) \[([2-9TJQKA][shdc] [2-9TJQKA][shdc].*?)\]/);
    const heroName = heroM ? heroM[1] : 'Hero';
    const heroCards = heroM ? heroM[2].replace(/\s/g, '') : '';
    const heroSeatM = seatLines.find((l) => l.includes(`: ${heroName} `) || l.includes(`: ${heroName}(`));
    const heroSeat = heroSeatM ? parseInt(heroSeatM.match(/^Seat (\d+):/)![1], 10) : seatNums[0] ?? 0;

    // Position: order seats clockwise from button
    const ordered = [...seatNums].sort((a, b) => a - b);
    const btnIdx = ordered.indexOf(buttonSeat);
    const rel: number[] = [];
    for (let i = 0; i < ordered.length; i++) rel.push(ordered[(btnIdx + i) % ordered.length]);
    const heroOrder = rel.indexOf(heroSeat);
    const labels = POS_BY_SIZE[tableSize] ?? POS_BY_SIZE[6];
    const heroPosition: Position = heroOrder >= 0 && labels[heroOrder] ? labels[heroOrder] : 'NA';

    // Streets
    const flopIdx = lines.findIndex((l) => /\*\*\* FLOP \*\*\*/.test(l));
    const sdIdx = lines.findIndex((l) => /\*\*\* SHOW ?DOWN \*\*\*/.test(l));
    const summaryIdx = lines.findIndex((l) => /\*\*\* SUMMARY \*\*\*/.test(l));
    const preflop = lines.slice(lines.findIndex((l) => /HOLE CARDS/.test(l)) + 1, flopIdx === -1 ? (summaryIdx === -1 ? lines.length : summaryIdx) : flopIdx);
    const flopEnd = lines.findIndex((l) => /\*\*\* TURN \*\*\*/.test(l));
    const flop = flopIdx === -1 ? [] : lines.slice(flopIdx + 1, flopEnd === -1 ? (sdIdx === -1 ? (summaryIdx === -1 ? lines.length : summaryIdx) : sdIdx) : flopEnd);

    const heroActsPre = preflop.filter((l) => l.startsWith(`${heroName}:`));
    const raisesBeforeHeroFirstVPIP = countRaisesUntilHero(preflop, heroName);

    const vpip = heroActsPre.some((l) => /: (calls|raises|bets)/.test(l));
    const pfr = heroActsPre.some((l) => /: raises/.test(l));
    // hero raised after exactly one prior raise => 3bet
    const threeBet = pfr && raisesBeforeHeroFirstVPIP === 1;
    // hero opened (first raise) then faced another raise
    const heroOpened = pfr && raisesBeforeHeroFirstVPIP === 0;
    const facedThreeBet = heroOpened && raiseCountAfterHeroOpen(preflop, heroName) >= 1;
    const foldedToThreeBet = facedThreeBet && didFoldAfterFacing(preflop, heroName);

    const sawFlop = flopIdx !== -1 && heroSeenOnStreet(flop, heroName, preflop);
    const couldCbet = heroOpened && sawFlop;
    const cbetFlop = couldCbet && flop.some((l) => l.startsWith(`${heroName}:`) && /: (bets|raises)/.test(l));
    const facedCbet = sawFlop && !heroOpened && flop.some((l) => /: bets/.test(l) && !l.startsWith(`${heroName}:`));
    const foldedToCbet = facedCbet && flop.some((l) => l.startsWith(`${heroName}:`) && /: folds/.test(l));

    const wentToShowdown = sdIdx !== -1 && lines.slice(sdIdx).some((l) => l.startsWith(`${heroName}:`) || l.includes(`${heroName} `));
    const collectedM = block.match(new RegExp(`${escapeRe(heroName)} (?:collected|wins) \\(?\\$?([\\d.,]+)`));
    const wonAtShowdown = wentToShowdown && !!collectedM;

    // Net: collected minus total hero invested
    const invested = sumHeroInvested(block, heroName);
    const collected = collectedM ? num(collectedM[1]) : seatWonInSummary(lines, heroName);
    const heroNet = collected - invested;

    hands.push({
      id, site: 'pokerstars', gameType, stakes, date, tableSize, heroPosition,
      heroCards, board: extractBoard(lines), heroNet,
      vpip, pfr, threeBet, facedThreeBet, foldedToThreeBet,
      sawFlop, cbetFlop, couldCbet, facedCbet, foldedToCbet, wentToShowdown, wonAtShowdown,
    });
  }
  return hands;
}

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function countRaisesUntilHero(preflop: string[], hero: string): number {
  let raises = 0;
  for (const l of preflop) {
    if (l.startsWith(`${hero}:`) && /: (raises|calls|bets)/.test(l)) return raises;
    if (/: raises/.test(l)) raises++;
  }
  return raises;
}
function raiseCountAfterHeroOpen(preflop: string[], hero: string): number {
  let seenHero = false, raises = 0;
  for (const l of preflop) {
    if (seenHero && /: raises/.test(l) && !l.startsWith(`${hero}:`)) raises++;
    if (l.startsWith(`${hero}:`) && /: raises/.test(l)) seenHero = true;
  }
  return raises;
}
function didFoldAfterFacing(preflop: string[], hero: string): boolean {
  let opened = false;
  for (const l of preflop) {
    if (l.startsWith(`${hero}:`) && /: raises/.test(l)) opened = true;
    else if (opened && l.startsWith(`${hero}:`) && /: folds/.test(l)) return true;
  }
  return false;
}
function heroSeenOnStreet(street: string[], hero: string, preflop: string[]): boolean {
  // Hero saw the flop if hero did not fold preflop.
  return !preflop.some((l) => l.startsWith(`${hero}:`) && /: folds/.test(l));
}
function sumHeroInvested(block: string, hero: string): number {
  let total = 0;
  const re = new RegExp(`${escapeRe(hero)}: (?:posts|bets|calls|raises) [^\\n]*?\\$?([\\d.]+)(?: to \\$?([\\d.]+))?`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) total += m[2] ? num(m[2]) : num(m[1]);
  return total;
}
function seatWonInSummary(lines: string[], hero: string): number {
  const l = lines.find((x) => x.includes(hero) && /won \(?\$?([\d.,]+)/.test(x));
  const m = l?.match(/won \(?\$?([\d.,]+)/);
  return m ? num(m[1]) : 0;
}
function extractBoard(lines: string[]): string {
  const m = lines.join(' ').match(/Board \[([^\]]+)\]/);
  if (m) return m[1];
  const flop = lines.find((l) => /\*\*\* FLOP \*\*\* \[/.test(l));
  return flop ? (flop.match(/\[([^\]]+)\]/)?.[1] ?? '') : '';
}

type Parser = (text: string) => ParsedHand[];
const PARSERS: Parser[] = [parsePokerStars];

/** Parse raw hand-history text with whichever registered parser yields hands. */
export function parseHandHistory(text: string): ParsedHand[] {
  for (const p of PARSERS) {
    try {
      const hands = p(text);
      if (hands.length) return hands;
    } catch {
      // try next parser
    }
  }
  return [];
}
