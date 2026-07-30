# Loom AI — Project Brief

**Theme:** Intelligent Automation
**Team size:** 4 | **Build time:** 4 days

## What It Is
Loom AI is an AI-powered frontend development assistant that generates, explains, and debugs frontend projects in real time — supporting both **Vanilla HTML/CSS/JS** and **React + Tailwind CSS** — built specifically for students and beginner developers, not professional engineers.

## The Problem
Students and beginner frontend developers lose hours to boilerplate website building, debugging invisible layout/script/component errors, and understanding unfamiliar code — whether it's a plain HTML page or a React component. Existing tools don't fit:
- ChatGPT/Claude.ai — no live preview, no persistent project context
- Cursor/Windsurf — built for professional engineers, assumes prior knowledge
- Lovable/v0 — optimized for shipping fast, not for teaching *why*
- Almost nothing exists that's beginner-first for React specifically

## The Solution
A focused web app where a user picks a stack — **Vanilla** or **React + Tailwind** — then either **generates a project from a prompt** or **uploads an existing one**, and:
1. Sees it live in a sandboxed preview (iframe for Vanilla, in-browser bundler sandbox for React + Tailwind)
2. Asks the AI to explain any part of the code in beginner-friendly language
3. Asks the AI to find, explain, and fix bugs
4. Iterates conversationally
5. Downloads the finished project as a `.zip`

Strictly scoped to frontend (HTML/CSS/JS and React/Tailwind) — not a general chatbot. A Router Agent gates every message and rejects anything off-topic before it reaches the generation pipeline.

## How It Works (Architecture)
```
User → picks stack (Vanilla / React + Tailwind)
     → Router Agent (intent: generate/edit/explain/debug/off_topic)
           │
           ├── off_topic → fixed redirect, pipeline never runs
           │
           ▼
      Builder Agent (writes/edits code for the active stack only)
           │
           ▼
      Reviewer Agent (checks quality, stack-aware, 1 retry max)
           │
           ▼
      Live Preview (iframe sandbox / bundler sandbox) + Download (.zip)
```

| Agent | Model | Role |
|---|---|---|
| Router | Qwen 2.5 3B Instruct | Classify intent, detect/carry active stack, gate off-topic requests |
| Builder | Qwen 2.5 Coder 7B | Generate/edit Vanilla HTML/CSS/JS **or** React JSX + Tailwind |
| Reviewer | Llama 3.1 8B | Catch bugs, enforce quality per active stack, one repair loop |
| Brain (future) | Qwen 3 8B | Planning/reasoning — stubbed, not in MVP path |

Orchestration: **LangGraph**. Providers: **OpenRouter / Groq / Gemini API** with automatic fallback. React live preview uses a proven in-browser bundling/sandbox library (e.g., Sandpack) rather than a custom-built bundler.

## Tech Stack
- **Frontend (app itself):** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** SQLite (session/project state + active stack, no user accounts)
- **Generated-project stacks supported:** Vanilla (HTML/CSS/JS) and React + Tailwind
- **Deployment:** Vercel (frontend), Render/Railway (backend)

## MVP Feature List
1. AI project generation from a prompt, in either Vanilla or React + Tailwind
2. Upload an existing project in either supported stack (auto-detected)
3. Live, sandboxed preview for both stacks
4. Beginner-friendly code explanations, stack-aware
5. Bug detection, explanation, and auto-fix, stack-aware
6. Conversational follow-up edits
7. Download final project as `.zip`, correct layout per stack

**Explicitly out of scope for MVP:** accounts/auth, multi-page/multi-route apps, billing, team collaboration, any framework beyond Vanilla and React + Tailwind (Vue, Svelte, Next.js, TypeScript are Future Scope).
**Stretch (if time remains):** responsive suggestions, accessibility audit, Vanilla → React + Tailwind migration assistant.

## Why This Wins
Not another ChatGPT, Cursor, or Lovable — Loom AI is the only tool purpose-built around the beginner frontend learning loop across **both** classic fundamentals and the modern stack most jobs actually use: **generate → preview → understand → debug → improve**, powered by a cost-efficient, stack-aware multi-agent pipeline instead of one expensive general model.

## Demo Flow (4 minutes)
1. Pick Vanilla → prompt → live site generates (~10–15s)
2. Pick React + Tailwind → prompt → live app bundles and renders
3. Ask for an explanation of a Tailwind-styled section
4. Trigger debug on the React project → bug found, explained, fixed live
5. Ask for a conversational edit
6. Download both project `.zip`s
7. Close on the multi-agent, dual-stack architecture diagram

---
*Full detail: see `SPEC.md` (product) and `CLAUDE.md` (engineering rules).*
