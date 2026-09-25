import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseGuideMarkdown, parseInline, slugify, stripInline } from './guides-md-to-json.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(SCRIPT_DIR, 'guides-md-to-json.mjs');
const FIXTURE_PATH = join(SCRIPT_DIR, '__fixtures__', 'fixture-country.md');

const tempDirs = [];
function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'guides-md-to-json-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseGuideMarkdown', () => {
  const raw = readFileSync(FIXTURE_PATH, 'utf-8');
  const guide = parseGuideMarkdown(raw, 'fixture-country.md');

  it('parses the frontmatter', () => {
    expect(guide.country).toBe('DE');
    expect(guide.locale).toBe('de');
    expect(guide.slug).toBe('fixture-guide-slug');
    expect(guide.title).toBe('Fixture guide title | Fakturcho');
    expect(guide.h1).toBe('Fixture guide H1');
    expect(guide.answer).toContain('fixture forty to sixty word direct answer');
  });

  it('extracts lastReviewed from a DD.MM.YYYY date in the body', () => {
    expect(guide.lastReviewed).toBe('2026-09-25');
  });

  it('prefers the frontmatter lastReviewed over any earlier date in the body', () => {
    const withLegalDate = raw
      .replace(/^answer:/m, 'lastReviewed: 2026-09-25\nanswer:')
      .replace(/\n## /, '\nIn force since 31.12.2024.\n\n## ');
    expect(parseGuideMarkdown(withLegalDate, 'fixture-country.md').lastReviewed).toBe('2026-09-25');
  });

  it('builds body sections with stable ids, excluding FAQ and CTA', () => {
    expect(guide.sections.map((s) => s.heading)).toEqual([
      'Fixture section one',
      'Fixture section two',
    ]);
    expect(guide.sections.map((s) => s.id)).toEqual(['fixture-section-one', 'fixture-section-two']);
  });

  it('folds the pre-H2 preamble into the first section', () => {
    const firstBlock = guide.sections[0].blocks[0];
    expect(firstBlock.type).toBe('p');
    expect(firstBlock.inline[0].text).toContain('Fixture intro paragraph before the first H2');
  });

  it('parses bold and link runs inside a paragraph', () => {
    const paragraph = guide.sections[0].blocks[1];
    expect(paragraph.type).toBe('p');
    expect(paragraph.inline).toContainEqual({ text: 'bold run', bold: true });
    expect(paragraph.inline).toContainEqual({
      text: 'fixture link',
      href: 'https://example.com/fixture',
    });
  });

  it('parses a GitHub-style table with bold stripped to plain text', () => {
    const table = guide.sections[0].blocks[2];
    expect(table.type).toBe('table');
    expect(table.head).toEqual(['Column A', 'Column B']);
    expect(table.rows).toEqual([
      ['row1a', 'row1b'],
      ['row2a', 'row2b'],
    ]);
  });

  it('parses a bullet list with a link inside an item', () => {
    const list = guide.sections[0].blocks[3];
    expect(list.type).toBe('ul');
    expect(list.items[0]).toEqual([{ text: 'fixture bullet one' }]);
    expect(list.items[1]).toContainEqual({ text: 'a link', href: 'https://example.com/bullet' });
  });

  it('parses an H3 subsection followed by an ordered list', () => {
    const heading = guide.sections[0].blocks[4];
    const orderedList = guide.sections[0].blocks[5];
    expect(heading).toEqual({ type: 'h3', text: 'Fixture subsection' });
    expect(orderedList.type).toBe('ol');
    expect(orderedList.items).toHaveLength(2);
  });

  it('parses the FAQ heading and entries', () => {
    expect(guide.faqHeading).toBe('Fixture FAQ heading');
    expect(guide.faq).toHaveLength(2);
    expect(guide.faq[0].question).toBe('Fixture question one?');
    expect(guide.faq[0].answer).toContainEqual({ text: 'emphasis', bold: true });
    expect(guide.faq[1].question).toBe('Fixture question two?');
  });

  it('parses the CTA heading and body', () => {
    expect(guide.cta.heading).toBe('Fixture CTA heading');
    expect(guide.cta.body[0].text).toContain('Fixture CTA body sentence');
  });

  it('strips the trailing SOURCES comment from the published content', () => {
    const serialized = JSON.stringify(guide);
    expect(serialized).not.toContain('SOURCES');
    expect(serialized).not.toContain('example.com/source');
    expect(serialized).not.toContain('fixture claim');
  });

  it('fails loudly on a missing required frontmatter field', () => {
    const broken = raw.replace('h1: Fixture guide H1\n', '');
    expect(() => parseGuideMarkdown(broken, 'broken.md')).toThrow(/h1/);
  });

  it('fails loudly on an unknown locale', () => {
    const broken = raw.replace('locale: de\n', 'locale: xx\n');
    expect(() => parseGuideMarkdown(broken, 'broken.md')).toThrow(/locale/);
  });
});

describe('slugify', () => {
  it('lowercases, strips diacritics and hyphenates', () => {
    expect(slugify('Über uns & Rechnungsnummer')).toBe('uber-uns-rechnungsnummer');
    expect(slugify('Kleinbetragsrechnung – 250 €')).toBe('kleinbetragsrechnung-250');
  });

  it('falls back to a fully-numeric slug for non-Latin headings', () => {
    expect(slugify('Често задавани въпроси')).toBe('');
  });
});

describe('parseInline / stripInline', () => {
  it('parses plain text with no markup as a single run', () => {
    expect(parseInline('plain text')).toEqual([{ text: 'plain text' }]);
  });

  it('strips markup for table cells', () => {
    expect(stripInline('**bold** and [a link](https://example.com)')).toBe('bold and a link');
  });
});

describe('CLI end to end', () => {
  it('converts a source dir of <cc>.md files into <cc>.json plus a regenerated index.ts', () => {
    const srcDir = makeTempDir();
    const outDir = makeTempDir();
    writeFileSync(join(srcDir, 'de.md'), readFileSync(FIXTURE_PATH, 'utf-8'));

    execFileSync(process.execPath, [SCRIPT_PATH, '--src', srcDir, '--out', outDir], {
      stdio: 'pipe',
    });

    expect(existsSync(join(outDir, 'de.json'))).toBe(true);
    const written = JSON.parse(readFileSync(join(outDir, 'de.json'), 'utf-8'));
    expect(written.slug).toBe('fixture-guide-slug');

    const index = readFileSync(join(outDir, 'index.ts'), 'utf-8');
    expect(index).toContain("import guide0 from './de.json';");
    expect(index).toContain(
      'export const GUIDE_MODULES: GuideContent[] = [\n  guide0,\n] as GuideContent[];',
    );
  });

  it('regenerates an empty index.ts when the source dir does not exist', () => {
    const outDir = makeTempDir();
    mkdirSync(outDir, { recursive: true });
    execFileSync(
      process.execPath,
      [SCRIPT_PATH, '--src', join(outDir, 'does-not-exist'), '--out', outDir],
      { stdio: 'pipe' },
    );
    const index = readFileSync(join(outDir, 'index.ts'), 'utf-8');
    expect(index).toContain('export const GUIDE_MODULES: GuideContent[] = [] as GuideContent[];');
  });
});
