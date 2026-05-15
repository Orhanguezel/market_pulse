'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/googleMaps';

type Suggestion = {
  description: string;
  place_id: string;
  main: string;
  secondary: string;
};

type Props = {
  value: string;
  onChange: (city: string) => void;
  className?: string;
  placeholder?: string;
  /** ISO ülke kodu (varsayılan TR). Türkiye dışı için 'us', 'de' vs. */
  country?: string;
  disabled?: boolean;
};

export default function CityAutocomplete({
  value,
  onChange,
  className,
  placeholder = 'Şehir ara…',
  country = 'tr',
  disabled,
}: Props) {
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const serviceRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Google Maps SDK'yı yükle (lazy)
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled) return;
        serviceRef.current = new g.maps.places.AutocompleteService();
        sessionRef.current = new g.maps.places.AutocompleteSessionToken();
      })
      .catch(() => {
        // API key yok ya da load fail → input fallback olarak çalışır
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dış tıklama → kapat
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function fetchPredictions(query: string) {
    const svc = serviceRef.current;
    const token = sessionRef.current;
    if (!svc || !query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    svc.getPlacePredictions(
      {
        input: query,
        sessionToken: token,
        types: ['(cities)'],
        componentRestrictions: country ? { country } : undefined,
        language: 'tr',
      },
      (preds: any[] | null) => {
        setLoading(false);
        if (!preds) {
          setSuggestions([]);
          return;
        }
        setSuggestions(
          preds.slice(0, 6).map((p) => ({
            description: p.description,
            place_id: p.place_id,
            main: p.structured_formatting?.main_text || p.description,
            secondary: p.structured_formatting?.secondary_text || '',
          })),
        );
      },
    );
  }

  // Debounced fetch
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    setOpen(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchPredictions(v), 200);
  }

  function pickSuggestion(s: Suggestion) {
    onChange(s.main);
    setOpen(false);
    setSuggestions([]);
    // Yeni session — Google billing best practice
    loadGoogleMaps()
      .then((g) => {
        sessionRef.current = new g.maps.places.AutocompleteSessionToken();
      })
      .catch(() => {});
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--gm-muted)">
          <MapPin size={16} />
        </span>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => value && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full bg-(--gm-bg-deep) border border-(--gm-border-soft) rounded-xl pl-11 pr-10 py-3.5 text-sm text-(--gm-text) placeholder:text-(--gm-muted) focus:border-(--gm-gold)/50 outline-none transition-colors ${
            className || ''
          }`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-(--gm-gold-deep)">
            <Loader2 size={14} className="animate-spin" />
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 left-0 right-0 max-h-72 overflow-y-auto rounded-xl border border-(--gm-border-soft) bg-(--gm-surface) shadow-card divide-y divide-(--gm-border-soft)/50">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-4 py-3 hover:bg-(--gm-gold)/5 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-(--gm-gold-deep) mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-(--gm-text) truncate">{s.main}</div>
                    {s.secondary && (
                      <div className="text-xs text-(--gm-muted) truncate">{s.secondary}</div>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
