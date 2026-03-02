# ClawFree

**Open-source AI agent platform powered by Claude CLI. Zero API cost.**

ClawFree is a local-first AI agent platform that uses your existing Claude subscription (via the Claude CLI) instead of API tokens. It includes a gateway runtime, web dashboard, CLI tool, and optional cloud sync via Supabase.

## How It Works

ClawFree spawns the official `claude` CLI tool (`claude -p`) under the hood. This means:

- **Zero API cost** — uses your Claude Pro or Max subscription
- **No `ANTHROPIC_API_KEY` needed** — the CLI authenticates via your subscription
- **Official and sanctioned** — Anthropic ships the Claude CLI specifically for this use case

## Features

- **Zero API Cost** — Uses Claude CLI with your existing subscription
- **Local-First** — Gateway runs on your machine, accessing your filesystem and shell
- **Web Dashboard** — Real-time chat, session history, memory management, skills marketplace
- **CLI Tool** — `clawfree chat`, `clawfree run`, `clawfree status`
- **Persistent Memory** — Local markdown files with optional Supabase cloud sync
- **Skills System** — Install/create SKILL.md files (compatible with ClawHub skills)
- **Cron Scheduler** — Schedule recurring agent tasks
- **Tool Sandbox** — Permission model, audit logging, command safety checks
- **Multi-Channel** — Web, CLI, Telegram, Slack, Discord
- **Full Observability** — Tool execution audit log, daily metrics, analytics dashboard

## Prerequisites

- Node.js 18+
- pnpm 8+
- Claude CLI installed and authenticated:
  ```bash
  npm install -g @anthropic-ai/claude-code
  # Run `claude` once — it opens a browser to authenticate with your Claude account
  claude
  ```

## Quick Start

### Option A — Global CLI (recommended)

```bash
npm install -g clawfree
clawfree onboard   # first-time setup wizard
clawfree start     # start the gateway
clawfree chat      # start chatting
```

### Option B — From source

```bash
git clone https://github.com/yourusername/clawfree.git
cd clawfree
pnpm install
cp .env.example .env
pnpm dev:gateway   # gateway on :4000
pnpm dev:dashboard # dashboard on :3000
```

## CLI Usage

```bash
# Check gateway status
clawfree status

# Interactive chat
clawfree chat

# Single prompt
clawfree run "Summarize the latest HackerNews posts"

# Manage skills
clawfree skill list
clawfree skill install https://example.com/skill.md

# Manage cron jobs
clawfree cron list
clawfree cron add -n "daily-digest" -s "0 9 * * *" -p "Give me a morning briefing"

# Manage memory
clawfree memory add "User prefers TypeScript" --type preference
clawfree memory search "TypeScript"
```

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────┐
│   Dashboard   │────▶│            Gateway (:4000)            │
│   (:3000)     │ WS  │                                      │
└──────────────┘     │  ┌─────────┐  ┌──────────┐           │
                     │  │  Agent   │  │  Tools   │           │
┌──────────────┐     │  │  Loop    │  │ Registry │           │
│     CLI      │────▶│  └────┬────┘  └──────────┘           │
└──────────────┘ HTTP│       │                               │
                     │  ┌────▼────┐  ┌──────────┐           │
┌──────────────┐     │  │ Claude  │  │  Memory  │           │
│  Telegram /  │────▶│  │  CLI    │  │ Manager  │           │
│  Slack /     │     │  └─────────┘  └──────────┘           │
│  Discord     │     └──────────────┬───────────────────────┘
└──────────────┘                    │ (optional)
                              ┌─────▼─────┐
                              │  Supabase  │
                              │  (cloud)   │
                              └───────────┘
```

### Packages

| Package | Description |
|---------|-------------|
| `@clawfree/shared` | TypeScript types, Zod schemas, utilities |
| `@clawfree/gateway` | Core runtime — Fastify server, agent loop, Claude CLI runner |
| `@clawfree/dashboard` | Next.js 14 web dashboard |
| `clawfree` (CLI) | Command-line interface |

### How It Works

1. **User sends message** (via dashboard, CLI, or bot)
2. **Gateway builds context** — loads SOUL.md, retrieves relevant memories, checks active skills
3. **Claude CLI processes** — spawns `claude -p "prompt" --output-format stream-json`
4. **Tools execute** — Claude's tool calls are handled by the tool registry
5. **Response streams back** — via WebSocket (dashboard) or HTTP (CLI/bots)
6. **Session persists** — messages stored locally and optionally synced to Supabase

## SOUL.md

Your agent's personality and instructions live in `workspace/SOUL.md`:

```markdown
---
name: My Agent
---

## Identity
You are a helpful assistant...

## Instructions
Help users with their tasks...

## Constraints
- Never share sensitive information
- Ask before destructive operations

## Tools
- shell
- file_read
- web_fetch
```

## Supabase Setup (Optional)

ClawFree works fully offline. To enable cloud sync:

1. Create a Supabase project
2. Run the migrations:
   ```bash
   supabase db push
   ```
3. Add your credentials to `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

## Development

```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Dev mode (gateway)
pnpm dev:gateway

# Dev mode (dashboard)
pnpm dev:dashboard
```

## License

MIT
