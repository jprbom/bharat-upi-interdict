# Bharat UPI Interdict Concept-Specific Diagrams

<p align="center">
  <img src="assets/hero.svg" width="100%" alt="Bharat UPI Interdict hero diagram">
</p>

<p align="center">
  <img src="assets/system-map.svg" width="100%" alt="Bharat UPI Interdict system map">
</p>

## Latest Enhancement Map

~~~mermaid
flowchart LR
  UI["Mule Graph + Timeline CTA"] --> AUTH["Signed Demo Token"]
  AUTH --> API["Express API"]
  API --> GRAPH["Mule Graph Evidence"]
  API --> SIM["Payment Ecosystem Simulator"]
  GRAPH --> HOLD["Pre-settlement Hold Recommendation"]
  SIM --> NPCI["NPCI-style UPI Rail"]
  NPCI --> WH["Risk Hold Webhook"]
  WH --> CASE["Investigator Case Workspace"]
  CASE --> UI
~~~

## Product Decision Flow

~~~mermaid
flowchart LR
  A["Graph Overview"]:::start --> B["Risk Entities"]:::signal
  B --> C["Interdiction Cases"]:::model
  C --> D["Mule Graph AI"]:::decision
  D --> E["Recovery Simulator"]:::output
  E --> F["Mock NPCI/UPI response + audit trail"]:::audit

  classDef start fill:#f8fafc,stroke:#334155,stroke-width:2px,color:#0f172a
  classDef signal fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#083344
  classDef model fill:#eef2ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b
  classDef decision fill:#fff7ed,stroke:#ef4444,stroke-width:2px,color:#431407
  classDef output fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#052e16
  classDef audit fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#422006
~~~

## End-to-End API Flow

~~~mermaid
sequenceDiagram
  participant User as RBAC User
  participant UI as React Command Center
  participant API as Express API
  participant Model as Domain AI Engine
  participant Mock as Mock NPCI/UPI Rail
  participant DB as JSON Test DB
  User->>UI: Click tab, CTA, or row drill-down
  UI->>API: Request with signed demo bearer token
  API->>DB: Read/write synthetic records
  API->>Model: Score domain-specific risk or recommendation
  API->>Mock: Generate UPI-like response code, RRN, callback
  Mock-->>API: Sandbox response, no real money movement
  API-->>UI: Render decision, reason codes, and drill-down
~~~

## Mule Interdiction Lifecycle

~~~mermaid
stateDiagram-v2
  [*] --> PAYMENT_ATTEMPT_CREATED
  PAYMENT_ATTEMPT_CREATED --> GRAPH_RISK_SCORED
  GRAPH_RISK_SCORED --> PRE_SETTLEMENT_HOLD
  PRE_SETTLEMENT_HOLD --> NPCI_STYLE_RAIL_STATUS
  NPCI_STYLE_RAIL_STATUS --> RISK_WEBHOOK_SENT
  RISK_WEBHOOK_SENT --> INVESTIGATOR_REVIEW
  INVESTIGATOR_REVIEW --> HOLD_CONFIRMED
  INVESTIGATOR_REVIEW --> RELEASE_TO_SETTLEMENT
~~~

## Deployment and SDLC View

~~~mermaid
flowchart TB
  Repo["Private GitHub repo"] --> CI["GitHub Actions: npm run verify"]
  CI --> Tests["Backend + frontend tests"]
  CI --> Audit["npm audit --audit-level=high"]
  Tests --> Runtime["Node 22 runtime"]
  Runtime --> Backend["Express API :4102"]
  Runtime --> Frontend["Vite preview :5102"]
  Backend --> Mock["/api/mock-upi NPCI sandbox"]
  Backend --> DB[("Synthetic JSON database")]
~~~
