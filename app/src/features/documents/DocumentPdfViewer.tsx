import { getDocumentPreviewUrl, getDocumentRenderUrl } from '@app/api';
import { Button } from '@design/components';
import type { DocumentStatus } from '@shared/types';
import { useTranslations } from 'next-intl';
import { canDownloadDocument } from './documentDownload';

interface DocumentPdfViewerProps {
  documentId: string;
  title: string;
  status: DocumentStatus;
  updatedAt: string;
}

export function DocumentPdfViewer({
  documentId,
  title,
  status,
  updatedAt,
}: DocumentPdfViewerProps) {
  const t = useTranslations('documents.view');
  const previewUrl = `${getDocumentPreviewUrl(documentId)}&v=${encodeURIComponent(updatedAt)}`;
  const canDownload = canDownloadDocument(status);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
        <iframe
          key={`${documentId}-${status}-${updatedAt}`}
          src={previewUrl}
          title={title}
          className="h-120 w-full sm:h-160 lg:h-192"
        />
      </div>
      {canDownload ? (
        <Button variant="secondary" size="sm" asChild className="self-start">
          <a href={getDocumentRenderUrl(documentId)} download>
            {t('downloadPdf')}
          </a>
        </Button>
      ) : (
        <p className="text-sm text-text-muted">{t('draftPreviewNotice')}</p>
      )}
    </div>
  );
}
