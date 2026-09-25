import { renderInline } from './renderInline';
import type { GuideBlock as GuideBlockData, Inline } from './types';

function inlineKey(inline: Inline): string {
  return inline.map((run) => run.text).join('');
}

export function GuideBlock({ block }: { block: GuideBlockData }) {
  if (block.type === 'p') {
    return (
      <p className="text-base leading-relaxed text-text-muted">{renderInline(block.inline)}</p>
    );
  }
  if (block.type === 'h3') {
    return <h3 className="text-lg font-semibold text-text">{block.text}</h3>;
  }
  if (block.type === 'ul') {
    return (
      <ul className="flex list-disc flex-col gap-1 pl-5 text-base leading-relaxed text-text-muted">
        {block.items.map((item) => (
          <li key={inlineKey(item)}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'ol') {
    return (
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-base leading-relaxed text-text-muted">
        {block.items.map((item) => (
          <li key={inlineKey(item)}>{renderInline(item)}</li>
        ))}
      </ol>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {block.head.map((cell) => (
              <th
                key={cell}
                className="border-b border-border-strong px-3 py-2 text-left font-semibold text-text"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell) => (
                <td key={cell} className="border-b border-border px-3 py-2 text-text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
