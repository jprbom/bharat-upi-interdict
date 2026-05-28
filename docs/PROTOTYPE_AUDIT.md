# Prototype Audit Response

## Honest Status

Bharat UPI Interdict is a runnable portfolio-grade prototype, not a production fraud-interdiction system. It demonstrates a mule-risk investigation workspace, synthetic CRUD workflows, RBAC simulation, a mocked UPI/NPCI response, tests, CI, Docker packaging, and SDLC documentation.

It should be presented as: **a pre-settlement mule-risk interdiction prototype using synthetic data and explainable scoring.**

It should not be presented as: **a real graph neural network, bank-grade mule detector, or live fraud-freeze platform.**

## What Is Real Today

- React dashboard with working tabs, CTAs, drill-downs, CRUD, and RBAC role selection.
- Express API with Zod validation, Helmet, rate limiting, CORS, and permission middleware.
- Domain endpoint for mule-risk scoring with reason codes and investigator-friendly explanation.
- Mock NPCI/UPI rail returning RRN, UPI request id, bank reference, response code, settlement state, risk decision, reason codes, and callback metadata.
- Local JSON persistence for demo review.
- Backend tests, frontend helper tests, local browser E2E smoke script, Docker files, and CI verify workflow.
- Python ML/DL training demonstration that creates a model-card artifact from synthetic data.

## Prototype Boundaries

- RBAC is a simulator. It uses `x-user-role`; production would require OIDC/JWT, signed sessions, tenant isolation, KMS-backed secrets, and immutable audit logs.
- Current mule logic is weighted scoring, not graph traversal, entity resolution, connected components, PageRank, community detection, or GNN inference.
- The ML script is educational and synthetic, not statistically valid fraud-model training.
- Persistence is JSON file storage, not a graph database, event store, case ledger, or immutable evidence chain.
- The UPI rail is fully mocked and does not connect to NPCI, PSPs, banks, law-enforcement workflows, or real fraud hold systems.

## Serious Upgrade Path

- Add graph nodes for VPA, account hash, mobile hash, device hash, merchant id, QR id, and bank handle.
- Add edges for transfer, refund, collect request, failed collect, device reuse, QR reuse, and merchant onboarding.
- Implement connected components, circularity, burst velocity, betweenness, degree, and community-risk propagation.
- Add case workspace with investigator notes, hold reason, evidence timeline, and SAR-style export.
- Add graph fixtures and scenario tests for mule chains, circular money movement, and merchant laundering.

