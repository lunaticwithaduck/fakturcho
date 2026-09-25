// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KsefNumberField } from './KsefNumberField';

const setKsefNumber = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve() });

vi.mock('@app/api', () => ({
  useSetDocumentKsefNumberMutation: () => [setKsefNumber, { isLoading: false }],
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderField(ksefNumber: string | null = null) {
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <KsefNumberField documentId="doc-1" ksefNumber={ksefNumber} />
    </NextIntlClientProvider>,
  );
}

describe('KsefNumberField', () => {
  it('starts empty when no KSeF number is saved yet', () => {
    renderField(null);
    expect(screen.getByLabelText('Номер в KSeF')).toHaveProperty('value', '');
  });

  it('pre-fills the input with the saved KSeF number', () => {
    renderField('1234563218-20260905-010203ABCDEF-4A5B6C-7D');
    expect(screen.getByLabelText('Номер в KSeF')).toHaveProperty(
      'value',
      '1234563218-20260905-010203ABCDEF-4A5B6C-7D',
    );
  });

  it('saves the trimmed pasted number', () => {
    renderField(null);
    fireEvent.change(screen.getByLabelText('Номер в KSeF'), {
      target: { value: '  1234563218-20260905-010203ABCDEF-4A5B6C-7D  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    expect(setKsefNumber).toHaveBeenCalledWith({
      id: 'doc-1',
      ksefNumber: '1234563218-20260905-010203ABCDEF-4A5B6C-7D',
    });
  });

  it('saves null when the field is cleared', () => {
    renderField('1234563218-20260905-010203ABCDEF-4A5B6C-7D');
    fireEvent.change(screen.getByLabelText('Номер в KSeF'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    expect(setKsefNumber).toHaveBeenCalledWith({ id: 'doc-1', ksefNumber: null });
  });
});
