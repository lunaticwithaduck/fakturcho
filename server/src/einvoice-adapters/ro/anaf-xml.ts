function attr(xml: string, name: string): string | undefined {
  return xml.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function errorMessages(xml: string): string[] {
  const messages: string[] = [];
  for (const match of xml.matchAll(/<Errors[^>]*\berrorMessage="([^"]*)"/g)) {
    if (match[1]) messages.push(match[1]);
  }
  return messages;
}

export interface AnafUploadResponse {
  executionStatus: number | undefined;
  uploadIndex: string | undefined;
  errors: string[];
}

export function parseUploadResponse(xml: string): AnafUploadResponse {
  const status = attr(xml, 'ExecutionStatus');
  return {
    executionStatus: status === undefined ? undefined : Number(status),
    uploadIndex: attr(xml, 'index_incarcare'),
    errors: errorMessages(xml),
  };
}

export interface AnafMessageStateResponse {
  state: string | undefined;
  downloadId: string | undefined;
  errors: string[];
}

export function parseMessageStateResponse(xml: string): AnafMessageStateResponse {
  return {
    state: attr(xml, 'stare'),
    downloadId: attr(xml, 'id_descarcare'),
    errors: errorMessages(xml),
  };
}
