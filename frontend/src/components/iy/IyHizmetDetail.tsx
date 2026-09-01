import Link from 'next/link';
import { Check, ChevronDown } from 'lucide-react';
import type { HizmetContent, HizmetSection } from '@/lib/hizmet-content';
import { IY_SURFACE_STYLE } from './iy-data';

function Section({ section }: { section: HizmetSection }) {
  switch (section.type) {
    case 'richText':
      return (
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#0f172a]">{section.heading}</h2>
          <div className="mt-4 space-y-4">
            {section.body.map((p, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-[#475569]">{p}</p>
            ))}
          </div>
        </div>
      );
    case 'cards':
      return (
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0f172a]">{section.heading}</h2>
            {section.intro && <p className="mx-auto mt-3 max-w-2xl text-[15px] text-[#64748b]">{section.intro}</p>}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((it, i) => (
              <div key={i} className="rounded-2xl border border-[#edf0f4] bg-white p-6">
                <h3 className="text-[16px] font-bold text-[#0f172a]">{it.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'steps':
      return (
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0f172a]">{section.heading}</h2>
            {section.intro && <p className="mx-auto mt-3 max-w-2xl text-[15px] text-[#64748b]">{section.intro}</p>}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {section.steps.map((st) => (
              <div key={st.n} className="rounded-2xl border border-[#edf0f4] bg-[#f8fafc] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1e40af] text-lg font-bold text-white">{st.n}</span>
                <h3 className="mt-4 text-[16px] font-bold text-[#0f172a]">{st.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'bullets':
      return (
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#0f172a]">{section.heading}</h2>
          {section.intro && <p className="mt-3 text-[15px] text-[#64748b]">{section.intro}</p>}
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {section.items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-[#edf0f4] bg-white p-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcfce7]">
                  <Check className="h-4 w-4 text-[#166534]" />
                </span>
                <span className="text-[14px] leading-relaxed text-[#1e293b]">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'faq':
      return (
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#0f172a]">{section.heading}</h2>
          <div className="mt-5 space-y-3">
            {section.items.map((it, i) => (
              <details key={i} className="group rounded-xl border border-[#edf0f4] bg-white p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-[#0f172a]">
                  {it.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#1e40af] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-[#475569]">{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function IyHizmetDetail({ content }: { content: HizmetContent }) {
  const { hero, sections, closingCTA } = content;

  return (
    <div style={IY_SURFACE_STYLE} className="bg-[#eaeaea] text-[#0f172a]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e40af] py-20 text-white">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-9">
          {hero.eyebrow && (
            <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-semibold text-[#93c5fd]">
              {hero.eyebrow}
            </span>
          )}
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.12]">
            {hero.title}
          </h1>
          {hero.lead && <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/80">{hero.lead}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {hero.primaryCTA?.label && (
              <Link href={hero.primaryCTA.href || '#'} className="rounded-xl bg-white px-7 py-3.5 text-center text-[15px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
                {hero.primaryCTA.label}
              </Link>
            )}
            {hero.secondaryCTA?.label && (
              <Link href={hero.secondaryCTA.href || '#'} className="rounded-xl border border-white/50 px-7 py-3.5 text-center text-[15px] font-semibold text-white hover:bg-white/10">
                {hero.secondaryCTA.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="space-y-14 py-16">
        {sections.map((s, i) => (
          <section key={i} className="px-5 lg:px-9">
            <Section section={s} />
          </section>
        ))}
      </div>

      {/* Closing CTA */}
      {closingCTA?.heading && (
        <section className="bg-gradient-to-br from-[#0f172a] to-[#1e40af] py-16 text-center text-white">
          <div className="mx-auto max-w-3xl px-5 lg:px-9">
            <h2 className="text-2xl font-bold leading-snug text-white sm:text-[30px]">{closingCTA.heading}</h2>
            {closingCTA.body && <p className="mt-4 text-[15px] leading-relaxed text-white/80">{closingCTA.body}</p>}
            {closingCTA.button?.label && (
              <div className="mt-8">
                <Link href={closingCTA.button.href || '#'} className="inline-block rounded-xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
                  {closingCTA.button.label}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
