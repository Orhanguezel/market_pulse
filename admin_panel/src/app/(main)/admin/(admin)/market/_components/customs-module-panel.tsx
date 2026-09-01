'use client';

import CustomsIntelligencePanel from './customs-intelligence-panel';
import CustomsLeadSearchPanel from './customs-lead-search-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CustomsModulePanel() {
  return (
    <Tabs defaultValue="intelligence" className="space-y-6">
      <TabsList className="grid w-full max-w-xl grid-cols-2 rounded-full bg-gm-bg-deep p-1">
        <TabsTrigger value="intelligence" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">İhracat İstihbaratı</TabsTrigger>
        <TabsTrigger value="leads" className="rounded-full data-[state=active]:bg-gm-gold data-[state=active]:text-black">İthalatçı Firma Bul</TabsTrigger>
      </TabsList>
      <TabsContent value="intelligence"><CustomsIntelligencePanel /></TabsContent>
      <TabsContent value="leads"><CustomsLeadSearchPanel /></TabsContent>
    </Tabs>
  );
}
