import type { ScoreInput } from './schemas.js';

export function scoreInterdiction(input: ScoreInput) {
  const weightedScore =
    input.inflowVelocity * 0.24 +
    input.onwardTransferRatio * 100 * 0.22 +
    input.newCounterpartyRatio * 100 * 0.18 +
    Math.min(input.deviceReuseCount, 20) * 1.2 +
    Math.min(input.refundLoopCount, 20) * 1.1 +
    Math.min(input.failedCollectAttempts, 20) * 0.9;

  const riskScore = Math.round(Math.min(100, weightedScore));
  const action =
    riskScore >= 75 ? 'PRE_SETTLEMENT_HOLD' :
    riskScore >= 70 ? 'ENHANCED_REVIEW' :
    riskScore >= 45 ? 'WATCHLIST' :
    'ALLOW_WITH_MONITORING';

  const reasonCodes: string[] = [];
  if (input.inflowVelocity > 75) reasonCodes.push('INFLOW_VELOCITY_SPIKE');
  if (input.onwardTransferRatio > 0.6) reasonCodes.push('FAST_ONWARD_TRANSFER');
  if (input.newCounterpartyRatio > 0.5) reasonCodes.push('NEW_COUNTERPARTY_CLUSTER');
  if (input.deviceReuseCount > 5) reasonCodes.push('DEVICE_REUSE_PATTERN');
  if (input.refundLoopCount > 2) reasonCodes.push('REFUND_LOOP_SIGNAL');
  if (input.failedCollectAttempts > 3) reasonCodes.push('FAILED_COLLECT_PROBING');

  return {
    riskScore,
    action,
    reasonCodes,
    investigatorSummary: 'Network exhibits ' + reasonCodes.join(', ') + '. Recommended action: ' + action + '. Preserve audit trail, notify bank partner, and review settlement hold window.'
  };
}
