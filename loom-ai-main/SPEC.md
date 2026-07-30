
 # Loom AI — Product Specification

## Project Name
Loom AI

## One-line Description
Loom AI is an AI-powered frontend development assistant that generates, explains, and debugs HTML, CSS, JavaScript, React, and Tailwind CSS projects in real time — built for students and beginner developers, not professional engineers.

## Problem
Students and beginner frontend developers spend hours writing boilerplate websites, debugging broken layouts and scripts, and trying to understand codebases they didn't write — whether that's a plain HTML/CSS/JS page or a React + Tailwind component. Existing AI coding tools don't solve this well:

- **Generic assistants** (ChatGPT, Claude.ai) can write code but provide no live preview, no project context, and no structured learning path.
- **Professional AI IDEs** (Cursor, Windsurf) are built for experienced engineers working in large codebases — overkill and intimidating for beginners.
- **No-code/low-code builders** (Lovable, v0) optimize for shipping fast, not for teaching *why* the code works.
- **Cost** — most powerful coding assistants are subscription-gated, putting them out of reach for students.

There is no tool built specifically around the beginner frontend learning loop — across both classic web fundamentals and modern component-based development: **generate → preview → understand → debug → improve.**

## Target Users

**Primary:**
- College students learning web development
- Coding bootcamp learners
- Beginner frontend developers building portfolio/practice projects, in either plain HTML/CSS/JS or React + Tailwind

**Secondary:**
- Freelancers who need quick frontend scaffolding
- Frontend developers who want fast prototyping with built-in review

## Why This Problem Matters
Frontend development is usually the first real coding experience for new developers, and it's where most learners get stuck — not because the concepts are hard, but because errors are often invisible (a missing closing div, a CSS specificity conflict, a JS scope bug, a broken React prop, a misapplied Tailwind class) and existing tools either write the fix silently (no learning) or explain in overly technical language (no comprehension). A tool that automates the busywork *while* teaching the underlying concept — for both fundamentals (HTML/CSS/JS) and the modern stack most jobs actually use (React + Tailwind) — directly addresses the biggest friction point in early frontend education.

## Current Solution (Status Quo)
- Students paste code into ChatGPT/Claude.ai — no live preview, no persistent project context, must re-explain the project every session.
- Students use browser DevTools + Stack Overflow — slow, discouraging, no guided explanation.
- Students use Cursor/Copilot — built for professionals, assumes prior knowledge, no explicit "explain like I'm learning" mode.
- Students learning React have almost no beginner-first tool that explains *and* live-previews component-based code the way they can with plain HTML.

## Our Solution
Loom AI is a focused web application where a user either **generates a new website from a prompt** or **uploads an existing project**, in one of two supported stacks:

- **Vanilla:** `index.html` + `style.css` + `script.js`
- **React + Tailwind:** a component-based project (`App.jsx`, supporting components, `tailwind.config.js`)

The user then:
1. Sees it rendered instantly in a live preview pane (sandboxed for vanilla, sandboxed in-browser bundler for React + Tailwind).
2. Can ask the AI to explain any part of the code — HTML, CSS, JS, JSX, or Tailwind utility classes — in beginner-friendly language.
3. Can ask the AI to find and fix bugs, with an explanation of what was wrong and why the fix works, in whichever stack the project uses.
4. Can iterate conversationally ("make the navbar sticky", "convert this button to a reusable React component", "why isn't my Tailwind class applying?").
5. Can download the final project as a ready-to-use folder.

Under the hood, a multi-agent pipeline (Router → Builder → Reviewer) orchestrates specialized, cost-efficient open models instead of one expensive general-purpose model, keeping the product fast and cheap to run — regardless of which of the two supported stacks the user is working in.

## Core Flow

```
User opens Loom AI
        │
        ▼
Chooses: [Generate Website]  or  [Upload Project]
        │
        ▼
Chooses stack: [Vanilla HTML/CSS/JS]  or  [React + Tailwind]
        │
        ▼
Router Agent classifies intent
(generate / explain / debug / edit / off_topic)
        │
        ├── off_topic ──▶ Fixed on-brand reply returned
        │                 ("I'm focused on frontend dev —
        │                  try asking me to build, explain,
        │                  or fix a website.")
        │                 No Builder/Reviewer call made.
        │
        ▼ (all other intents)
Builder Agent produces or modifies code
in the project's active stack
        │
        ▼
Reviewer Agent checks output for bugs/quality
        │
        ▼
Live Preview updates
(iframe sandbox for Vanilla, in-browser
bundler sandbox for React + Tailwind)
        │
        ▼
User asks for explanation or further debugging
(loops back to Router Agent)
        │
        ▼
User downloads final project as a .zip
```

## Features

### MVP (must ship in 4 days)
1. **AI Website Generation** — prompt → full project, rendered live, in either Vanilla HTML/CSS/JS or React + Tailwind (user picks the stack up front).
2. **Upload Existing Project** — accepts either a Vanilla project (`index.html`, `style.css`, `script.js`) or a React + Tailwind project (`App.jsx` + components + `tailwind.config.js`); the system detects and loads the correct stack.
3. **Live Preview** — Vanilla projects render via a sandboxed iframe; React + Tailwind projects render via an in-browser bundler (sandboxed), updating on every AI edit.
4. **Explain Code** — chat-based, beginner-friendly explanations of selected code or whole files, aware of whichever stack (HTML/CSS/JS or JSX/Tailwind) the project uses.
5. **Debug Code** — detects bugs, explains the root cause in plain language, proposes and applies a fix — in either stack.
6. **Download Project** — exports current project state as a `.zip` with the correct file structure for its stack.
7. **Chat-driven iteration** — conversational follow-up edits ("make the button blue", "turn this into a reusable component", "add a Tailwind hover state").

### Explicit Non-Goals for MVP
- User accounts / auth / saved project history across sessions (session-only state is fine)
- Multi-page/multi-route generation (single-page apps/sites only, in either stack)
- Payment/billing
- Team collaboration
- Any language/framework beyond the two supported stacks (see Future Scope)

### Stretch Goals (only if time remains)
- Responsive design suggestions (mobile breakpoint checks) — both stacks
- Basic accessibility audit (alt text, contrast, semantic tags) — both stacks
- Converting a Vanilla project into React + Tailwind (stack migration assistant)
- Component-splitting suggestions for large React files

### Future Scope (post-hackathon)
- Additional frameworks/languages: Vue, Svelte, Next.js, TypeScript
- Performance optimization pass (Lighthouse-style scoring)
- Persistent user accounts and project history
- Real-time collaborative editing
- Plugin-style "lesson mode" tied to a curriculum

## Technology Stack

**Frontend (the Loom AI app itself)**
- React + Vite
- Tailwind CSS
- Live preview split by generated-project stack:
  - **Vanilla:** sandboxed `<iframe>` via `srcDoc` — no eval, no direct DOM injection into the parent app
  - **React + Tailwind:** an in-browser bundling sandbox (e.g., Sandpack by CodeSandbox) so generated JSX + Tailwind can be transpiled and rendered live, fully isolated from the parent app

**Backend**
- Node.js + Express.js
- LangGraph for agent orchestration
- SQLite for MVP persistence (ephemeral session/project storage only — no user accounts). Rationale: zero-config, file-based, sufficient for a 4-day scope with a single small server instance. Revisit for Postgres only if multi-user concurrency becomes a real requirement post-hackathon.

**Supported Generated-Project Stacks (what Loom AI can build/edit for the user)**
- Vanilla: HTML, CSS, JavaScript
- React + Tailwind CSS

**AI Layer**
- Router Agent: Qwen 2.5 3B Instruct
- Builder Agent: Qwen 2.5 Coder 7B — prompted per active stack (Vanilla vs. React + Tailwind), never mixes syntax between them in one project
- Reviewer Agent: Llama 3.1 8B — validates against the conventions of whichever stack is active (valid JSX/hooks usage for React, valid Tailwind class names, valid vanilla HTML/CSS/JS)
- Brain Agent (Qwen 3 8B): stubbed interface only, not wired into MVP critical path
- Provider routing across OpenRouter / Groq / Gemini API, selected by whichever has lowest latency/cost for the given model at request time

**Deployment**
- Frontend: Vercel
- Backend: Render or Railway

## Architecture Overview

```
┌─────────────────────────────┐
│         React + Vite        │
│  (Chat UI, Upload, Preview) │
│  Preview renders either:    │
│   - iframe srcDoc (Vanilla) │
│   - bundler sandbox (React) │
└──────────────┬──────────────┘
               │ REST (JSON) + SSE for streaming
               ▼
┌─────────────────────────────┐
│      Express.js Backend     │
│  /api/generate  {stack}      │
│  /api/upload                 │
│  /api/chat (explain/debug/edit)
│  /api/download                │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      LangGraph Orchestrator │
│                              │
│  Router Agent → Builder     │
│  (stack-aware) → Reviewer   │
│  (stack-aware) → (loop back │
│  to Router on follow-up)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   AI Provider Layer          │
│  OpenRouter / Groq / Gemini  │
└─────────────────────────────┘
               │
               ▼
┌─────────────────────────────┐
│   SQLite (session/project    │
│   state + active stack,      │
│   chat history)              │
└─────────────────────────────┘
```

## AI Workflow

1. **Router Agent** (Qwen 2.5 3B Instruct) receives the raw user message, the project's active stack (`vanilla` or `react-tailwind`), and current project state summary. Classifies intent into one of: `generate`, `edit`, `explain`, `debug`, `off_topic`. Outputs a structured JSON decision (`{ intent, stack, target_files, notes }`).
   - **`off_topic` is a hard gate, not a fallback style.** Any message unrelated to generating, editing, explaining, or debugging frontend code in one of the two supported stacks is classified `off_topic`. This is what keeps Loom AI from behaving like a general-purpose chatbot.
   - When `off_topic` is returned, the backend **never calls Builder or Reviewer**. It immediately returns a fixed, on-brand redirect message (e.g., *"I'm focused on frontend development — try asking me to build a site, explain some code, or fix a bug."*) and the conversation loop returns control to the user without touching the AI generation pipeline.
2. **Builder Agent** (Qwen 2.5 Coder 7B) receives the intent, active stack, and current file contents (if editing), and produces new/modified code for that stack only:
   - `vanilla`: complete `index.html` / `style.css` / `script.js` contents.
   - `react-tailwind`: complete `.jsx` component file(s) using Tailwind utility classes, plus any config changes needed (e.g., `tailwind.config.js`).
   Always outputs complete, valid file contents per file — never partial diffs the frontend has to reconstruct, and never mixes stacks within one project.
3. **Reviewer Agent** (Llama 3.1 8B) receives Builder's output, checks for syntax errors, obviously broken markup/CSS/JS or JSX/Tailwind usage, and unmet requirements from the user prompt. Returns either an approval or a structured list of issues sent back to Builder for one repair pass (max 1 retry loop in MVP to bound latency/cost).
4. Approved output is written to project state, returned to frontend, and the Live Preview updates (iframe reload for Vanilla, bundler re-render for React + Tailwind).
5. For `explain` and `debug` intents, the Router routes directly to a lightweight, stack-aware explanation prompt against the Builder or Reviewer model (whichever is already warm/cheaper) rather than invoking the full generate pipeline.

## Definition of Done (MVP)
- [ ] User can pick a stack (Vanilla or React + Tailwind) and enter a prompt, receiving a rendered, working project within ~15–20 seconds
- [ ] User can upload a Vanilla project (`index.html`/`style.css`/`script.js`) and see it rendered in Live Preview
- [ ] User can upload a React + Tailwind project and see it rendered in Live Preview via the in-browser bundler sandbox
- [ ] User can select or reference code and receive a beginner-friendly explanation via chat, correct for the project's active stack
- [ ] User can trigger debugging and receive: bug description, explanation, and an applied fix, correct for the project's active stack
- [ ] Live Preview updates automatically after every successful AI edit, in either stack
- [ ] User can download the current project as a working `.zip` with the correct file structure for its stack
- [ ] No unhandled crashes during the full demo flow (generate in both stacks → explain → debug → download)
- [ ] Off-topic/non-frontend messages (general chat, unrelated questions) are correctly rejected by the Router with a fixed redirect message, without invoking Builder/Reviewer
- [ ] Deployed and publicly accessible (Vercel + Render/Railway)

## Demo Flow (for judges)
1. Open Loom AI (deployed link).
2. Generate a Vanilla site: *"Create a modern portfolio website for a photographer."* → show live preview generate in ~10–15s.
3. Generate a React + Tailwind app: *"Create a React landing page for a SaaS product with a hero section and pricing cards, styled with Tailwind."* → show it bundle and render live.
4. Ask: *"Explain how this Tailwind pricing card is styled."* → show plain-language explanation.
5. Manually break something (or ask AI to introduce a bug for demo) in the React project → click Debug → show bug found, explained, fixed live in preview.
6. Ask: *"Add a fade-in animation to the hero section."* → show conversational edit applied.
7. Click Download → show both project types export correctly as working `.zip`s.
8. Close with the multi-agent, dual-stack architecture diagram to show technical depth beyond "just an API wrapper."

## Success Metrics
**Hackathon judging:**
- Live demo completes without errors, end-to-end, in both stacks, in under 4 minutes
- Judges can articulate the multi-agent, dual-stack architecture back after the demo
- Clear differentiation from ChatGPT/Cursor is understood without extra explanation

**Product-level (if continued):**
- Time-to-first-working-project under 20 seconds, in either stack
- % of debug sessions where the user reports the explanation was "understandable" (post-hackathon survey metric)
- Session-to-download conversion rate, tracked per stack

## Risks
| Risk | Mitigation |
|---|---|
| Open-source model output quality inconsistent for code gen, especially JSX/Tailwind | Reviewer Agent + single bounded retry loop; hardcode a few polished fallback templates per stack if generation fails outright |
| In-browser React bundling adds real engineering complexity vs. plain iframe srcDoc | Use a proven library (e.g., Sandpack by CodeSandbox) instead of building a custom bundler — do not roll your own Babel/webpack pipeline under a 4-day deadline |
| Latency stacking across 3 sequential agent calls | Stream Builder output directly to preview before Reviewer finishes; run Reviewer async where possible |
| Provider rate limits / downtime during live demo | Configure at least 2 providers (e.g., Groq + OpenRouter) with automatic fallback; test failover before demo day |
| Uploaded project has unexpected structure (wrong stack files, multiple frameworks) | MVP explicitly scopes to exactly the two defined stacks; validate uploads and reject/guide otherwise |
| Iframe/bundler sandbox security (injected script from generated or uploaded code) | Use `sandbox` attribute on iframes; for React, rely on the bundler sandbox's built-in isolation rather than a custom solution |
| 4-day timeline with 4 people, now across two stacks | Strict feature freeze after Day 2; get Vanilla stack fully working before starting React + Tailwind; see CLAUDE.md hackathon priorities |

## Assumptions
- Users interact in English; no localization needed for MVP.
- Single-page projects only, in both stacks — no routing/multi-page generation in MVP.
- No authentication needed; each session is ephemeral and self-contained.
- Team has access to API keys for at least one of OpenRouter/Groq/Gemini before Day 1.
- Demo will run on a stable internet connection; no offline mode required.
- Generated code quality target is "correct and clean for a beginner project," not production-enterprise-grade optimization, in either stack.
- A React live-preview sandboxing library (e.g., Sandpack) is an acceptable dependency rather than building an in-house bundler.

## Future Scope
- Additional frameworks/languages: Vue, Svelte, Next.js, TypeScript
- Full user accounts with saved project history and revisit/edit later
- Automated accessibility and performance auditing with actionable scores
- "Lesson mode": structured curriculum where Loom AI teaches HTML/CSS/JS and React/Tailwind fundamentals through guided project building
- Real-time multi-user collaboration on a single project
- Plugin marketplace for component libraries (shadcn/ui, Bootstrap, etc.)
- Assisted migration: convert a Vanilla project into React + Tailwind automatically
