# CLAUDE.md — Engineering Guide for Loom AI

This file tells Claude Code how to think, decide, and write code on this project. Read this before writing or modifying anything. If a request conflicts with this file, follow this file and flag the conflict to the user rather than silently deviating.

---

## Project Overview

Loom AI is a hackathon MVP (4-day build, 4-person team): an AI-powered frontend assistant for students and beginner developers. Users either generate a project from a prompt or upload an existing one, in **one of two supported stacks**:

- **Vanilla:** `index.html` + `style.css` + `script.js`
- **React + Tailwind:** JSX components styled with Tailwind utility classes

A multi-agent pipeline (Router → Builder → Reviewer) built on LangGraph generates or edits the code for whichever stack is active, which then renders instantly in a live-preview pane (sandboxed iframe for Vanilla, sandboxed in-browser bundler for React + Tailwind). Users can ask the AI to explain code or debug it in plain language, iterate conversationally, and download the final project.

Full product context lives in `SPEC.md` — read it first if you need the "why" behind a decision. This file is the "how."

**This is not a general coding assistant, and it is not a framework-agnostic tool.** Scope for MVP is strictly: single-page Vanilla (HTML/CSS/JS) or React + Tailwind generation, explanation, and debugging. Do not add scope (other frameworks, multi-page routing, auth systems, billing) without an explicit user request — see Future Scope in `SPEC.md` for what's intentionally deferred (Vue, Svelte, Next.js, TypeScript, etc.).

---

## Architecture

```
React/Vite frontend  →  Express backend  →  LangGraph orchestrator  →  AI providers (OpenRouter/Groq/Gemini)
                                                     │
                                    SQLite (session/project state + active stack)
```

- **Router Agent** (Qwen 2.5 3B Instruct): classifies user intent into `generate | edit | explain | debug | off_topic`, aware of the project's active stack. `off_topic` is a hard gate — any message unrelated to frontend generation/editing/explaining/debugging in one of the two supported stacks is rejected here with a fixed redirect message, before Builder or Reviewer are ever called. This is what stops Loom AI from behaving like a general-purpose chatbot.
- **Builder Agent** (Qwen 2.5 Coder 7B): writes/edits code for exactly one active stack at a time — Vanilla HTML/CSS/JS, or React JSX + Tailwind classes. Never mixes stacks within a single project.
- **Reviewer Agent** (Llama 3.1 8B): validates Builder output against the conventions of the active stack (valid JSX/hooks usage and Tailwind class names for React; valid HTML/CSS/JS for Vanilla), one bounded retry loop max.
- **Brain Agent** (Qwen 3 8B): interface stubbed only — do not wire into the critical path unless explicitly asked.

Agents communicate via structured JSON, never free-form text parsing. Every agent node in LangGraph must validate its own output shape before passing it downstream, and every state object must carry an explicit `stack: "vanilla" | "react-tailwind"` field so no node has to guess.

---

## Folder Structure

```
loom-ai/
├── apps/
│   ├── web/                      # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── chat/         # Chat UI (messages, input, streaming)
│   │   │   │   ├── preview/      # Live preview: iframe renderer (Vanilla) +
│   │   │   │   │                 # bundler sandbox renderer (React + Tailwind)
│   │   │   │   ├── upload/       # Project upload UI (stack auto-detection)
│   │   │   │   └── ui/           # Shared, generic components (buttons, modals)
│   │   │   ├── hooks/
│   │   │   ├── lib/              # API client, helpers
│   │   │   ├── pages/            # Top-level route views (if any routing used)
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   └── vite.config.js
│   │
│   └── server/                   # Express backend
│       ├── src/
│       │   ├── routes/           # Express route definitions (thin controllers)
│       │   ├── agents/           # LangGraph agent + graph definitions
│       │   │   ├── router.agent.js
│       │   │   ├── builder.agent.js       # dispatches to stack-specific prompt builders
│       │   │   ├── reviewer.agent.js      # dispatches to stack-specific validators
│       │   │   └── graph.js               # Wires agents into the LangGraph pipeline
│       │   ├── stacks/            # Stack-specific logic kept isolated from agent code
│       │   │   ├── vanilla/       # Vanilla prompt templates, file validators, zip layout
│       │   │   └── react-tailwind/# React/Tailwind prompt templates, file validators, zip layout
│       │   ├── providers/         # AI provider clients (OpenRouter, Groq, Gemini)
│       │   ├── db/                # SQLite setup, queries
│       │   ├── services/          # Business logic (project state, zip export)
│       │   ├── middleware/
│       │   └── app.js
│       └── package.json
│
├── SPEC.md
├── CLAUDE.md
├── brief.md
└── package.json                  # workspace root (if using npm/pnpm workspaces)
```

Use a monorepo with workspaces (`apps/web`, `apps/server`) so both apps share root tooling but stay independently deployable (web → Vercel, server → Render/Railway). Keep `stacks/vanilla/` and `stacks/react-tailwind/` strictly separate — no shared prompt templates or file-validation logic between them, since the two stacks have fundamentally different file shapes.

---

## Coding Standards

- JavaScript/JSX everywhere in the Loom AI app itself. No TypeScript conversion mid-hackathon — the team doesn't have time to fight types under a 4-day deadline. (Revisit post-hackathon. Note: this is about the Loom AI codebase itself — generated *user* projects may still be plain JS/JSX per the two supported stacks.)
- Functional React components with Hooks only. No class components.
- Prefer small, single-purpose functions over large ones. If a function exceeds ~40 lines, look for a natural split.
- No unused imports, no commented-out dead code left in commits.
- Use `async/await` over raw `.then()` chains.
- Every Express route handler must be wrapped in try/catch or use a centralized async error wrapper — never let a rejected promise crash the server unhandled.

## Naming Conventions

- Files: `kebab-case.js` for backend, `PascalCase.jsx` for React components, `camelCase.js` for hooks/utilities.
- React components: `PascalCase` (e.g., `LivePreview.jsx`, `ChatPanel.jsx`).
- Functions/variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- LangGraph node names: `snake_case` matching the agent's role (`router_node`, `builder_node`, `reviewer_node`).
- Stack identifiers: always the literal strings `"vanilla"` and `"react-tailwind"` — never abbreviate or introduce alternate spellings anywhere in code, prompts, or API payloads.
- Express routes: RESTful, plural nouns where applicable (`/api/projects`, `/api/chat`).

## Git Workflow

- `main` is always deployable. No direct commits to `main` during active feature work.
- Branch naming: `feature/<short-desc>`, `fix/<short-desc>` (e.g., `feature/react-tailwind-preview`).
- Commit messages: short, imperative (`Add reviewer retry loop`, `Fix React zip export missing tailwind.config.js`).
- Given the 2-day timeline: small, frequent commits over large batched ones — easier to revert if an agent-generated change breaks something.
- PRs are optional for a 4-person hackathon team, but any change touching the agent pipeline (`apps/server/src/agents/`) or either stack module (`apps/server/src/stacks/`) should get at least one other teammate's eyes before merging to `main`.

## Testing Strategy

Given the 2-day constraint, testing is intentionally lightweight and targeted — not skipped, but scoped:

- **Manual smoke test after every merge to `main`**: run the full demo flow (generate in Vanilla → generate in React + Tailwind → explain → debug → download) once.
- **Unit tests only for pure logic that's easy to break silently**: zip export (both stack layouts), file validation on upload (both stacks), Router intent classification parsing (mock the model response, test the parsing/validation layer).
- **No unit tests required for React components** in MVP scope — visual/manual verification is sufficient given the timeline.
- **No E2E test framework setup** (Playwright/Cypress) unless the team has spare time on Day 4 — not worth the setup cost otherwise.

## Project Boundaries

Claude should stay within:
- Exactly two generated-project stacks: Vanilla (HTML/CSS/JS) and React + Tailwind
- The three-agent pipeline (Router/Builder/Reviewer) as designed
- The defined tech stack for the Loom AI app itself (React/Vite/Tailwind, Node/Express, SQLite, LangGraph)

Claude should **not**, without explicit user request:
- Add a third generated-project stack (Vue, Svelte, Next.js, TypeScript, etc.) — these are Future Scope only
- Add a database beyond SQLite
- Introduce TypeScript into the Loom AI app itself
- Add authentication/user accounts
- Add a state management library (Redux, Zustand) — React state/Context is sufficient at this scale

## Package Installation Rules

- Before adding any new npm package, check if the existing stack (React, Vite, Tailwind, Express, LangGraph, better-sqlite3) already covers the need.
- **React live preview must use a proven in-browser bundling/sandbox library** (e.g., Sandpack by CodeSandbox) rather than a hand-rolled Babel/webpack pipeline — building a custom in-browser bundler is not a good use of hackathon time and is a common way to blow the 2-day budget.
- Prefer well-maintained, widely-used packages. Avoid anything unmaintained (no commits >2 years) or with very low weekly downloads for a hackathon dependency.
- Zip export: use `archiver` or `jszip` — pick one and use it consistently across both stacks, don't mix.
- SQLite client: use `better-sqlite3` (synchronous, simple, fast enough at MVP scale) rather than `sqlite3` (async, more setup overhead) unless the user specifies otherwise.
- Never install a package "just in case." Every dependency added should map to a concrete, current feature.

## Environment Variable Rules

- All secrets (API keys for OpenRouter/Groq/Gemini) go in `.env` files, never hardcoded, never committed.
- `.env.example` must be kept up to date with every required key (empty/placeholder values only).
- Backend loads env vars via `dotenv` at startup; fail fast with a clear error message if a required key is missing rather than failing silently mid-request.
- Naming: `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `PORT`, `DATABASE_PATH`.
- Never log full API keys, even in debug output — mask to first/last 4 characters if logging is needed for debugging provider issues.

## Component Organization

- One component per file. No multi-component files except tightly coupled sub-components (e.g., a `ChatMessage` sub-component used only inside `ChatPanel`).
- Presentational vs. logic separation: complex state/data logic goes in a custom hook (`useChat.js`, `useProject.js`), components stay focused on rendering.
- Shared/generic UI pieces (buttons, modals, spinners) live in `components/ui/` and must not contain feature-specific logic.
- Live Preview has **two renderer components**, selected by the project's active stack — never one component branching internally on stack with a pile of conditionals:
  - `components/preview/VanillaPreview.jsx` — renders via `srcDoc` on a sandboxed iframe. Never use `dangerouslySetInnerHTML` on the parent DOM.
  - `components/preview/ReactTailwindPreview.jsx` — renders via the chosen bundler sandbox library (e.g., Sandpack), which provides its own isolated iframe internally.

## Backend Structure

- Routes are thin: parse request (including `stack`), call a service/agent graph function, return response. No business logic directly in route handlers.
- All AI orchestration logic lives in `agents/`, invoked from routes via a single `runGraph(input)`-style entry point where `input` always includes the active `stack`.
- Stack-specific prompt templates, file-shape validators, and zip-layout logic live in `stacks/vanilla/` and `stacks/react-tailwind/` respectively — agents call into these modules rather than hardcoding stack-specific strings inline.
- `services/` holds non-AI business logic: project state persistence, zip generation, file validation.
- `providers/` abstracts the actual HTTP calls to OpenRouter/Groq/Gemini behind a consistent interface (e.g., `callModel({ provider, model, messages })`) so agent code never depends on a specific provider's SDK shape directly.

## AI Integration Rules

- Every agent call must request **structured output** (JSON) wherever the downstream consumer is code, not a human — never regex-parse free-form prose to extract a decision.
- Builder Agent must always return **complete file contents per file**, never partial diffs/patches, for whichever stack is active:
  - Vanilla: complete `index.html`, `style.css`, `script.js`.
  - React + Tailwind: complete `.jsx` file(s) plus any config file changes (e.g., `tailwind.config.js`).
- Builder Agent must never blend syntax between stacks (e.g., no JSX inside a Vanilla `script.js`, no `<script>`-style vanilla DOM manipulation inside a React component).
- Reviewer Agent must validate against the conventions of the active stack specifically — Reviewer's system prompt differs by stack and must not apply React/JSX linting rules to a Vanilla project or vice versa.
- Reviewer Agent gets exactly **one retry loop** with Builder in MVP — do not build unbounded retry chains; bound latency and cost.
- Provider fallback: if the primary provider for a given model fails or rate-limits, retry once against a secondary provider before surfacing an error to the user.
- Never block the entire pipeline on the Brain Agent (Qwen 3 8B) — it is not wired into the MVP critical path.
- Every user message must pass through Router's intent classification before anything else happens. If Router returns `off_topic`, the backend returns a fixed, pre-written redirect response immediately — Builder and Reviewer are never invoked for that turn, and no model is asked to "just answer" the off-topic message. This gate is non-negotiable: Loom AI must never fall back to general chatbot behavior, no matter how the user phrases or reframes the request.
- Log every agent's raw input/output during development (strip in production) to make debugging the pipeline tractable under time pressure.

## API Design Rules

- REST, JSON in/out. Use Server-Sent Events (SSE) for streaming Builder output to the frontend so the user sees progress rather than a long blank wait.
- Core endpoints:
  - `POST /api/generate` — `{ prompt, stack }` → new project in the requested stack
  - `POST /api/upload` — files → parsed project state, with stack auto-detected from the uploaded file set (reject uploads that don't clearly match either supported stack)
  - `POST /api/chat` — message + intent → routed through Router/Builder/Reviewer, stack read from project state
  - `GET /api/download/:projectId` — returns `.zip` in the correct layout for the project's stack
- Every endpoint returns a consistent response envelope: `{ success: boolean, data?, error? }`.
- Version endpoints only if there's a real reason to — do not add `/api/v1/` ceremony for a 4-day hackathon unless already decided by the team.

## Error Handling

- Centralized Express error-handling middleware; all routes funnel unexpected errors through it.
- User-facing errors must be plain-language and actionable ("Couldn't generate the site — the AI service is temporarily unavailable, please try again" — not a raw stack trace).
- Agent-layer errors (malformed JSON from a model, provider timeout) are caught and retried once before bubbling up as a user-facing error.
- Uploads that don't match either supported stack's expected file set get a clear, specific error ("This doesn't look like a Vanilla or React + Tailwind project — expected index.html/style.css/script.js, or a React project with App.jsx and tailwind.config.js.") rather than a generic failure.
- Never let a single failed agent call crash the whole request — degrade gracefully (e.g., if Reviewer fails, ship Builder's output with a warning rather than failing the whole generation).

## Code Quality Rules

- Readability over cleverness — this is a beginner-facing product; the codebase itself should model good, clear practice.
- No premature abstraction. Don't build a plugin system, generic multi-framework config, or config-driven pipeline for a 2-stack, 3-agent hackathon MVP — direct, explicit code per stack wins under this timeline.
- Every non-obvious decision (e.g., "why one retry loop and not three," "why Sandpack instead of a custom bundler") gets a one-line comment, not an essay.

## Performance Expectations

- Target end-to-end generation time (prompt → rendered preview): under ~15 seconds for Vanilla, under ~20 seconds for React + Tailwind (bundling adds overhead — set this expectation explicitly with the team and in the demo script).
- Stream Builder output to the frontend as it's produced rather than waiting for the full pipeline (Router→Builder→Reviewer) to complete before showing anything.
- Live Preview re-render should feel as close to instant as possible once file contents are received; for React + Tailwind, rely on the bundler sandbox's incremental re-bundling rather than a full reload where the library supports it.

## Security Guidelines

- Vanilla Live Preview iframe **must** use the `sandbox` attribute. Do not combine `allow-same-origin` and `allow-scripts` in a way that lets generated/uploaded code escape the sandbox and touch the parent app's DOM or storage.
- React + Tailwind Live Preview must run inside the bundler sandbox library's own isolated iframe — do not attempt to bundle and render React code directly in the parent app's DOM.
- Sanitize/validate all uploaded files: enforce expected filenames per stack, reasonable size limits, and reject anything that isn't plain text or doesn't match either supported stack's shape.
- Never `eval()` or execute generated/uploaded JavaScript or JSX in the Node backend — it only ever runs inside a sandboxed browser preview.
- API keys never reach the frontend bundle — all provider calls happen server-side only.
- Basic rate limiting on `/api/generate` and `/api/chat` to protect against runaway cost from repeated calls (even a simple in-memory limiter is fine for MVP).

## Documentation Rules

- Every new agent node gets a short docstring/comment: what it receives, what it returns, what it must never do, and which stack(s) it applies to.
- `SPEC.md` stays the source of truth for product scope; `CLAUDE.md` stays the source of truth for engineering process; `brief.md` is the one-page summary for quick reference. If a decision changes any of these, update the relevant file(s) in the same PR/commit.
- README (if added) should let a new teammate run the full stack locally in under 5 minutes, including which stack(s) they can test against.

## Pull Request Guidelines

- Keep PRs scoped to one feature/fix — especially important given 4 people working in parallel over 4 days, and now two stacks to cover.
- PR description: what changed, why, which stack(s) it affects, and how it was manually tested (link to the smoke-test flow if relevant).
- Any PR touching `agents/`, `stacks/`, or `providers/` should note which models/providers were tested against, and for which stack.

## Hackathon Priorities

Ordered priority for the 2-day build — if time runs short, cut from the bottom, not the top:

1. Vanilla: Generate → Live Preview working end-to-end
2. Vanilla: Upload → Live Preview working end-to-end
3. React + Tailwind: Generate → Live Preview working end-to-end (bring in the bundler sandbox library early — this is the highest-risk item)
4. React + Tailwind: Upload → Live Preview working end-to-end
5. Explain Code (chat-based), both stacks
6. Debug Code (find, explain, fix), both stacks
7. Download as `.zip`, both stacks
8. Conversational follow-up edits, both stacks
9. Polish (loading states, error messages, UI styling pass)
10. Stretch goals (responsive suggestions, accessibility, Vanilla→React migration assistant)

Feature freeze after Day 1 evening — Day 2 are integration, bug-fixing, demo polish, and rehearsal only. Get Vanilla fully solid before starting React + Tailwind; do not build both in parallel from scratch with a 4-person team on a 2-day clock.

## Definition of Done (Engineering)

A feature is "done" only when:
- [ ] It works in the deployed environment, not just locally
- [ ] It's covered by the manual smoke test flow, for whichever stack(s) it touches
- [ ] No console errors during normal use
- [ ] Error states are handled with a user-facing message, not a silent failure or raw stack trace
- [ ] Code is committed to `main` with a clear commit message

## Things Claude Should NEVER Do
- Never execute uploaded or generated user JavaScript/JSX outside a sandboxed preview environment.
- Never hardcode API keys or commit `.env` files.
- Never introduce a new major dependency (state management lib, TypeScript, a third generated-project stack) without explicit user confirmation.
- Never let the Reviewer/Builder retry loop run unbounded — max one retry in MVP.
- Never regex-parse a model's free-form text output when structured JSON output was requested and available.
- Never blend Vanilla and React + Tailwind syntax within a single generated project.
- Never build a custom in-browser bundler from scratch for React preview — use a proven library.
- Never let an off-topic/general-chat message reach Builder or Reviewer — Router must gate it first, every time.
- Never expand scope to a third framework/language without being asked — that belongs in Future Scope.

## Things Claude Should ALWAYS Do
- Always check `SPEC.md` for product intent before making an architectural judgment call.
- Always keep Builder Agent output as complete, valid files — never partial diffs — for whichever stack is active.
- Always sandbox any rendering of generated/uploaded code, using the appropriate mechanism for the stack (iframe srcDoc for Vanilla, bundler sandbox for React + Tailwind).
- Always fail fast and loud on missing required environment variables at startup.
- Always prefer the simplest solution that meets the 2-day deadline over the "more correct" solution that doesn't fit the timeline.
- Always keep error messages in plain, beginner-friendly language on user-facing surfaces.
- Always tag project/agent state with an explicit `stack` field rather than inferring it implicitly from file contents at every step.

---

## Guidelines for Production-Quality React Components
- Functional components, Hooks only, one component per file, `PascalCase` naming.
- Props destructured in the function signature; default values via default parameters, not `defaultProps`.
- Co-locate component-specific styles via Tailwind utility classes directly in JSX — avoid separate CSS files per component unless a style is genuinely reused or too complex for utility classes.
- Loading and error states are not optional — every component that triggers an async action (generate, upload, chat, download) must visibly represent `idle | loading | success | error` states.
- Avoid prop-drilling more than 2 levels — lift state into a custom hook or Context if it needs to go deeper.
- Accessibility basics even under time pressure: semantic HTML elements, `alt` text on images, labeled form inputs.
- This section applies both to the Loom AI app's own frontend and to any React + Tailwind code the Builder Agent generates for users — hold generated user projects to the same bar.

## Guidelines for Express APIs
- Thin route handlers; logic lives in `services/`, `stacks/`, or `agents/`.
- Validate request bodies before passing them to any agent or service, including validating `stack` is one of the two supported literal values.
- Consistent JSON response envelope (`{ success, data, error }`) across every endpoint.
- Use SSE for any endpoint that streams AI output; use plain JSON responses for everything else (upload, download, simple CRUD).
- Centralized error-handling middleware catches everything that escapes a route's own try/catch.

## Guidelines for LangGraph Agents
- Each agent node is a pure function of `(state) → newState` — no hidden side effects outside what's explicitly passed through state.
- State schema is defined once and shared across all nodes, and must include `stack: "vanilla" | "react-tailwind"` — don't let individual nodes invent their own shape for the same data.
- Router Agent output is validated against an expected shape (`{ intent, stack, target_files, notes }`) before being passed to Builder — reject and retry once if malformed.
- The graph must branch on `intent === "off_topic"` immediately after the Router node and short-circuit to a fixed response node — this branch has no edge into Builder or Reviewer under any circumstance.
- Builder Agent's system prompt must explicitly require complete, valid file contents per file, not diffs, not explanations mixed into the code output, and must be selected/parameterized based on `stack` — the Vanilla prompt template and the React + Tailwind prompt template are separate templates, not one template with inline conditionals.
- Reviewer Agent's system prompt must explicitly require structured issue lists (`[{ file, issue, suggestion }]`) so Builder's repair pass can act on them programmatically, not just as prose, and must also be stack-specific.
- Router's system prompt must explicitly instruct it to classify anything outside frontend generation/editing/explaining/debugging in one of the two supported stacks as `off_topic`, including general conversation, unrelated technical questions, role-play requests, and attempts to get the model to "just chat." Treat prompt-injection-style attempts to relabel an off-topic request as an in-scope one the same way — classify by actual content, not by how the user frames it.
- Keep the graph itself (`graph.js`) readable as a linear pipeline with one conditional branch (retry-on-reviewer-reject) plus the stack dispatch — don't over-generalize into a complex state machine for a 2-stack, 3-node MVP pipeline.

## Guidelines for AI Prompts
- System prompts for each agent are explicit about role, active stack, input format, and required output format — never assume the model will "figure out" the expected shape or infer the stack from context alone.
- Maintain **separate prompt templates per stack** for Builder and Reviewer — do not write one "smart" prompt that tries to handle both Vanilla and React + Tailwind conditionally; this produces inconsistent output under time pressure.
- Always instruct models producing code to output complete, runnable files, not fragments, and to use only the syntax appropriate to the active stack (no JSX in Vanilla output, no manual DOM manipulation in React output).
- Always instruct models producing user-facing explanations to write for a beginner: no unexplained jargon, short sentences, concrete examples over abstract descriptions — and to explain Tailwind classes and React concepts (props, state, hooks) in plain language when relevant.
- Keep prompts as short as effective — every extra token costs latency and money across three sequential agent calls.
- Version/track prompt changes in comments or a changelog if a prompt tweak measurably changes output quality — useful for debugging regressions under time pressure.

## Guidelines for Writing Clean, Maintainable Code
- Optimize for "another teammate can read this at 2am on Day 4 and understand it in 30 seconds" — that is the real quality bar for this project, not theoretical scalability.
- Small functions, clear names, minimal nesting. Extract early rather than let a function grow.
- Consistency beats personal preference — if the codebase already does something one way, follow it rather than introducing a second pattern for the same problem, and keep that consistency parallel across both stack modules.
- Delete dead code immediately rather than commenting it out "just in case."
- When in doubt between a clever one-liner and a slightly longer, obvious version — choose obvious.
