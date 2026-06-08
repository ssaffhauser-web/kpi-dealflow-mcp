# kpi-dealflow-mcp

MCP (Model Context Protocol) server for [KPI DealFlow](https://kpidealflow.com) — connect Claude, Cursor, or any MCP-compatible AI assistant directly to your real estate pipeline.

## What it does

Gives your AI agent four tools:

| Tool | Description |
|------|-------------|
| `add_lead` | Add a new prospect to your pipeline |
| `list_leads` | List and filter leads by stage or temperature |
| `get_lead` | Pull full details on a specific lead |
| `update_lead` | Move a lead through the funnel or update notes |

## Prerequisites

1. A [KPI DealFlow](https://kpidealflow.com) account
2. An API key — generate one at **Settings → API Access** inside the app
3. Node.js 18 or newer

## Setup

### Claude Desktop (recommended)

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kpi-dealflow": {
      "command": "npx",
      "args": ["kpi-dealflow-mcp"],
      "env": {
        "KPIDEALFLOW_API_KEY": "kpid_your_key_here"
      }
    }
  }
}
```

Config file locations:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop after saving.

### Other MCP clients

Any client that supports stdio MCP servers works the same way — point it at `npx kpi-dealflow-mcp` with your `KPIDEALFLOW_API_KEY` env var set.

### Run directly (for testing)

```bash
KPIDEALFLOW_API_KEY=kpid_your_key npx kpi-dealflow-mcp
```

## Usage examples

Once connected, just talk to your agent:

> "Add John Smith as a lead — he called in wanting to buy a 3-bed in Northampton, timeline is 90 days. Phone 413-555-1234."

> "Who are my hot leads right now?"

> "Move John Smith to Qualified Lead — we agreed to a buyer consultation Thursday."

> "Show me all my Qualified Leads."

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KPIDEALFLOW_API_KEY` | Yes | — | Your API key from kpidealflow.com/settings |
| `KPIDEALFLOW_BASE_URL` | No | `https://kpidealflow.com` | Override for self-hosted or staging |

## License

MIT
