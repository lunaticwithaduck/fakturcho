import { GuideBlock } from './GuideBlock';
import type { GuideBlock as GuideBlockData, GuideSection } from './types';

function blockKey(block: GuideBlockData): string {
  if (block.type === 'p') return `p-${block.inline.map((run) => run.text).join('')}`;
  if (block.type === 'h3') return `h3-${block.text}`;
  if (block.type === 'table') return `table-${block.head.join('|')}`;
  if (block.type === 'tip') return `tip-${block.inline.map((run) => run.text).join('')}`;
  const firstItem = block.items[0]?.map((run) => run.text).join('') ?? '';
  return `${block.type}-${firstItem}`;
}

export function GuideSections({ sections }: { sections: readonly GuideSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="flex scroll-mt-20 flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">{section.heading}</h2>
          {section.blocks.map((block) => (
            <GuideBlock key={blockKey(block)} block={block} />
          ))}
        </section>
      ))}
    </>
  );
}
