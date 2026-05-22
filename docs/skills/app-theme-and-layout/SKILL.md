---
name: app-theme-and-layout
description: Implement React UI layout, design system, responsive usability, and light/dark themes for the CPA app. Use when building screens inspired by https://nexcpa.com.br/ and docs/imagens screenshots, app navigation, dashboards, cards, tables, forms, CSS theme tokens, user theme settings, or visual consistency across desktop/mobile web.
---

# App Theme And Layout

## Goal

Build a React interface inspired by the usability and operational layout of `https://nexcpa.com.br/` and the local screenshots in `docs/imagens`, with a complete light/dark theme system and the app's own visual identity.

## Reference Rule

Before implementing final UI screens, review the NEX CPA reference manually when accessible and inspect the local screenshots in `docs/imagens`.

Use these local references:

- `dashboard.jpeg`
- `acompanhamento.jpeg`
- `acompanhamento_operacoes.jpeg`
- `operadores.jpeg`
- `operadores-equipe.jpeg`
- `historico.jpeg`
- `timeline.jpeg`
- `folha-pagamento.jpeg`
- `notificacao.jpeg`
- `configuracoes.jpeg`

Map the relevant patterns:

- Dashboard organization.
- Navigation structure.
- List/detail workflows.
- Creation flows for operations and cycles.
- Visual density and action placement.
- Mobile and desktop behavior.

Use the reference for product ergonomics. Do not copy proprietary logo, brand, text, images, or exact visual assets.

## React Theme Workflow

1. Create centralized theme files under `src/app/theme`.
2. Define light and dark tokens using CSS variables or the selected styling system.
3. Respect system theme by default.
4. Add user-controlled theme mode: `system`, `light`, `dark`.
5. Persist theme mode locally and optionally in `users/{uid}.settings.themeMode`.
6. Apply theme tokens to cards, forms, tables, buttons, navigation, chips and status indicators.
7. Test key screens in both themes.

## Layout Principles

- Build the actual operational app, not a marketing landing page.
- Prioritize dense, scannable dashboards for controller users.
- Prioritize fast creation flows for operator users.
- Keep primary actions visible and easy to reach.
- Use responsive layouts for mobile and desktop.
- Avoid nested cards and decorative excess.
- Keep tables/lists readable with filters, status chips and financial summaries.

## Required Screens To Align

- Login.
- Controller dashboard.
- Operator dashboard.
- Operators list and detail.
- Betting houses list.
- Operations list and detail.
- Cycle creation with proof upload.
- Cycle review.
- Settings with theme selector.

## Acceptance Checks

- App supports light, dark and system theme modes.
- Theme preference survives app restart.
- All main screens remain readable in both themes.
- Dashboard and list screens are fast to scan.
- UI is inspired by NEX CPA screenshots/usability while keeping distinct branding.
