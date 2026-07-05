'use client';

import * as React from 'react';
import { Loader2, MailPlus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import SummaryOverview from '@/components/iy/SummaryOverview';
import { useGetCrmUsersSummaryQuery } from '@/integrations/rtk/public/crm.endpoints';
import {
  useInviteWorkspaceUserMutation,
  useListWorkspaceUsersQuery,
  useRemoveWorkspaceUserMutation,
  useUpdateWorkspaceUserRoleMutation,
  type WorkspaceRole,
} from '@/integrations/rtk/public/workspace.endpoints';

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  tenant_admin: 'Tenant admin',
  tenant_editor: 'Editör',
};

function isForbidden(error: unknown) {
  const status = (error as { status?: number } | undefined)?.status;
  return status === 403;
}

export default function KullanicilarPage() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useGetCrmUsersSummaryQuery();
  const { data: members = [], isLoading, isError, error } = useListWorkspaceUsersQuery();
  const [inviteUser, inviteState] = useInviteWorkspaceUserMutation();
  const [updateRole, updateRoleState] = useUpdateWorkspaceUserRoleMutation();
  const [removeUser, removeState] = useRemoveWorkspaceUserMutation();
  const [invite, setInvite] = React.useState<{ email: string; full_name: string; role: WorkspaceRole }>({
    email: '',
    full_name: '',
    role: 'tenant_editor',
  });
  const [temporaryPassword, setTemporaryPassword] = React.useState<string | null>(null);
  const busy = inviteState.isLoading || updateRoleState.isLoading || removeState.isLoading;

  const submitInvite = async () => {
    const email = invite.email.trim();
    if (!email) {
      toast.error('E-posta gerekli');
      return;
    }
    try {
      const result = await inviteUser({
        email,
        full_name: invite.full_name.trim() || undefined,
        role: invite.role,
      }).unwrap();
      setTemporaryPassword(result.temporary_password);
      setInvite({ email: '', full_name: '', role: 'tenant_editor' });
      toast.success(result.temporary_password ? 'Kullanıcı oluşturuldu ve workspace’e eklendi' : 'Kullanıcı workspace’e eklendi');
    } catch {
      toast.error('Davet tamamlanamadı');
    }
  };

  const roleChange = async (userId: string, role: WorkspaceRole) => {
    await updateRole({ userId, role }).unwrap();
    toast.success('Rol güncellendi');
  };

  const remove = async (userId: string) => {
    if (!window.confirm('Kullanıcı bu workspace’ten kaldırılsın mı?')) return;
    await removeUser(userId).unwrap();
    toast.success('Kullanıcı workspace’ten kaldırıldı');
  };

  const forbidden = isForbidden(error);

  return (
    <div className="space-y-5">
      <SummaryOverview
        title="Kullanıcılar"
        subtitle="Workspace kullanıcıları, roller ve davet yönetimi"
        isLoading={summaryLoading}
        isError={summaryError}
        metrics={[
          { label: 'Toplam kullanıcı', value: summary?.users_total, tone: 'blue' },
          { label: 'Aktif kullanıcı', value: summary?.active_users, tone: 'green' },
          { label: 'Pasif kullanıcı', value: summary?.inactive_users, tone: 'amber' },
          { label: 'Doğrulanmış', value: summary?.verified_users },
          { label: 'Tenant admin', value: summary?.tenant_admins },
          { label: 'Editör', value: summary?.tenant_editors },
          { label: 'Tenant', value: summary?.tenant_key },
        ]}
      />

      {forbidden ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
          Bu ekran için tenant-admin yetkisi gerekli.
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-[#e2e8f0] bg-white p-4">
            <div className="mb-4 flex items-center gap-2 text-[#0f172a]">
              <MailPlus className="h-5 w-5 text-[#1e40af]" />
              <h2 className="text-[15px] font-bold">Kullanıcı Davet Et</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_auto]">
              <input value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="eposta@firma.com" className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" />
              <input value={invite.full_name} onChange={(event) => setInvite({ ...invite, full_name: event.target.value })} placeholder="Ad soyad" className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]" />
              <select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as WorkspaceRole })} className="h-10 rounded-md border border-[#cbd5e1] px-3 text-[13px]">
                <option value="tenant_editor">Editör</option>
                <option value="tenant_admin">Tenant admin</option>
              </select>
              <button disabled={busy} onClick={submitInvite} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1e40af] px-4 text-[13px] font-semibold text-white disabled:opacity-50">
                {inviteState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Davet Et
              </button>
            </div>
            {temporaryPassword && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800">
                Geçici parola: <b>{temporaryPassword}</b>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#e2e8f0] bg-white">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <Users className="h-5 w-5 text-[#1e40af]" />
                <h2 className="text-[15px] font-bold">Workspace Üyeleri</h2>
              </div>
              <span className="text-[12px] font-semibold text-[#64748b]">{members.length} üye</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1e40af]" /></div>
            ) : isError ? (
              <div className="px-4 py-10 text-center text-[13px] text-[#64748b]">Üyeler alınamadı.</div>
            ) : members.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-[#64748b]">Workspace üyesi yok.</div>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {members.map((member) => (
                  <div key={member.user_id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_180px_120px_44px] md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-[#0f172a]">{member.profile_name || member.full_name || member.email}</p>
                        {member.role === 'tenant_admin' && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <p className="truncate text-[12px] text-[#64748b]">{member.email}</p>
                    </div>
                    <select disabled={busy} value={member.role} onChange={(event) => roleChange(member.user_id, event.target.value as WorkspaceRole)} className="h-9 rounded-md border border-[#cbd5e1] px-2 text-[13px] disabled:opacity-50">
                      <option value="tenant_editor">{ROLE_LABELS.tenant_editor}</option>
                      <option value="tenant_admin">{ROLE_LABELS.tenant_admin}</option>
                    </select>
                    <span className={`w-fit rounded-md px-2 py-1 text-[12px] font-semibold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {member.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                    <button disabled={busy} onClick={() => remove(member.user_id)} className="grid h-9 w-9 place-items-center rounded-md border border-rose-200 text-rose-700 disabled:opacity-50" title="Workspace’ten kaldır">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
