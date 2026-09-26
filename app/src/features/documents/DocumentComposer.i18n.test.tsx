// @vitest-environment jsdom
import * as api from '@app/api';
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type {
  CatalogueItemDto,
  ClientDto,
  DocumentDto,
  IssuerProfileDto,
  IssuerSnapshotDto,
  RecipientSnapshotDto,
} from '@shared/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComposerCorrectionReasonField } from './ComposerCorrectionReasonField';
import { ComposerDetailsFields } from './ComposerDetailsFields';
import { ComposerDiscountRow } from './ComposerDiscountRow';
import { ComposerFrMentionsFields } from './ComposerFrMentionsFields';
import { ComposerOriginalDocumentField } from './ComposerOriginalDocumentField';
import { ComposerVatSection } from './ComposerVatSection';
import type { DiscountFormState } from './composerState';
import { DocumentComposerPage } from './DocumentComposerPage';

vi.mock('@app/api', () => ({
  useListDocumentsQuery: vi.fn(),
  useGetDocumentQuery: vi.fn(),
  useSaveDraftMutation: vi.fn(),
  useUpdateDraftMutation: vi.fn(),
  useGetIssuerProfileQuery: vi.fn(),
  useListCatalogueItemsQuery: vi.fn(),
  useListClientsQuery: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

const ISSUER_SNAPSHOT: IssuerSnapshotDto = {
  companyName: null,
  eik: null,
  mol: null,
  addressLine: null,
  street: null,
  postcode: null,
  countyRegion: null,
  city: null,
  country: null,
  phone: null,
  vatRegistered: null,
  vatNumber: null,
  bankName: null,
  iban: null,
  bic: null,
  altIban: null,
  identifiers: {},
};

const RECIPIENT_SNAPSHOT: RecipientSnapshotDto = {
  companyName: null,
  eik: null,
  vatNumber: null,
  address: null,
  street: null,
  postcode: null,
  countyRegion: null,
  city: null,
  country: null,
  email: null,
  mol: null,
  sdiRecipientCode: null,
  pec: null,
};

const BASE_DOCUMENT: DocumentDto = {
  id: 'doc-1',
  documentType: 'invoice',
  status: 'draft',
  number: null,
  numberPrefix: null,
  numberSuffix: null,
  referenceNumber: null,
  originalDocumentId: null,
  issuedAt: null,
  taxEventAt: null,
  dueAt: null,
  validUntil: null,
  deliveryDate: null,
  buyerReference: null,
  paymentMeansCode: null,
  paymentTermsNote: null,
  transportReason: null,
  transportedAt: null,
  carrierName: null,
  transportNote: null,
  correctionReason: null,
  subtotal: 0,
  discountTotal: 0,
  amount: 0,
  vatIncluded: false,
  vatRateBp: 0,
  vatAmount: 0,
  vatExemptionGround: null,
  currency: 'EUR',
  clientId: null,
  preparedBy: null,
  notes: null,
  emailText: null,
  emailedAt: null,
  templateId: 'classic',
  documentLanguage: null,
  issuer: ISSUER_SNAPSHOT,
  recipient: RECIPIENT_SNAPSHOT,
  lineItems: [],
  discounts: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ISSUER_PROFILE: IssuerProfileDto = {
  id: 'issuer-1',
  companyName: 'Тест ЕООД',
  eik: '123456789',
  mol: null,
  addressLine: null,
  street: null,
  postcode: null,
  countyRegion: null,
  city: null,
  country: 'BG',
  phone: null,
  vatRegistered: true,
  vatNumber: 'BG123456789',
  bankName: null,
  iban: null,
  bic: null,
  altIban: null,
  peppolEndpointId: null,
  peppolScheme: null,
  identifiers: {},
  vatOnCashBasis: false,
  vatOnDebits: false,
  defaultPaymentTermsDays: null,
};

const CATALOGUE_ITEMS: CatalogueItemDto[] = [
  { id: 'cat-1', name: 'Консултация', defaultUnitPrice: 10000, unit: 'бр.', unitCode: null },
];

const CLIENTS: ClientDto[] = [
  {
    id: 'client-1',
    companyName: 'Клиент ООД',
    eik: null,
    vatNumber: null,
    address: null,
    street: null,
    postcode: null,
    countyRegion: null,
    city: null,
    country: 'BG',
    documentLanguage: null,
    email: null,
    mol: null,
    peppolEndpointId: null,
    peppolScheme: null,
    sdiRecipientCode: null,
    pec: null,
  },
];

function renderWithLocale(locale: 'bg' | 'en', node: ReactNode) {
  const messages = locale === 'bg' ? bgMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );
}

function renderComposerPage(locale: 'bg' | 'en', documentId?: string) {
  return renderWithLocale(
    locale,
    <DocumentComposerPage {...(documentId !== undefined ? { documentId } : {})} />,
  );
}

beforeEach(() => {
  vi.mocked(api.useListClientsQuery).mockReturnValue({
    data: CLIENTS,
    isLoading: false,
  } as unknown as ReturnType<typeof api.useListClientsQuery>);
  vi.mocked(api.useListCatalogueItemsQuery).mockReturnValue({
    data: CATALOGUE_ITEMS,
    isLoading: false,
  } as unknown as ReturnType<typeof api.useListCatalogueItemsQuery>);
  vi.mocked(api.useGetIssuerProfileQuery).mockReturnValue({
    data: ISSUER_PROFILE,
    isLoading: false,
  } as unknown as ReturnType<typeof api.useGetIssuerProfileQuery>);
  vi.mocked(api.useSaveDraftMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as unknown as ReturnType<typeof api.useSaveDraftMutation>);
  vi.mocked(api.useUpdateDraftMutation).mockReturnValue([
    vi.fn(),
    { isLoading: false },
  ] as unknown as ReturnType<typeof api.useUpdateDraftMutation>);
  vi.mocked(api.useListDocumentsQuery).mockReturnValue({
    data: { items: [] },
  } as unknown as ReturnType<typeof api.useListDocumentsQuery>);
  vi.mocked(api.useGetDocumentQuery).mockReturnValue({
    data: undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof api.useGetDocumentQuery>);
});

afterEach(cleanup);

describe('DocumentComposerPage — new document', () => {
  it('renders the Bulgarian copy unchanged', async () => {
    renderComposerPage('bg');

    expect(screen.getByRole('heading', { name: 'Нов документ', level: 1 })).toBeTruthy();
    expect(screen.getByText('Клиент')).toBeTruthy();
    expect(screen.getByText('+ Нов клиент')).toBeTruthy();
    expect(screen.getByText('Вид документ')).toBeTruthy();
    expect(screen.getByText('Референтен номер')).toBeTruthy();
    expect(screen.getByText('Данъчно събитие')).toBeTruthy();
    expect(screen.getByText('Падеж')).toBeTruthy();
    expect(screen.getByText('Артикули')).toBeTruthy();
    expect(screen.getByText('Наименование')).toBeTruthy();
    expect(screen.getByText('Количество')).toBeTruthy();
    expect(screen.getByText('Цена')).toBeTruthy();
    expect(screen.getAllByText('Общо').length).toBe(2);
    expect(screen.getByText('Премахни')).toBeTruthy();
    expect(screen.getByText('Добави артикул')).toBeTruthy();
    expect(screen.getByText('Отстъпки')).toBeTruthy();
    expect(screen.getByText('Добави отстъпка')).toBeTruthy();
    expect(screen.getByText('ДДС')).toBeTruthy();
    expect(screen.getByText('Начисли ДДС (20%)')).toBeTruthy();
    expect(screen.getByText('Междинна сума')).toBeTruthy();
    expect(screen.getByText('Данъчна основа')).toBeTruthy();
    expect(screen.getByText('ДДС (20%)')).toBeTruthy();
    expect(screen.getByText('Бележки')).toBeTruthy();
    expect(screen.getByText('Съставил')).toBeTruthy();
    expect(screen.getByText('Запази чернова')).toBeTruthy();
    expect(screen.getByText('Запази и издай')).toBeTruthy();
    expect(screen.getByText('Отказ')).toBeTruthy();

    fireEvent.click(screen.getByText('Запази чернова'));
    expect(
      await screen.findByText(
        'Добавете поне един артикул с попълнени наименование, количество и цена.',
      ),
    ).toBeTruthy();
  });

  it('resolves the English messages without missing-key warnings', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComposerPage('en');

    expect(screen.getByRole('heading', { name: 'New document', level: 1 })).toBeTruthy();
    expect(screen.getByText('Client')).toBeTruthy();
    expect(screen.getByText('+ New client')).toBeTruthy();
    expect(screen.getByText('Document type')).toBeTruthy();
    expect(screen.getByText('Reference number')).toBeTruthy();
    expect(screen.getByText('Tax event date')).toBeTruthy();
    expect(screen.getByText('Due date')).toBeTruthy();
    expect(screen.getByText('Line items')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Quantity')).toBeTruthy();
    expect(screen.getByText('Price')).toBeTruthy();
    expect(screen.getAllByText('Total').length).toBe(2);
    expect(screen.getByText('Remove')).toBeTruthy();
    expect(screen.getByText('Add item')).toBeTruthy();
    expect(screen.getByText('Discounts')).toBeTruthy();
    expect(screen.getByText('Add discount')).toBeTruthy();
    expect(screen.getByText('VAT')).toBeTruthy();
    expect(screen.getByText('Charge VAT (20%)')).toBeTruthy();
    expect(screen.getByText('Subtotal')).toBeTruthy();
    expect(screen.getByText('Tax base')).toBeTruthy();
    expect(screen.getByText('VAT (20%)')).toBeTruthy();
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Prepared by')).toBeTruthy();
    expect(screen.getByText('Save draft')).toBeTruthy();
    expect(screen.getByText('Save and issue')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();

    fireEvent.click(screen.getByText('Save draft'));
    expect(
      await screen.findByText('Add at least one line item with a name, quantity and price.'),
    ).toBeTruthy();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('DocumentComposerPage — empty states', () => {
  it('shows the not-found empty state in Bulgarian', () => {
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('bg', 'missing-1');

    expect(screen.getByText('Документът не е намерен')).toBeTruthy();
    expect(screen.getByText('Към документите')).toBeTruthy();
  });

  it('shows the not-found empty state in English without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('en', 'missing-1');

    expect(screen.getByText('Document not found')).toBeTruthy();
    expect(screen.getByText('Go to documents')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('shows the not-draft empty state in Bulgarian', () => {
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: { ...BASE_DOCUMENT, status: 'sent' },
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('bg', 'doc-1');

    expect(screen.getByText('Само чернови могат да се редактират')).toBeTruthy();
    expect(
      screen.getByText(
        'Този документ вече е издаден и е неизменяем. Издаден документ се коригира с кредитно или дебитно известие.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Към документа')).toBeTruthy();
  });

  it('shows the not-draft empty state in English without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: { ...BASE_DOCUMENT, status: 'sent' },
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('en', 'doc-1');

    expect(screen.getByText('Only drafts can be edited')).toBeTruthy();
    expect(
      screen.getByText(
        'This document has already been issued and is immutable. An issued document is corrected with a credit or debit note.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Go to document')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders the edit title for an existing draft', () => {
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: BASE_DOCUMENT,
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('bg', 'doc-1');

    expect(screen.getByRole('heading', { name: 'Редактиране на документ', level: 1 })).toBeTruthy();
  });
});

describe('ComposerDetailsFields', () => {
  it('renders the Bulgarian labels for invoices and quotes', () => {
    const { unmount } = renderWithLocale(
      'bg',
      <ComposerDetailsFields
        documentType="invoice"
        referenceNumber=""
        taxEventAt=""
        dueAt=""
        paymentTermsDays={null}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Референтен номер')).toBeTruthy();
    expect(screen.getByText('Данъчно събитие')).toBeTruthy();
    expect(screen.getByText('Условия за плащане')).toBeTruthy();
    expect(screen.getByText('Падеж')).toBeTruthy();
    unmount();

    renderWithLocale(
      'bg',
      <ComposerDetailsFields
        documentType="quote"
        referenceNumber=""
        taxEventAt=""
        dueAt=""
        paymentTermsDays={null}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Референтен номер')).toBeTruthy();
    expect(screen.getByText('Валидно до')).toBeTruthy();
  });

  it('renders the English labels without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderWithLocale(
      'en',
      <ComposerDetailsFields
        documentType="invoice"
        referenceNumber=""
        taxEventAt=""
        dueAt=""
        paymentTermsDays={null}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Reference number')).toBeTruthy();
    expect(screen.getByText('Tax event date')).toBeTruthy();
    expect(screen.getByText('Payment terms')).toBeTruthy();
    expect(screen.getByText('Due date')).toBeTruthy();
    unmount();

    renderWithLocale(
      'en',
      <ComposerDetailsFields
        documentType="quote"
        referenceNumber=""
        taxEventAt=""
        dueAt=""
        paymentTermsDays={null}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Reference number')).toBeTruthy();
    expect(screen.getByText('Valid until')).toBeTruthy();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('shows a fixed due date and hides the custom date picker once a day-count term is chosen', () => {
    renderWithLocale(
      'en',
      <ComposerDetailsFields
        documentType="invoice"
        referenceNumber=""
        taxEventAt=""
        dueAt="2026-10-10"
        paymentTermsDays={14}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('14 days')).toBeTruthy();
    expect(screen.queryByText('Due date')).toBeNull();
  });

  it('shows the selected day term even when it is the country cap', () => {
    renderWithLocale(
      'en',
      <ComposerDetailsFields
        documentType="invoice"
        referenceNumber=""
        taxEventAt=""
        dueAt="2026-11-25"
        paymentTermsDays={60}
        maxPaymentTermsDays={60}
        validUntil=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('60 days')).toBeTruthy();
  });
});

describe('ComposerDiscountRow', () => {
  const percentDiscount: DiscountFormState = {
    key: 'd1',
    label: '',
    mode: 'percent',
    percentBp: null,
    amount: null,
  };
  const amountDiscount: DiscountFormState = {
    key: 'd2',
    label: '',
    mode: 'amount',
    percentBp: null,
    amount: null,
  };

  it('renders the Bulgarian copy for both discount modes', () => {
    const { unmount } = renderWithLocale(
      'bg',
      <ComposerDiscountRow discount={percentDiscount} onChange={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getByText('Основание за отстъпка')).toBeTruthy();
    expect(screen.getAllByText('Процент').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Сума').length).toBeGreaterThan(0);
    expect(screen.getByText('Процент %')).toBeTruthy();
    expect(screen.getByText('Премахни')).toBeTruthy();
    unmount();

    renderWithLocale(
      'bg',
      <ComposerDiscountRow discount={amountDiscount} onChange={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getAllByText('Сума').length).toBe(2);
  });

  it('renders the English copy without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderWithLocale(
      'en',
      <ComposerDiscountRow discount={percentDiscount} onChange={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getByText('Discount reason')).toBeTruthy();
    expect(screen.getAllByText('Percent').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Amount').length).toBeGreaterThan(0);
    expect(screen.getByText('Percent %')).toBeTruthy();
    expect(screen.getByText('Remove')).toBeTruthy();
    unmount();

    renderWithLocale(
      'en',
      <ComposerDiscountRow discount={amountDiscount} onChange={() => {}} onRemove={() => {}} />,
    );
    expect(screen.getAllByText('Amount').length).toBe(2);

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('ComposerVatSection', () => {
  it('renders the Bulgarian copy including the exemption ground and required-field error', () => {
    renderWithLocale(
      'bg',
      <ComposerVatSection
        chargeVat={false}
        showChargeToggle
        vatExemptionGround={null}
        grounds={[]}
        ratePercent={20}
        hasGroundError
        onChangeChargeVat={() => {}}
        onChangeGround={() => {}}
      />,
    );
    expect(screen.getByText('ДДС')).toBeTruthy();
    expect(screen.getByText('Начисли ДДС (20%)')).toBeTruthy();
    expect(screen.getByText('Основание за неначисляване на ДДС')).toBeTruthy();
    expect(screen.getByText('Задължително поле')).toBeTruthy();
  });

  it('renders the English copy without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithLocale(
      'en',
      <ComposerVatSection
        chargeVat={false}
        showChargeToggle
        vatExemptionGround={null}
        grounds={[]}
        ratePercent={20}
        hasGroundError
        onChangeChargeVat={() => {}}
        onChangeGround={() => {}}
      />,
    );
    expect(screen.getByText('VAT')).toBeTruthy();
    expect(screen.getByText('Charge VAT (20%)')).toBeTruthy();
    expect(screen.getByText('Reason for not charging VAT')).toBeTruthy();
    expect(screen.getByText('Required field')).toBeTruthy();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('ComposerFrMentionsFields', () => {
  it('renders the Bulgarian copy including the required-field error', () => {
    renderWithLocale(
      'bg',
      <ComposerFrMentionsFields
        operationNature={null}
        deliveryAddress=""
        hasOperationNatureError
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Естество на сделката')).toBeTruthy();
    expect(screen.getByText('Адрес на доставка (ако е различен)')).toBeTruthy();
    expect(screen.getByText('Задължително поле')).toBeTruthy();
  });

  it('renders the English copy without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithLocale(
      'en',
      <ComposerFrMentionsFields
        operationNature={null}
        deliveryAddress=""
        hasOperationNatureError
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Nature of operation')).toBeTruthy();
    expect(screen.getByText('Delivery address (if different)')).toBeTruthy();
    expect(screen.getByText('Required field')).toBeTruthy();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('DocumentComposerPage — FR nature-of-operation visibility', () => {
  it('shows the nature-of-operation field for a French issuer', () => {
    vi.mocked(api.useGetIssuerProfileQuery).mockReturnValue({
      data: { ...ISSUER_PROFILE, country: 'FR' },
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetIssuerProfileQuery>);

    renderComposerPage('en');

    expect(screen.getByText('Nature of operation')).toBeTruthy();
  });

  it('hides the nature-of-operation field for a Bulgarian issuer', () => {
    renderComposerPage('en');

    expect(screen.queryByText('Nature of operation')).toBeNull();
  });
});

describe('ComposerOriginalDocumentField', () => {
  beforeEach(() => {
    vi.mocked(api.useListDocumentsQuery).mockReturnValue({
      data: { items: [] },
    } as unknown as ReturnType<typeof api.useListDocumentsQuery>);
  });

  it('renders the Bulgarian label and required-field error', () => {
    renderWithLocale(
      'bg',
      <ComposerOriginalDocumentField
        documentType="credit_note"
        value={null}
        currentDocumentId={null}
        hasError
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Оригинален документ')).toBeTruthy();
    expect(screen.getByText('Задължително поле')).toBeTruthy();
  });

  it('renders the English label without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithLocale(
      'en',
      <ComposerOriginalDocumentField
        documentType="credit_note"
        value={null}
        currentDocumentId={null}
        hasError
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Original document')).toBeTruthy();
    expect(screen.getByText('Required field')).toBeTruthy();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('ComposerCorrectionReasonField', () => {
  it('renders the Bulgarian label and required hint', () => {
    renderWithLocale('bg', <ComposerCorrectionReasonField value="" required onChange={() => {}} />);
    expect(screen.getByText('Основание за корекцията')).toBeTruthy();
    expect(
      screen.getByText('Задължително за издатели от България, Ирландия и Испания.'),
    ).toBeTruthy();
  });

  it('renders the English label without a hint when not required, without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithLocale(
      'en',
      <ComposerCorrectionReasonField value="" required={false} onChange={() => {}} />,
    );
    expect(screen.getByText('Reason for the correction')).toBeTruthy();
    expect(screen.queryByText('Required for issuers in Bulgaria, Ireland and Spain.')).toBeNull();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('DocumentComposerPage — correction reason field visibility', () => {
  it('shows the correction reason field for a credit note but not for an invoice', () => {
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: { ...BASE_DOCUMENT, documentType: 'credit_note', originalDocumentId: 'doc-0' },
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('en', 'doc-1');
    expect(screen.getByText('Reason for the correction')).toBeTruthy();
  });

  it('does not show the correction reason field for an invoice', () => {
    vi.mocked(api.useGetDocumentQuery).mockReturnValue({
      data: BASE_DOCUMENT,
      isLoading: false,
    } as unknown as ReturnType<typeof api.useGetDocumentQuery>);

    renderComposerPage('en', 'doc-1');
    expect(screen.queryByText('Reason for the correction')).toBeNull();
  });
});
