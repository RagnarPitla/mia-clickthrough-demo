# How the Mia click-through demo works

This repo is a self-contained static web app used to demo Project Mia. It lets a user start from a clean home page and choose either a Finance walkthrough or a Supply Chain walkthrough without requiring live Dataverse or F&O calls.

## User-facing flow

```text
Main home page
  |
  |-- Dynamics 365 Finance
  |     -> Mia dashboard
  |     -> all waves released
  |     -> no human-intervention item
  |     -> Add Wave popup appears
  |     -> "Implement SCM" creates an Atlanta DC warehouse wave
  |
  |-- Dynamics 365 Supply Chain
        -> Mia dashboard at /SCM?...#/dashboard
        -> Inventory to Deliver selected
        -> all waves released
        -> one "Open human intervention" item
        -> intervention opens /SCM/decision?...
```

## Main routes

| Route | What it renders |
| --- | --- |
| `/?demo=true` | Home page with Finance, Supply Chain, and other demo cards |
| `#/dashboard` | React dashboard route used by the Mia console |
| `/SCM?from=mia&task=warehouse&assigned=decision#/dashboard` | Same React dashboard, but seeded into the SCM pending-decision state |
| `/SCM/decision?from=mia&task=warehouse&assigned=decision` | Standalone SCM human-decision app from `public/SCM/index.html` |
| `/SCM/dashboard?run=cutover` | Standalone SCM cutover tracker from `public/SCM/dashboard.html` |

Azure Static Web Apps uses `public/staticwebapp.config.json` to route `/SCM` back to the React app and `/SCM/decision` to the standalone SCM decision page.

## State model

The demo is driven by localStorage so it can run as a plain static site.

| Key | Purpose |
| --- | --- |
| `kazuki-demo-mode` | Enables demo mode after `?demo=true` is used |
| `kazuki-project` | Selects the seeded Mia project |
| `kazuki-wave` | Selects the current wave, usually `mia-wave-inventory-to-deliver` for SCM |
| `mia-playback-step` | Stores released waves as comma-delimited indexes, for example `0,1,2,...` |
| `mia-finance-scm-wave` | Stores the Finance-added SCM follow-on wave |
| `mia-scm-pending-intervention` | Marks the SCM path as having one pending human decision |
| `mia-license-plate-decision` | Set to `complete` when the decision is resolved |

## Finance behavior

When the user clicks **Dynamics 365 Finance** on the home page:

1. `WelcomePage.tsx` selects the Mia demo project.
2. It stores all wave indexes in `mia-playback-step`.
3. It sets `mia-license-plate-decision` to `complete`.
4. It clears `mia-scm-pending-intervention`.
5. It clears any prior Finance-added SCM follow-on wave.
6. It navigates to `#/dashboard`.

Result: the dashboard appears fully released and clean, with no pending intervention callout.

After the Finance dashboard is fully released, the wave sidebar shows **+ Add Wave**. Clicking it opens a popup. If the user enters:

```text
Implement SCM
```

the app stores a new Finance-added wave in `mia-finance-scm-wave` and adds:

- wave: `6.1 Implement SCM - Atlanta DC Warehouse`;
- warehouse task: `Create Warehouse Atlanta DC (ATL-01)`;
- related setup tasks for zones, bin locations, location profiles, and docks.

This is intentionally Finance-only: the Add Wave popup is hidden on `/SCM?...#/dashboard`, so the SCM demo keeps its single pending intervention behavior.

## Supply Chain behavior

When the user clicks **Dynamics 365 Supply Chain** on the home page:

1. `WelcomePage.tsx` selects the Mia demo project.
2. It stores all wave indexes in `mia-playback-step`.
3. It selects `mia-wave-inventory-to-deliver`.
4. It clears `mia-license-plate-decision`.
5. It sets `mia-scm-pending-intervention` to `true`.
6. It opens `/SCM?from=mia&task=warehouse&assigned=decision#/dashboard`.

When that URL loads directly, `demoBootstrap.ts` recognizes the SCM dashboard request and seeds the same state. This makes the route work from a fresh browser tab, not only after clicking the card.

Result: the dashboard appears released, but the Inventory to Deliver wave shows one assigned human-intervention item.

## Human-intervention behavior

The pending SCM intervention is produced in `miaDemoData.ts`:

- the task `mia-wave-inventory-to-deliver-task-2` becomes `InProgress`;
- `awaitingUser` is set to `true`;
- `TaskNode.tsx` and `TaskList.tsx` render the orange **Open human intervention** link;
- `WaveSelector.tsx` renders the blinking user icon on the Inventory to Deliver wave.

Those links go to:

```text
/SCM/decision?from=mia&task=warehouse&assigned=decision
```

The standalone SCM decision app then walks through the DC-Atlanta warehouse scenario.

## Important source files

| File | Responsibility |
| --- | --- |
| `src/pages/WelcomePage.tsx` | Handles home-card clicks and seeds Finance vs SCM state |
| `src/services/demoBootstrap.ts` | Enables demo mode and seeds direct SCM dashboard URLs |
| `src/services/miaDemoData.ts` | Seeded projects, waves, tasks, localStorage keys, and pending-intervention logic |
| `src/components/DashboardContent.tsx` | Finance-only Add Wave state and Atlanta DC wave/task creation |
| `src/components/WaveSelector.tsx` | Left-rail wave cards, Add Wave popup trigger, and SCM user icon |
| `src/components/TaskNode.tsx` | Graph node rendering and intervention button |
| `src/components/TaskList.tsx` | List view rendering and intervention button |
| `public/SCM/index.html` | Standalone SCM decision click-through |
| `public/SCM/scm-script.js` | SCM decision state machine |
| `public/SCM/dashboard.html` | Static SCM cutover tracker |
| `public/staticwebapp.config.json` | Azure Static Web Apps route rewrites |

## Deployment notes

The live demo is hosted on Azure Static Web Apps:

```text
https://blue-wave-088081810.7.azurestaticapps.net/?demo=true
```

The app can be deployed to any static host after `npm run build`. Azure Static Web Apps is preferred because `staticwebapp.config.json` preserves the `/SCM`, `/SCM/decision`, and `/SCM/dashboard` routes.
