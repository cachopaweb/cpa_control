---
name: goals-and-progress
description: Implement goals and progress tracking for the CPA React/TypeScript microSaaS. Use when building financial or operational targets, goal CRUD, progress cards, progress bars, period-based goal calculations, profit/ROI/deposit/return goals, or dashboards that show target versus current performance.
---

# Goals And Progress

## Goal

Allow controllers to define and track financial or operational goals with a clear progress view.

## Workflow

1. Create a `goals/{goalId}` Firestore collection.
2. Link every goal to `organizationId`.
3. Support goal scopes: `organization`, `operator`, `betting_house`.
4. Support metrics: `profit`, `roi`, `deposit`, `return`, `cycles`, `operations`.
5. Store `targetValue`, `currentValue`, `progressPercent`, `periodStart`, `periodEnd`, `status`.
6. Calculate progress from Firestore data using the selected period and scope.
7. Use summary documents or Cloud Functions if real-time aggregation becomes expensive.
8. Show visual progress with cards, bars, status labels and period filters.

## Business Rules

- Only controllers create, edit, cancel or complete goals.
- Operators may view only goals assigned to them or visible to the organization.
- Goal progress must respect organization boundaries.
- Goals should not be deleted when history matters; prefer `canceled` status.
- Completed and missed goals remain visible in history.

## Acceptance Checks

- Controller can create a profit goal for a period.
- Controller can create ROI, deposit or return goals.
- Goal view shows target value, current value, progress percentage and status.
- Progress changes when period-filtered financial data changes.
- Users cannot access goals from another organization.
