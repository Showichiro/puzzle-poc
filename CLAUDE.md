# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level
- `bun turbo dev` - Start both backend and frontend servers using Turbo
- `bun lint` - Lint both frontend and backend using Biome
- `bun format` - Format both frontend and backend using Biome
- Package manager: Bun (v1.2.12)

### Frontend (Tauri + React + TypeScript)
- `cd frontend && bun dev` - Start Vite dev server
- `cd frontend && bun build` - Build for production (TypeScript compile + Vite build)
- `cd frontend && bun preview` - Preview production build
- `cd frontend && bun tauri dev` - Start Tauri development mode
- `cd frontend && bun tauri build` - Build Tauri app for production

### Backend (Hono on Cloudflare Workers)
- `cd backend && bun dev` - Start Wrangler dev server
- `cd backend && bun deploy` - Deploy to Cloudflare Workers
- `cd backend && bun cf-typegen` - Generate CloudflareBindings types
- `cd backend && bun db:push` - Push database schema to production
- `cd backend && bun db:push:local` - Push database schema to local development

## Architecture Overview

This is a full-stack puzzle game application with WebAuthn authentication:

### Frontend Stack
- **Tauri**: Cross-platform desktop app framework (Rust + Web)
- **React 19**: UI framework with hooks and contexts
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TailwindCSS 4**: Styling with utility classes
- **Framer Motion**: Animations
- **Recharts**: Data visualization for game statistics

### Backend Stack
- **Hono**: Fast web framework for Cloudflare Workers
- **Cloudflare Workers**: Serverless runtime
- **Cloudflare D1**: SQLite database
- **Drizzle ORM**: Type-safe database operations
- **SimpleWebAuthn**: Passkey/WebAuthn authentication
- **Zod**: Runtime type validation

### Key Components

#### Frontend Structure
- `src/components/`: React components (GameBoard, Header, Register, etc.)
- `src/contexts/`: React contexts for state management (AnimationSpeed, HighestScore)
- `src/hooks/`: Custom React hooks (useGameBoard)
- `src/utils/`: Utility functions (gameLogic, hono-client, WebAuthn helpers)

#### Backend Structure
- `src/index.ts`: Main Hono app with WebAuthn endpoints (/register-request, /register-response, /signin-request, /signin-response)
- `src/repository/`: Data access layer (users, passkeys)
- `src/db/`: Database schema and types
- `drizzle/`: Database migrations and schema

### Authentication Flow
The app uses WebAuthn (passkeys) for authentication:
1. Registration: Generate registration options → User creates passkey → Verify and store
2. Sign-in: Generate authentication options → User uses passkey → Verify and authenticate

### Database Schema
- `users`: User accounts with unique names
- `passkeys`: WebAuthn credentials linked to users

### Development Notes
- Uses workspaces with separate frontend/backend packages
- Biome for linting and formatting (configured in biome.json)
- CORS configured for localhost:1420 (Tauri's default port)
- Environment variables needed: RP_ID, RP_NAME, ORIGIN, SECRET, DB