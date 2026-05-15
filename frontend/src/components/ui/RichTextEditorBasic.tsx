// =============================================================
// FILE: src/components/ui/RichTextEditorBasic.tsx
// – Basit Rich Text Editor (HTML tabanlı + toolbar)
// =============================================================

import React, { useEffect, useRef } from 'react';

export type RichTextEditorBasicProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
};

export const RichTextEditorBasic: React.FC<RichTextEditorBasicProps> = ({
  value,
  onChange,
  disabled,
  minHeight = 220,
  maxHeight = 600,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Dışarıdan gelen value değiştiğinde editörü senkronize et
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    onChange(e.currentTarget.innerHTML);
  };

  const focusEditor = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const exec = (command: string, value?: string) => {
    if (disabled) return;
    // mousedown'da focus kaybını engelle
    focusEditor();
    try {
      document.execCommand(command, false, value);
    } catch {
      // bazı browserlarda desteklenmeyen komutlar olabilir – sessiz geç
    }
  };

  const handleToolbarMouseDown = (
    e: React.MouseEvent<HTMLButtonElement>,
    command: string,
    value?: string,
  ) => {
    e.preventDefault(); // butonun focus almasını engelle
    exec(command, value);
  };

  return (
    <div className="border rounded">
      {/* Toolbar */}
      <div className="border-bottom bg-light px-2 py-1 d-flex flex-wrap gap-1">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
          title="Kalın (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
          title="İtalik (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
          title="Altı çizili (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')}
          title="Madde işaretli liste"
        >
          ••
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')}
          title="Numaralı liste"
        >
          1.
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'p')}
          title="Paragraf"
        >
          P
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'h2')}
          title="Başlık 1"
        >
          H1
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'h3')}
          title="Başlık 2"
        >
          H2
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'removeFormat')}
          title="Biçimlendirmeyi temizle"
        >
          Temizle
        </button>
      </div>

      {/* Editör alanı */}
      <div
        ref={ref}
        className="px-2 py-2"
        style={{
          minHeight,
          maxHeight,
          overflowY: 'auto',
          backgroundColor: disabled ? '#f8f9fa' : undefined,
        }}
        contentEditable={!disabled}
        onInput={handleInput}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
      />
    </div>
  );
};
