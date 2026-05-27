import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Crosshair, Eye, GitFork, Lock, Network, RefreshCw, Shield, Sparkles, Trash2 } from 'lucide-react';
import { apiRequest } from './api';
import { formatInr } from './lib/viewModel';

type Role = 'ADMIN' | 'INVESTIGATOR' | 'COMPLIANCE_OFFICER' | 'BANK_PARTNER' | 'VIEWER';
type RiskEntity = {
  id: string;
  entityType: string;
  handle: string;
  bank: string;
  deviceHash: string;
  riskScore: number;
  velocityScore: number;
  linkedEntities: number;
  status: string;
  createdAt: string;
};
type CaseItem = {
  id: string;
  networkId: string;
  title: string;
  amountAtRisk: number;
  entities: number;
  status: string;
  recommendedAction: string;
  createdAt: string;
};
type Metrics = { kpis: { highRiskEntities: number; activeCases: number; heldAmount: number; averageRiskScore: number } };
type ScoreResult = { riskScore: number; action: string; reasonCodes: string[]; investigatorSummary: string };

const roles: Role[] = ['ADMIN', 'INVESTIGATOR', 'COMPLIANCE_OFFICER', 'BANK_PARTNER', 'VIEWER'];
const fallbackEntities: RiskEntity[] = [
  { id: 'ent_001', entityType: 'MERCHANT', handle: 'merchant-red-772@upi', bank: 'Axis Bank', deviceHash: 'dev_8f2a91', riskScore: 94, velocityScore: 91, linkedEntities: 44, status: 'BLOCK', createdAt: '2026-05-27T09:15:00.000Z' },
  { id: 'ent_002', entityType: 'VPA', handle: 'rahul9981@oksbi', bank: 'SBI', deviceHash: 'dev_8f2a91', riskScore: 88, velocityScore: 82, linkedEntities: 29, status: 'REVIEW', createdAt: '2026-05-27T09:18:00.000Z' },
  { id: 'ent_003', entityType: 'DEVICE', handle: 'android-fp-29a7', bank: 'Multi-bank', deviceHash: 'dev_29a7cc', riskScore: 76, velocityScore: 68, linkedEntities: 18, status: 'WATCH', createdAt: '2026-05-27T09:21:00.000Z' }
];
const fallbackCases: CaseItem[] = [
  { id: 'case_001', networkId: 'NW-MUM-4451', title: 'Circular low-ticket merchant laundering mesh', amountAtRisk: 4830000, entities: 32, status: 'HELD', recommendedAction: 'Pre-settlement debit hold and enhanced merchant KYC', createdAt: '2026-05-27T09:30:00.000Z' }
];
const fallbackMetrics: Metrics = { kpis: { highRiskEntities: 23, activeCases: 17, heldAmount: 4830000, averageRiskScore: 86 } };

export default function App() {
  const [role, setRole] = useState<Role>('INVESTIGATOR');
  const [entities, setEntities] = useState<RiskEntity[]>(fallbackEntities);
  const [cases, setCases] = useState<CaseItem[]>(fallbackCases);
  const [metrics, setMetrics] = useState<Metrics>(fallbackMetrics);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');
  const highRisk = useMemo(() => entities.filter((entity) => entity.riskScore >= 80), [entities]);

  async function load() {
    try {
      const [nextMetrics, nextEntities, nextCases] = await Promise.all([
        apiRequest<Metrics>('/metrics', role),
        apiRequest<RiskEntity[]>('/risk-entities', role),
        apiRequest<CaseItem[]>('/interdiction-cases', role)
      ]);
      setMetrics(nextMetrics);
      setEntities(nextEntities);
      setCases(nextCases);
      setError('');
    } catch {
      setError('API offline: showing synthetic graph-risk data.');
    }
  }

  useEffect(() => {
    void load();
  }, [role]);

  async function runScore() {
    const result = await apiRequest<ScoreResult>('/interdiction-score', role, {
      method: 'POST',
      body: JSON.stringify({
        inflowVelocity: 92,
        onwardTransferRatio: 0.83,
        newCounterpartyRatio: 0.71,
        deviceReuseCount: 9,
        refundLoopCount: 4,
        failedCollectAttempts: 8
      })
    });
    setScore(result);
  }

  async function createEntity() {
    const created = await apiRequest<RiskEntity>('/risk-entities', role, {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'VPA',
        handle: 'watch-' + Math.floor(Math.random() * 9999) + '@upi',
        bank: 'HDFC Bank',
        deviceHash: 'dev_new_88',
        riskScore: 72,
        velocityScore: 69,
        linkedEntities: 11,
        status: 'WATCH'
      })
    });
    setEntities([created, ...entities]);
  }

  async function removeEntity(id: string) {
    await apiRequest<void>('/risk-entities/' + id, role, { method: 'DELETE' });
    setEntities(entities.filter((entity) => entity.id !== id));
  }

  return (
    <div className="app-shell interdict">
      <aside className="sidebar">
        <div className="brand"><img src="/logo.svg" alt="" /><span>Bharat UPI Interdict</span></div>
        {['Command Center', 'Alerts', 'Networks', 'Entities', 'Transactions', 'Cases', 'Investigations', 'Audit Trail'].map((item, index) => (
          <button className={index === 0 ? 'nav-item active' : 'nav-item'} key={item}><Network size={16} />{item}</button>
        ))}
        <div className="region-card"><span>Environment</span><strong>Production-like</strong><small>Synthetic data only</small></div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <h1>Pre-settlement Mule Network Interdiction</h1>
            <p>Graph-risk scoring, fraud community triage, and explainable investigation summaries.</p>
          </div>
          <div className="top-actions">
            <span className="live-dot">Live</span>
            <select value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item}>{item}</option>)}</select>
            <button onClick={load}><RefreshCw size={16} />Refresh</button>
          </div>
        </header>
        {error ? <div className="notice">{error}</div> : null}
        <section className="kpi-grid">
          <Metric title="High Risk Entities" value={String(metrics.kpis.highRiskEntities)} detail="watch, review, block" icon={<AlertTriangle />} />
          <Metric title="Held Amount" value={formatInr(metrics.kpis.heldAmount)} detail="pre-settlement hold" icon={<Shield />} />
          <Metric title="Active Cases" value={String(metrics.kpis.activeCases)} detail="casework queue" icon={<Eye />} />
          <Metric title="Avg Risk Score" value={String(metrics.kpis.averageRiskScore)} detail="network weighted" icon={<Crosshair />} />
        </section>
        <section className="workspace-grid">
          <div className="panel span-two">
            <div className="panel-title"><GitFork size={18} /> Interdiction Copilot</div>
            <button onClick={runScore}><Sparkles size={16} />Score Sample Network</button>
            <button onClick={createEntity}><Lock size={16} />Create Watch Entity</button>
            <div className="recommendation-card">
              <div><span>Action</span><strong>{score?.action || 'Run score'}</strong></div>
              <div><span>Risk Score</span><strong>{score?.riskScore || 0}/100</strong></div>
              <p>{score?.investigatorSummary || 'The copilot converts graph evidence into case-ready reason codes.'}</p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title"><Network size={18} /> Network Spotlight</div>
            {highRisk.map((entity) => <div className="node-row" key={entity.id}><strong>{entity.riskScore}</strong><span>{entity.handle}</span><small>{entity.linkedEntities} links</small></div>)}
          </div>
          <div className="panel span-three">
            <div className="panel-title"><Lock size={18} /> Risk Entities CRUD</div>
            <div className="table">
              <div className="table-row header"><span>Handle</span><span>Type</span><span>Bank</span><span>Risk</span><span>Status</span><span>Action</span></div>
              {entities.map((entity) => (
                <div className="table-row" key={entity.id}>
                  <span>{entity.handle}</span><span>{entity.entityType}</span><span>{entity.bank}</span><span>{entity.riskScore}</span><span className={'status ' + entity.status.toLowerCase()}>{entity.status}</span>
                  <span><button className="icon-button" onClick={() => void removeEntity(entity.id)}><Trash2 size={15} /></button></span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel span-three">
            <div className="panel-title"><Shield size={18} /> Casework Queue</div>
            {cases.map((item) => <div className="case-card" key={item.id}><strong>{item.title}</strong><span>{item.networkId} - {item.entities} entities - {formatInr(item.amountAtRisk)}</span><p>{item.recommendedAction}</p></div>)}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="metric-card"><div>{icon}</div><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}

