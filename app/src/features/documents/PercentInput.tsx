'use client';

import { Input } from '@design/components';
import { useEffect, useRef, useState } from 'react';
import { parsePercentInput, percentBpToEditableValue } from './liveTotals';

interface PercentInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

export function PercentInput({ label, value, onChange }: PercentInputProps) {
  const [text, setText] = useState(() => percentBpToEditableValue(value));
  const lastEmitted = useRef<number | null>(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(percentBpToEditableValue(value));
      lastEmitted.current = value;
    }
  }, [value]);

  return (
    <Input
      label={label}
      required
      inputMode="decimal"
      placeholder="0"
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = parsePercentInput(raw);
        lastEmitted.current = parsed;
        onChange(parsed);
      }}
    />
  );
}
