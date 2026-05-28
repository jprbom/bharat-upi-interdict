# API Reference

Base URL: http://127.0.0.1:4102

Authentication model: demo RBAC through x-user-role header. This is intentionally simple for a portfolio prototype and is documented in SECURITY.md.

## Health

GET /api/health

Returns service status, author, and role catalogue.

## Metrics

GET /api/metrics

Returns operational KPIs for the dashboard.

## Domain Intelligence

POST /api/interdiction-score

Returns a recommendation, score, action, reason codes, and plain-language explanation for the product domain.

GET /api/mule-graph

Returns a synthetic but concrete mule-network graph for demo investigations. The response includes victim, merchant, VPA, device, bank-account, and case nodes; payment/onward-transfer/device-reuse/refund-loop edges; graph metrics; reason codes; investigator narrative; and a pre-settlement kill-switch recommendation.

## CRUD

This repository implements list, create, update, and delete operations for risk entities and interdiction cases. Write endpoints require write permission. Delete endpoints require admin permission.
