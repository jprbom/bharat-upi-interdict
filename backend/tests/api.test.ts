import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createTestDatabase } from '../src/db.js';

describe('Bharat UPI Interdict API', () => {
  it('scores a high-risk mule network for pre-settlement hold', async () => {
    const app = createApp(createTestDatabase());
    const response = await request(app)
      .post('/api/interdiction-score')
      .set('x-user-role', 'INVESTIGATOR')
      .send({
        inflowVelocity: 92,
        onwardTransferRatio: 0.83,
        newCounterpartyRatio: 0.71,
        deviceReuseCount: 9,
        refundLoopCount: 4,
        failedCollectAttempts: 8
      });

    expect(response.status).toBe(200);
    expect(response.body.action).toBe('PRE_SETTLEMENT_HOLD');
    expect(response.body.reasonCodes).toContain('FAST_ONWARD_TRANSFER');
  });

  it('builds a complex mule graph from synthetic risk entities and cases', async () => {
    const app = createApp(createTestDatabase());
    const response = await request(app)
      .get('/api/mule-graph')
      .set('x-user-role', 'INVESTIGATOR');

    expect(response.status).toBe(200);
    expect(response.body.nodes.length).toBeGreaterThanOrEqual(7);
    expect(response.body.edges.length).toBeGreaterThanOrEqual(8);
    expect(response.body.metrics.circularFlowCount).toBeGreaterThan(0);
    expect(response.body.reasonCodes).toContain('CIRCULAR_REFUND_LOOP');
    expect(response.body.killSwitchRecommendation).toContain('pre-settlement hold');
  });

  it('supports risk entity CRUD and protects destructive operations', async () => {
    const app = createApp(createTestDatabase());
    const forgedRole = await request(app)
      .post('/api/risk-entities')
      .set('x-user-role', 'UNKNOWN_ADMIN')
      .send({
        entityType: 'VPA',
        handle: 'forged-role@upi',
        bank: 'SBI',
        deviceHash: 'dev_forged_01',
        riskScore: 31,
        velocityScore: 21,
        linkedEntities: 3,
        status: 'WATCH'
      });

    expect(forgedRole.status).toBe(403);
    expect(forgedRole.body.role).toBe('VIEWER');

    const created = await request(app)
      .post('/api/risk-entities')
      .set('x-user-role', 'INVESTIGATOR')
      .send({
        entityType: 'VPA',
        handle: 'new-watch@upi',
        bank: 'HDFC Bank',
        deviceHash: 'dev_test_01',
        riskScore: 64,
        velocityScore: 58,
        linkedEntities: 7,
        status: 'WATCH'
      });

    expect(created.status).toBe(201);

    const denied = await request(app)
      .delete('/api/risk-entities/' + created.body.id)
      .set('x-user-role', 'INVESTIGATOR');
    expect(denied.status).toBe(403);

    const deleted = await request(app)
      .delete('/api/risk-entities/' + created.body.id)
      .set('x-user-role', 'ADMIN');
    expect(deleted.status).toBe(204);
  });

  it('returns NPCI-style mock UPI rail response for end-to-end demo flows', async () => {
    const app = createApp(createTestDatabase());
    const response = await request(app)
      .post('/api/mock-upi')
      .set('x-user-role', 'OPS_MANAGER')
      .send({
        txnId: 'TXN-DEMO-001',
        payerVpa: 'payer@oksbi',
        payeeVpa: 'merchant@upi',
        amount: 499,
        flow: 'UPI_INTENT',
        purpose: 'portfolio test flow',
        riskScore: 24,
        scenario: 'HAPPY_PATH'
      });

    expect(response.status).toBe(200);
    expect(response.body.gateway).toBe('NPCI_UPI_MOCK');
    expect(response.body.txnId).toBe('TXN-DEMO-001');
    expect(response.body.rrn).toMatch(/^RRN/);
    expect(response.body.risk.reasonCodes).toContain('SYNTHETIC_NPCI_SANDBOX');
    expect(response.body.settlement).toHaveProperty('preSettlementHold');
  });

});
