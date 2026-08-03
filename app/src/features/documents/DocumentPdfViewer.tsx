import { getDocumentRenderUrl } from '@app/api';
import { Button } from '@design/components';

interface DocumentPdfViewerProps {
  documentId: string;
  title: string;
}

export function DocumentPdfViewer({ documentId, title }: DocumentPdfViewerProps) {
  const renderUrl = getDocumentRenderUrl(documentId);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
        <iframe src={renderUrl} title={title} className="h-120 w-full sm:h-160 lg:h-192" />
      </div>
      <Button variant="secondary" size="sm" asChild className="self-start">
        <a href={renderUrl} download>
          Изтегли PDF
        </a>
      </Button>
    </div>
  );
}
