import Link from 'next/link';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { IY_BRAND, IY_FOOTER_COLUMNS, iyLinkHref, iyTeklifHref, IY_DARK_SURFACE_STYLE } from './iy-data';

export default function IyFooter({ locale }: { locale?: string }) {
  const l = locale || 'tr';
  const signInUrl = 'https://isletmeniyonet.com/salecrm/sign-in.php';

  return (
    <footer
      style={IY_DARK_SURFACE_STYLE}
      className="mt-16 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-[#cbd5e1]"
    >
      <div className="mx-auto max-w-[1320px] px-5 lg:px-9">
        {/* CTA banner (overlaps) */}
        <div className="-translate-y-9 rounded-3xl bg-gradient-to-br from-[#1e40af] to-[#2563eb] px-6 py-9 shadow-[0_24px_60px_rgba(30,64,175,0.35)] sm:px-10">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <h3 className="max-w-2xl text-xl font-bold leading-snug text-white sm:text-2xl">
              İhracat, CRM ve B2B müşteri bulma sürecinizi birlikte planlayalım
            </h3>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href={iyTeklifHref(l)}
                className="rounded-xl bg-white px-6 py-3 text-center text-sm font-semibold text-[#1e40af] hover:bg-[#eff6ff]"
              >
                Teklif Al
              </Link>
              <a
                href={signInUrl}
                className="rounded-xl border border-white/60 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
              >
                Giriş Yap
              </a>
            </div>
          </div>
        </div>

        {/* Main footer */}
        <div className="grid grid-cols-1 gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[#60a5fa] to-[#2563eb] text-base font-extrabold text-white">
                İ
              </span>
              <span className="text-[18px] font-extrabold text-white">
                İşletmeni<span className="text-[#60a5fa]">Yönet</span>
              </span>
            </div>
            <p className="mb-3 text-sm font-medium text-[#60a5fa]">{IY_BRAND.tagline}</p>
            <p className="mb-4 text-[13.5px] leading-relaxed text-[#94a3b8]">
              {IY_BRAND.description}
            </p>
            <ul className="space-y-2 text-[13.5px]">
              <li>
                <a href={`mailto:${IY_BRAND.email}`} className="flex items-center gap-2 hover:text-white">
                  <Mail className="h-4 w-4 text-[#60a5fa]" /> {IY_BRAND.email}
                </a>
              </li>
              <li>
                <a href={`mailto:${IY_BRAND.email2}`} className="flex items-center gap-2 hover:text-white">
                  <Mail className="h-4 w-4 text-[#60a5fa]" /> {IY_BRAND.email2}
                </a>
              </li>
              <li>
                <a href={`tel:+${IY_BRAND.phoneRaw}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 text-[#60a5fa]" /> {IY_BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={IY_BRAND.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 text-[#25d366]" /> WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Columns */}
          {IY_FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[14px] font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={iyLinkHref(l, link)}
                      className="text-[13.5px] text-[#94a3b8] hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-[13px] text-[#94a3b8] md:flex-row">
          <p>© 2019 - 2026 İşletmeniYönet. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href={`/${l}`} className="hover:text-white">TR</Link>
            <span className="opacity-30">|</span>
            <a href={signInUrl} className="hover:text-white">Giriş Yap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
