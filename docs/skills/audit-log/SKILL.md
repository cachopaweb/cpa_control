---
name: audit-log
description: Implement Firestore audit logging for the CPA React/TypeScript betting operations system. Use when tracking sensitive changes to users, operators, betting houses, operations, cycles, Firebase Storage proof images, financial values, statuses, or permissions.
---

# Audit Log

## Goal

Record important system changes so financial and operational history can be reviewed.

## Workflow

1. Add an `auditLogs/{auditLogId}` Firestore document with actor, entity type, entity id, action, before data, after data and timestamp.
2. Log changes close to the business action; prefer Cloud Functions for privileged or tamper-sensitive logs.
3. Avoid logging raw passwords, secrets or large binary data.
4. Capture financial changes, status changes, proof changes and permission changes.
5. Provide a controller-only React audit view with filters.
6. Keep audit entries append-only.

## Events To Log

- Operator created, edited, activated or deactivated.
- Betting house created, edited or deactivated.
- Operation created, paused, resumed or closed.
- Cycle created or updated.
- Cycle financial values changed.
- Proof image uploaded, replaced or removed.
- User role or status changed.

## Acceptance Checks

- Sensitive changes create audit records.
- Operators cannot view organization audit logs.
- Audit entries do not expose password hashes or secrets.
- Controller can filter logs by user, entity and date.
