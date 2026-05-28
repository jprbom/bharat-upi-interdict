import type { Express } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requirePermission } from './auth.js';
import type { JsonDatabase } from './db.js';
import { scoreInterdiction } from './engine.js';
import { caseInputSchema, riskEntityInputSchema, scoreInputSchema } from './schemas.js';
import { buildMockUpiResponse, mockUpiRailRequestSchema } from './mockUpi.js';

const nonEmptyPatch = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.partial().refine((value) => Object.keys(value).length > 0, 'Patch must contain at least one field.');

export function registerRoutes(app: Express, db: JsonDatabase) {
  app.get('/api/metrics', requirePermission('read'), async (_req, res, next) => {
    try {
      const entities = await db.list<any>('riskEntities');
      const cases = await db.list<any>('interdictionCases');
      const highRiskEntities = entities.filter((entity) => entity.riskScore >= 80).length;
      const heldAmount = cases.filter((item) => item.status === 'HELD').reduce((sum, item) => sum + item.amountAtRisk, 0);
      res.json({
        kpis: {
          highRiskEntities,
          activeCases: cases.filter((item) => item.status !== 'RELEASED').length,
          heldAmount,
          averageRiskScore: Math.round(entities.reduce((sum, entity) => sum + entity.riskScore, 0) / Math.max(entities.length, 1))
        },
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/risk-entities', requirePermission('read'), async (_req, res, next) => {
    try {
      res.json(await db.list('riskEntities'));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/risk-entities', requirePermission('write'), async (req, res, next) => {
    try {
      const body = riskEntityInputSchema.parse(req.body);
      const item = { id: 'ent_' + randomUUID(), createdAt: new Date().toISOString(), ...body };
      res.status(201).json(await db.create('riskEntities', item));
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/risk-entities/:id', requirePermission('write'), async (req, res, next) => {
    try {
      const patch = nonEmptyPatch(riskEntityInputSchema).parse(req.body);
      res.json(await db.update('riskEntities', String(req.params.id), patch));
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/risk-entities/:id', requirePermission('admin'), async (req, res, next) => {
    try {
      await db.delete('riskEntities', String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/interdiction-cases', requirePermission('read'), async (_req, res, next) => {
    try {
      res.json(await db.list('interdictionCases'));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/interdiction-cases', requirePermission('write'), async (req, res, next) => {
    try {
      const body = caseInputSchema.parse(req.body);
      const item = { id: 'case_' + randomUUID(), createdAt: new Date().toISOString(), ...body };
      res.status(201).json(await db.create('interdictionCases', item));
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/interdiction-cases/:id', requirePermission('write'), async (req, res, next) => {
    try {
      const patch = nonEmptyPatch(caseInputSchema).parse(req.body);
      res.json(await db.update('interdictionCases', String(req.params.id), patch));
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/interdiction-cases/:id', requirePermission('admin'), async (req, res, next) => {
    try {
      await db.delete('interdictionCases', String(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/interdiction-score', requirePermission('read'), (req, res, next) => {
    try {
      res.json(scoreInterdiction(scoreInputSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/mock-upi', requirePermission('read'), (req, res, next) => {
    try {
      const body = mockUpiRailRequestSchema.parse(req.body);
      res.json(buildMockUpiResponse(body));
    } catch (error) {
      next(error);
    }
  });

}
