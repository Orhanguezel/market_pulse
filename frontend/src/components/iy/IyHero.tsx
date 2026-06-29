'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { iyTeklifHref, IY_SURFACE_STYLE } from './iy-data';

const TYPING = [
  'Müşteri Bilgilerine Anında Ulaşın',
  'Otomasyonlar ile Vakit Kazanın',
  'Kağıtsız Çalışın. İstediğiniz Yerden Çalışın.',
];

function useTyping(phrases: string[]) {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const full = phrases[idx % phrases.length];
    let timer: ReturnType<typeof setTimeout>;
    if (!del && text === full) {
      timer = setTimeout(() => setDel(true), 1600);
    } else if (del && text === '') {
      setDel(false);
      setIdx((i) => i + 1);
    } else {
      timer = setTimeout(
        () => {
          setText((t) =>
            del ? full.slice(0, t.length - 1) : full.slice(0, t.length + 1),
          );
        },
        del ? 35 : 70,
      );
    }
    return () => clearTimeout(timer);
  }, [text, del, idx, phrases]);

  return text;
}

export default function IyHero({ locale }: { locale?: string }) {
  const l = locale || 'tr';
  const typed = useTyping(TYPING);
  const signUpUrl = 'https://isletmeniyonet.com/salecrm/sign-up.php';

  return (
    <section
      style={IY_SURFACE_STYLE}
      className="relative overflow-hidden bg-[#eaeaea]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: 'url(/iy/homeBg.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-[#eaeaea]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-[1320px] flex-col items-center justify-center px-5 py-20 text-center lg:px-9">
        <span className="mb-5 inline-block rounded-full bg-[#eff6ff] px-4 py-1.5 text-[13px] font-semibold text-[#1e40af]">
          5.0 Teknoloji Akıllı İşletme
        </span>
        <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-[#0f172a] sm:text-4xl lg:text-[52px] lg:leading-[1.1]">
          5.0 Teknoloji Akıllı İşletme,
          <br />
          <span className="bg-gradient-to-r from-[#071fb2] via-[#1e40af] to-[#4dabff] bg-clip-text text-transparent">
            {typed}
            <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-[#1e40af] align-middle" style={{ height: '0.9em' }} />
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-[#475569] sm:text-lg">
          Firmanız için İhtiyaç Duyduğunuz Tüm Çözümler Tek Platformda
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <a
            href={signUpUrl}
            className="rounded-xl bg-[#1e40af] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[#1e40af]/25 hover:bg-[#15317f]"
          >
            Ücretsiz Denemeye Başla
          </a>
          <Link
            href={iyTeklifHref(l)}
            className="rounded-xl border-2 border-[#111827] px-7 py-3.5 text-[15px] font-semibold text-[#111827] hover:bg-[#111827] hover:text-white"
          >
            Demo Talep Et
          </Link>
        </div>
      </div>
    </section>
  );
}
