# Feuerwehr App

Tool for working with data of the local fire department. The home screen shows tiles; each tile opens a topic.

## Topic "Einsätze"

Yearly data files live in `src/features/einsaetze/data/<year>.txt`, one operation per line:

```
DD.MM.YYYY hh:mm Uhr; Description
```

Keyword filter (any keyword, case-insensitive) applies to both tools: a timeframe list and a distribution chart (hour/weekday/month/year).

## Scripts

- `yarn dev` – start dev server
- `yarn build` – typecheck and build
- `yarn lint` – oxlint
- `yarn format` / `yarn format:check` – Prettier
- `yarn test` – Vitest

## Adding a topic

Create a feature in `src/features/<topic>` and register it in `src/sections.ts`.
