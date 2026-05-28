# Architecture

Bharat UPI Interdict uses a split React and Express architecture with a public-safe payment ecosystem simulator and a complex mule-network graph workspace.

## Components

- React dashboard: RBAC role switcher, KPI cards, command panels, tables, CRUD actions, mule graph, and Payment Ecosystem Timeline.
- Express API: health, metrics, CRUD, mule graph, interdiction scoring, signed demo auth, payment lifecycle, webhooks, refund, dispute, and reconciliation endpoints.
- RBAC middleware: signed local demo bearer tokens and role-to-permission mapping.
- JSON persistence: deterministic synthetic DB file for local demos.
- Domain engine: mule risk, circular movement, device reuse, and pre-settlement hold reason-code simulator.
- Payment ecosystem simulator: PG, PA, TPAP, PSP/bank, and NPCI-style rail adapters with HMAC webhooks, idempotency, and risk-hold scenarios.
- AIML/DL artifacts: 10,000-row synthetic training harness with model card, metrics, and feature importance.

## Runtime Ports

- Backend: 4102
- Frontend dev server: 5172
- Frontend preview server: 5102

