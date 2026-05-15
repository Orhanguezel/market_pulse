'use client';

// =============================================================
// FILE: src/components/common/AdminJsonEditor.tsx
// FINAL — JSON Editor (shadcn)
// - Monospace textarea
// - Blur'da parse edip onChange (valid JSON only)
// - Error state + helper
// =============================================================

import React, { useEffect, useState } from 'react';
import { Braces } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type AdminJsonEditorProps = {
  label?: React.ReactNode;
  value: unknown;
  onChange: (next: any) => void;
  onErrorChange?: (err: string | null) => void;
  disabled?: boolean;
  helperText?: React.ReactNode;
  height?: number;
};

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '';
  }
};

export const AdminJsonEditor: React.FC<AdminJsonEditorProps> = ({
  label,
  value,
  onChange,
  onErrorChange,
  disabled,
  helperText,
  height = 260,
}) => {
  const [text, setText] = useState<string>(() => safeStringify(value));
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    setText(safeStringify(value));
  }, [value]);

  const handleBlur = () => {
    const trimmed = text.trim();

    if (!trimmed) {
      const parsed: any = {};
      onChange(parsed);
      setInternalError(null);
      onErrorChange?.(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setInternalError(null);
      onErrorChange?.(null);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'Geçersiz JSON';
      setInternalError(msg);
      onErrorChange?.(msg);
    }
  };

  const error = internalError;

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm">{label}</Label>
          <Badge variant="secondary" className="gap-1">
            <Braces className="size-3.5" />
            JSON editor
          </Badge>
        </div>
      ) : null}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          'font-mono text-xs leading-5',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
        style={{
          minHeight: height,
          whiteSpace: 'pre',
          fontFamily:
            "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      />

      {helperText && !error ? (
        <div className="text-xs text-muted-foreground">{helperText}</div>
      ) : null}

      {error ? (
        <div className="text-xs text-destructive">
          JSON hatası: <span className="font-medium">{error}</span>
        </div>
      ) : null}
    </div>
  );
};
