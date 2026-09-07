import type { z } from 'zod';
import type * as s from './schemas.ts';
export type RawAmount = string;
export type DecimalString = string;
export type ChainId = 'solana:mainnet';
export type Wallet = { id: string; chain: ChainId; address: string; inputMethod: 'pasted'; ownership: 'watched' };
export type FreshnessMetadata = z.infer<typeof s.freshnessSchema>;
export type Warning = z.infer<typeof s.warningSchema>;
export type Observation = z.infer<typeof s.observationSchema>;
export type TokenBalance = z.infer<typeof s.tokenSchema>;
export type PositionAsset = z.infer<typeof s.assetSchema>;
export type Debt = z.infer<typeof s.debtSchema>;
export type Reward = z.infer<typeof s.rewardSchema>;
export type HealthStatus = z.infer<typeof s.healthSchema>;
export type DeFiPosition = z.infer<typeof s.positionSchema>;
export type LinkResolution = z.infer<typeof s.linkSchema>;
export type ProviderStatus = z.infer<typeof s.providerSchema>;
export type CompletenessStatus = z.infer<typeof s.completenessSchema>;
export type Portfolio = z.infer<typeof s.portfolioSchema>;
export type PortfolioEnvelope = z.infer<typeof s.envelopeSchema>;
export type Section = z.infer<typeof s.sectionSchema>;
export interface Protocol { id: string; name: string; deployments: {programId: string; version: string; product: string}[]; approvedDomains: string[]; deprecated: boolean }
export interface Vault { id: string; protocol: string; version: string; shareMint: string; underlyingIds: string[]; conversion: Observation; withdrawalRules: string }
export interface Pool { id: string; protocol: string; version: string; mints: string[]; lpMint: string | null; kind: string; freshness: FreshnessMetadata }
export interface Market { id: string; protocol: string; version: string; reserveIds: string[]; oracleIds: string[]; mint: string }
export interface PnL { kind: 'realized'|'unrealized'|'change'; value: Observation; period: string; method: string; costBasisCoverage: string; transfers: string; feesAndRewards: string; excludedAssets: string[] }
export interface UserDisplayPreferences { currency: 'USD'; hideSpam: boolean; dustThreshold: DecimalString; group: 'protocol'|'type'; sort: 'value'|'name'; rememberAddress: boolean; maskBalances: boolean }
