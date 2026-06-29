import { IY_SURFACE_STYLE } from './iy-data';

/** Pazarlama alt sayfaları için IY mavi hero başlığı (İletişim, Teklif Al, yasal vb.). */
export default function IyPageHeader({
  eyebrow, title, subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section style={IY_SURFACE_STYLE} className="bg-gradient-to-br from-[#0f172a] to-[#1e40af] py-14 text-white">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-9">
        {eyebrow && (
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-[#93c5fd]">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/80">{subtitle}</p>}
      </div>
    </section>
  );
}
