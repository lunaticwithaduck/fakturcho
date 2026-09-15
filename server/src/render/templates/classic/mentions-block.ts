import { escapeHtml } from './html-utils';
import { buildStatutoryMentions, type MentionsInput } from './mentions';

export function buildMentionsBlock(input: MentionsInput): string {
  const mentions = buildStatutoryMentions(input);
  if (mentions.length === 0) return '';
  const rows = mentions.map((text) => `<div>${escapeHtml(text)}</div>`).join('');
  return `<div class="mentions">${rows}</div>`;
}
