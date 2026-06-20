#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPORT = process.argv.includes('--report');

function parseVer(v) {
  return String(v).replace(/^[^\d]*/, '').split('.').map(n => parseInt(n, 10) || 0);
}
function lessThan(a, b) {
  const pa = parseVer(a), pb = parseVer(b);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}
function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// Self-locate the policy file relative to THIS script, so it works no matter
// how the script is invoked (no dependency on env vars or cwd).
// PROD: replace this read with a fetch to Artifactory / Nexus / your policy API.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const policyPath = path.join(__dirname, '..', 'policy', 'approved-versions.json');
const policy = loadJSON(policyPath) || {};

// Project manifest in the current working directory.
const manifest = loadJSON(path.join(process.cwd(), 'package.json'));

function findViolations() {
  if (!manifest) return [];
  const deps = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
  const out = [];
  for (const [name, declared] of Object.entries(deps)) {
    const rule = policy[name];
    if (!rule || !rule.required) continue;
    if (lessThan(declared, rule.required)) {
      out.push({ name, declared, required: rule.required, reason: rule.reason || '' });
    }
  }
  return out;
}

if (REPORT) {
  if (!manifest) { console.log('No package.json found in this directory.'); process.exit(0); }
  const v = findViolations();
  if (!v.length) { console.log('All dependencies satisfy the approved-version policy.'); process.exit(0); }
  console.log('Dependencies that violate the approved-version policy:\n');
  for (const x of v) {
    console.log(`  - ${x.name}: ${x.declared}  ->  must be >= ${x.required}` + (x.reason ? `\n      reason: ${x.reason}` : ''));
  }
  console.log('\nBump these in package.json to the required version (or higher).');
  process.exit(0);
}

let input = '';
try { input = fs.readFileSync(0, 'utf8'); } catch {}
let payload = {};
try { payload = JSON.parse(input || '{}'); } catch {}
const command = payload?.tool_input?.command || '';

if (!/\bgit\s+commit\b/.test(command)) process.exit(0);
const v = findViolations();
if (!v.length) process.exit(0);

const lines = v.map(x => `  - ${x.name}: ${x.declared} -> must be >= ${x.required}` + (x.reason ? `  (${x.reason})` : ''));
console.error(
  `\nCommit blocked by dependency-governance policy.\n\n${lines.join('\n')}\n\n` +
  `Fix these versions in package.json (ask the dependency-governor agent for help), then commit again.\n`
);
process.exit(2);
