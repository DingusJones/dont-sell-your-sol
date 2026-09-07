export type { LinkResolution } from '../../domain/src/types.ts';
export interface VerifiedRoute { key: string; url: string; targetIds: string[]; label: string; target: 'position'|'entity'|'action'|'dashboard'; intent: 'manage'|'withdraw'|'redeem'|'unstake'|'claim'|'repay'; verifiedAt: string; expiresAt: string; verificationSource: string; approvedHosts: string[] }
