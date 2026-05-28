import { useEffect, useMemo, useState, type ReactNode } from 'react';
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

function MuleGraphView({ graph }: { graph: MuleGraph }) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const shortLabel = (value: string) => value.length > 18 ? value.slice(0, 16) + '..' : value;
  return (
    <div className="mule-graph-layout">
      <div className="graph-canvas" aria-label="Complex mule money laundering graph">
        <svg viewBox="0 0 100 86" role="img">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {graph.edges.map((edge) => {
            const source = nodeById.get(edge.source);
            const target = nodeById.get(edge.target);
            if (!source || !target) return null;
            return (
              <g key={edge.id}>
                <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={'graph-edge ' + edge.edgeType.toLowerCase()} markerEnd="url(#arrow)" />
              </g>
            );
          })}
          {graph.nodes.map((node) => (
            <g key={node.id} className={'graph-node ' + node.type.toLowerCase()} transform={'translate(' + node.x + ' ' + node.y + ')'}>
              <circle r={node.riskScore >= 85 ? 5.8 : 4.8} />
              <text y="-7">{shortLabel(node.label)}</text>
              <text y="9" className="node-meta">{node.type} / {node.status}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="graph-evidence">
        <strong>{graph.networkId}: {graph.title}</strong>
        <p>{graph.investigatorNarrative}</p>
        <div className="graph-metrics">
          {Object.entries(graph.metrics).map(([key, value]) => <span key={key}><b>{formatValue(key, value)}</b>{key}</span>)}
        </div>
        <div className="reason-list">{graph.reasonCodes.map((code) => <span className="chip" key={code}>{code}</span>)}</div>
        <div className="edge-ledger">
          {graph.edges.slice(0, 5).map((edge) => <span key={edge.id}><b>{edge.edgeType}</b>{edge.label} · {formatValue('amount', edge.amount)} · {edge.velocityMinutes}m</span>)}
        </div>
        <div className="kill-switch"><strong>Kill-switch</strong><p>{graph.killSwitchRecommendation}</p></div>
      </div>
    </div>
  );
}

function Metric({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="metric-card"><div>{icon}</div><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
