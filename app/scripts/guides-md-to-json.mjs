#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SRC_DIR = join(SCRIPT_DIR, '..', '..', 'guides-drafts');
const DEFAULT_OUT_DIR = join(SCRIPT_DIR, '..', 'src', 'features', 'guides', 'content');

const KNOWN_LOCALES = new Set(['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro', 'es']);
const KNOWN_COUNTRIES = new Set(['BG', 'DE', 'FR', 'IT', 'PL', 'RO', 'ES', 'EU']);
const COUNTRY_FILES = ['bg', 'de', 'fr', 'it', 'pl', 'ro', 'es', 'eu'];
const FALLBACK_LAST_REVIEWED = '2026-09-25';

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC_DIR, out: DEFAULT_OUT_DIR };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src') args.src = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function fail(file, message) {
  throw new Error(`[guides-md-to-json] ${file}: ${message}`);
}

function splitFrontmatter(raw, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) fail(file, 'missing --- frontmatter block');
  return { frontmatterText: match[1] ?? '', body: match[2] ?? '' };
}

function parseFrontmatterFields(text) {
  const data = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '') continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

function parseFrontmatter(text, file) {
  const data = parseFrontmatterFields(text);
  const required = ['country', 'locale', 'slug', 'title', 'description', 'h1', 'answer'];
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      fail(file, `frontmatter is missing required field "${field}"`);
    }
  }
  if (!KNOWN_LOCALES.has(data.locale)) {
    fail(file, `frontmatter locale "${data.locale}" is not a published locale`);
  }
  if (!KNOWN_COUNTRIES.has(data.country)) {
    fail(file, `frontmatter country "${data.country}" is not a known guide country`);
  }
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    fail(file, `frontmatter slug "${data.slug}" must be ascii kebab-case`);
  }
  return data;
}

function stripSourcesComment(body) {
  return body.replace(/<!--\s*SOURCES[\s\S]*$/, '').trimEnd();
}

function stripHtmlComments(body) {
  return body.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function extractLastReviewed(body) {
  const dotOrSlash = /\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/.exec(body);
  if (dotOrSlash) {
    const [, day, month, year] = dotOrSlash;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(body);
  if (iso) return iso[0];
  return FALLBACK_LAST_REVIEWED;
}

const DIACRITIC_MAP = {
  ß: 'ss',
  ł: 'l',
  Ł: 'L',
  ø: 'o',
  Ø: 'O',
  đ: 'd',
  Đ: 'D',
  ı: 'i',
};

function slugify(text) {
  const replaced = [...text].map((ch) => DIACRITIC_MAP[ch] ?? ch).join('');
  const normalized = replaced.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug;
}

function uniqueId(base, used) {
  const id = base === '' ? 'section' : base;
  if (!used.has(id)) {
    used.add(id);
    return id;
  }
  let index = 2;
  while (used.has(`${id}-${index}`)) index++;
  const unique = `${id}-${index}`;
  used.add(unique);
  return unique;
}

const INLINE_RE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;

function parseInline(text) {
  const runs = [];
  let lastIndex = 0;
  INLINE_RE.lastIndex = 0;
  let match = INLINE_RE.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      runs.push({ text: match[1], href: match[2] });
    } else if (match[3] !== undefined) {
      runs.push({ text: match[3], bold: true });
    }
    lastIndex = INLINE_RE.lastIndex;
    match = INLINE_RE.exec(text);
  }
  if (lastIndex < text.length) runs.push({ text: text.slice(lastIndex) });
  return runs.filter((run) => run.text !== '');
}

function stripInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim();
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => stripInline(cell.trim()));
}

function isSeparatorRow(line) {
  const cells = splitTableRow(line);
  return cells.every((cell) => /^:?-+:?$/.test(cell));
}

function parseBlocks(lines, file) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (line === '') {
      i++;
      continue;
    }
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h3) {
      blocks.push({ type: 'h3', text: h3[1].trim() });
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const headLine = tableLines[0];
      if (!headLine) fail(file, 'empty table block');
      const head = splitTableRow(headLine);
      const dataLines = tableLines.slice(1).filter((row, idx) => idx > 0 || !isSeparatorRow(row));
      const rows = dataLines.filter((row) => !isSeparatorRow(row)).map(splitTableRow);
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    if (/^>/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const text = quoteLines
        .join(' ')
        .trim()
        .replace(/^Tip:\s*/i, '');
      blocks.push({ type: 'tip', inline: parseInline(text) });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      let current = '';
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        if (itemLine === '') break;
        const marker = /^[-*]\s+(.*)$/.exec(itemLine);
        if (marker) {
          if (current !== '') items.push(current);
          current = marker[1];
        } else if (
          /^###\s+/.test(itemLine) ||
          itemLine.startsWith('|') ||
          /^\d+\.\s+/.test(itemLine)
        ) {
          break;
        } else {
          current = `${current} ${itemLine}`;
        }
        i++;
      }
      if (current !== '') items.push(current);
      blocks.push({ type: 'ul', items: items.map(parseInline) });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      let current = '';
      while (i < lines.length) {
        const itemLine = lines[i].trim();
        if (itemLine === '') break;
        const marker = /^\d+\.\s+(.*)$/.exec(itemLine);
        if (marker) {
          if (current !== '') items.push(current);
          current = marker[1];
        } else if (
          /^###\s+/.test(itemLine) ||
          itemLine.startsWith('|') ||
          /^[-*]\s+/.test(itemLine)
        ) {
          break;
        } else {
          current = `${current} ${itemLine}`;
        }
        i++;
      }
      if (current !== '') items.push(current);
      blocks.push({ type: 'ol', items: items.map(parseInline) });
      continue;
    }
    const paragraphLines = [];
    while (i < lines.length) {
      const paragraphLine = lines[i].trim();
      if (
        paragraphLine === '' ||
        paragraphLine.startsWith('|') ||
        /^###\s+/.test(paragraphLine) ||
        /^[-*]\s+/.test(paragraphLine) ||
        /^\d+\.\s+/.test(paragraphLine)
      ) {
        break;
      }
      paragraphLines.push(paragraphLine);
      i++;
    }
    blocks.push({ type: 'p', inline: parseInline(paragraphLines.join(' ')) });
  }
  return blocks;
}

function splitH2Groups(body) {
  const lines = body.split('\n');
  const groups = [{ heading: null, lines: [] }];
  for (const raw of lines) {
    const h2 = /^##\s+(.*)$/.exec(raw);
    if (h2) {
      groups.push({ heading: h2[1].trim(), lines: [] });
      continue;
    }
    groups[groups.length - 1].lines.push(raw);
  }
  return groups;
}

function parseFaq(lines) {
  const entries = [];
  let currentQuestion = null;
  let buffer = [];
  const flush = () => {
    if (currentQuestion !== null) {
      const text = buffer.join(' ').trim();
      entries.push({ question: currentQuestion, answer: parseInline(text) });
    }
    buffer = [];
  };
  for (const raw of lines) {
    const h3 = /^###\s+(.*)$/.exec(raw.trim());
    if (h3) {
      flush();
      currentQuestion = h3[1].trim();
      continue;
    }
    const line = raw.trim();
    if (line === '') continue;
    buffer.push(line);
  }
  flush();
  return entries;
}

function parseGuideMarkdown(raw, file) {
  const { frontmatterText, body } = splitFrontmatter(raw, file);
  const frontmatter = parseFrontmatter(frontmatterText, file);
  const cleanBody = stripSourcesComment(body);
  const lastReviewed = /^\d{4}-\d{2}-\d{2}$/.test(frontmatter.lastReviewed ?? '')
    ? frontmatter.lastReviewed
    : extractLastReviewed(cleanBody);

  const groups = splitH2Groups(cleanBody);
  const preamble = groups[0];
  const h2Groups = groups.slice(1);
  if (h2Groups.length < 3) {
    fail(file, 'expected at least one body H2 section plus an FAQ H2 and a CTA H2');
  }
  const ctaGroup = h2Groups[h2Groups.length - 1];
  const faqGroup = h2Groups[h2Groups.length - 2];
  const bodyGroups = h2Groups.slice(0, -2);

  const firstBody = bodyGroups[0];
  if (preamble.lines.some((l) => l.trim() !== '') && firstBody) {
    firstBody.lines = [...preamble.lines, ...firstBody.lines];
  }

  const usedIds = new Set();
  const sections = bodyGroups.map((group) => ({
    heading: group.heading,
    id: uniqueId(slugify(group.heading ?? ''), usedIds),
    blocks: parseBlocks(group.lines, file),
  }));

  const faq = parseFaq(faqGroup.lines);
  const ctaText = ctaGroup.lines
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ');

  return {
    country: frontmatter.country,
    locale: frontmatter.locale,
    slug: frontmatter.slug,
    title: frontmatter.title,
    description: frontmatter.description,
    h1: frontmatter.h1,
    answer: frontmatter.answer,
    lastReviewed,
    sections,
    faqHeading: faqGroup.heading,
    faq,
    cta: { heading: ctaGroup.heading, body: parseInline(ctaText) },
  };
}

function regenerateIndex(outDir, options = {}) {
  const {
    typeName = 'GuideContent',
    typeImportPath = '../types',
    exportName = 'GUIDE_MODULES',
    prefix = 'guide',
  } = options;
  const files = existsSync(outDir)
    ? readdirSync(outDir)
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];
  const identifiers = files.map((_file, i) => `${prefix}${i}`);
  const importLines = files.map((file, i) => `import ${identifiers[i]} from './${file}';`);
  const arrayExpr =
    files.length > 0 ? `[\n${identifiers.map((id) => `  ${id},`).join('\n')}\n]` : '[]';
  const typeImportLine = `import type { ${typeName} } from '${typeImportPath}';`;
  const lines = [typeImportLine];
  if (importLines.length > 0) {
    lines.push('', ...importLines);
  }
  lines.push('', `export const ${exportName}: ${typeName}[] = ${arrayExpr} as ${typeName}[];`, '');
  writeFileSync(join(outDir, 'index.ts'), lines.join('\n'));
  return files.length;
}

function main() {
  const { src, out } = parseArgs(process.argv.slice(2));
  if (!existsSync(out)) mkdirSync(out, { recursive: true });

  let written = 0;
  if (existsSync(src)) {
    for (const cc of COUNTRY_FILES) {
      const file = join(src, `${cc}.md`);
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, 'utf-8');
      const guide = parseGuideMarkdown(raw, `${cc}.md`);
      writeFileSync(join(out, `${cc}.json`), `${JSON.stringify(guide, null, 2)}\n`);
      written++;
      console.log(
        `[guides-md-to-json] wrote ${cc}.json (${guide.sections.length} sections, ${guide.faq.length} FAQ entries)`,
      );
    }
  } else {
    console.log(`[guides-md-to-json] source dir ${src} does not exist — skipping conversion`);
  }

  const total = regenerateIndex(out);
  console.log(`[guides-md-to-json] index.ts now lists ${total} guide(s)`);
  if (written === 0 && total === 0) {
    console.log(
      '[guides-md-to-json] no guides converted (drafts not available yet) — registry stays empty',
    );
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) main();

export {
  main,
  parseBlocks,
  parseFaq,
  parseFrontmatterFields,
  parseGuideMarkdown,
  parseInline,
  regenerateIndex,
  slugify,
  splitFrontmatter,
  splitH2Groups,
  stripHtmlComments,
  stripInline,
  uniqueId,
};
