import { format as fmtDate, formatDistanceToNowStrict } from 'date-fns';

export function money(n: number, opts?: { sign?: boolean; cents?: boolean }): string {
  const sign = opts?.sign && n > 0 ? '+' : n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const body = opts?.cents
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(abs).toLocaleString('en-US');
  return `${sign}$${body}`;
}

export function moneySigned(n: number, cents = false): string {
  return money(n, { sign: true, cents });
}

export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function dayMonth(epoch: number): string {
  return fmtDate(new Date(epoch), 'MMM d');
}

export function fullDate(epoch: number): string {
  return fmtDate(new Date(epoch), 'EEE, MMM d yyyy');
}

export function dateTime(epoch: number): string {
  return fmtDate(new Date(epoch), 'MMM d, h:mm a');
}

export function isoDayMonth(iso: string): string {
  return fmtDate(new Date(iso), 'MMM d');
}

export function isoDateTime(iso: string): string {
  return fmtDate(new Date(iso), 'MMM d, h:mm a');
}

export function relative(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function hourly(n: number): string {
  return `${moneySigned(n)}/hr`;
}
