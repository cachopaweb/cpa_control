---
name: betting-house-management
description: Implement complete Firestore-backed betting house management for the CPA React/TypeScript system. Use when creating cadastro, listing, editing, activation status, validation, real-time streams, performance views, profit/ROI by house, or selection of betting houses for operations.
---

# Betting House Management

## Goal

Allow controllers to maintain betting houses and monitor each house's operational and financial performance.

## Workflow

1. Create a `bettingHouses/{bettingHouseId}` Firestore collection.
2. Include `name`, optional `website`, optional `logoUrl`, optional `notes`, `status`, `organizationId`, `createdAt`, `updatedAt`, `createdBy`.
3. Add controller-only React management UI.
4. Allow operators to select only active betting houses when creating operations.
5. Preserve existing operations if a betting house is deactivated.
6. Add filters/search for active/inactive houses.
7. Show house-level summary: operations, deposit, return, profit/loss, ROI.
8. Enforce controller-only writes in Firestore Security Rules.

## Business Rules

- Inactive betting houses cannot receive new operations.
- Existing operations remain auditable after deactivation.
- Names should be unique enough to avoid duplicate operational confusion.
- Metrics must respect the selected period and organization.

## Acceptance Checks

- Controller can create, edit and deactivate a betting house.
- Operator sees active betting houses during operation creation.
- Operator cannot create a new operation in an inactive house.
- Controller can view profit, ROI, deposits and returns by betting house.
