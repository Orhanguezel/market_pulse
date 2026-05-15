export type WeeklyReportData = {
  generatedAt: string;
  totalTargets: number;
  activeLeads: number;
  pendingSignals: number;
  highRiskTargets: Array<{ name: string; churnRiskScore: number; city: string | null }>;
  weeklySignals: Array<{ createdAt: string; targetName: string | null; severity: string; title: string }>;
  leadStatusCounts: Array<{ status: string; count: number }>;
};

export function renderWeeklyReportText(data: WeeklyReportData): string[] {
  const action =
    data.highRiskTargets.length > 0
      ? `${data.highRiskTargets.length} firmada yuksek churn riski var. Bu hafta oncelikli arama planlanmali.`
      : 'Yuksek churn riski gorunmuyor. Lead pipeline takibi surdurulmeli.';

  return [
    'MarketPulse Haftalik Ozet Raporu',
    `Olusturma: ${data.generatedAt}`,
    '',
    `Toplam hedef: ${data.totalTargets}`,
    `Aktif lead: ${data.activeLeads}`,
    `Incelenmemis sinyal: ${data.pendingSignals}`,
    '',
    'Risk Siralamasi',
    ...(data.highRiskTargets.length
      ? data.highRiskTargets.map((item, index) => `${index + 1}. ${item.name} - ${item.churnRiskScore} (${item.city ?? '-'})`)
      : ['Yuksek riskli hedef yok.']),
    '',
    'Bu Hafta Kritik/Yuksek Sinyaller',
    ...(data.weeklySignals.length
      ? data.weeklySignals.map((item) => `${item.createdAt} - ${item.severity} - ${item.targetName ?? '-'} - ${item.title}`)
      : ['Bu hafta kritik/yuksek sinyal yok.']),
    '',
    'Lead Pipeline',
    ...(data.leadStatusCounts.length
      ? data.leadStatusCounts.map((item) => `${item.status}: ${item.count}`)
      : ['Lead kaydi yok.']),
    '',
    'Aksiyon Onerisi',
    action,
  ];
}
