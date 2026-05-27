# Architecture

Bharat UPI Interdict uses a split frontend and backend architecture.

## Components

- React dashboard: RBAC role switcher, KPI cards, command panels, tables, and CRUD actions.
- Express API: health, metrics, CRUD, and domain intelligence endpoints.
- RBAC middleware: role-to-permission mapping.
- JSON persistence: deterministic synthetic DB file for local demos.
- Domain engine: pure TypeScript model simulator with reason codes.

## Runtime Ports

- Backend: 4102
- Frontend dev server: 5172
- Frontend preview server: 5102

