# Puzzle POC

A frontend-only puzzle game built with React, TypeScript, Vite and Tailwind CSS.
No backend, accounts, database or API configuration is required.
Stage history (the last 10 games) and the highest cleared stage are stored in
this browser's localStorage. Existing browser records are preserved using the
keys stageHistory and highestStageCleared. Online rankings and account-based
score submission have been removed.

## Development

Install Bun matching packageManager in package.json and Node.js 22.12+ (or a
current LTS version).

~~~sh
bun install --frozen-lockfile
bun dev
~~~

Open http://localhost:1420/puzzle-poc/.

~~~sh
bun test
bun build
bun preview
bun lint
bun format
~~~

The static production output is frontend/dist. The GitHub Pages workflow deploys
this directory under /puzzle-poc/ without API secrets.

## Source layout

Components live in frontend/src/components. GameSession in frontend/src/game owns
cell selection, turns, stage transitions and cancellable animation tasks.
frontend/src/hooks/useGameBoard.ts connects the session to React with
useSyncExternalStore. UI components send actions instead of setting game state.

Pure scoring and stage rules live in frontend/src/utils/gameRules.ts; board
operations live in frontend/src/utils/gameLogic.ts. Both accept a random source
for reproducible tests. frontend/src/utils/gameRecords.ts validates browser
records and preserves the existing storage keys. Contexts manage animation speed
and the highest cleared stage, which is updated on each stage clear.

A completed turn checks stage clear before game over. Invalid swaps consume
neither moves nor card turns and block input until rollback. Card effects last
for three valid swaps and carry over between stages. Reset and unmount cancel
pending animation tasks. A stuck board still resets the game, as before.

Run the regression suite with bun test (or npm test). It uses Node's built-in
test runner, seeded randomness and fake timers without additional dependencies.
The documents under docs are historical plans for the removed server features.
