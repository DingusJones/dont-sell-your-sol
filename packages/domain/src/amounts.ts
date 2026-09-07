import Decimal from 'decimal.js';
import { decimalSchema, rawSchema } from './schemas.ts';
export const D = Decimal.clone({ precision: 400, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -400, toExpPos: 400 });
export function amount(raw: string, decimals: number): string {
  rawSchema.parse(raw);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error('INVALID_DECIMALS');
  const s = raw.padStart(decimals + 1, '0');
  return decimals === 0 ? s : `${s.slice(0,-decimals)}.${s.slice(-decimals)}`.replace(/\.?0+$/, '');
}
export function sum(values: string[]): string { return values.reduce((n,v) => n.plus(decimalSchema.parse(v)), new D(0)).toFixed(); }
export function usd(value: string | null): string {
  if (value === null) return 'Unavailable';
  const n = new D(decimalSchema.parse(value));
  const [whole, fraction] = n.abs().toFixed(2).split('.');
  return `${n.isNegative() ? '−' : ''}$${whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`;
}
export function valueOf(raw: string, decimals: number, price: string | null): string | null {
  return price === null ? null : new D(amount(raw, decimals)).times(decimalSchema.parse(price)).toFixed();
}
