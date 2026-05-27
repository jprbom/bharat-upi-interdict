export type RiskEntity = {
  id: string;
  entityType: 'VPA' | 'MERCHANT' | 'DEVICE' | 'BANK_ACCOUNT';
  handle: string;
  bank: string;
  deviceHash: string;
  riskScore: number;
  velocityScore: number;
  linkedEntities: number;
  status: 'CLEAR' | 'WATCH' | 'REVIEW' | 'BLOCK';
  createdAt: string;
};

export type InterdictionCase = {
  id: string;
  networkId: string;
  title: string;
  amountAtRisk: number;
  entities: number;
  status: 'NEW' | 'IN_REVIEW' | 'HELD' | 'RELEASED' | 'ESCALATED';
  recommendedAction: string;
  createdAt: string;
};

export type DatabaseShape = {
  riskEntities: RiskEntity[];
  interdictionCases: InterdictionCase[];
};

export const seed: DatabaseShape = {
  riskEntities: [
    { id: 'ent_001', entityType: 'MERCHANT', handle: 'merchant-red-772@upi', bank: 'Axis Bank', deviceHash: 'dev_8f2a91', riskScore: 94, velocityScore: 91, linkedEntities: 44, status: 'BLOCK', createdAt: '2026-05-27T09:15:00.000Z' },
    { id: 'ent_002', entityType: 'VPA', handle: 'rahul9981@oksbi', bank: 'SBI', deviceHash: 'dev_8f2a91', riskScore: 88, velocityScore: 82, linkedEntities: 29, status: 'REVIEW', createdAt: '2026-05-27T09:18:00.000Z' },
    { id: 'ent_003', entityType: 'DEVICE', handle: 'android-fp-29a7', bank: 'Multi-bank', deviceHash: 'dev_29a7cc', riskScore: 76, velocityScore: 68, linkedEntities: 18, status: 'WATCH', createdAt: '2026-05-27T09:21:00.000Z' }
  ],
  interdictionCases: [
    { id: 'case_001', networkId: 'NW-MUM-4451', title: 'Circular low-ticket merchant laundering mesh', amountAtRisk: 4830000, entities: 32, status: 'HELD', recommendedAction: 'Pre-settlement debit hold and enhanced merchant KYC', createdAt: '2026-05-27T09:30:00.000Z' },
    { id: 'case_002', networkId: 'NW-BLR-1180', title: 'Synthetic VPA mule chain', amountAtRisk: 1275000, entities: 17, status: 'IN_REVIEW', recommendedAction: 'Freeze terminal nodes and notify partner bank', createdAt: '2026-05-27T09:40:00.000Z' }
  ]
};

