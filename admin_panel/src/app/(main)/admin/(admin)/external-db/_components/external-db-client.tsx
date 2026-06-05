'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Database, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Play, 
  Settings, 
  Server,
  Key,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useCreateExternalDbConnectionMutation,
  useDeleteExternalDbConnectionMutation,
  useListExternalDbConnectionsQuery,
  useTestExternalDbConnectionMutation,
} from '@/integrations/hooks';

const DEFAULT_FORM = {
  key: 'PROMAT',
  name: 'Promat ERP',
  description: '',
  host: '',
  port: 3306,
  db_name: '',
  username: '',
  password: '',
};

export default function ExternalDbClient() {
  const { data, isLoading, isFetching, refetch } = useListExternalDbConnectionsQuery();
  const [createConnection, { isLoading: isCreating }] = useCreateExternalDbConnectionMutation();
  const [deleteConnection] = useDeleteExternalDbConnectionMutation();
  const [testConnection, { isLoading: isTesting }] = useTestExternalDbConnectionMutation();
  const [form, setForm] = React.useState(DEFAULT_FORM);

  const onCreate = async () => {
    try {
      await createConnection({
        key: form.key,
        name: form.name,
        description: form.description,
        host: form.host,
        port: Number(form.port || 3306),
        db_name: form.db_name,
        username: form.username,
        password: form.password,
        is_active: true,
      }).unwrap();
      toast.success('Bağlantı başarıyla eklendi');
      setForm(DEFAULT_FORM);
    } catch {
      toast.error('Bağlantı eklenirken hata oluştu');
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteConnection(id).unwrap();
      toast.success('Bağlantı silindi');
    } catch {
      toast.error('Bağlantı silinemedi');
    }
  };

  const onTest = async (id: string) => {
    try {
      await testConnection(id).unwrap();
      toast.success('Bağlantı testi başarılı');
    } catch {
      toast.error('Bağlantı testi başarısız');
    }
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">Entegrasyon</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Harici Veritabanı</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            ERP ve diğer harici veri kaynaklarına güvenli bağlantılar kurun.
          </p>
        </div>

        <Button 
          onClick={() => refetch()} 
          disabled={isLoading || isFetching} 
          variant="outline"
          className="rounded-full border-gm-border-soft px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-surface shadow-lg backdrop-blur-sm text-gm-text"
        >
          <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", isFetching && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* Creation Card */}
        <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold border border-gm-gold/20 shadow-inner">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-gm-text font-serif text-xl">Yeni Bağlantı Ekle</h3>
                <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase">Bağlantı Detaylarını Tanımlayın</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Key (Kod)</Label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                  <Input 
                    placeholder="Örn: PROMAT"
                    value={form.key} 
                    onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))}
                    className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Bağlantı Adı</Label>
                <Input 
                  placeholder="Örn: Promat ERP Üretim"
                  value={form.name} 
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Açıklama</Label>
                <Input 
                  placeholder="Veritabanı hakkında kısa bilgi..."
                  value={form.description} 
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>

              <Separator className="bg-gm-border-soft md:col-span-2" />

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Host (IP/Domain)</Label>
                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
                  <Input 
                    placeholder="127.0.0.1"
                    value={form.host} 
                    onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                    className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Port</Label>
                <Input 
                  type="number" 
                  value={form.port} 
                  onChange={(e) => setForm((p) => ({ ...p, port: Number(e.target.value || 3306) }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Veritabanı Adı</Label>
                <Input 
                  placeholder="promat_prod"
                  value={form.db_name} 
                  onChange={(e) => setForm((p) => ({ ...p, db_name: e.target.value }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Kullanıcı Adı</Label>
                <Input 
                  placeholder="root"
                  value={form.username} 
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Şifre</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm text-gm-text"
                />
              </div>
            </div>

            <Button 
              onClick={onCreate} 
              disabled={isCreating}
              className="w-full bg-gm-gold hover:bg-gm-gold-light text-black rounded-full h-14 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
            >
              <Plus className="mr-2 size-4" />
              Bağlantıyı Kaydet
            </Button>
          </CardContent>
        </Card>

        {/* List Card */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-gm-gold ml-4">
            <Database size={18} />
            <h3 className="text-sm font-bold tracking-widest uppercase">Mevcut Bağlantılar</h3>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-gm-surface/20 border-gm-border-soft rounded-[24px] h-32 animate-pulse" />
              ))
            ) : data?.length === 0 ? (
              <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[24px] p-12 text-center border-dashed">
                <p className="font-serif italic text-gm-muted opacity-50">Henüz kayıtlı bağlantı bulunmuyor.</p>
              </Card>
            ) : (
              (data || []).map((row) => (
                <Card key={row.id} className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl hover:bg-gm-primary/2 transition-colors group">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-2xl bg-gm-bg-deep border border-gm-border-soft flex items-center justify-center text-gm-muted group-hover:text-gm-gold transition-colors shrink-0">
                          <Server size={20} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-gm-text font-serif text-lg leading-tight">{row.name}</h4>
                            <Badge className="bg-gm-surface text-gm-muted border-gm-border-soft text-[8px] font-bold tracking-widest uppercase py-0 px-2 rounded-full">
                              {row.key}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gm-muted font-mono truncate">
                            {row.host}:{row.port} • {row.db_name}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            {row.last_test_ok ? (
                              <div className="flex items-center gap-1.5 text-[10px] text-gm-gold font-bold uppercase tracking-tighter">
                                <CheckCircle2 size={12} />
                                Aktif & Bağlı
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[10px] text-gm-muted font-bold uppercase tracking-tighter opacity-50">
                                <AlertCircle size={12} />
                                Durum Belirsiz
                              </div>
                            )}
                            <span className="text-gm-muted/20">•</span>
                            <span className="text-[9px] text-gm-muted font-serif italic">
                              Son test: {row.last_tested_at ? new Date(row.last_tested_at).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onTest(row.id)} 
                          disabled={isTesting}
                          className="rounded-full h-8 text-[9px] font-bold tracking-widest uppercase border-gm-gold/20 text-gm-gold hover:bg-gm-gold hover:text-black"
                        >
                          <Play size={12} className="mr-1.5" />
                          Test
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => onDelete(row.id)}
                          className="rounded-full h-8 text-[9px] font-bold tracking-widest uppercase text-gm-error/40 hover:text-gm-error hover:bg-gm-error/10"
                        >
                          <Trash2 size={12} className="mr-1.5" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Card className="bg-gm-gold/5 border border-gm-gold/10 rounded-[24px] p-6">
            <div className="flex gap-4">
              <Info className="size-5 text-gm-gold shrink-0" />
              <p className="text-xs text-gm-text font-serif italic leading-relaxed">
                Harici bağlantılar ERP entegrasyonu için kullanılır. Bağlantı bilgilerinin doğruluğu, market verilerinin senkronizasyonu için kritiktir.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
