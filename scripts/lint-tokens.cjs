#!/usr/bin/env node

const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative, resolve, sep } = require('node:path');

const ROOT = resolve(__dirname, '..');

const TOKEN_SCAN_DIRS = [resolve(ROOT, 'app/src'), resolve(ROOT, 'design')];
const LINE_CAP_SCAN_DIRS = [
  ...TOKEN_SCAN_DIRS,
  resolve(ROOT, 'server/src'),
  resolve(ROOT, 'backoffice/src'),
];

const MAX_LINES = 200;

const isTestOrStory = (p) => /\.(test|spec|stories)\.(tsx?|jsx?)$/.test(p);
const isTokenSource = (p) => p.includes(`${sep}design${sep}tokens${sep}`);
const isStylesFile = (p) => p.endsWith('.styles.ts') || p.endsWith('.styles.tsx');

const rules = [
  {
    name: 'T1: no inline style={}',
    pattern: /\bstyle=\{/,
    skipFile: (p) => isStylesFile(p) || isTestOrStory(p),
    skipLine: () => false,
    hint: 'Move styling into the co-located *.styles.ts (tailwind-variants), built from token utilities.',
  },
  {
    name: 'T2: no raw hex colour',
    pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/,
    skipFile: (p) => isTokenSource(p),
    skipLine: (line) => /^\s*(?:\/\/|\*|\{\/\*)/.test(line),
    hint: 'Colours are tokens. Use the token utility (bg-…, text-…, border-…) mapped into the Tailwind theme; hex belongs only under design/tokens/.',
  },
  {
    name: 'T3: no arbitrary Tailwind value',
    pattern: /-\[[^\]]*(?:\d\s*(?:px|rem|em|dvh|svh|vh|vw|%)|#[0-9a-fA-F])[^\]]*\]/,
    skipFile: (p) => isTokenSource(p),
    skipLine: (line) => /^\s*(?:\/\/|\*|\{\/\*)/.test(line),
    hint: 'Raw px/rem/%/hex values belong only under design/tokens/. Use a token utility; if the token does not exist, stop and ask — do not add one to unblock yourself.',
  },
];

const TOP_LEVEL_COMPONENT_RE =
  /^(?:export\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9]*)\s*(?:\(|=\s*(?:\(|\(?\s*[A-Za-z{]))/gm;

function findComponentDeclarations(src) {
  const matches = [...src.matchAll(TOP_LEVEL_COMPONENT_RE)];
  const decls = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const name = match[1];
    const start = match.index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;
    const body = src.slice(start, end);
    if (
      /return\s*\(\s*</.test(body) ||
      /=>\s*\(?\s*</.test(body) ||
      /<[A-Z][A-Za-z0-9]*[\s/>]/.test(body)
    ) {
      const line = src.slice(0, start).split('\n').length;
      decls.push({ name, line });
    }
  }
  return decls;
}

function findMultiComponentViolations(src, rel, file) {
  if (isTestOrStory(file) || !file.endsWith('.tsx')) return [];
  const decls = findComponentDeclarations(src);
  if (decls.length < 2) return [];
  return decls.slice(1).map((decl) => ({
    file: rel,
    line: decl.line,
    rule: 'T4: one component per file',
    hint: `File declares multiple React components (${decls.map((d) => d.name).join(', ')}). Extract "${decl.name}" into its own folder per the design/components convention.`,
    snippet: decl.name,
  }));
}

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      out.push(full);
    }
  }
}

const tokenFiles = [];
for (const d of TOKEN_SCAN_DIRS) walk(d, tokenFiles);

const capFiles = [];
for (const d of LINE_CAP_SCAN_DIRS) walk(d, capFiles);

const violations = [];

for (const file of tokenFiles) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, 'utf-8');
  const lines = src.split('\n');

  violations.push(...findMultiComponentViolations(src, rel, file));

  for (const rule of rules) {
    if (rule.skipFile(file)) continue;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (rule.skipLine(line)) continue;
      if (rule.pattern.test(line)) {
        violations.push({
          file: rel,
          line: i + 1,
          rule: rule.name,
          hint: rule.hint,
          snippet: line.trim().slice(0, 160),
        });
      }
    }
  }
}

for (const file of capFiles) {
  if (isTestOrStory(file)) continue;
  const src = readFileSync(file, 'utf-8');
  const count = src.split('\n').length;
  if (count > MAX_LINES) {
    violations.push({
      file: relative(ROOT, file),
      line: MAX_LINES,
      rule: `T5: file over ${MAX_LINES} lines`,
      hint: `${count} lines. Split before it grows: extract components, hooks or utils into their own files.`,
      snippet: '',
    });
  }
}

const scanned = new Set([...tokenFiles, ...capFiles]).size;

if (violations.length === 0) {
  console.log(`[lint-tokens] ${scanned} files scanned — clean.`);
  process.exit(0);
}

console.error(
  `[lint-tokens] ${violations.length} violation${violations.length === 1 ? '' : 's'}:\n`,
);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    rule : ${v.rule}`);
  if (v.snippet) console.error(`    code : ${v.snippet}`);
  console.error(`    fix  : ${v.hint}\n`);
}
process.exit(1);
