export type MockScenario = 'HAPPY_PATH' | 'DEGRADED_BANK' | 'BANK_TIMEOUT' | 'RISK_HOLD' | 'STEP_UP';

export type WorkflowTab = {
  id: string;
  label: string;
  description: string;
  cta: string;
  drillDown: string;
  apiFlow: string;
  mockScenario: MockScenario;
};

export const workflowTabs: WorkflowTab[] = [
  {
    "id": "overview",
    "label": "Graph Overview",
    "description": "Risk entity graph, mule links, and amount-at-risk command view.",
    "cta": "Open Mule Graph",
    "drillDown": "Trace VPA-device-merchant links.",
    "apiFlow": "GET /metrics -> graph risk KPIs",
    "mockScenario": "RISK_HOLD"
  },
  {
    "id": "entities",
    "label": "Risk Entities",
    "description": "VPA, merchant, device, and bank-account risk records.",
    "cta": "Create Watch Entity",
    "drillDown": "Open entity drill-down and status action.",
    "apiFlow": "CRUD /risk-entities",
    "mockScenario": "RISK_HOLD"
  },
  {
    "id": "cases",
    "label": "Interdiction Cases",
    "description": "Pre-settlement hold cases and investigation queue.",
    "cta": "Review Hold Case",
    "drillDown": "Inspect evidence chain and recommended action.",
    "apiFlow": "CRUD /interdiction-cases",
    "mockScenario": "RISK_HOLD"
  },
  {
    "id": "graph",
    "label": "Mule Graph AI",
    "description": "Synthetic graph scoring for circular movement and mule clusters.",
    "cta": "Run Graph Score",
    "drillDown": "Explain reason codes for the fraud ring.",
    "apiFlow": "POST /interdiction-score",
    "mockScenario": "RISK_HOLD"
  },
  {
    "id": "recovery",
    "label": "Recovery Simulator",
    "description": "Victim-money recovery probability and kill-switch impact.",
    "cta": "Mock Hold Callback",
    "drillDown": "View RRN, hold flag, and bank callback.",
    "apiFlow": "POST /mock-upi",
    "mockScenario": "RISK_HOLD"
  },
  {
    "id": "compliance",
    "label": "Compliance Evidence",
    "description": "RBI/NPCI-style reason codes and audit-ready case packet.",
    "cta": "Generate Evidence Summary",
    "drillDown": "Map risk signals to investigation notes.",
    "apiFlow": "Reason codes + audit trail",
    "mockScenario": "STEP_UP"
  }
];

export function getWorkflowTab(id: string) {
  return workflowTabs.find((tab) => tab.id === id) ?? workflowTabs[0];
}

export function buildMockUpiRequest(tab: WorkflowTab, amount: number) {
  return {
    txnId: 'TXN-' + tab.id.toUpperCase() + '-' + Date.now().toString(36).toUpperCase(),
    payerVpa: 'demo.payer@oksbi',
    payeeVpa: 'bharatupiinterdict@upi',
    amount,
    flow: tab.id.includes('qr') ? 'UPI_QR' : tab.id.includes('lite') ? 'UPI_LITE' : 'UPI_INTENT',
    purpose: 'Bharat UPI Interdict ' + tab.label + ' sandbox payment',
    riskScore: tab.mockScenario === 'RISK_HOLD' ? 88 : tab.mockScenario === 'STEP_UP' ? 66 : 24,
    scenario: tab.mockScenario
  };
}
