---
name: proof-image-capture
description: Implement proof image capture and Firebase Storage integration for CPA React/TypeScript betting cycles. Use when building file inputs, camera capture, upload, screenshot attachment, Firebase Storage paths, Firestore metadata, preview, validation, or image proof requirements for cycles.
---

# Proof Image Capture

## Goal

Ensure each cycle has a reliable visual proof, such as a screenshot, uploaded image or camera photo, stored in Firebase Storage with Firestore metadata.

## Workflow

1. Reuse the project's React Firebase service/repository pattern if one exists.
2. Use browser file inputs and mobile capture attributes, or an established local package if needed.
3. Store files in Firebase Storage under `cycle-proofs/{operatorId}/{operationId}/{cycleId}/{proofId}.{ext}`.
4. Support common image formats such as JPEG, PNG and WebP.
5. Validate file size, MIME type and presence before upload and in Storage Rules where possible.
6. Store metadata in Firestore `cycleProofs`: storage path, file name, MIME type, size, uploader and timestamps.
7. Show preview before submission when implementing UI.
8. Keep proof access protected by the same permissions as the cycle.
9. Consider multiple proofs per cycle from the beginning, even if the MVP requires only one.

## UX Rules

- Mobile users should be able to take a photo directly.
- Desktop users should be able to upload screenshots.
- Failed uploads should show clear recovery options.

## Firebase Rules

- Operator can upload only when `operatorId == request.auth.uid`.
- Controller can read all proof metadata and files.
- Non-image files must be rejected.
- Keep Storage and Firestore permissions aligned.

## Acceptance Checks

- A cycle cannot be finalized without a valid image.
- Invalid file types are rejected.
- Operators cannot access proof images from other operators.
- Controller can view all proof images during review.
