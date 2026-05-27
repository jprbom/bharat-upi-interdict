import { z } from 'zod';

export const entityTypeSchema = z.enum(['VPA', 'MERCHANT', 'DEVICE', 'BANK_ACCOUNT']);
export const caseStatusSchema = z.enum(['NEW', 'IN_REVIEW', 'HELD', 'RELEASED', 'ESCALATED']);

export const riskEntityInputSchema = z.object({
  entityType: entityTypeSchema,
  handle: z.string().min(3),
  bank: z.string().min(2),
  deviceHash: z.string().min(6),
  riskScore: z.number().min(0).max(100),
  velocityScore: z.number().min(0).max(100),
  linkedEntities: z.number().int().nonnegative(),
  status: z.enum(['CLEAR', 'WATCH', 'REVIEW', 'BLOCK'])
});

export const caseInputSchema = z.object({
  networkId: z.string().min(3),
  title: z.string().min(3),
  amountAtRisk: z.number().nonnegative(),
  entities: z.number().int().nonnegative(),
  status: caseStatusSchema,
  recommendedAction: z.string().min(3)
});

export const scoreInputSchema = z.object({
  inflowVelocity: z.number().min(0).max(100),
  onwardTransferRatio: z.number().min(0).max(1),
  newCounterpartyRatio: z.number().min(0).max(1),
  deviceReuseCount: z.number().int().nonnegative(),
  refundLoopCount: z.number().int().nonnegative(),
  failedCollectAttempts: z.number().int().nonnegative()
});

export type RiskEntityInput = z.infer<typeof riskEntityInputSchema>;
export type CaseInput = z.infer<typeof caseInputSchema>;
export type ScoreInput = z.infer<typeof scoreInputSchema>;

