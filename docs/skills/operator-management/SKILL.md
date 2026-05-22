---
name: operator-management
description: Implement Firestore and Firebase Auth operator management with invite links for the CPA React/TypeScript microSaaS. Use when creating controller features to invite, create, edit, activate, deactivate, list, filter, or inspect operator users and their betting activity inside an organization.
---

# Operator Management

## Goal

Allow the controller to manage operator accounts in the current organization through Firebase Auth/Firestore invite links and monitor operator activity.

## Workflow

1. Reuse the `users/{uid}` Firestore profile from authentication.
2. Add controller-only React screens for operator management.
3. Support invite by link, edit, activate, deactivate, list and detail views.
4. Use Cloud Functions or a controlled admin flow for invite generation and acceptance.
5. Store invited users with `organizationId` and role after invite acceptance.
6. Prevent deletion when historical operations or cycles exist; prefer deactivation.
7. Show useful operational summary: open operations, total cycles, current balance, profit/loss.
8. Log sensitive changes such as invite creation, status, role and email updates.
9. Enforce organization access in Firestore Security Rules.

## Business Rules

- Only controllers manage operators.
- Operators cannot change their own role or active status.
- Controllers can invite users only into their own organization.
- Invite links expire and are single-use.
- Deactivated operators keep historical data visible to controllers.

## Acceptance Checks

- Controller can generate an invite link for an operator.
- Invited operator can accept the link, create/login with Firebase Auth and enter the correct organization.
- Controller can deactivate an operator and block future login.
- Existing cycles remain linked to deactivated operators.
