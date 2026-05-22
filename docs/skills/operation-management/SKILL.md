---
name: operation-management
description: Implement Firestore-backed operation management for the CPA React/TypeScript betting system. Use when creating features for operators to open, pause, close, list, stream, or inspect operations linked to betting houses and balances.
---

# Operation Management

## Goal

Allow operators to create and manage betting operations in a betting house.

## Workflow

1. Create an `operations/{operationId}` Firestore document linked to `operatorId` and `bettingHouseId`.
2. Track `initialBalance`, `currentBalance`, `status`, `createdAt`, `updatedAt`, `closedAt`.
3. Allow operators to stream and inspect only their own operations.
4. Allow controllers to inspect all operations.
5. Prevent new cycles when an operation is `closed`.
6. Recalculate or update `currentBalance` from cycle results using one consistent strategy.
7. Use Firestore transactions or batched writes when operation balance and cycle result change together.

## Status Rules

- `open`: accepts new cycles.
- `paused`: visible but does not accept new cycles unless explicitly resumed.
- `closed`: final state, no new cycles.

## Acceptance Checks

- Operator can create an operation for an active betting house.
- Operation detail shows cycles and balance summary.
- Closed operations reject new cycle creation.
- Controller can view operations across all operators.
