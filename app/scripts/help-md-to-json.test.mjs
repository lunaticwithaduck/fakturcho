import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseHelpMarkdown } from './help-md-to-json.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(SCRIPT_DIR, 'help-md-to-json.mjs');
const FIXTURE_PATH = join(SCRIPT_DIR, '__fixtures__', 'fixture-help.md');

const tempDirs = [];
function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'help-md-to-json-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseHelpMarkdown', () => {
  const raw = readFileSync(FIXTURE_PATH, 'utf-8');
  const help = parseHelpMarkdown(raw, 'fixture-help.md');

  it('parses the frontmatter', () => {
    expect(help.locale).toBe('de');
    expect(help.title).toBe('Fixture help title');
    expect(help.intro).toContain('Fixture forty word introduction');
  });

  it('strips a leading HTML comment from the body', () => {
    const serialized = JSON.stringify(help);
    expect(serialized).not.toContain('editor note');
  });

  it('builds task sections with stable ids, excluding the FAQ', () => {
    expect(help.sections.map((s) => s.heading)).toEqual(['Fixture task one', 'Fixture task two']);
    expect(help.sections.map((s) => s.id)).toEqual(['fixture-task-one', 'fixture-task-two']);
  });

  it('parses numbered steps with inline links and bold runs', () => {
    const steps = help.sections[0].blocks[0];
    expect(steps.type).toBe('ol');
    expect(steps.items[0]).toContainEqual({
      text: 'fixture link',
      href: 'https://example.com/help',
    });
    expect(steps.items[1]).toContainEqual({ text: 'bold', bold: true });
  });

  it('parses a blockquote Tip line as a tip block', () => {
    const tip = help.sections[0].blocks[1];
    expect(tip.type).toBe('tip');
    expect(tip.inline[0].text).toContain('fixture tip callout text.');
  });

  it('parses the FAQ heading and entries', () => {
    expect(help.faqHeading).toBe('Fixture FAQ heading');
    expect(help.faq).toHaveLength(2);
    expect(help.faq[0].question).toBe('Fixture help question one?');
    expect(help.faq[1].answer).toContainEqual({ text: 'emphasis', bold: true });
  });

  it('fails loudly on a missing required frontmatter field', () => {
    const broken = raw.replace('title: Fixture help title\n', '');
    expect(() => parseHelpMarkdown(broken, 'broken.md')).toThrow(/title/);
  });

  it('fails loudly on an unknown locale', () => {
    const broken = raw.replace('locale: de\n', 'locale: xx\n');
    expect(() => parseHelpMarkdown(broken, 'broken.md')).toThrow(/locale/);
  });

  it('fails loudly with fewer than one task section plus an FAQ H2', () => {
    const broken = raw.slice(0, raw.indexOf('## Fixture task two'));
    expect(() => parseHelpMarkdown(broken, 'broken.md')).toThrow(/FAQ/);
  });
});

describe('CLI end to end', () => {
  it('converts a source dir of <locale>.md files into <locale>.json plus a regenerated index.ts', () => {
    const srcDir = makeTempDir();
    const outDir = makeTempDir();
    writeFileSync(join(srcDir, 'de.md'), readFileSync(FIXTURE_PATH, 'utf-8'));

    execFileSync(process.execPath, [SCRIPT_PATH, '--src', srcDir, '--out', outDir], {
      stdio: 'pipe',
    });

    expect(existsSync(join(outDir, 'de.json'))).toBe(true);
    const written = JSON.parse(readFileSync(join(outDir, 'de.json'), 'utf-8'));
    expect(written.title).toBe('Fixture help title');

    const index = readFileSync(join(outDir, 'index.ts'), 'utf-8');
    expect(index).toContain("import help0 from './de.json';");
    expect(index).toContain(
      'export const HELP_MODULES: HelpContent[] = [\n  help0,\n] as HelpContent[];',
    );
  });

  it('regenerates an empty index.ts when the source dir does not exist', () => {
    const outDir = makeTempDir();
    execFileSync(
      process.execPath,
      [SCRIPT_PATH, '--src', join(outDir, 'does-not-exist'), '--out', outDir],
      { stdio: 'pipe' },
    );
    const index = readFileSync(join(outDir, 'index.ts'), 'utf-8');
    expect(index).toContain('export const HELP_MODULES: HelpContent[] = [] as HelpContent[];');
  });
});
