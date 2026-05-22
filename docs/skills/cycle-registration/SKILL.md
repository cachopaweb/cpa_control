---
name: cycle-registration
description: Implement Firestore-backed cycle registration for the CPA React/TypeScript betting system. Use when building creation, editing, validation, real-time streams, status flow, numbering, profit/loss calculation, proofCount checks, or controller review of betting cycles within an operation.
---

# Cycle Registration

## Goal

Allow operators to register each betting cycle with financial values, result status and mandatory proof.

## Workflow

1. Create a Firestore cycle document linked to an operation.
2. Generate `cycle_number` sequentially inside the operation.
3. Capture `bet_amount`, `expected_return`, `result_amount`, `profit_loss`, `status`, `notes`.
4. Require at least one Firebase Storage proof image before final submission.
5. Recalculate operation balance after cycle creation or result update.
6. Add client validation and Firebase Security Rules where possible for financial values.
7. Log changes to amounts, status and proof references in `auditLogs`.
8. Use Firestore transactions or batched writes when cycle updates must also update operation balance.

## Status Rules

- `pending`: created but not finalized or not reviewed.
- `under_review`: waiting controller review.
- `won`: successful cycle.
- `lost`: unsuccessful cycle.
- `canceled`: invalidated cycle.

## Acceptance Checks

- A cycle cannot be submitted without proof.
- Cycle numbers are sequential per operation.
- Profit/loss is calculated consistently.
- Operators cannot create cycles in another operator's operation.
