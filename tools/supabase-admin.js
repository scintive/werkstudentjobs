#!/usr/bin/env node
// Simple Supabase Management API helper for Codex
// Usage:
//  SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxxx node tools/supabase-admin.js list-tables
//  SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxxx node tools/supabase-admin.js exec-sql "select now()"
//  SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxxx node tools/supabase-admin.js apply-file supabase_migrations/02_create_ai_cache.sql

const fs = require('fs');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!TOKEN || !PROJECT_REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF');
  process.exit(1);
}

async function callSql(query) {
  // Try current endpoint; fall back if needed
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'list-tables': {
      const sql = `select table_schema, table_name from information_schema.tables where table_schema='public' order by table_name;`;
      const out = await callSql(sql);
      console.log(JSON.stringify(out, null, 2));
      break;
    }
    case 'exec-sql': {
      const sql = args.join(' ');
      if (!sql) throw new Error('Provide SQL to execute');
      const out = await callSql(sql);
      console.log(JSON.stringify(out, null, 2));
      break;
    }
    case 'apply-file': {
      const file = args[0];
      if (!file) throw new Error('Provide path to .sql file');
      const sql = fs.readFileSync(file, 'utf8');
      const out = await callSql(sql);
      console.log(JSON.stringify(out, null, 2));
      break;
    }
    default:
      console.log('Commands: list-tables | exec-sql "..." | apply-file path.sql');
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
