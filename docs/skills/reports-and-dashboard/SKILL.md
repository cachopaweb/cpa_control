---
name: reports-and-dashboard
description: Implement React dashboards and Firestore-backed reports for the CPA betting operations system. Use when building controller or operator metrics, daily/monthly profit, ROI, deposits, returns by period, goal progress, balance reports, filters, exports, charts, or operational overview pages inspired by docs/imagens/dashboard.jpeg.
---

# Reports And Dashboard

## Goal

Provide clear visibility into operations, cycles, balances, daily/monthly profit, ROI, deposits, returns, goals and operator/house performance.

## Workflow

1. Define metrics from existing Firestore documents instead of duplicating business logic.
2. Separate controller dashboards from operator dashboards.
3. Add filters for date range, operator, betting house, operation status and cycle status.
4. Prefer Firestore aggregate queries, denormalized summary documents, or Cloud Functions for large datasets.
5. Keep export data consistent with on-screen filters.
6. Make financial totals traceable back to operations and cycles.
7. Make period filters apply consistently to profit, ROI, deposit, return and goal progress.

## Suggested Metrics

- Total operators.
- Active operations.
- Total cycles.
- Total amount bet.
- Total expected return.
- Total result amount.
- Total deposit amount.
- Total return amount.
- Daily profit.
- Monthly profit.
- ROI by period.
- Profit/loss by operator.
- Profit/loss by betting house.
- ROI by operator.
- ROI by betting house.
- Goal progress by organization, operator or betting house.
- Pending or under-review cycles.

## Acceptance Checks

- Controller dashboard aggregates all operators.
- Operator dashboard shows only own data.
- Date filters affect both charts and totals.
- Dashboard shows daily and monthly profit.
- Reports show ROI, deposits and returns by period.
- Goals display target, current value and progress percentage.
- Exported reports match filtered screen data.
