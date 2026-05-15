// =============================================================
// FILE: src/components/common/RichContentEditor.tsx
// – Zengin HTML Editörü + Canlı Önizleme (depsiz)
//  - contentEditable tabanlı WYSIWYG
//  - Tablo ve Resim ekleme butonları
//  - Kaynak (HTML) sekmesi
//  - Önizleme anlık güncellenir
//  - Eski {"html":"..."} kayıtlarını otomatik düz HTML'e çevirir
//
// FIXES (FINAL):
//  - ✅ H2/H3 buton label/arg düzeltildi
//  - ✅ formatBlock arg: <p>, <h2>, <h3>
//  - ✅ insertHtmlAtCursor caret davranışı iyileştirildi
// =============================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';

export type RichContentEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: string;
  /**
   * Opsiyonel image upload hook'u.
   * Storage modülüne upload edip public URL döndürmek için kullanabilirsin.
   */
  onUploadImage?: (file: File) => Promise<string>;
};

type ActiveTab = 'visual' | 'source';

const DEFAULT_HEIGHT = '260px';

function normalizeLegacyHtmlValue(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as any;
      if (parsed && typeof parsed.html === 'string') return parsed.html;
    } catch {
      // parse edilemezse olduğu gibi bırak
    }
  }
  return raw;
}

function insertHtmlAtCursor(html: string) {
  if (typeof window === 'undefined') return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let lastNode: ChildNode | null = null;

  while (temp.firstChild) {
    lastNode = temp.firstChild;
    frag.appendChild(temp.firstChild);
  }

  range.insertNode(frag);

  // caret: inserted content sonrası
  if (lastNode) {
    const after = document.createRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }
}

const RichContentEditor: React.FC<RichContentEditorProps> = ({
  label = 'İçerik',
  value,
  onChange,
  disabled = false,
  height = DEFAULT_HEIGHT,
  onUploadImage,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('visual');
  const [html, setHtml] = useState<string>(normalizeLegacyHtmlValue(value));

  // dış value sync + legacy normalize
  useEffect(() => {
    const normalized = normalizeLegacyHtmlValue(value);
    setHtml(normalized);

    if (editorRef.current && activeTab === 'visual') {
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized || '';
      }
    }

    // legacy json -> plain html normalize
    if (
      typeof value === 'string' &&
      value.trim().startsWith('{') &&
      value.trim().endsWith('}') &&
      normalized !== value
    ) {
      onChange(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // tab switch sync
  useEffect(() => {
    if (activeTab === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== html) editorRef.current.innerHTML = html || '';
    }
  }, [activeTab, html]);

  const propagateChange = (next: string) => {
    setHtml(next);
    onChange(next);
  };

  const handleVisualInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    const next = e.currentTarget.innerHTML;
    propagateChange(next);
  };

  const focusEditor = () => editorRef.current?.focus();

  const exec = (command: string, valueArg?: string) => {
    if (disabled) return;
    if (typeof document === 'undefined') return;

    focusEditor();
    try {
      document.execCommand(command, false, valueArg);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
    } catch {
      // sessiz geç
    }
  };

  const handleToolbarMouseDown = (
    e: React.MouseEvent<HTMLButtonElement>,
    command: string,
    valueArg?: string,
  ) => {
    e.preventDefault();

    if (disabled) return;
    if (activeTab !== 'visual') return;

    if (command === 'insertTable') {
      focusEditor();
      const tableHtml =
        '<table class="table table-bordered"><thead><tr><th>Başlık 1</th><th>Başlık 2</th></tr></thead><tbody><tr><td>Hücre 1</td><td>Hücre 2</td></tr></tbody></table><p></p>';
      insertHtmlAtCursor(tableHtml);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
      return;
    }

    if (command === 'insertImage') {
      // upload varsa file picker
      if (onUploadImage && fileInputRef.current) {
        fileInputRef.current.click();
        return;
      }

      // yoksa URL prompt
      if (typeof window !== 'undefined') {
        const url = window.prompt("Resim URL'si girin:");
        if (url && url.trim()) {
          const safeUrl = url.trim();
          const imgHtml = `<img src="${safeUrl}" alt="" class="img-fluid" style="max-width: 100%; height: auto;" />`;
          focusEditor();
          insertHtmlAtCursor(imgHtml);
          if (editorRef.current) propagateChange(editorRef.current.innerHTML);
        }
      }
      return;
    }

    if (command === 'formatBlock') {
      exec(command, valueArg);
      return;
    }

    exec(command, valueArg);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadImage) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const url = await onUploadImage(file);
      if (!url) return;

      const safeAlt = file.name.replace(/"/g, '&quot;');
      const imgHtml = `<img src="${url}" alt="${safeAlt}" class="img-fluid" style="max-width: 100%; height: auto;" />`;

      focusEditor();
      insertHtmlAtCursor(imgHtml);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
    } catch {
      // parent isterse toast basar
    }
  };

  return (
    <div className="mt-3">
      {label && <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>}

      {/* Tabs */}
      <div className="flex border-b mb-1 text-sm">
        <button
          type="button"
          className={`px-3 py-1 border-0 rounded-t ${
            activeTab === 'visual'
              ? 'bg-bg-card-hover font-semibold text-gray-900'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          onClick={() => setActiveTab('visual')}
          disabled={disabled}
        >
          Görsel editör
        </button>
        <button
          type="button"
          className={`px-3 py-1 border-0 rounded-t ${
            activeTab === 'source'
              ? 'bg-bg-card-hover font-semibold text-gray-900'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          onClick={() => setActiveTab('source')}
          disabled={disabled}
        >
          Kaynak (HTML)
        </button>
      </div>

      <div className="border rounded relative">
        {/* Toolbar */}
        <div className="border-b bg-bg-card px-2 py-1 flex flex-wrap gap-1 text-sm">
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
            disabled={disabled || activeTab !== 'visual'}
            title="Kalın"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
            disabled={disabled || activeTab !== 'visual'}
            title="İtalik"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
            disabled={disabled || activeTab !== 'visual'}
            title="Altı çizili"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>

          <span className="w-px h-auto bg-gray-300 mx-1" />

          {/* formatBlock */}
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<p>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Paragraf"
          >
            P
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<h2>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Başlık (H2)"
          >
            H2
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<h3>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Alt başlık (H3)"
          >
            H3
          </button>

          <span className="w-px h-auto bg-gray-300 mx-1" />

          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')}
            disabled={disabled || activeTab !== 'visual'}
            title="Madde işaretli liste"
          >
            ••
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')}
            disabled={disabled || activeTab !== 'visual'}
            title="Numaralı liste"
          >
            1.
          </button>

          <span className="w-px h-auto bg-gray-300 mx-1" />

          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertTable')}
            disabled={disabled || activeTab !== 'visual'}
            title="Tablo ekle"
          >
            Tbl
          </button>

          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertImage')}
            disabled={disabled || activeTab !== 'visual'}
            title={onUploadImage ? 'Resim yükle ve ekle' : "Resim URL'si ile ekle"}
          >
            Resim
          </button>

          <span className="w-px h-auto bg-gray-300 mx-1" />

          <button
            type="button"
            className="px-2 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-gray-300 rounded hover:bg-bg-card"
            onMouseDown={(e) => handleToolbarMouseDown(e, 'removeFormat')}
            disabled={disabled || activeTab !== 'visual'}
            title="Biçimlendirmeyi temizle"
          >
            Temizle
          </button>

          {onUploadImage && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          )}
        </div>

        {/* Editor */}
        {activeTab === 'visual' ? (
          <div
            ref={editorRef}
            className="px-2 py-2"
            style={{
              minHeight: height,
              maxHeight: '600px',
              overflowY: 'auto',
              backgroundColor: disabled ? '#f8f9fa' : '#ffffff',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
            contentEditable={!disabled}
            onInput={handleVisualInput}
            suppressContentEditableWarning
          />
        ) : (
          <textarea
            className="w-full px-2 py-2 border-0 font-mono text-sm focus:outline-none"
            style={{ height, maxHeight: '600px', resize: 'vertical' }}
            value={html}
            onChange={(e) => propagateChange(e.target.value)}
            disabled={disabled}
            placeholder="<p>HTML içeriği buraya yaz...</p>"
          />
        )}
      </div>

      <div className="mt-1 text-xs text-text-muted">
        <ul className="mb-0 pl-3">
          <li>
            <strong>Görsel editör</strong> sekmesinde tablo, başlık, liste vb. zengin içeriği
            düzenleyebilirsin.
          </li>
          <li>
            <strong>Kaynak (HTML)</strong> sekmesinde ham HTML’i görüp düzenleyebilirsin.
          </li>
          <li>
            <strong>Tbl</strong> butonu varsayılan bir tablo ekler.
          </li>
          <li>
            <strong>Resim</strong> butonu{' '}
            {onUploadImage
              ? 'dosya seçip upload eder ve URL ile ekler.'
              : "resim URL'si ister ve o URL’yi ekler."}
          </li>
        </ul>
      </div>

      {/* Live Preview */}
      <div className="mt-3">
        <div className="text-xs text-text-muted mb-1">Önizleme</div>
        <div
          className="border rounded p-2 bg-bg-card"
          style={{
            minHeight: '120px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
          }}
        >
          {html && html.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="text-text-muted text-xs mb-0">
              Henüz içerik yok. Yazdıkça burada anlık olarak gözükecek.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichContentEditor;
