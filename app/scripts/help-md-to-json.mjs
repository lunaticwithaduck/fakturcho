#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  parseBlocks,
  parseFaq,
  parseFrontmatterFields,
  regenerateIndex,
  slugify,
  splitFrontmatter,
  splitH2Groups,
  stripHtmlComments,
  uniqueId,
} from './guides-md-to-json.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SRC_DIR = join(SCRIPT_DIR, '..', '..', 'help-drafts');
const DEFAULT_OUT_DIR = join(SCRIPT_DIR, '..', 'src', 'features', 'help', 'content');

const KNOWN_LOCALES = new Set(['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro', 'es']);

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC_DIR, out: DEFAULT_OUT_DIR };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--src') args.src = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function fail(file, message) {
  throw new Error(`[help-md-to-json] ${file}: ${message}`);
}

function parseHelpFrontmatter(text, file) {
  const data = parseFrontmatterFields(text);
  const required = ['locale', 'title', 'intro'];
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      fail(file, `frontmatter is missing required field "${field}"`);
    }
  }
  if (!KNOWN_LOCALES.has(data.locale)) {
    fail(file, `frontmatter locale "${data.locale}" is not a published locale`);
  }
  return data;
}

function parseHelpMarkdown(raw, file) {
  const { frontmatterText, body } = splitFrontmatter(raw, file);
  const frontmatter = parseHelpFrontmatter(frontmatterText, file);
  const cleanBody = stripHtmlComments(body);

  const groups = splitH2Groups(cleanBody);
  const preamble = groups[0];
  const h2Groups = groups.slice(1);
  if (h2Groups.length < 2) {
    fail(file, 'expected at least one task section plus an FAQ H2');
  }
  const faqGroup = h2Groups[h2Groups.length - 1];
  const bodyGroups = h2Groups.slice(0, -1);

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

  return {
    locale: frontmatter.locale,
    title: frontmatter.title,
    intro: frontmatter.intro,
    sections,
    faqHeading: faqGroup.heading,
    faq,
  };
}

function main() {
  const { src, out } = parseArgs(process.argv.slice(2));
  if (!existsSync(out)) mkdirSync(out, { recursive: true });

  let written = 0;
  if (existsSync(src)) {
    for (const locale of KNOWN_LOCALES) {
      const file = join(src, `${locale}.md`);
      if (!existsSync(file)) continue;
      const raw = readFileSync(file, 'utf-8');
      const help = parseHelpMarkdown(raw, `${locale}.md`);
      writeFileSync(join(out, `${locale}.json`), `${JSON.stringify(help, null, 2)}\n`);
      written++;
      console.log(
        `[help-md-to-json] wrote ${locale}.json (${help.sections.length} sections, ${help.faq.length} FAQ entries)`,
      );
    }
  } else {
    console.log(`[help-md-to-json] source dir ${src} does not exist — skipping conversion`);
  }

  const total = regenerateIndex(out, {
    typeName: 'HelpContent',
    exportName: 'HELP_MODULES',
    prefix: 'help',
  });
  console.log(`[help-md-to-json] index.ts now lists ${total} help page(s)`);
  if (written === 0 && total === 0) {
    console.log(
      '[help-md-to-json] no help pages converted (drafts not available yet) — registry stays empty',
    );
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) main();

export { main, parseHelpMarkdown };
