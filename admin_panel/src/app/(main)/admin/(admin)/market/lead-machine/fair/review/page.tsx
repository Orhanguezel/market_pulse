import LeadCandidatesPanel from '../../../_components/lead-candidates-panel';

export default function FairLeadReviewPage() {
  return (
    <LeadCandidatesPanel
      initialChannel="trade_fair"
      initialStatus="pending"
      lockChannel
      title="Fuar Aday Onayı"
      description="Automechanika adaylarını hızlıca inceleyin; uygun firmaları onaylayın, rakip veya alakasız profilleri tag ile reddedin, sıcak adayları favoriye alın."
    />
  );
}
