import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3, Mail, MessageCircle, Headphones, Globe, Target, Database, Ship,
  ShoppingCart, GraduationCap, Building2, Bot, Check, Phone,
} from 'lucide-react';
import IyHero from './IyHero';
import { iyHref, iyTeklifHref, IY_BRAND, IY_SURFACE_STYLE } from './iy-data';

const modules = [
  { icon: BarChart3, title: 'CRM', text: 'Satış, müşteri ve süreç yönetimi', href: 'crm-yazilimi', accent: true },
  { icon: Mail, title: 'Mail', text: 'Mail adresi bulma ve gönderim', href: 'mail-adresi-bulma', accent: false },
  { icon: MessageCircle, title: 'WhatsApp AI', text: '7/24 yapay zeka yanıt', href: 'yapay-zekali-crm', accent: false },
  { icon: Headphones, title: 'AI Telefon', text: 'Çağrıları yapay zeka karşılar', href: 'telefon-aramalari-ile-musteri-takibi', accent: true },
];

const services = [
  { icon: Globe, title: 'İhracata Hazırlık', text: 'İngilizce firma profili, ürün açıklamaları, web sitesi yapısı, teklif formatı ve ihracat başlangıç süreciniz için hazırlık desteği.', href: 'ihracata-hazirlik-paketi' },
  { icon: Target, title: 'B2B Müşteri Bulma', text: 'GTİP / HS kodu, ürün adı, konşimento verileri, LinkedIn ve karar verici kişi araştırmasıyla hedef müşteri çalışmaları.', href: 'b2b-musteri-bulma-paketi' },
  { icon: BarChart3, title: 'CRM Kurulumu', text: 'Müşteri adayı, teklif, satış aşaması, görev, takip tarihi ve raporlama yapısını CRM üzerinde düzenli hale getirme.', href: 'crm-kurulum-paketi' },
  { icon: Ship, title: 'Dış Ticaret Departmanı', text: 'Müşteri bulma, teklif, proforma, ödeme, nakliye, evrak ve sevkiyat süreçlerinde dışarıdan operasyonel destek.', href: 'dis-ticaret-departmani-paketi' },
  { icon: ShoppingCart, title: 'E-Ticaret ve Pazaryerleri', text: 'Trendyol, Amazon, Etsy, eBay, Alibaba, TradeWheel, Go4WorldBusiness ve Europages süreçleri için mağaza ve ürün yönetimi.', href: 'e-ticaret-ve-pazaryeri-paketi' },
  { icon: GraduationCap, title: 'Kurumsal Eğitimler', text: 'Yapay zeka, ChatGPT, LinkedIn, CRM, ihracat, e-ticaret, mail marketing ve şirket yönetimi eğitimleri.', href: 'kurumsal-egitim-paketi' },
  { icon: Building2, title: 'DYS ve Fuar Teşvikleri', text: 'DYS kayıt kontrolü, fuar destek uygunluğu, evrak listesi, başvuru hazırlığı ve eksik belge takibi.', href: 'dys-ve-fuar-tesvikleri-paketi' },
  { icon: Bot, title: 'Yapay Zeka ve Dijital Dönüşüm', text: 'ChatGPT, yapay zeka araçları, CRM, otomasyon ve dijital süreçlerle şirket yönetimini daha verimli hale getirme.', href: 'kurumsal-dijital-donusum-danismanligi' },
];

const steps = [
  { n: '1', title: 'Ön Değerlendirme', text: 'Şirketinizin mevcut durumu, ürünleri, satış yapısı, ihracat hedefi ve dijital ihtiyaçları değerlendirilir.' },
  { n: '2', title: 'Hizmet Planı', text: 'İhracat, CRM, müşteri bulma, e-ticaret veya eğitim ihtiyacınıza göre uygun hizmet kapsamı belirlenir.' },
  { n: '3', title: 'Uygulama', text: 'Belirlenen çalışma kapsamında içerik, CRM yapısı, müşteri araştırması, eğitim veya operasyon süreci başlatılır.' },
  { n: '4', title: 'Takip ve Raporlama', text: 'Yapılan çalışmalar müşteri listesi, CRM, rapor, takip tarihi veya süreç notlarıyla ölçülebilir hale getirilir.' },
];

const whyUs = [
  'Şirketinizin ihtiyacına göre özel hizmet veya paket yapısı oluşturulur.',
  'B2B müşteri bulma süreci CRM ve takip sistemiyle desteklenir.',
  'İhracat hazırlığı, müşteri bulma ve operasyon süreci birlikte planlanabilir.',
  'Yapay zeka, CRM ve dijital araçlar şirketin günlük işlerine uyarlanabilir.',
  'Kurumsal eğitimlerle ekiplerin uygulama becerisi güçlendirilebilir.',
  'Kesin satış vaadi yerine düzenli, takip edilebilir ve profesyonel süreç kurulmasına odaklanılır.',
];

const packages = [
  { icon: '📌', title: 'İhracata Hazırlık Paketi', text: 'İhracata başlamak isteyen firmalar için web sitesi, İngilizce metin, teklif ve hazırlık süreci.', href: 'ihracata-hazirlik-paketi' },
  { icon: '🔎', title: 'B2B Müşteri Bulma Paketi', text: 'Yurt dışı alıcı firma, karar verici kişi, mail marketing, LinkedIn ve CRM takip süreci.', href: 'b2b-musteri-bulma-paketi' },
  { icon: '⚙️', title: 'CRM Kurulum Paketi', text: 'Müşteri adayı, satış aşaması, teklif, görev, takip tarihi ve raporlama yapısı.', href: 'crm-kurulum-paketi' },
  { icon: '🎓', title: 'Kurumsal Eğitim Paketi', text: 'Yapay zeka, ChatGPT, LinkedIn, CRM, ihracat, e-ticaret ve mail marketing eğitimleri.', href: 'kurumsal-egitim-paketi' },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-[#eff6ff] px-4 py-1.5 text-[13px] font-semibold text-[#1e40af]">
      {children}
    </span>
  );
}

export default function IyHome({ locale }: { locale?: string }) {
  const l = locale || 'tr';

  return (
    <div style={IY_SURFACE_STYLE} className="bg-[#eaeaea] text-[#0f172a]">
      <IyHero locale={l} />

      {/* 2 — Modüller Bar */}
      <section className="bg-gradient-to-b from-white to-[#f8fafc] py-16">
        <div className="mx-auto max-w-[1320px] px-5 text-center lg:px-9">
          <Badge>Akıllı İş Çözümleri</Badge>
          <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold sm:text-3xl">
            Satış, iletişim ve otomasyonu tek merkezden yönetin
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-[#64748b]">
            CRM, e-posta, WhatsApp AI ve telefon otomasyonu ile müşteri süreçlerinizi daha hızlı, ölçülebilir ve profesyonel hale getirin.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <Link
                key={m.title}
                href={iyHref(l, m.href)}
                className={`group rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                  m.accent ? 'border-[#1e40af]/20 bg-[#1e40af] text-white' : 'border-[#edf0f4] bg-white'
                }`}
              >
                <span className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${m.accent ? 'bg-white/15' : 'bg-[#eff6ff]'}`}>
                  <m.icon className={`h-6 w-6 ${m.accent ? 'text-white' : 'text-[#1e40af]'}`} />
                </span>
                <h3 className="text-lg font-bold">{m.title}</h3>
                <p className={`mt-1 text-sm ${m.accent ? 'text-white/80' : 'text-[#64748b]'}`}>{m.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Ana Giriş */}
      <section className="py-16">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-9">
          <div className="rounded-3xl bg-white p-8 shadow-[0_8px_40px_rgba(15,23,42,0.06)] sm:p-12">
            <Badge>İhracat Radarı</Badge>
            <h2 className="mt-4 max-w-3xl text-2xl font-bold leading-snug sm:text-[32px]">
              Şirketiniz İçin İhracat, CRM, B2B Müşteri Bulma ve Dijital Büyüme Çözümleri
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#475569]">
              İhracat Radarı; şirketlerin ihracata hazırlanması, yurt dışı müşteri bulması, CRM ile satış süreçlerini takip etmesi, e-ticaret ve pazaryeri kanallarını düzenlemesi, yapay zeka araçlarını kullanması ve ekiplerini kurumsal eğitimlerle geliştirmesi için hizmet sunar.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#475569]">
              Amacımız, işletmelerin dağınık ilerleyen satış, müşteri takibi, ihracat, teklif, operasyon, eğitim ve dijital dönüşüm süreçlerini daha planlı, ölçülebilir ve yönetilebilir hale getirmektir.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#iy-hizmetler" className="rounded-xl bg-[#1e40af] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#15317f]">
                Hizmetleri İncele
              </a>
              <Link href={iyTeklifHref(l)} className="rounded-xl border border-[#1e40af]/30 px-6 py-3 text-center text-sm font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
                Teklif Al
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — Hizmetlerimiz */}
      <section id="iy-hizmetler" className="py-16">
        <div className="mx-auto max-w-[1320px] px-5 text-center lg:px-9">
          <Badge>Hizmetlerimiz</Badge>
          <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold sm:text-3xl">
            Şirketinizin Büyüme Sürecine Uygun Çözümler
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] text-[#64748b]">
            İhracat, CRM, B2B müşteri bulma, e-ticaret, kurumsal eğitim, DYS ve dijital dönüşüm süreçlerini tek tek değil, şirketinizin genel büyüme sistemi içinde birlikte değerlendiriyoruz.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.title}
                href={iyHref(l, s.href)}
                className="group rounded-2xl border border-[#edf0f4] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#1e40af]/30 hover:shadow-xl"
              >
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#eff6ff] group-hover:bg-[#1e40af]">
                  <s.icon className="h-6 w-6 text-[#1e40af] group-hover:text-white" />
                </span>
                <h3 className="text-[17px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">{s.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — WhatsApp AI */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 lg:grid-cols-2 lg:px-9">
          <div>
            <Badge>WhatsApp AI</Badge>
            <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              Müşterilerinize 7/24 Akıllı Yapay Zeka ile Yanıt Verin
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#475569]">
              Eğitilebilir WhatsApp chatbot ile müşteri sorularını 9 farklı dilde anında cevaplayın, satış fırsatlarını kaçırmayın, destek yükünü azaltın.
            </p>
            <ul className="mt-5 space-y-2.5">
              {['İnsan gibi konuşur', 'Sadece sizin verilerinizle cevap verir', 'Gerekirse insan temsilciye devreder'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14.5px] text-[#1e293b]">
                  <Check className="h-5 w-5 shrink-0 text-[#166534]" /> {f}
                </li>
              ))}
            </ul>
            <Link href={iyHref(l, 'kurumsal-dijital-donusum-danismanligi')} className="mt-7 inline-block rounded-xl bg-[#25d366] px-6 py-3 text-sm font-semibold text-white hover:brightness-95">
              💬 Daha Fazla Bilgi
            </Link>
          </div>
          <div className="overflow-hidden rounded-3xl">
            <Image src="/iy/hero-whatsapp-ai.png" alt="WhatsApp AI" width={720} height={560} className="h-auto w-full object-cover" />
          </div>
        </div>
      </section>

      {/* 6 — AI Telefon */}
      <section className="py-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 lg:grid-cols-2 lg:px-9">
          <div className="order-2 overflow-hidden rounded-3xl lg:order-1">
            <Image src="/iy/ai-phone-hero.png" alt="AI Telefon Asistanı" width={720} height={560} className="h-auto w-full object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <Badge>AI Telefon Asistanı</Badge>
            <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              Müşteri Telefonlarınızı Yapay Zekâ Yanıtlasın
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#475569]">
              7/24, hatasız, yorulmadan. Yapay zekâ destekli telefon asistanımız, 9 farklı dilde gelen çağrıları karşılar ve gerektiğinde canlı operatöre aktarır.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#475569]">
              Çağrı maliyetlerinizi düşürün, müşteri memnuniyetini artırın.
            </p>
            <Link href={iyHref(l, 'kurumsal-dijital-donusum-danismanligi')} className="mt-7 inline-block rounded-xl bg-[#1e40af] px-6 py-3 text-sm font-semibold text-white hover:bg-[#15317f]">
              🎧 Daha Fazla Bilgi
            </Link>
          </div>
        </div>
      </section>

      {/* 7 — Süreç */}
      <section id="iy-surec" className="bg-white py-16">
        <div className="mx-auto max-w-[1320px] px-5 text-center lg:px-9">
          <Badge>Nasıl Çalışıyoruz?</Badge>
          <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold sm:text-3xl">
            Şirketiniz İçin Önce İhtiyacı Belirliyor, Sonra Uygulanabilir Plan Hazırlıyoruz
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] text-[#64748b]">
            Her işletmenin sektörü, ürün yapısı, müşteri profili, satış süreci ve hedef pazarı farklıdır. Bu nedenle her çalışmada önce mevcut durumu değerlendiriyor, ardından size uygun hizmet kapsamını planlıyoruz.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[#edf0f4] bg-[#f8fafc] p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1e40af] text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[16px] font-bold">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — Neden Biz */}
      <section className="py-16">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-9">
          <div className="text-center">
            <Badge>Neden Biz?</Badge>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold sm:text-3xl">
              Satış, İhracat ve Dijital Süreçleri Birlikte Ele Alıyoruz
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-[15px] text-[#64748b]">
              İhracat Radarı, hizmetleri birbirinden kopuk şekilde değil; şirketinizin satış, müşteri takibi, ihracat, CRM, e-ticaret ve eğitim süreçlerini birlikte değerlendirerek planlar.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {whyUs.map((w) => (
              <div key={w} className="flex items-start gap-3 rounded-2xl border border-[#edf0f4] bg-white p-5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcfce7]">
                  <Check className="h-4 w-4 text-[#166534]" />
                </span>
                <p className="text-[14.5px] leading-relaxed text-[#1e293b]">{w}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={iyHref(l, 'hakkimizda')} className="inline-block rounded-xl border border-[#1e40af]/30 px-6 py-3 text-sm font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
              Hakkımızda
            </Link>
          </div>
        </div>
      </section>

      {/* 9 — Paketler */}
      <section id="iy-paketler" className="bg-white py-16">
        <div className="mx-auto max-w-[1320px] px-5 text-center lg:px-9">
          <Badge>Paketler</Badge>
          <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold sm:text-3xl">
            İhtiyacınıza Göre Planlanan Hizmet Paketleri
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] text-[#64748b]">
            Tek bir hizmet yerine daha kapsamlı bir çalışma istiyorsanız, şirketinizin durumuna göre hazırlanabilecek paketleri inceleyebilirsiniz. Paketlerde fiyat sabit değildir; kapsam, hedef ve ihtiyaçlara göre teklif hazırlanır.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <Link
                key={p.title}
                href={iyHref(l, p.href)}
                className="group rounded-2xl border border-[#edf0f4] bg-[#f8fafc] p-6 transition-all hover:-translate-y-1 hover:border-[#1e40af]/30 hover:shadow-xl"
              >
                <span className="text-3xl">{p.icon}</span>
                <h3 className="mt-4 text-[17px] font-bold">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#64748b]">{p.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 10 — Final CTA */}
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e40af] py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-5 lg:px-9">
          <h2 className="text-2xl font-bold leading-snug text-white sm:text-[34px]">
            Şirketiniz İçin Doğru Hizmet Yapısını Birlikte Belirleyelim
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/80">
            İhracat, B2B müşteri bulma, CRM kurulumu, e-ticaret, kurumsal eğitim, DYS ve dijital dönüşüm konularında destek almak için bizimle iletişime geçebilirsiniz.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={iyTeklifHref(l)} className="rounded-xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#1e40af] hover:bg-[#eff6ff]">
              Teklif Al
            </Link>
            <a href={`tel:+${IY_BRAND.phoneRaw}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 px-7 py-3.5 text-[15px] font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" /> Telefonla Ara
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
