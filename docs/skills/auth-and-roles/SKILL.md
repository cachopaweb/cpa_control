---
name: auth-and-roles
description: Implement Firebase Authentication, invite-based onboarding, multi-tenant organization access, and role-based authorization for the CPA React/TypeScript microSaaS. Use when building login, logout, invite acceptance links, Firebase Auth session handling, Firestore user profiles, controller/operator permissions, route guards, or Firebase Security Rules that isolate organization/operator data.
---

# Auth And Roles

## Goal

Implement secure Firebase access for a multi-tenant microSaaS with two roles: `controller` and `operator`.

## Workflow

1. Inspect the existing React architecture before adding new packages.
2. Use Firebase Authentication as the identity provider.
3. Store profile and authorization fields in Firestore at `users/{uid}`.
4. Model user profile with at least `name`, `email`, `role`, `status`, `organizationId`, `createdAt`, `updatedAt`.
5. Protect private React routes based on auth state, profile role and profile status.
6. Enforce role checks in Firestore and Storage Security Rules, not only in the UI.
7. Ensure authenticated users can only access data from their own `organizationId`.
8. Ensure operators can only access their own operations, cycles and proof files.
9. Ensure controllers can access management and review screens inside their own organization.
10. Support invite acceptance routes such as `/accept-invite?token=...`.
11. Add tests or verification for forbidden access when practical.

## Role Rules

- `controller`: full system visibility and administration.
- `operator`: limited to own operations, own cycles, and allowed profile actions.

## Invite Rules

- Controllers create invite links for users in their own organization.
- Store only a hash of the invite token.
- Invites must have status, expiration and target email.
- Invite links are single-use.
- Accepting an invite must bind the Firebase Auth user to the invited organization and role.
- Prefer Cloud Functions for `createInvite` and `acceptInvite`.

## Firebase Rules

- Read the user's role from `users/{request.auth.uid}`.
- Read the user's organization from `users/{request.auth.uid}.organizationId`.
- Treat `status != active` as blocked.
- Do not trust client-provided role fields.
- Prefer Cloud Functions for privileged account creation if direct client creation would expose administrative power.

## Acceptance Checks

- Inactive users cannot log in.
- Operators cannot read or mutate another operator's data.
- Controller-only endpoints reject operator users.
- Users cannot read or mutate data from another organization.
- Valid invite links create or complete user access in the target organization.
- Expired, revoked or accepted invites cannot be used.
- Unauthorized requests return a clear 401 or 403 response.
