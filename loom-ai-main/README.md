# Loom AI

Loom AI is an AI-powered workspace platform supporting both `vanilla` HTML/JS and `react-tailwind` application stacks.

## Architecture Summary

- **Frontend (`apps/web`)**: Vite + React single page application with Tailwind CSS and CodeSandbox Sandpack integration for rendering interactive live code previews.
- **Backend (`apps/server`)**: Express API server with SQLite persistence, file upload processing, prompt orchestration, and LLM provider integration.

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` in the root directory and update configuration values:

```bash
cp .env.example .env
```

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run individual apps:

```bash
npm run dev:web
npm run dev:server
```
