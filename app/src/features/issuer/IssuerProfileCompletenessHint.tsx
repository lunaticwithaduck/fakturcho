import { Card } from '@design/components';
import type { IssuerProfileDto } from '@shared/types';
import { getMissingIssuerFields } from './issuerCompleteness';

interface IssuerProfileCompletenessHintProps {
  profile: IssuerProfileDto;
}

export function IssuerProfileCompletenessHint({ profile }: IssuerProfileCompletenessHintProps) {
  const missing = getMissingIssuerFields(profile);
  if (missing.length === 0) return null;

  return (
    <Card className="flex flex-col gap-1 border-warning-border bg-warning-subtle">
      <p className="text-sm font-semibold text-warning">Профилът не е готов за издаване</p>
      <p className="text-sm text-text-muted">
        Допълнете следните полета, за да можете да издавате документи: {missing.join(', ')}.
      </p>
    </Card>
  );
}
