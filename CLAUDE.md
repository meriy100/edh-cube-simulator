# EDH Cube Simulator - Claude Code Guidelines

A Next.js app for publishing and browsing the card pool of a Magic: The Gathering EDH (Commander) cube. Admins import a pool from a CubeCobra CSV and publish one version; visitors browse commanders, normal cards, combos and out-of-game cards by color identity, with Japanese card names and texts.

> Despite the repo name, there is no draft feature in the current code.

## Tech Stack

- **Framework**: Next.js 15.4.10 (App Router, Turbopack in dev)
- **Frontend**: React 19.1.0, TypeScript, Tailwind CSS 4, lucide-react, mana-font
- **Database**: Google Cloud Firestore via Firebase Admin SDK (server side only)
- **Async jobs**: Google Cloud Pub/Sub → `edh-cube-discover-worker` (separate repo)
- **Auth**: NextAuth v5 (beta) with Google OAuth, admin allowlist
- **Validation**: zod 4
- **UI dev**: Storybook 10 (`@storybook/nextjs-vite`) + Vitest browser tests
- **Package Manager**: yarn 4.6.0
- **Node Version**: 22.18.0 (managed by Volta)

## Commands

**Always use yarn.**

```bash
yarn install          # Install dependencies
yarn dev              # Dev server (Turbopack)
yarn build            # Production build
yarn typecheck        # tsc --noEmit
yarn lint             # next lint
yarn format           # prettier --write .
yarn format:check     # prettier --check .
yarn check            # format:check + lint + typecheck
yarn storybook        # Storybook on :6006 (also serves the Storybook MCP at /mcp)
```

## Directory Structure

```
src/
├── app/
│   ├── (user)/                     # Public pages (published pool only)
│   │   ├── page.tsx                # Home: links to the four sections
│   │   ├── commanders/[c]/         # Commander cards, filtered by color identity
│   │   ├── normals/[c]/            # Normal cards
│   │   ├── combos/[c]/             # Combos that work within the pool
│   │   ├── outside/[c]/            # Out-of-game cards (tags starting with "9-")
│   │   └── cards/[id]/             # Card detail
│   ├── admin/                      # Admin UI (protected by middleware)
│   │   ├── login/
│   │   ├── cards/[id]/             # Card detail + refetch from Scryfall
│   │   └── pools/                  # Pool list / create / delete
│   │       └── [id]/               # Edit, publish, combos (unlisted, translate), compare/[targetId]
│   └── api/
│       ├── admin/pools/route.ts    # POST: CubeCobra CSV import
│       ├── pools/route.ts          # GET: pool list
│       └── auth/[...nextauth]/
├── components/
│   ├── ui/                         # Reusable UI components + stories
│   ├── cards/                      # CardImage, CardSearchForm, cardSearchParams
│   ├── combos/
│   ├── poolXCards/
│   └── pools/
├── domain/entity/                  # Card, Combo, Pool, PoolXCard, PoolXCombo + helpers
├── repository/                     # Firestore access (one file per collection)
├── lib/
│   ├── auth.ts                     # NextAuth config (admin allowlist)
│   ├── cubecobra.ts                # CubeCobra cubeJSON client + cube ID
│   ├── poolImport.ts               # importPool(): shared by API sync and CSV upload
│   ├── firebase/admin.ts           # Firebase Admin SDK init
│   ├── pubsub.ts                   # Pub/Sub publish helpers
│   └── scryfall.ts                 # Scryfall API client + schemas
└── middleware.ts                   # Guards /admin/*
```

`src/lib/firebase/config.ts` (client SDK), `src/lib/auth-minimal.ts` and `src/lib/auth-utils.ts` are not imported anywhere.

## Domain Model (Firestore)

| Collection                 | Entity       | Notes                                                                                                     |
| -------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `cards/{id}`               | `Card`       | Shared across pools. `id = uuidv5(lowercased name)` (`newCardId`). Holds `scryfall` (en) and `scryfallJa` |
| `pools/{id}`               | `Pool`       | `id` is a ULID. `status`: `processing` / `ready` / `error`. Only one pool is `published`                  |
| `pools/{id}/poolXCards/*`  | `PoolXCard`  | Card in a pool: `commander`, `outside`, `tags`                                                            |
| `combos/{id}`              | `Combo`      | From Commander Spellbook. `descriptionJa` / `notablePrerequisitesJa` after translation                    |
| `pools/{id}/poolXCombos/*` | `PoolXCombo` | Combo in a pool. `unlisted` hides it from public pages                                                    |

Japanese display prefers `scryfallJa` (see `cardNameJa`, `cardOracle`, `cardImageUrl` in `domain/entity/card.ts`).

## Pool Import Flow

1. A pool is created in one of two ways. Both turn the source into `PoolImportRow[]` and call `importPool()` in `lib/poolImport.ts`, with the next version from `nextPoolVersion()`:
   - **Sync from CubeCobra** (recommended): the "同期" button on `/admin/pools` calls `syncCubeCobraAction`, which reads the mainboard from `https://cubecobra.com/cube/api/cubeJSON/{CUBECOBRA_CUBE_ID}` (`lib/cubecobra.ts`).
   - **CubeCobra CSV upload** (`POST /api/admin/pools`): rows with `maybeboard` other than `"false"` are skipped.

   Moxfield format is not supported.

2. Tags (`;`-separated) control classification:
   - `0-commander` → `commander: true`
   - any tag starting with `9-` → `outside: true`
   - `x-edh-cube-discover:fixed-name` → name is replaced with Scryfall's English name
   - `x-edh-cube-discover:exclude-combos` → card is not sent to combo search
3. `cards` are upserted, the `pool` is created, then in `after()`: `poolXCards` are written, status becomes `ready`, and messages are published to Pub/Sub.
4. Publishing a pool (`publishPoolAction`) unpublishes the others and calls `revalidateTag("published-pool")`. Public pages cache with `unstable_cache` tagged `published-pool`.

## Worker (`../edh-cube-discover-worker`)

A Google Cloud Function triggered by Pub/Sub topic `worker-topic`. The message attribute `eventType` selects the job:

| eventType         | Sent from                                | What it does                                                                        |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `attachScryfall`  | CSV import (cards without Scryfall data) | Fetches en/ja data from Scryfall → `cards/{id}.scryfall` / `scryfallJa`             |
| `saveCombos`      | CSV import                               | Queries Commander Spellbook (≤3 colors) → `combos/*` and `pools/{id}/poolXCombos/*` |
| `translateCombos` | Admin combos page (TranslateButton)      | Translates with Vertex AI (Gemini) → `combos/{id}.descriptionJa` etc.               |

Message shapes and the `Combo` shape are duplicated by hand in both repos (zod schemas on the worker side). **When changing them, update both repos.** The worker does not report completion back to Firestore.

## Color Routes

The `[c]` segment is a color set such as `wubrgc`, `ub`, or `c` (colorless). `generateStaticParams` builds every subset from `colorPathList()` in `components/cards/cardSearchParams.ts`; `colorIn` decides whether a card's color identity matches.

## Environment Variables

| Name                                        | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `GOOGLE_APPLICATION_CREDENTIALS`            | Dev: path to a service account JSON (Firestore and Pub/Sub) |
| `GCP_SERVICE_ACCOUNT_KEY_BASE64`            | Production: Base64-encoded service account JSON             |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`           | Project ID for Pub/Sub in dev                               |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth for NextAuth                                   |
| `ADMIN_EMAILS`                              | Comma-separated allowlist for admin login                   |

## Development Guidelines

### UI Components

**Always create reusable UI components in `src/components/ui/`, each with a story at `ui/{ComponentName}.stories.tsx`.**

Stories document the component's props, visual states and variations, and interactive examples.

**When implementing UI components, use the Storybook MCP** (`.mcp.json` → `http://localhost:6006/mcp`, available while `yarn storybook` is running) to get story URLs and check components in isolation: variations, responsive behavior, interactive states and accessibility.

### Code Standards

- Use TypeScript for all new files
- **Define functions using arrow function syntax** - `const ComponentName = () => {}` instead of `function ComponentName() {}`
- **Client Component naming** - use the `.client.tsx` extension for components with the `'use client'` directive (e.g. `Button.client.tsx`)
- Use Tailwind CSS with the existing dark/light mode classes
- **Always add `cursor-pointer` to clickable elements** and `cursor-not-allowed` for disabled states
- Use React Server Components by default; mutations go through Server Actions (`actions.ts` next to the page)
- Validate external input and Firestore data with zod
- Keep Firestore access inside `src/repository/`, and domain types and helpers in `src/domain/entity/`
- Implement proper error handling with user-friendly messages

### Authentication

- Google OAuth through NextAuth; sign-in is rejected unless the email is in `ADMIN_EMAILS`
- `middleware.ts` redirects unauthenticated access to `/admin/*` to `/admin/login`
- API routes under `api/admin` check `auth()` themselves

## Quality Checks

**Before completing any implementation, run in this order:**

1. `yarn typecheck` - **MUST pass with zero errors**
2. `yarn lint` - **MUST pass with zero errors**
3. `yarn format:check` - Prettier compliance (`yarn format` to fix)

`yarn check` runs all three at once.

## Deployment

- Vercel, automatic deployment from `main`
- Environment variables are set in the Vercel dashboard
- The worker deploys separately via GitHub Actions in its own repo
