'use client';

import { Input } from '@design/components';
import type { Cents } from '@shared/types';
import { useEffect, useRef, useState } from 'react';
import { centsToEditableValue, parseMoneyInput } from './format';

interface MoneyInputProps {
  label: string;
  value: Cents | null;
  onChange: (value: Cents | null) => void;
  required?: boolean;
  error?: string;
  wrapperClassName?: string;
}

export function MoneyInput({
  label,
  value,
  onChange,
  required,
  error,
  wrapperClassName,
}: MoneyInputProps) {
  const [text, setText] = useState(() => centsToEditableValue(value));
  const lastEmitted = useRef<Cents | null>(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(centsToEditableValue(value));
      lastEmitted.current = value;
    }
  }, [value]);

  return (
    <Input
      label={label}
      required={required}
      inputMode="decimal"
      placeholder="0,00"
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = parseMoneyInput(raw);
        lastEmitted.current = parsed;
        onChange(parsed);
      }}
      {...(error !== undefined ? { error } : {})}
      {...(wrapperClassName !== undefined ? { wrapperClassName } : {})}
    />
  );
}
