#!/usr/bin/env node
// Minimal MCP-like stdio server for Supabase management API
// Exposes tools: list_tables, execute_sql, apply_migration
// NOTE: This is a lightweight shim; proper MCP features (capabilities, prompts) can be added later.

const readline = require('readline');
const fetch = require('node-fetch');

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const DB_HOST = process.env.SUPABASE_DB_HOST;

if (!ACCESS_TOKEN || !PROJECT_REF) {
  console.error('[supabase-mcp] Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF');
  process.exit(1);
}

async function supabaseSql(sql) {
  const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;
  const url = `${base}/database/query${DB_HOST ? `?db_host=${encodeURIComponent(DB_HOST)}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: sql
    })
  });
  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      details = await res.text();
    }
    throw new Error(`Supabase SQL error: ${res.status} ${typeof details === 'string' ? details : JSON.stringify(details)}`);
  }
  return res.json();
}

async function handleCall(call) {
  const { method, params, id } = call;
  try {
    switch (method) {
      case 'list_tables': {
        const sql = `select table_schema, table_name from information_schema.tables where table_schema = 'public' order by table_name`;
        const result = await supabaseSql(sql);
        return { id, result };
      }
      case 'execute_sql': {
        const { sql } = params || {};
        const result = await supabaseSql(sql);
        return { id, result };
      }
      case 'apply_migration': {
        const { sql } = params || {};
        const result = await supabaseSql(sql);
        return { id, result };
      }
      case 'list_projects': {
        // Minimal placeholder: return the configured project
        return { id, result: [{ ref: PROJECT_REF }] };
      }
      default:
        return { id, error: { message: `Unknown method: ${method}` } };
    }
  } catch (e) {
    return { id, error: { message: e.message } };
  }
}

// Simple line-delimited JSON RPC
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: 0, result: { ready: true, tools: ['list_tables', 'execute_sql', 'apply_migration', 'list_projects'] } }) + '\n');

rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const resp = await handleCall(msg);
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...resp }) + '\n');
});
