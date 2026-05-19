# Mia Click-Through Demo

Standalone React/Vite demo for the Project Mia Dynamics 365 implementation walkthrough.

Live site: <https://blue-wave-088081810.7.azurestaticapps.net/?demo=true>

## What this repo contains

- **Main Mia home page** with Dynamics 365 Finance and Supply Chain cards.
- **Finance path** that opens the Mia dashboard with every wave released, no human-intervention item, and an **Add Wave** popup for adding an Atlanta DC SCM follow-on wave.
- **Supply Chain path** that opens the Mia dashboard focused on Inventory to Deliver with one assigned human-intervention item.
- **SCM decision app** under `/SCM/decision` for the DC-Atlanta warehouse approval click-through.
- **Static Web Apps route config** in `public/staticwebapp.config.json`.

The app is a static demo. It does not require Dataverse, F&O, Power Apps, or any backend service to run the click-through.

## Key URLs

| URL | Purpose |
| --- | --- |
| `/?demo=true` | Main home page with Finance and Supply Chain cards |
| `/SCM?from=mia&task=warehouse&assigned=decision#/dashboard` | SCM dashboard-style experience with one pending intervention |
| `/SCM/decision?from=mia&task=warehouse&assigned=decision` | Full SCM human-decision click-through |
| `/SCM/dashboard?run=cutover` | Static SCM cutover tracker page |

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/?demo=true
```

## Build and test

```bash
npm run build
npm run test:demo
```

`test:demo` is the maintained smoke-test set for the shareable static demo routes and state seeding.

## Deploy to Azure Static Web Apps

```bash
npm run build
npx @azure/static-web-apps-cli deploy ./dist --env production --deployment-token "<deployment-token>"
```

## How it works

See [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) for the end-to-end flow, localStorage state, route handling, and source-file map.
