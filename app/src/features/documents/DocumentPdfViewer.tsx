import { getDocumentPreviewUrl, getDocumentRenderUrl } from '@app/api';
import { Button } from '@design/components';
import type { DocumentStatus } from '@shared/types';
import { canDownloadDocument } from './documentDownload';

interface DocumentPdfViewerProps {
  documentId: string;
  title: string;
  status: DocumentStatus;
}

export function DocumentPdfViewer({ documentId, title, status }: DocumentPdfViewerProps) {
  const previewUrl = getDocumentPreviewUrl(documentId);
  const canDownload = canDownloadDocument(status);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
        <iframe src={previewUrl} title={title} className="h-120 w-full sm:h-160 lg:h-192" />
      </div>
      {canDownload ? (
        <Button variant="secondary" size="sm" asChild className="self-start">
          <a href={getDocumentRenderUrl(documentId)} download>
            Изтегли PDF
          </a>
        </Button>
      ) : (
        <p className="text-sm text-text-muted">
          Черновата се показва само като преглед с воден знак. Издайте документа, за да го изтеглите
          или изпратите.
        </p>
      )}
    </div>
  );
}
