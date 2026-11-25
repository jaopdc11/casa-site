# casa-site

Web app (PWA) for the smart home. Lives at `https://casa.jaopd.dev` and talks to the
[casa](../../casa) API (`https://casa.api.jaopd.dev`). Same stack and design system as the
Orçamento site.

Stack: React 18, Vite 5, TypeScript, Tailwind CSS 3.3.2, vite-plugin-pwa, pnpm.

## Screens

- **Login**: e-mail, then a 6-digit code (cookie session, same flow as Orçamento).
- **Início**: one card per root device (today the bedroom light). Power, brightness, white
  temperature (warm to cold) or color (named palette plus any hex), preset chips. Optimistic UI
  with rollback; live state over SSE.
- **Horários**: weekly and one-off schedules; pause/resume inline; create, edit and delete in a
  bottom sheet.
- **Presets**: saved looks with a color preview; apply, create, delete.
- **Histórico**: event log grouped by day, by origin (app, WhatsApp/Argos, schedule, Smart Life).
- **Ajustes**: theme (system, light, dark), account, sign out.

## Development

```sh
pnpm install
cp .env.example .env   # point VITE_API_URL at a local API if needed
pnpm dev
```

Without `VITE_API_URL` the build uses `https://casa.api.jaopd.dev`. The API must list the dev
origin in `CASA_ORIGENS` for cookie writes to work.

Checks: `pnpm typecheck && pnpm build`.

## Layout

```
src/
  design/      design system components (see DESIGN.md)
  lib/         api client, SSE (eventos.ts), shared store (casa.tsx), types, colors, dates, theme
  shell/       navigation: bottom nav, sidebar, top bar, settings
  features/
    auth/      login and session
    luz/       home screen, light card, command hook, color pickers
    horarios/  schedules
    presets/   presets
    historico/ event log
```

API contract: `casa/docs/APP.md`.

## Icons

`python3 scripts/gerar-icones.py` (needs Pillow) regenerates `public/icon-*.png`,
`apple-touch-icon.png` and `favicon.svg` from code.

## Deploy

`pnpm deploy` builds and publishes `dist/` to the `gh-pages` branch. `public/CNAME` holds
`casa.jaopd.dev`.
