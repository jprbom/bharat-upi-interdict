import type { InterdictionCase, RiskEntity } from './seed.js';

export type MuleGraphNode = {
  id: string;
  label: string;
  type: 'MERCHANT' | 'VPA' | 'DEVICE' | 'BANK_ACCOUNT' | 'CASE' | 'VICTIM';
  riskScore: number;
  status: string;
  amountAtRisk: number;
  x: number;
  y: number;
};

export type MuleGraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  edgeType: 'PAYMENT' | 'ONWARD_TRANSFER' | 'DEVICE_REUSE' | 'REFUND_LOOP' | 'CASE_LINK';
  amount: number;
  velocityMinutes: number;
  riskWeight: number;
};

export type MuleGraphResponse = {
  networkId: string;
  title: string;
  nodes: MuleGraphNode[];
  edges: MuleGraphEdge[];
  metrics: {
    connectedComponents: number;
    circularFlowCount: number;
    highRiskNodeCount: number;
    averageTransferVelocityMinutes: number;
    totalAmountAtRisk: number;
    recoveryProbability: number;
  };
  reasonCodes: string[];
  killSwitchRecommendation: string;
  investigatorNarrative: string;
};

export function buildMuleGraph(entities: RiskEntity[], cases: InterdictionCase[]): MuleGraphResponse {
  const primaryCase = cases[0];
  const totalAmountAtRisk = cases.reduce((sum, item) => sum + item.amountAtRisk, 0);
  const highRiskNodeCount = entities.filter((item) => item.riskScore >= 80).length;
  const averageRisk = Math.round(entities.reduce((sum, item) => sum + item.riskScore, 0) / Math.max(entities.length, 1));
  const highestRisk = [...entities].sort((a, b) => b.riskScore - a.riskScore);
  const merchant = highestRisk.find((item) => item.entityType === 'MERCHANT') ?? highestRisk[0];
  const vpa = highestRisk.find((item) => item.entityType === 'VPA') ?? highestRisk[1] ?? highestRisk[0];
  const device = highestRisk.find((item) => item.entityType === 'DEVICE') ?? highestRisk[2] ?? highestRisk[0];

  const nodes: MuleGraphNode[] = [
    { id: 'victim_pool', label: 'Victim pool', type: 'VICTIM', riskScore: 18, status: 'SOURCE', amountAtRisk: 760000, x: 13, y: 43 },
    { id: 'merchant_red', label: merchant?.handle ?? 'merchant-red-772@upi', type: 'MERCHANT', riskScore: merchant?.riskScore ?? 94, status: merchant?.status ?? 'BLOCK', amountAtRisk: 1480000, x: 31, y: 38 },
    { id: 'device_8f2a91', label: device?.deviceHash ?? 'dev_8f2a91', type: 'DEVICE', riskScore: Math.max(device?.riskScore ?? 91, 91), status: 'REUSED', amountAtRisk: 0, x: 45, y: 20 },
    { id: 'vpa_rahul', label: vpa?.handle ?? 'rahul9981@oksbi', type: 'VPA', riskScore: vpa?.riskScore ?? 88, status: vpa?.status ?? 'REVIEW', amountAtRisk: 970000, x: 52, y: 50 },
    { id: 'bank_shadow_01', label: 'shadow-acct-41@sbi', type: 'BANK_ACCOUNT', riskScore: 86, status: 'WATCH', amountAtRisk: 810000, x: 71, y: 31 },
    { id: 'vpa_terminal', label: 'terminal-cashout@upi', type: 'VPA', riskScore: 92, status: 'BLOCK', amountAtRisk: 620000, x: 85, y: 54 },
    { id: 'case_primary', label: primaryCase?.networkId ?? 'NW-MUM-4451', type: 'CASE', riskScore: averageRisk, status: primaryCase?.status ?? 'HELD', amountAtRisk: primaryCase?.amountAtRisk ?? 4830000, x: 53, y: 76 }
  ];

  const edges: MuleGraphEdge[] = [
    { id: 'edge_001', source: 'victim_pool', target: 'merchant_red', label: '900 low-ticket credits', edgeType: 'PAYMENT', amount: 1480000, velocityMinutes: 3, riskWeight: 0.82 },
    { id: 'edge_002', source: 'merchant_red', target: 'vpa_rahul', label: 'onward split in 4m', edgeType: 'ONWARD_TRANSFER', amount: 970000, velocityMinutes: 4, riskWeight: 0.91 },
    { id: 'edge_003', source: 'merchant_red', target: 'device_8f2a91', label: 'same device onboarding', edgeType: 'DEVICE_REUSE', amount: 0, velocityMinutes: 0, riskWeight: 0.88 },
    { id: 'edge_004', source: 'device_8f2a91', target: 'vpa_rahul', label: 'device-linked VPA', edgeType: 'DEVICE_REUSE', amount: 0, velocityMinutes: 0, riskWeight: 0.76 },
    { id: 'edge_005', source: 'vpa_rahul', target: 'bank_shadow_01', label: 'split to new account', edgeType: 'ONWARD_TRANSFER', amount: 810000, velocityMinutes: 5, riskWeight: 0.84 },
    { id: 'edge_006', source: 'bank_shadow_01', target: 'vpa_terminal', label: 'terminal cash-out', edgeType: 'ONWARD_TRANSFER', amount: 620000, velocityMinutes: 7, riskWeight: 0.89 },
    { id: 'edge_007', source: 'vpa_terminal', target: 'merchant_red', label: 'refund loop return', edgeType: 'REFUND_LOOP', amount: 126000, velocityMinutes: 12, riskWeight: 0.93 },
    { id: 'edge_008', source: 'case_primary', target: 'merchant_red', label: 'case anchor', edgeType: 'CASE_LINK', amount: primaryCase?.amountAtRisk ?? 4830000, velocityMinutes: 0, riskWeight: 0.95 }
  ];

  return {
    networkId: primaryCase?.networkId ?? 'NW-MUM-4451',
    title: primaryCase?.title ?? 'Circular low-ticket merchant laundering mesh',
    nodes,
    edges,
    metrics: {
      connectedComponents: 1,
      circularFlowCount: 1,
      highRiskNodeCount,
      averageTransferVelocityMinutes: 5,
      totalAmountAtRisk,
      recoveryProbability: Number(Math.max(0.41, 0.78 - highRiskNodeCount * 0.04).toFixed(2))
    },
    reasonCodes: [
      'MERCHANT_LOW_VALUE_BURST',
      'FAST_ONWARD_TRANSFER',
      'DEVICE_REUSE_ACROSS_VPAS',
      'CIRCULAR_REFUND_LOOP',
      'TERMINAL_CASHOUT_RISK'
    ],
    killSwitchRecommendation: 'Execute pre-settlement hold on merchant_red, vpa_rahul, and terminal-cashout; notify linked issuer banks and queue enhanced merchant KYC.',
    investigatorNarrative: `Graph ${primaryCase?.networkId ?? 'NW-MUM-4451'} shows victim funds entering one synthetic merchant, splitting to linked VPAs within five minutes, touching a reused device fingerprint, and returning through a refund loop. Recommended action is pre-settlement hold plus partner-bank review.`
  };
}
