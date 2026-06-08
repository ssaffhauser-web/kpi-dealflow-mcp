#!/usr/bin/env node
/**
 * KPI DealFlow MCP Server
 *
 * Exposes your KPI DealFlow pipeline as tools any AI agent can call.
 * Set KPIDEALFLOW_API_KEY to your key from kpidealflow.com/settings.
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json or %APPDATA%\Claude\):
 * {
 *   "mcpServers": {
 *     "kpi-dealflow": {
 *       "command": "npx",
 *       "args": ["kpi-dealflow-mcp"],
 *       "env": { "KPIDEALFLOW_API_KEY": "kpid_your_key_here" }
 *     }
 *   }
 * }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_KEY  = process.env.KPIDEALFLOW_API_KEY
const BASE_URL = (process.env.KPIDEALFLOW_BASE_URL ?? 'https://kpidealflow.com').replace(/\/$/, '')

if (!API_KEY) {
  console.error('Error: KPIDEALFLOW_API_KEY environment variable is required.')
  console.error('Generate a key at kpidealflow.com/settings → API Access.')
  process.exit(1)
}

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: HEADERS })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'kpi-dealflow',
  version: '1.0.0',
})

// ─── Tool: add_lead ───────────────────────────────────────────────────────────

server.tool(
  'add_lead',
  'Add a new lead to the KPI DealFlow pipeline. Use this when someone calls in, texts, emails, or is otherwise identified as a prospect.',
  {
    first_name:    z.string().describe('First name of the lead (required)'),
    last_name:     z.string().optional().describe('Last name'),
    email:         z.string().optional().describe('Email address'),
    phone:         z.string().optional().describe('Phone number'),
    lead_type:     z.enum(['Buyer', 'Seller', 'Renter', 'Landlord']).optional().default('Buyer').describe('Type of lead'),
    lead_status:   z.enum(['Hot', 'Warm', 'Active', 'Cold']).optional().default('Warm').describe('Temperature/urgency of the lead'),
    funnel_status: z.enum(['Contact', 'Email', 'Qualified Lead']).optional().default('Contact').describe('Where in the funnel the lead sits'),
    source:        z.string().optional().describe('How the lead was generated — e.g. "Cold Call", "Zillow", "Door Knock", "Referral"'),
    notes:         z.string().optional().describe('Any additional context or notes about the lead'),
    inbound:       z.boolean().optional().default(false).describe('True if the lead reached out first (inbound), false if you initiated (outbound)'),
  },
  async (args) => {
    const { ok, data } = await apiFetch('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(args),
    })
    if (!ok) return { content: [{ type: 'text', text: `Failed to add lead: ${data.error ?? 'unknown error'}` }] }
    const l = data.lead
    return {
      content: [{
        type: 'text',
        text: `Lead added: ${l.first_name} ${l.last_name ?? ''}`.trim() +
              `\nID: ${l.id}` +
              `\nStatus: ${l.lead_status} · ${l.funnel_status}` +
              (l.phone ? `\nPhone: ${l.phone}` : '') +
              (l.email ? `\nEmail: ${l.email}` : '') +
              (l.source ? `\nSource: ${l.source}` : ''),
      }],
    }
  }
)

// ─── Tool: list_leads ─────────────────────────────────────────────────────────

server.tool(
  'list_leads',
  'List leads from the KPI DealFlow pipeline. Filter by stage, status, or inbound/outbound.',
  {
    funnel_status: z.enum(['Contact', 'Email', 'Qualified Lead', 'Appointment', 'Agreement', 'UAG', 'Closed']).optional().describe('Filter by funnel stage'),
    lead_status:   z.enum(['Hot', 'Warm', 'Active', 'Cold', 'Sphere']).optional().describe('Filter by lead temperature'),
    inbound:       z.boolean().optional().describe('Filter by inbound (true) or outbound (false)'),
    limit:         z.number().int().min(1).max(100).optional().default(20).describe('Number of leads to return (max 100)'),
  },
  async (args) => {
    const params = new URLSearchParams()
    if (args.funnel_status) params.set('funnel_status', args.funnel_status)
    if (args.lead_status)   params.set('lead_status', args.lead_status)
    if (args.inbound !== undefined) params.set('inbound', String(args.inbound))
    params.set('limit', String(args.limit ?? 20))

    const { ok, data } = await apiFetch(`/api/v1/leads?${params}`)
    if (!ok) return { content: [{ type: 'text', text: `Failed to fetch leads: ${data.error ?? 'unknown error'}` }] }

    const leads = data.leads ?? []
    if (leads.length === 0) return { content: [{ type: 'text', text: 'No leads found matching those filters.' }] }

    const lines = leads.map(l =>
      `• ${l.first_name} ${l.last_name ?? ''}`.trim() +
      ` [${l.funnel_status} · ${l.lead_status}]` +
      (l.phone ? ` ${l.phone}` : '') +
      (l.source ? ` — ${l.source}` : '') +
      ` (ID: ${l.id})`
    )

    return {
      content: [{
        type: 'text',
        text: `Found ${leads.length} lead(s):\n\n${lines.join('\n')}`,
      }],
    }
  }
)

// ─── Tool: get_lead ───────────────────────────────────────────────────────────

server.tool(
  'get_lead',
  'Get full details for a specific lead by ID.',
  {
    id: z.string().uuid().describe('The lead ID (from add_lead or list_leads)'),
  },
  async ({ id }) => {
    const { ok, data } = await apiFetch(`/api/v1/leads/${id}`)
    if (!ok) return { content: [{ type: 'text', text: `Lead not found: ${data.error ?? id}` }] }
    const l = data.lead
    return {
      content: [{
        type: 'text',
        text: [
          `Name: ${l.first_name} ${l.last_name ?? ''}`.trim(),
          `Type: ${l.lead_type}`,
          `Status: ${l.lead_status} · ${l.funnel_status}`,
          l.phone   ? `Phone: ${l.phone}`   : null,
          l.email   ? `Email: ${l.email}`   : null,
          l.source  ? `Source: ${l.source}` : null,
          l.notes   ? `Notes: ${l.notes}`   : null,
          `Inbound: ${l.inbound ? 'Yes' : 'No'}`,
          `Added: ${new Date(l.created_at).toLocaleDateString()}`,
          `ID: ${l.id}`,
        ].filter(Boolean).join('\n'),
      }],
    }
  }
)

// ─── Tool: update_lead ────────────────────────────────────────────────────────

server.tool(
  'update_lead',
  'Update a lead — move them through the pipeline, change their status, or add notes.',
  {
    id:            z.string().uuid().describe('The lead ID to update'),
    funnel_status: z.enum(['Contact', 'Email', 'Qualified Lead', 'Appointment', 'Agreement', 'UAG', 'Closed']).optional().describe('Move the lead to this pipeline stage'),
    lead_status:   z.enum(['Hot', 'Warm', 'Active', 'Cold']).optional().describe('Update lead temperature'),
    notes:         z.string().optional().describe('Add or replace notes on the lead'),
    source:        z.string().optional().describe('Update the lead source'),
  },
  async ({ id, ...updates }) => {
    if (Object.keys(updates).length === 0)
      return { content: [{ type: 'text', text: 'No fields to update were provided.' }] }

    const { ok, data } = await apiFetch(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    if (!ok) return { content: [{ type: 'text', text: `Failed to update lead: ${data.error ?? 'unknown error'}` }] }
    const l = data.lead
    return {
      content: [{
        type: 'text',
        text: `Updated ${l.first_name} ${l.last_name ?? ''}`.trim() +
              `\nNow: ${l.lead_status} · ${l.funnel_status}` +
              (l.notes ? `\nNotes: ${l.notes}` : ''),
      }],
    }
  }
)

// ─── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
