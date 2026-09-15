// Minimal, dependency-free helpers for reading the small, fixed-shape SOAP responses
// AEAT/FACe return. Not a general XML parser: it assumes well-formed, non-attribute-
// bearing text content, which is all these two response schemas ever carry.

function tagPattern(localName: string): RegExp {
  return new RegExp(
    `<(?:[\\w.-]+:)?${localName}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</(?:[\\w.-]+:)?${localName}>)`,
  );
}

export function extractTagText(xml: string, localName: string): string | null {
  const match = tagPattern(localName).exec(xml);
  if (!match) return null;
  return (match[1] ?? '').trim();
}

// Returns the raw inner XML of every non-nested occurrence of `localName` — good enough
// for flat repeated blocks like RespuestaLinea, which never contain another
// RespuestaLinea.
export function extractBlocks(xml: string, localName: string): string[] {
  const pattern = new RegExp(
    `<(?:[\\w.-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${localName}>`,
    'g',
  );
  const blocks: string[] = [];
  let match = pattern.exec(xml);
  while (match) {
    blocks.push(match[1] ?? '');
    match = pattern.exec(xml);
  }
  return blocks;
}

export function isSoapFault(xml: string): boolean {
  return /<(?:[\w.-]+:)?Fault[\s>]/.test(xml);
}

export function soapFaultMessage(xml: string): string {
  return (
    extractTagText(xml, 'faultstring') ??
    extractTagText(xml, 'Reason') ??
    extractTagText(xml, 'Text') ??
    'SOAP fault with no faultstring'
  );
}
