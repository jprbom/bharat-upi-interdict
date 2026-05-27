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

## CRUD

This repository implements list, create, update, and delete operations for risk entities and interdiction cases. Write endpoints require write permission. Delete endpoints require admin permission.

