import {
  Activity,
  AlertTriangle,
  BookOpenText,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileSearch,
  Flame,
  Mail,
  MapPin,
  Play,
  Radar,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const pages = [
  {
    title: 'MarketPulse Dashboard',
    href: '/admin/market',
    icon: Radar,
    purpose: 'Pazar takibinin ana ekranıdır. Hedef firma sayısı, aktif lead sayısı ve bekleyen sinyal sayısını hızlıca gösterir.',
    useFor: ['Genel durumu görmek', 'Hedef firmalara geçmek', 'Lead ve sinyal ekranlarına hızlı erişmek'],
    notes: 'Bu ekran operasyonel özet verir; detaylı işlem hedef, lead ve sinyal sayfalarında yapılır.',
  },
  {
    title: 'Hedef Firmalar',
    href: '/admin/market/targets',
    icon: Building2,
    purpose: 'Takip edilen bayi, rakip, distribütör ve potansiyel iş ortaklarının yönetildiği ekrandır.',
    useFor: ['Firma ekleme ve düzenleme', 'Churn risk skorunu yenileme', 'Rakip web sitesi tarama', 'Toplu CSV içe aktarma', 'ERP müşteri verisini hedeflere senkronlama'],
    notes: 'Website alanı dolu olan hedeflerde rakip tarama sinyal üretebilir. ERP bağlantılı kayıtlar `external_customer_id` ile eşleşir.',
  },
  {
    title: 'Lead Pipeline',
    href: '/admin/market/leads',
    icon: Users,
    purpose: 'Satış fırsatlarının durum, öncelik, kaynak ve skor bazlı takip edildiği hunidir.',
    useFor: ['Manuel lead oluşturma', 'Lead durumunu güncelleme', 'Öncelik ve kaynak filtreleme', 'Adaydan onaylanan leadleri takip etme'],
    notes: 'Lead Machine adayları onaylandığında buraya `source` bilgisiyle aktarılır.',
  },
  {
    title: 'Lead Adayları',
    href: '/admin/market/lead-machine/candidates',
    icon: Flame,
    purpose: 'Amazon, B2B dizin ve fuar taramalarından gelen ham adayların incelendiği ekrandır.',
    useFor: ['Aday onaylama', 'Aday reddetme ve red sebebi kaydetme', 'Favoriye alma', 'Enrichment başlatma', 'Outreach taslağı üretme', 'Market lead olarak aktarma'],
    notes: 'Reddedilen adayların sebepleri Lead Machine öğrenme döngüsü için pattern olarak kullanılabilir.',
  },
  {
    title: 'Amazon Arama',
    href: '/admin/market/lead-machine/amazon',
    icon: Search,
    purpose: 'Amazon ürün ve satıcı verilerinden potansiyel distribütör veya e-ticaret satıcı adayları üretir.',
    useFor: ['Keyword ve marketplace ile arama başlatma', 'Review/rating/price filtreleri kullanma', 'Amazon job sonuçlarını aday listesine taşıma'],
    notes: 'Oxylabs bilgileri yapılandırılmamışsa Amazon scraping jobları çalışmaz.',
  },
  {
    title: 'B2B Arama',
    href: '/admin/market/lead-machine/b2b',
    icon: Building2,
    purpose: 'Google Maps, Europages veya TOBB gibi kaynaklardan ICP uyumlu B2B firma adayları çıkarır.',
    useFor: ['ICP profiliyle arama yapma', 'Ülke ve kaynak seçme', 'Firma web sitesi analiziyle skor artırma'],
    notes: 'ICP tanımı güçlü değilse düşük kaliteli sonuçlar artar; önce ICP Profilleri sayfasını netleştirmek gerekir.',
  },
  {
    title: 'Fuar Tarama',
    href: '/admin/market/lead-machine/fair',
    icon: MapPin,
    purpose: 'Fuar katılımcı listelerinden potansiyel firma adayları üretir.',
    useFor: ['Fuar adı, URL ve tarih ile job başlatma', 'Katılımcı açıklamalarını ICP ile eşleştirme', 'Fuar kaynaklı adayları inceleme'],
    notes: 'Fuar sitesi erişilebilir ve katılımcı listesi parse edilebilir olmalıdır.',
  },
  {
    title: 'ICP Profilleri',
    href: '/admin/market/lead-machine/icp',
    icon: SlidersHorizontal,
    purpose: 'İdeal müşteri profilini tanımlar. Lead Machine joblarının kalite filtresidir.',
    useFor: ['Sektör, firma tipi ve coğrafya tanımlama', 'Hariç ülke/pattern belirleme', 'Aktif ICP seçme'],
    notes: 'Amazon, B2B ve fuar akışlarında skorlamanın omurgası ICP tanımıdır.',
  },
  {
    title: 'Outreach Taslakları',
    href: '/admin/market/lead-machine/outreach',
    icon: Mail,
    purpose: 'Adaylar veya leadler için oluşturulan e-posta taslaklarının yönetildiği ekrandır.',
    useFor: ['Taslakları inceleme', 'Konu ve gövde düzenleme', 'Draft/sent/archived durumunu güncelleme'],
    notes: 'Sistem otomatik gönderim yapmaz; taslak üretir ve kullanıcı onayı bekler.',
  },
  {
    title: 'Pazar Sinyalleri',
    href: '/admin/market/signals',
    icon: Activity,
    purpose: 'Rakip hareketleri, manuel gözlemler ve churn risk sinyallerinin takip edildiği merkezdir.',
    useFor: ['Sinyal oluşturma', 'Sinyali incelendi olarak işaretleme', 'Severity bazlı önceliklendirme', 'Kaynak URL üzerinden doğrulama'],
    notes: 'İncelenmemiş sinyaller dashboard ve raporlarda aksiyon bekleyen iş olarak görünür.',
  },
  {
    title: 'Haftalık Raporlar',
    href: '/admin/market/reports',
    icon: FileSearch,
    purpose: 'MarketPulse verilerinden haftalık PDF rapor önizleme ve e-posta gönderimi yapılır.',
    useFor: ['PDF rapor önizleme', 'E-posta alıcısı girerek rapor gönderme', 'Riskli hedef ve kritik sinyal özetlerini paylaşma'],
    notes: 'SMTP yapılandırması yoksa rapor gönderimi çalışmaz; önizleme yine üretilebilir.',
  },
];

const setupItems = [
  { label: 'MySQL', text: 'MarketPulse ve Lead Machine tabloları seed/migration dosyalarıyla oluşturulmuş olmalı.' },
  { label: 'ERP DB', text: 'ERP müşteri ve ürün importları için harici DB bağlantısı tanımlanmalı.' },
  { label: 'Scraper Service', text: 'Rakip tarama, B2B/fuar scraping ve enrichment için scraper servis URL/API key ayarları gerekir.' },
  { label: 'Oxylabs', text: 'Amazon ürün ve yorum taraması için Oxylabs kullanıcı adı ve şifresi gerekir.' },
  { label: 'AI Provider', text: 'Outreach, review analizi ve bazı özetler için OpenAI veya Groq API key gerekir.' },
  { label: 'SMTP', text: 'Haftalık rapor e-posta gönderimi için SMTP ayarları gerekir.' },
];

const flow = [
  'ICP profilini tanımla veya mevcut profili güncelle.',
  'Hedef firmaları manuel, CSV veya ERP sync ile oluştur.',
  'Amazon/B2B/Fuar jobları ile lead adayı üret.',
  'Lead adaylarını incele, zenginleştir ve uygun olanları lead pipeline’a aktar.',
  'Rakip tarama ve manuel gözlemlerle sinyal üret.',
  'Churn skorlarını ve haftalık raporu düzenli takip et.',
];

const testNotes = [
  {
    title: 'Backend Modül Testleri',
    command: 'cd backend && bun test',
    text: 'Market ve Lead Machine repository, controller, service ve entegrasyon adaptörleri mock DB ile doğrulanır. Gerçek DB veya dış servis çağrısı yapılmaz.',
  },
  {
    title: 'Admin Panel Smoke Testleri',
    command: 'cd admin_panel && bun test',
    text: 'Market admin endpoint tanımları, dashboard, hedef, lead, sinyal, Lead Machine ve dokümantasyon yüzeyleri render edilir.',
  },
  {
    title: 'Tip Kontrolü',
    command: 'cd admin_panel && bun run typecheck',
    text: 'Next admin panel kodu TypeScript seviyesinde doğrulanır. Test dosyaları tsconfig dışında bırakılmıştır; Bun test runner kendi tipleriyle çalışır.',
  },
  {
    title: 'Production Build',
    command: 'cd admin_panel && bun run build',
    text: 'Route üretimi ve Next build doğrulanır. Ortamda Google Fonts erişimi kapalıysa build font indirme adımında takılabilir.',
  },
];

const developerNotes = [
  {
    title: 'Modül Sınırları',
    icon: Code2,
    text: '`backend/src/modules/market` operasyonel hedef, lead, sinyal ve rapor akışını; `backend/src/modules/lead-machine` aday üretimi, ICP, enrichment ve outreach akışını taşır.',
  },
  {
    title: 'Admin Yüzeyi',
    icon: Wrench,
    text: '`admin_panel/src/app/(main)/admin/(admin)/market` sadece Market Pulse ekranlarını içerir. API sözleşmesi `market_admin.endpoints.ts` ve shared type dosyalarında tutulur.',
  },
  {
    title: 'Dış Bağımlılıklar',
    icon: AlertTriangle,
    text: 'Amazon jobları Oxylabs, B2B/fuar/enrichment işleri scraper servis, outreach ve özetleme işleri AI provider, rapor gönderimi SMTP ayarı ister.',
  },
  {
    title: 'Veri Akışı',
    icon: ShieldCheck,
    text: 'ICP profili job kalitesini belirler; job sonuçları aday havuzuna düşer; onaylanan adaylar lead pipeline’a aktarılır; sinyal ve rapor ekranları takip katmanını oluşturur.',
  },
];

export default function MarketDocumentationPage() {
  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-700">
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">MarketPulse</span>
        </div>
        <div className="max-w-4xl space-y-4">
          <h1 className="font-serif text-4xl text-gm-text md:text-5xl">Dokümantasyon</h1>
          <p className="font-serif text-base italic leading-7 text-gm-muted md:text-lg">
            MarketPulse; hedef firma takibi, lead üretimi, rakip sinyalleri ve haftalık raporlama iş akışlarını tek admin yüzeyinde toplar.
            Bu sayfa her modülün ne işe yaradığını, hangi durumda kullanılacağını ve çalışması için hangi entegrasyonlara ihtiyaç duyduğunu açıklar.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <a href="#sayfa-rehberi" className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-5 transition hover:border-gm-gold/50 hover:bg-gm-surface/20">
          <BookOpenText className="mb-4 size-5 text-gm-gold" />
          <h2 className="font-serif text-xl text-gm-text">Sayfa Rehberi</h2>
          <p className="mt-2 text-sm leading-6 text-gm-muted">Her Market Pulse ekranının amacı, kullanımı ve bağlı olduğu koşullar.</p>
        </a>
        <Link href="/admin/market/test-center" className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-5 transition hover:border-gm-gold/50 hover:bg-gm-surface/20">
          <ClipboardCheck className="mb-4 size-5 text-gm-gold" />
          <h2 className="font-serif text-xl text-gm-text">Test Notları</h2>
          <p className="mt-2 text-sm leading-6 text-gm-muted">Market Pulse kalite kapıları ve komutları.</p>
        </Link>
        <Link href="/admin/market/developer-notes" className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-5 transition hover:border-gm-gold/50 hover:bg-gm-surface/20">
          <Code2 className="mb-4 size-5 text-gm-gold" />
          <h2 className="font-serif text-xl text-gm-text">Yazılımcı Notları</h2>
          <p className="mt-2 text-sm leading-6 text-gm-muted">Modül sınırları, dış bağımlılıklar ve çalışmama durumunda kontrol edilecek noktalar.</p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {setupItems.map((item) => (
          <Card key={item.label} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
            <CardContent className="space-y-3 p-6">
              <Badge className="rounded-full border-gm-border-soft bg-gm-surface/30 text-gm-gold">{item.label}</Badge>
              <p className="text-sm leading-6 text-gm-muted">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Zap className="size-5 text-gm-gold" />
          <h2 className="font-serif text-2xl text-gm-text">Önerilen Kullanım Akışı</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {flow.map((item, index) => (
            <div key={item} className="flex gap-4 rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gm-gold text-sm font-bold text-black">{index + 1}</div>
              <p className="text-sm leading-6 text-gm-muted">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sayfa-rehberi" className="space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3">
          <BookOpenText className="size-5 text-gm-gold" />
          <h2 className="font-serif text-2xl text-gm-text">Sayfa Rehberi</h2>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {pages.map(({ title, href, icon: Icon, purpose, useFor, notes }) => (
            <Card key={href} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-2xl">
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-gm-border-soft bg-gm-surface/30 text-gm-gold">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-gm-text">{title}</h3>
                      <Link href={href} className="text-xs font-mono text-gm-muted hover:text-gm-gold">{href}</Link>
                    </div>
                  </div>
                  <Badge className="rounded-full border-gm-border-soft bg-gm-surface/20 text-gm-muted">Admin</Badge>
                </div>

                <p className="text-sm leading-6 text-gm-muted">{purpose}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
                    <Target className="size-4" />
                    Kullanım
                  </div>
                  <div className="grid gap-2">
                    {useFor.map((item) => (
                      <div key={item} className="flex gap-2 text-sm text-gm-muted">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gm-success" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-4 text-sm leading-6 text-gm-muted">
                  {notes}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="test-notlari" className="space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-5 text-gm-gold" />
          <h2 className="font-serif text-2xl text-gm-text">Test Notları</h2>
        </div>
        <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/10 p-5 text-sm leading-6 text-gm-muted">
          Test Merkezi yaklaşımı Market Pulse için kalite kapısı olarak uygulanır: önce izole Bun testleri, sonra tip kontrolü,
          son olarak build doğrulaması çalıştırılır. Gerçek dış servis testleri eklendiğinde önce snapshot/backup adımı zorunlu kabul edilmelidir.
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {testNotes.map((item) => (
            <Card key={item.title} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-gm-border-soft bg-gm-surface/30 text-gm-gold">
                    <Play className="size-4" />
                  </div>
                  <h3 className="font-serif text-lg text-gm-text">{item.title}</h3>
                </div>
                <code className="block rounded-xl border border-gm-border-soft bg-black/30 px-4 py-3 font-mono text-xs text-gm-gold">{item.command}</code>
                <p className="text-sm leading-6 text-gm-muted">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="yazilimci-notlari" className="space-y-5 scroll-mt-24">
        <div className="flex items-center gap-3">
          <Code2 className="size-5 text-gm-gold" />
          <h2 className="font-serif text-2xl text-gm-text">Yazılımcı Notları</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {developerNotes.map(({ title, icon: Icon, text }) => (
            <Card key={title} className="border-gm-border-soft bg-gm-bg-deep/50 shadow-xl">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-gm-border-soft bg-gm-surface/30 text-gm-gold">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="font-serif text-lg text-gm-text">{title}</h3>
                </div>
                <p className="text-sm leading-6 text-gm-muted">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
