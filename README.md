<p align="center">
  <img src="frontend/public/logo.svg" width="96" alt="Bharat UPI Interdict logo">
</p>

# Bharat UPI Interdict

Pre-settlement mule-network interdiction and explainable fraud investigation copilot.

Author: Prashant Jagtap <jprbom@gmail.com>

## Portfolio Positioning

A UPI-native graph risk prototype that reconstructs mule-chain movement, scores suspicious entities, recommends pre-settlement holds, and creates investigation-ready summaries for fraud operations.

This repo uses synthetic UPI-style data only. It is designed as an India-scale payment AI infrastructure prototype, not as a production integration with NPCI, PSPs, banks, account aggregators, or live UPI rails.

## Highlights

- TypeScript Express backend with RBAC, Helmet, CORS controls, rate limiting, Zod validation, and JSON persistence.
- React and Vite frontend with role-aware operations dashboard, animated KPI panels, CRUD controls, and model explanation surface.
- Domain engine endpoint at /api/interdiction-score.
- DB-backed CRUD for risk entities and interdiction cases.
- Documentation set covering SDLC, API, security, testing, deployment, and diagrams.
- Mermaid diagrams for architecture, DFD, deployment, integration, API flow, and RBAC.

## Run Locally

~~~bash
npm install
npm run dev:backend
npm run dev:frontend
~~~

Backend: http://127.0.0.1:4102

Frontend: http://127.0.0.1:5172

## Verify

~~~bash
npm run build
npm run test
npm run audit:high
~~~

## Repo Name

bharat-upi-interdict

