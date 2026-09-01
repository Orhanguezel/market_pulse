'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Globe2, Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useListPlatformSettingsQuery, useUpsertPlatformSettingMutation } from '@/integrations/hooks';

function parseValue(text: string) {
  if (!text.trim()) return null;
  return JSON.parse(text);
}

export default function PlatformSettingsClient() {
  const { data: rows = [], isLoading } = useListPlatformSettingsQuery({ locale: '*' });
  const [key, setKey] = React.useState('');
  const [locale, setLocale] = React.useState('*');
  const [value, setValue] = React.useState('{\n  \n}');
  const [upsert, upsertState] = useUpsertPlatformSettingMutation();

  const save = async () => {
    if (!key.trim()) return;
    try {
      await upsert({ key: key.trim(), locale: locale.trim() || '*', value: parseValue(value) }).unwrap();
      toast.success('Global ayar kaydedildi');
    } catch {
      toast.error('JSON veya kayıt hatası');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-gm-gold">
          <Globe2 className="size-5" />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Global</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl text-gm-text">Platform Ayarları</h1>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Ayar Yaz</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Key</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="feature_flags" />
            </div>
            <div className="grid gap-2">
              <Label>Locale</Label>
              <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="*" />
            </div>
          </div>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-44 font-mono text-xs" />
          <Button onClick={save} disabled={upsertState.isLoading || !key.trim()} className="w-fit">
            <Save className="mr-2 size-4" />
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        ) : rows.map((row) => (
          <Card key={row.id} className="rounded-lg">
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div>
                <div className="font-medium">{row.key}</div>
                <pre className="mt-2 max-w-4xl overflow-auto text-xs text-muted-foreground">
                  {JSON.stringify(row.value, null, 2)}
                </pre>
              </div>
              <Badge variant="outline">{row.locale}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
