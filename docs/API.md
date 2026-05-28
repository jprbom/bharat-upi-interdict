# API Reference

Base URL: http://127.0.0.1:4102

Authentication model: signed local demo bearer tokens from `POST /api/auth/demo-token`. Raw `x-user-role` headers are ignored for authorization.

## Health

GET /api/health

Returns service status, author, and role catalogue.

## Metrics

GET /api/metrics

Returns operational KPIs for the dashboard.

## Auth

POST /api/auth/demo-token

Returns a one-hour signed local demo bearer token for one of the documented RBAC roles.

## Payment Ecosystem Simulator

POST /api/payments/initiate
GET /api/payments/:id/status
POST /api/payments/:id/simulate-event
GET /api/payments/:id/timeline
GET /api/reconciliation/batches
POST /api/refunds/initiate
POST /api/disputes/raise
POST /api/webhooks/payment-gateway
POST /api/webhooks/payment-aggregator
POST /api/webhooks/tpap
POST /api/webhooks/npci

These endpoints simulate PG checkout, PA payment attempts, TPAP app authorization, PSP/bank outcomes, NPCI-style UPI rail states, HMAC webhooks, settlement, refunds, disputes, duplicate delivery, out-of-order webhook handling, and risk-hold scenarios for mule interdiction review.

## Domain Intelligence

POST /api/interdiction-score

Returns a recommendation, score, action, reason codes, and plain-language explanation for the product domain.

GET /api/mule-graph

Returns a synthetic but concrete mule-network graph for demo investigations. The response includes victim, merchant, VPA, device, bank-account, and case nodes; payment/onward-transfer/device-reuse/refund-loop edges; graph metrics; reason codes; investigator narrative; and a pre-settlement kill-switch recommendation.

## CRUD

This repository implements list, create, update, and delete operations for risk entities and interdiction cases. Write endpoints require write permission. Delete endpoints require admin permission.
