import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import cytoscape from 'cytoscape';
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, Database, Eye, FileCheck2, Lock, Network, RefreshCw, Route, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { apiRequest } from './api';
import { formatValue, toneForRisk } from './lib/viewModel';
import { buildMockUpiRequest, getWorkflowTab, workflowTabs, type WorkflowTab } from './lib/workflow';

type RecordItem = Record<string, unknown> & { id: string };
type Metrics = { kpis: Record<string, number>; failureReasons?: Record<string, number> };
type DomainResult = Record<string, unknown> & { reasonCodes?: string[]; explanation?: string; alternatives?: unknown[] };
type MuleGraph = {
  networkId: string;
  title: string;
  nodes: Array<{ id: string; label: string; type: string; riskScore: number; status: string; amountAtRisk: number; x: number; y: number }>;
  edges: Array<{ id: string; source: string; target: string; label: string; edgeType: string; amount: number; velocityMinutes: number; riskWeight: number }>;
  metrics: Record<string, number>;
  reasonCodes: string[];
  killSwitchRecommendation: string;
  investigatorNarrative: string;
};
type MockUpiResult = {
  gateway: string;
  txnId: string;
  rrn: string;
  responseCode: string;
  responseMessage: string;
  npciStatus: string;
  settlement: { mode: string; preSettlementHold: boolean; estimatedSettlementSeconds: number };
  risk: { score: number; decision: string; reasonCodes: string[] };
};

const CONFIG = {
  "title": "Bharat UPI Interdict",
  "short": "Pre-settlement mule-network interdiction and fraud investigation copilot.",
  "roles": [
    "ADMIN",
    "INVESTIGATOR",
    "COMPLIANCE_OFFICER",
    "BANK_PARTNER",
    "VIEWER"
  ],
  "defaultRole": "ADMIN",
  "primary": {
    "label": "Risk Entities",
    "route": "/risk-entities",
    "columns": [
      "handle",
      "entityType",
      "status",
      "riskScore",
      "linkedEntities"
    ],
    "createPayload": {
      "entityType": "VPA",
      "handle": "new-mule-watch@oksbi",
      "bank": "SBI",
      "deviceHash": "dev_demo_77",
      "riskScore": 86,
      "velocityScore": 82,
      "linkedEntities": 19,
      "status": "REVIEW"
    },
    "patchPayload": {
      "status": "BLOCK",
      "riskScore": 91,
      "linkedEntities": 25
    }
  },
  "secondary": {
    "label": "Interdiction Cases",
    "route": "/interdiction-cases"
  },
  "domain": {
    "label": "Mule Network Score",
    "endpoint": "/interdiction-score",
    "cta": "Score Mule Chain",
    "payload": {
      "inflowVelocity": 91,
      "onwardTransferRatio": 0.82,
      "newCounterpartyRatio": 0.63,
      "deviceReuseCount": 8,
      "refundLoopCount": 6,
      "failedCollectAttempts": 5
    },
    "resultKey": "action",
    "riskKey": "riskScore"
  }
} as const;

const ICONS = [Route, Activity, Database, BrainCircuit, ShieldCheck, FileCheck2, Network, Lock];

export default function App() {
  const [role, setRole] = useState<string>(CONFIG.defaultRole);
  const [activeTabId, setActiveTabId] = useState(workflowTabs[0].id);
  const [primary, setPrimary] = useState<RecordItem[]>([]);
  const [secondary, setSecondary] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ kpis: {} });
  const [domainResult, setDomainResult] = useState<DomainResult | null>(null);
  const [muleGraph, setMuleGraph] = useState<MuleGraph | null>(null);
  const [mockResult, setMockResult] = useState<MockUpiResult | null>(null);
  const [notice, setNotice] = useState('Ready: all CTAs use synthetic test data and mocked UPI rails.');
  const [amount, setAmount] = useState(875);

  const activeTab = getWorkflowTab(activeTabId);
  const highRiskCount = useMemo(() => primary.filter((item) => Number(item.riskScore ?? item.impulseScore ?? 0) >= 70).length, [primary]);
  const totalAmount = useMemo(() => primary.reduce((sum, item) => sum + Number(item.amount ?? item.monthlyInflow ?? item.amountAtRisk ?? 0), 0), [primary]);

  async function load() {
    try {
      const [nextMetrics, nextPrimary, nextSecondary] = await Promise.all([
        apiRequest<Metrics>('/metrics', role),
        apiRequest<RecordItem[]>(CONFIG.primary.route, role),
        apiRequest<RecordItem[]>(CONFIG.secondary.route, role)
      ]);
      setMetrics(nextMetrics);
      setPrimary(nextPrimary);
      setSecondary(nextSecondary);
      setSelected(nextPrimary[0] ?? null);
      setNotice('Loaded live synthetic API data through RBAC role ' + role + '.');
    } catch (error) {
      setNotice('API request failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  useEffect(() => {
    void load();
  }, [role]);

  async function runDomainDecision() {
    try {
      const response = await apiRequest<DomainResult>(CONFIG.domain.endpoint, role, {
        method: 'POST',
        body: JSON.stringify(CONFIG.domain.payload)
      });
      setDomainResult(response);
      setActiveTabId(workflowTabs.find((tab) => tab.apiFlow.includes(CONFIG.domain.endpoint))?.id ?? activeTabId);
      setNotice(CONFIG.domain.label + ' completed with reason-code output.');
    } catch (error) {
      setNotice('Decision failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  async function loadMuleGraph() {
    try {
      const response = await apiRequest<MuleGraph>('/mule-graph', role);
      setMuleGraph(response);
      setActiveTabId('graph');
      setNotice('Loaded complex mule graph ' + response.networkId + ' with ' + response.edges.length + ' risk edges from synthetic test data.');
    } catch (error) {
      setNotice('Mule graph failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  async function runActiveTabCta() {
    if (activeTab.id === 'overview' || activeTab.id === 'graph') {
      await loadMuleGraph();
      await runDomainDecision();
      return;
    }
    if (activeTab.id === 'entities') {
      await createRecord();
      return;
    }
    if (activeTab.id === 'cases') {
      setSelected(secondary[0] ?? null);
      setNotice('Opened interdiction case evidence from live synthetic test data.');
      return;
    }
    if (activeTab.id === 'recovery') {
      await runMockRail(activeTab);
      return;
    }
    await runDomainDecision();
  }

  async function runMockRail(tab: WorkflowTab = activeTab) {
    try {
      const payload = buildMockUpiRequest(tab, amount);
      const response = await apiRequest<MockUpiResult>('/mock-upi', role, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setMockResult(response);
      setNotice('Mock UPI rail returned ' + response.npciStatus + ' with RRN ' + response.rrn + '.');
    } catch (error) {
      setNotice('Mock UPI failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  async function createRecord() {
    try {
      const created = await apiRequest<RecordItem>(CONFIG.primary.route, role, {
        method: 'POST',
        body: JSON.stringify(CONFIG.primary.createPayload)
      });
      setPrimary([created, ...primary]);
      setSelected(created);
      setActiveTabId(workflowTabs[2]?.id ?? activeTabId);
      setNotice('Created test record ' + created.id + ' through ' + CONFIG.primary.route + '.');
    } catch (error) {
      setNotice('Create failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  async function patchSelected() {
    const target = selected ?? primary[0];
    if (!target) {
      setNotice('No record available to patch.');
      return;
    }
    try {
      const updated = await apiRequest<RecordItem>(CONFIG.primary.route + '/' + target.id, role, {
        method: 'PATCH',
        body: JSON.stringify(CONFIG.primary.patchPayload)
      });
      setPrimary(primary.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setNotice('Patched drill-down record ' + updated.id + ' with review outcome.');
    } catch (error) {
      setNotice('Patch failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  async function removeSelected() {
    const target = selected ?? primary[0];
    if (!target) {
      setNotice('No record available to delete.');
      return;
    }
    try {
      await apiRequest<void>(CONFIG.primary.route + '/' + target.id, role, { method: 'DELETE' });
      const nextPrimary = primary.filter((item) => item.id !== target.id);
      setPrimary(nextPrimary);
      setSelected(nextPrimary[0] ?? null);
      setNotice('Deleted ' + target.id + '. Switch to non-admin roles to see RBAC denial.');
    } catch (error) {
      setNotice('Delete failed: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  }

  function openDrillDown(tab: WorkflowTab) {
    setActiveTabId(tab.id);
    setSelected(primary[0] ?? null);
    setNotice(tab.drillDown);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logo.svg" alt="" /><span>{CONFIG.title}</span></div>
        {workflowTabs.map((item, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <button className={item.id === activeTabId ? 'nav-item active' : 'nav-item'} key={item.id} onClick={() => openDrillDown(item)} aria-pressed={item.id === activeTabId}>
              <Icon size={16} />{item.label}
            </button>
          );
        })}
        <div className="region-card"><span>Sandbox</span><strong>NPCI UPI Mock</strong><small>Live synthetic endpoints</small></div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <h1>{CONFIG.title}</h1>
            <p>{CONFIG.short}</p>
          </div>
          <div className="top-actions">
            <span className="live-dot">Live</span>
            <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="RBAC role">{CONFIG.roles.map((item) => <option key={item}>{item}</option>)}</select>
            <button onClick={load}><RefreshCw size={16} />Refresh</button>
          </div>
        </header>
        <div className="notice">{notice}</div>
        <section className="kpi-grid">
          <Metric title={CONFIG.primary.label} value={String(primary.length)} detail="live API records" icon={<Activity />} />
          <Metric title={CONFIG.secondary.label} value={String(secondary.length)} detail="policy/reference records" icon={<FileCheck2 />} />
          <Metric title="Risk Watch" value={String(highRiskCount)} detail="records above review line" icon={<AlertTriangle />} />
          <Metric title="Amount Signal" value={formatValue('amount', totalAmount)} detail="synthetic portfolio value" icon={<ShieldCheck />} />
        </section>
        <section className="workspace-grid">
          <div className="panel span-two">
            <div className="panel-title"><Sparkles size={18} /> {activeTab.label}</div>
            <p>{activeTab.description}</p>
            <div className="tab-detail">
              <div><span>CTA</span><strong>{activeTab.cta}</strong></div>
              <div><span>Drill-down</span><strong>{activeTab.drillDown}</strong></div>
              <div><span>API Flow</span><strong>{activeTab.apiFlow}</strong></div>
            </div>
            <div className="simulator-row">
              <label>Mock amount <input aria-label="Mock amount" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>
              <button onClick={runActiveTabCta}><BrainCircuit size={16} />{activeTab.cta}</button>
              <button onClick={runDomainDecision}><ShieldCheck size={16} />{CONFIG.domain.cta}</button>
              <button onClick={() => runMockRail()}><Network size={16} />Mock UPI/NPCI</button>
              <button onClick={createRecord}><Activity size={16} />Create Test Data</button>
              <button onClick={patchSelected}><CheckCircle2 size={16} />Mark Reviewed</button>
              <button onClick={removeSelected}><Trash2 size={16} />Delete Selected</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title"><Lock size={18} /> Decision Output</div>
            <div className="recommendation-card">
              <div><span>{CONFIG.domain.resultKey}</span><strong>{String(domainResult?.[CONFIG.domain.resultKey] ?? 'Run model')}</strong></div>
              <div><span>{CONFIG.domain.riskKey}</span><strong>{formatValue(CONFIG.domain.riskKey, domainResult?.[CONFIG.domain.riskKey] ?? 0)}</strong></div>
              <p>{String(domainResult?.explanation ?? 'Use the model CTA to generate explainable reason codes from the domain engine.')}</p>
            </div>
            <div className="reason-list">
              {(domainResult?.reasonCodes ?? ['READY_FOR_TEST_DATA', 'RBAC_ENABLED', 'MOCK_UPI_READY']).map((code) => <span className="chip" key={code}>{code}</span>)}
            </div>
          </div>
          <div className="panel span-two">
            <div className="panel-title"><Network size={18} /> Mock NPCI/UPI Response</div>
            {mockResult ? (
              <div className="mock-card">
                <strong>{mockResult.npciStatus} / {mockResult.responseCode}</strong>
                <span>RRN: {mockResult.rrn}</span>
                <span>Txn: {mockResult.txnId}</span>
                <span>Hold: {mockResult.settlement.preSettlementHold ? 'Yes' : 'No'}</span>
                <p>{mockResult.responseMessage}</p>
                <div className="reason-list">{mockResult.risk.reasonCodes.map((code) => <span className="chip" key={code}>{code}</span>)}</div>
              </div>
            ) : <p>Run Mock UPI/NPCI to see a sandbox response with RRN, bank reference, response code, webhook status, and settlement behavior.</p>}
          </div>
          <div className="panel span-three">
            <div className="panel-title"><Network size={18} /> Complex Mule Graph From Test Data</div>
            {muleGraph ? <MuleGraphView graph={muleGraph} /> : <p>Click Open Mule Graph or Run Graph Score to render the synthetic laundering mesh with VPA, device, merchant, bank-account, victim, and case nodes.</p>}
          </div>
          <div className="panel">
            <div className="panel-title"><Eye size={18} /> Drill-down</div>
            {selected ? <DetailCard item={selected} /> : <p>Select or create a record to open a drill-down.</p>}
          </div>
          <div className="panel span-three">
            <div className="panel-title"><Database size={18} /> {CONFIG.primary.label} End-to-End CRUD</div>
            <div className="table">
              <div className="table-row header">{CONFIG.primary.columns.map((column) => <span key={column}>{column}</span>)}<span>Action</span></div>
              {primary.map((item) => {
                const risk = Number(item.riskScore ?? item.impulseScore ?? 0);
                return (
                  <button className="table-row table-button" key={item.id} onClick={() => setSelected(item)}>
                    {CONFIG.primary.columns.map((column) => <span className={/risk|impulse|score/i.test(column) ? 'status ' + toneForRisk(risk) : ''} key={column}>{formatValue(column, item[column])}</span>)}
                    <span><Eye size={15} /> Open</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="panel span-three">
            <div className="panel-title"><FileCheck2 size={18} /> {CONFIG.secondary.label}</div>
            <div className="secondary-grid">
              {secondary.map((item) => <DetailCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailCard({ item }: { item: RecordItem }) {
  return <div className="case-card">{Object.entries(item).filter(([key]) => !['id', 'createdAt'].includes(key)).slice(0, 6).map(([key, value]) => <p key={key}><strong>{key}</strong>: {formatValue(key, value)}</p>)}</div>;
}

const GRAPH_TYPE_COLORS: Record<string, string> = {
  VICTIM: '#22c55e',
  MERCHANT: '#ef4444',
  DEVICE: '#06b6d4',
  VPA: '#f59e0b',
  BANK_ACCOUNT: '#f97316',
  CASE: '#8b5cf6'
};

function graphTypeColor(type: string) {
  return GRAPH_TYPE_COLORS[type] ?? '#64748b';
}

function graphFilterKey(type: string) {
  return type === 'BANK_ACCOUNT' ? 'account' : type.toLowerCase();
}

function entityInitials(label: string) {
  return label
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'UP';
}

function MuleGraphView({ graph }: { graph: MuleGraph }) {
  const graphRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState(graph.nodes[0]);
  const [selectedEdge, setSelectedEdge] = useState(graph.edges[0]);
  const [nodeFilter, setNodeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const topRiskNodes = [...graph.nodes].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const shortLabel = (value: string) => value.length > 22 ? value.slice(0, 20) + '..' : value;
  const totalAtRisk = graph.nodes.reduce((sum, node) => sum + node.amountAtRisk, 0);
  const highRiskCount = graph.nodes.filter((node) => node.riskScore >= 80).length;
  const maxRisk = Math.max(...graph.nodes.map((node) => node.riskScore));
  const selectedConnections = graph.edges
    .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    .slice(0, 6);
  const filterOptions = [
    ['all', 'All'],
    ['merchant', 'Merchant'],
    ['vpa', 'VPA'],
    ['device', 'Device'],
    ['account', 'Sink'],
    ['victim', 'Victim'],
    ['case', 'Case']
  ];
  const riskGaugeStyle = {
    '--risk': selectedNode.riskScore * 3.6 + 'deg',
    '--risk-color': graphTypeColor(selectedNode.type)
  } as CSSProperties;

  useEffect(() => {
    if (!graphRef.current) return;
    setSelectedNode(graph.nodes[0]);
    setSelectedEdge(graph.edges[0]);

    const cy = cytoscape({
      container: graphRef.current,
      boxSelectionEnabled: false,
      elements: [
        ...graph.nodes.map((node) => ({
          data: {
            ...node,
            displayLabel: shortLabel(node.label),
            initials: entityInitials(node.label),
            typeKey: graphFilterKey(node.type)
          },
          position: {
            x: node.x * 9.2,
            y: node.y * 6.6
          }
        })),
        ...graph.edges.map((edge) => ({
          data: {
            ...edge,
            displayLabel: edge.edgeType.replaceAll('_', ' ')
          }
        }))
      ],
      layout: {
        name: 'preset',
        fit: true,
        padding: 42,
        animate: true,
        animationDuration: 700,
        animationEasing: 'ease-out'
      },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(displayLabel)',
            width: 'mapData(riskScore, 0, 100, 40, 86)',
            height: 'mapData(riskScore, 0, 100, 40, 86)',
            'background-color': '#ef4444',
            'background-opacity': 0.16,
            'background-gradient-stop-colors': '#fecaca #ef4444',
            'background-gradient-direction': 'to-bottom-right',
            'border-width': 4,
            'border-color': '#ef4444',
            'font-size': 11,
            'font-weight': 800,
            color: '#111827',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.88,
            'text-background-padding': 4,
            'text-background-shape': 'roundrectangle',
            'text-margin-y': 9,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': 98,
            'overlay-padding': 8,
            'overlay-color': '#ef4444',
            'overlay-opacity': 0
          }
        },
        {
          selector: 'node[type = "VICTIM"]',
          style: {
            'background-color': '#22c55e',
            'border-color': '#16a34a',
            'background-gradient-stop-colors': '#dcfce7 #22c55e'
          }
        },
        {
          selector: 'node[type = "DEVICE"]',
          style: {
            'background-color': '#06b6d4',
            'border-color': '#0891b2',
            'background-gradient-stop-colors': '#cffafe #06b6d4'
          }
        },
        {
          selector: 'node[type = "CASE"]',
          style: {
            'background-color': '#8b5cf6',
            'border-color': '#7c3aed',
            'background-gradient-stop-colors': '#ede9fe #8b5cf6',
            shape: 'round-rectangle'
          }
        },
        {
          selector: 'node[type = "BANK_ACCOUNT"]',
          style: {
            'background-color': '#f97316',
            'border-color': '#ea580c',
            'background-gradient-stop-colors': '#ffedd5 #f97316',
            shape: 'hexagon'
          }
        },
        {
          selector: 'node[type = "VPA"]',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
            'background-gradient-stop-colors': '#fef3c7 #f59e0b',
            shape: 'diamond'
          }
        },
        {
          selector: 'node[status = "BLOCK"]',
          style: {
            'border-style': 'double',
            'border-width': 6
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#0f172a',
            'border-width': 5,
            'overlay-opacity': 0.14
          }
        },
        {
          selector: 'edge',
          style: {
            label: 'data(displayLabel)',
            width: 'mapData(riskWeight, 0, 100, 2, 7)',
            'curve-style': 'bezier',
            'control-point-step-size': 42,
            'line-color': '#ef4444',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ef4444',
            'arrow-scale': 1.15,
            opacity: 0.82,
            'font-size': 9,
            'font-weight': 800,
            color: '#334155',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.74,
            'text-background-padding': 3,
            'text-rotation': 'autorotate',
            'text-margin-y': -7
          }
        },
        {
          selector: 'edge[riskWeight >= 80]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444'
          }
        },
        {
          selector: 'edge[riskWeight >= 50][riskWeight < 80]',
          style: {
            'line-color': '#f97316',
            'target-arrow-color': '#f97316'
          }
        },
        {
          selector: 'edge[edgeType = "DEVICE_REUSE"]',
          style: {
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'line-style': 'dashed'
          }
        },
        {
          selector: 'edge[edgeType = "REFUND_LOOP"]',
          style: {
            'line-color': '#f97316',
            'target-arrow-color': '#f97316',
            'line-style': 'dotted'
          }
        },
        {
          selector: 'edge[edgeType = "CASE_LINK"]',
          style: {
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'line-style': 'dashed'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            opacity: 1,
            width: 8
          }
        },
        {
          selector: '.faded',
          style: {
            opacity: 0.13,
            'text-opacity': 0.08
          }
        },
        {
          selector: 'edge.faded',
          style: {
            opacity: 0.05
          }
        },
        {
          selector: '.filtered-out',
          style: {
            opacity: 0.08,
            'text-opacity': 0.04
          }
        },
        {
          selector: '.active-node',
          style: {
            'border-color': '#111827',
            'border-width': 7,
            'overlay-opacity': 0.16
          }
        },
        {
          selector: 'edge.active-edge',
          style: {
            opacity: 1,
            width: 'mapData(riskWeight, 0, 100, 4, 10)'
          }
        }
      ] as any
    });
    cyRef.current = cy;

    cy.on('tap', 'node', (event) => {
      cy.elements().removeClass('faded active-node active-edge');
      const node = event.target;
      const related = node.closedNeighborhood();
      cy.elements().not(related).addClass('faded');
      node.addClass('active-node');
      node.connectedEdges().addClass('active-edge');
      const data = event.target.data() as MuleGraph['nodes'][number] & { displayLabel: string };
      setSelectedNode({
        id: data.id,
        label: data.label,
        type: data.type,
        riskScore: data.riskScore,
        status: data.status,
        amountAtRisk: data.amountAtRisk,
        x: data.x,
        y: data.y
      });
    });
    cy.on('tap', 'edge', (event) => {
      cy.edges().removeClass('active-edge');
      event.target.addClass('active-edge');
      const data = event.target.data() as MuleGraph['edges'][number];
      setSelectedEdge({
        id: data.id,
        source: data.source,
        target: data.target,
        label: data.label,
        edgeType: data.edgeType,
        amount: data.amount,
        velocityMinutes: data.velocityMinutes,
        riskWeight: data.riskWeight
      });
    });
    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.elements().removeClass('faded active-node active-edge');
      }
    });
    cy.ready(() => {
      cy.fit(undefined, 42);
      cy.nodes('[riskScore >= 85]').select();
      window.setTimeout(() => cy.nodes().unselect(), 850);
    });

    let hotPulse = false;
    const pulseTimer = window.setInterval(() => {
      hotPulse = !hotPulse;
      cy.edges('[riskWeight >= 80]').style({
        opacity: hotPulse ? 1 : 0.62,
        width: hotPulse ? 8 : 5
      });
    }, 950);

    return () => {
      window.clearInterval(pulseTimer);
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const query = search.trim().toLowerCase();
    cy.elements().removeClass('filtered-out');
    cy.nodes().forEach((node) => {
      const haystack = [
        node.data('label'),
        node.data('type'),
        node.data('status'),
        node.data('id')
      ].join(' ').toLowerCase();
      const matchesFilter = nodeFilter === 'all' || node.data('typeKey') === nodeFilter;
      const matchesSearch = !query || haystack.includes(query);
      if (!matchesFilter || !matchesSearch) {
        node.addClass('filtered-out');
      }
    });
    cy.edges().forEach((edge) => {
      if (edge.source().hasClass('filtered-out') || edge.target().hasClass('filtered-out')) {
        edge.addClass('filtered-out');
      }
    });
  }, [nodeFilter, search, graph]);

  function zoomGraph(direction: 'in' | 'out' | 'reset') {
    const cy = cyRef.current;
    if (!cy) return;
    if (direction === 'reset') {
      cy.fit(undefined, 42);
      return;
    }
    cy.zoom({
      level: cy.zoom() * (direction === 'in' ? 1.22 : 0.82),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
    });
  }

  return (
    <div className="mule-graph-layout">
      <div className="graph-stage">
        <div className="graph-toolbar">
          <div>
            <span>Fund flow intelligence</span>
            <strong>{graph.nodes.length} entities / {graph.edges.length} risk edges</strong>
          </div>
          <label className="graph-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Entity, VPA, device, case" />
          </label>
          <div className="graph-stats">
            <span><b>{highRiskCount}</b>hot nodes</span>
            <span><b>{formatValue('amount', totalAtRisk)}</b>at risk</span>
            <span><b>{maxRisk}</b>max risk</span>
          </div>
        </div>
        <div className="graph-filter-bar">
          {filterOptions.map(([key, label]) => (
            <button className={nodeFilter === key ? 'graph-filter active' : 'graph-filter'} key={key} onClick={() => setNodeFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="case-badge">Active investigation - pre-settlement hold simulator</div>
        <div ref={graphRef} className="graph-canvas" aria-label="Interactive complex mule money laundering graph" />
        <div className="graph-footer">
          <div className="graph-legend">
            <span className="legend victim">Victim</span>
            <span className="legend merchant">Merchant</span>
            <span className="legend device">Device</span>
            <span className="legend account">Sink</span>
            <span className="legend case">Case</span>
          </div>
          <div className="graph-controls" aria-label="Graph zoom controls">
            <button onClick={() => zoomGraph('in')}>+</button>
            <button onClick={() => zoomGraph('out')}>-</button>
            <button onClick={() => zoomGraph('reset')}>Reset</button>
          </div>
        </div>
      </div>
      <div className="graph-evidence">
        <strong>{graph.networkId}: {graph.title}</strong>
        <p>{graph.investigatorNarrative}</p>
        <div className="risk-gauge-row">
          <div className="risk-gauge" style={riskGaugeStyle}><span>{selectedNode.riskScore}</span></div>
          <div>
            <span>Risk assessment</span>
            <strong>{selectedNode.riskScore >= 85 ? 'Critical escalation' : selectedNode.riskScore >= 70 ? 'Enhanced review' : 'Monitor'}</strong>
            <small>{selectedNode.status} / {selectedNode.type}</small>
          </div>
        </div>
        <div className="selected-node-card">
          <span>Selected entity</span>
          <strong>{selectedNode.label}</strong>
          <small>{selectedNode.type} / {selectedNode.status} / risk {selectedNode.riskScore}</small>
          <small>Amount at risk: {formatValue('amount', selectedNode.amountAtRisk)}</small>
        </div>
        <div className="selected-node-card edge-card">
          <span>Selected risk edge</span>
          <strong>{selectedEdge.edgeType}</strong>
          <small>{selectedEdge.label}</small>
          <small>{formatValue('amount', selectedEdge.amount)} moved in {selectedEdge.velocityMinutes}m</small>
        </div>
        <div className="graph-metrics">
          {Object.entries(graph.metrics).map(([key, value]) => <span key={key}><b>{formatValue(key, value)}</b>{key}</span>)}
        </div>
        <div className="top-risk-strip">
          {topRiskNodes.map((node) => <span key={node.id}><b>{node.riskScore}</b>{node.label}</span>)}
        </div>
        <div className="reason-list">{graph.reasonCodes.map((code) => <span className="chip" key={code}>{code}</span>)}</div>
        <div className="relationship-list">
          <strong>Fund flow connections</strong>
          {selectedConnections.length ? selectedConnections.map((edge) => {
            const isOut = edge.source === selectedNode.id;
            const counterpartyId = isOut ? edge.target : edge.source;
            const counterparty = graph.nodes.find((node) => node.id === counterpartyId);
            return (
              <button key={edge.id} onClick={() => counterparty && setSelectedNode(counterparty)}>
                <span>{isOut ? 'OUT' : 'IN'}</span>
                <b>{counterparty?.label ?? counterpartyId}</b>
                <small>{formatValue('amount', edge.amount)} / {edge.velocityMinutes}m</small>
              </button>
            );
          }) : <p>No direct edge selected for this entity.</p>}
        </div>
        <div className="edge-ledger">
          {graph.edges.slice(0, 5).map((edge) => <span key={edge.id}><b>{edge.edgeType}</b>{edge.label} - {formatValue('amount', edge.amount)} - {edge.velocityMinutes}m</span>)}
        </div>
        <div className="kill-switch"><strong>Kill-switch</strong><p>{graph.killSwitchRecommendation}</p></div>
      </div>
    </div>
  );
}

function Metric({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="metric-card"><div>{icon}</div><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
