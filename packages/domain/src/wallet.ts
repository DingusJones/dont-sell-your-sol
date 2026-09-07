import { z } from 'zod';
export function isAddress(value: string): boolean {
  if (value.length < 32 || value.length > 44) return false;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let integer = 0n;
  for (const char of value) { const digit = alphabet.indexOf(char); if(digit < 0) return false; integer = integer * 58n + BigInt(digit); }
  let bytes = 0; for(let n=integer; n>0n; n >>= 8n) bytes++;
  const leadingZeros = value.match(/^1*/)?.[0].length ?? 0;
  return bytes + leadingZeros === 32;
}
export const addressSchema = z.string().trim().refine(isAddress, 'Enter a base58 Solana public address (32 decoded bytes).');
export function walletId(address: string) { return `solana:mainnet:${addressSchema.parse(address)}`; }
export function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
