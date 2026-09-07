import type { Portfolio, ProviderStatus, Section } from '../../domain/src/types.ts';
export interface AdapterContext { address: string; signal: AbortSignal; now: number }
export interface AdapterResult { data: Portfolio | null; statuses: ProviderStatus[] }
export interface ProviderAdapter { id: string; version: string; section: Section; read(context: AdapterContext): Promise<AdapterResult> }
export interface Capability { id: string; provider: string; section: Section; enabled: boolean; evidence: 'synthetic-only'|'unverified'|'live-verified'; reason: string }
