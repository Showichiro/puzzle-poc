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
bun build
bun preview
bun lint
bun format
~~~

The static production output is frontend/dist. The GitHub Pages workflow deploys
this directory under /puzzle-poc/ without API secrets.

## Source layout

Components live in frontend/src/components, game state in
frontend/src/hooks/useGameBoard.ts and game rules in frontend/src/utils/gameLogic.ts.
Contexts manage animation speed and the highest cleared stage.
The documents under docs are historical plans for the removed server features.
