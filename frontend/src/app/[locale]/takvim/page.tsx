'use client';

import React from 'react';
import { toast } from 'sonner';
import { BellRing, Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  useCreateCrmReminderMutation,
  useCreateCrmTaskMutation,
  useDeleteCrmReminderMutation,
  useDeleteCrmTaskMutation,
  useGetCrmRemindersQuery,
  useGetCrmTasksQuery,
  useUpdateCrmReminderMutation,
  useUpdateCrmTaskMutation,
} from '@/integrations/rtk/public/crm.endpoints';
import type { CrmReminder, CrmTask } from '@/integrations/shared/crm.types';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const PRIORITY: Record<string, { color: string; label: string }> = {
  urgent: { color: '#dc2626', label: 'Acil' },
  high: { color: '#d97706', label: 'Yüksek' },
  normal: { color: '#1e40af', label: 'Normal' },
  low: { color: '#64748b', label: 'Düşük' },
};

type DragItem = { kind: 'task' | 'reminder'; id: string } | null;

function pad(n: number) { return String(n).padStart(2, '0'); }
function dayKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function keyOf(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dayKey(d);
}
function prio(t: CrmTask) { return PRIORITY[t.priority ?? 'normal'] ?? PRIORITY.normal; }
function isTaskDone(t: CrmTask) { return t.status === 'done' || Boolean(t.completed_at); }
function isTaskOpen(t: CrmTask) { return !isTaskDone(t) && t.status !== 'cancelled'; }
function mondayOf(d: Date) { const off = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() - off); }

export default function TakvimPage() {
  const { data: tasks = [] } = useGetCrmTasksQuery();
  const { data: reminders = [] } = useGetCrmRemindersQuery();
  const [createTask, createTaskState] = useCreateCrmTaskMutation();
  const [updateTask] = useUpdateCrmTaskMutation();
  const [deleteTask] = useDeleteCrmTaskMutation();
  const [createReminder, createReminderState] = useCreateCrmReminderMutation();
  const [updateReminder] = useUpdateCrmReminderMutation();
  const [deleteReminder] = useDeleteCrmReminderMutation();

  const todayKey = dayKey(new Date());
  const [view, setView] = React.useState<'month' | 'week'>('month');
  const [refDate, setRefDate] = React.useState(() => new Date());
  const [selectedKey, setSelectedKey] = React.useState(todayKey);
  const [dragItem, setDragItem] = React.useState<DragItem>(null);
  const [dragOverKey, setDragOverKey] = React.useState<string | null>(null);
  const [taskInput, setTaskInput] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState('normal');
  const [reminderInput, setReminderInput] = React.useState('');

  const monthGrid = React.useMemo(() => {
    const y = refDate.getFullYear(); const m = refDate.getMonth();
    const start = mondayOf(new Date(y, m, 1));
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [refDate]);
  const weekGrid = React.useMemo(() => {
    const start = mondayOf(refDate);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [refDate]);

  const byDay = React.useMemo(() => {
    const map: Record<string, { tasks: CrmTask[]; reminders: CrmReminder[] }> = {};
    for (const t of tasks) { const k = keyOf(t.due_at); if (!k) continue; (map[k] ??= { tasks: [], reminders: [] }).tasks.push(t); }
    for (const r of reminders) { const k = keyOf(r.remind_at); if (!k) continue; (map[k] ??= { tasks: [], reminders: [] }).reminders.push(r); }
    return map;
  }, [tasks, reminders]);

  const selectedDay = byDay[selectedKey] ?? { tasks: [], reminders: [] };
  const openTasksTotal = tasks.filter(isTaskOpen).length;
  const weekAhead = React.useMemo(() => {
    const now = new Date(); const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const in7 = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7);
    return tasks.filter((t) => { if (!isTaskOpen(t) || !t.due_at) return false; const d = new Date(t.due_at); return d >= base && d < in7; }).length;
  }, [tasks]);

  const failMsg = (e: unknown, fallback: string) => {
    const status = (e as { status?: number } | undefined)?.status;
    return status === 401 ? 'Oturumun süresi dolmuş görünüyor. Sayfayı yenileyip (Ctrl+Shift+R) tekrar deneyin.' : fallback;
  };
  const addTask = async () => {
    const subject = taskInput.trim(); if (!subject) return;
    try {
      await createTask({ subject, priority: taskPriority, due_at: `${selectedKey} 09:00:00`, status: 'open' }).unwrap();
      setTaskInput('');
      toast.success('Görev eklendi');
    } catch (e) { toast.error(failMsg(e, 'Görev eklenemedi.')); }
  };
  const addReminder = async () => {
    const title = reminderInput.trim(); if (!title) return;
    try {
      await createReminder({ title, remind_at: `${selectedKey} 09:00:00`, status: 'scheduled' }).unwrap();
      setReminderInput('');
      toast.success('Hatırlatma eklendi');
    } catch (e) { toast.error(failMsg(e, 'Hatırlatma eklenemedi.')); }
  };
  const toggleTask = async (t: CrmTask) => {
    try {
      await updateTask({ id: t.id, patch: isTaskDone(t) ? { status: 'open', completed_at: null } : { status: 'done', completed_at: new Date().toISOString() } }).unwrap();
    } catch (e) { toast.error(failMsg(e, 'Görev güncellenemedi.')); }
  };
  const reschedule = async (targetKey: string) => {
    const item = dragItem; setDragItem(null); setDragOverKey(null);
    if (!item) return;
    try {
      if (item.kind === 'task') await updateTask({ id: item.id, patch: { due_at: `${targetKey} 09:00:00` } }).unwrap();
      else await updateReminder({ id: item.id, patch: { remind_at: `${targetKey} 09:00:00` } }).unwrap();
    } catch (e) { toast.error(failMsg(e, 'Taşınamadı.')); }
  };

  const [dy, dm, dd] = selectedKey.split('-').map(Number);
  const selectedLabel = `${dd} ${MONTHS[dm - 1]} ${dy}`;
  const headerTitle = view === 'month'
    ? `${MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}`
    : (() => { const s = weekGrid[0]; const e = weekGrid[6]; return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`; })();

  const go = (dir: -1 | 1) => {
    setRefDate((d) => view === 'month'
      ? new Date(d.getFullYear(), d.getMonth() + dir, Math.min(d.getDate(), 28))
      : new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir * 7));
  };

  const TaskChip = ({ t }: { t: CrmTask }) => (
    <span
      draggable
      onDragStart={(e) => { setDragItem({ kind: 'task', id: t.id }); e.dataTransfer.effectAllowed = 'move'; }}
      onDragEnd={() => { setDragItem(null); setDragOverKey(null); }}
      className={`block cursor-grab truncate rounded px-1 text-[10px] font-medium active:cursor-grabbing ${isTaskDone(t) ? 'text-[#94a3b8] line-through' : ''}`}
      style={isTaskDone(t) ? undefined : { backgroundColor: `${prio(t).color}1a`, color: prio(t).color }}
      title={t.subject}
    >{t.subject}</span>
  );
  const ReminderChip = ({ r }: { r: CrmReminder }) => (
    <span
      draggable
      onDragStart={(e) => { setDragItem({ kind: 'reminder', id: r.id }); e.dataTransfer.effectAllowed = 'move'; }}
      onDragEnd={() => { setDragItem(null); setDragOverKey(null); }}
      className="block cursor-grab truncate rounded bg-[#f3e8ff] px-1 text-[10px] font-medium text-[#7c3aed] active:cursor-grabbing"
      title={r.title}
    >⏰ {r.title}</span>
  );

  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (dragOverKey !== key) setDragOverKey(key); },
    onDragLeave: () => setDragOverKey((k) => (k === key ? null : k)),
    onDrop: () => reschedule(key),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">Takvim</h1>
          <p className="mt-0.5 text-[13px] text-[#64748b]">Görev ve hatırlatmalarını planla · sürükleyip tarih değiştir</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Açık görev</p>
            <p className="text-lg font-bold text-[#1e40af]">{openTasksTotal}</p>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">7 günde</p>
            <p className="text-lg font-bold text-[#d97706]">{weekAhead}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="truncate text-[15px] font-bold text-[#0f172a]">{headerTitle}</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-[#cbd5e1] p-0.5">
                <button onClick={() => setView('month')} className={`h-7 rounded px-2.5 text-[12px] font-semibold ${view === 'month' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Ay</button>
                <button onClick={() => setView('week')} className={`h-7 rounded px-2.5 text-[12px] font-semibold ${view === 'week' ? 'bg-[#1e40af] text-white' : 'text-[#475569]'}`}>Hafta</button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => go(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9]"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => { const n = new Date(); setRefDate(n); setSelectedKey(dayKey(n)); }} className="h-8 rounded-md border border-[#cbd5e1] px-3 text-[13px] font-semibold text-[#334155] hover:bg-[#f1f5f9]">Bugün</button>
                <button onClick={() => go(1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#cbd5e1] text-[#334155] hover:bg-[#f1f5f9]"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {view === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (<div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase text-[#94a3b8]">{d}</div>))}
              {monthGrid.map((d) => {
                const key = dayKey(d);
                const inMonth = d.getMonth() === refDate.getMonth();
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const items = byDay[key];
                const count = (items?.tasks.length ?? 0) + (items?.reminders.length ?? 0);
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    {...dropProps(key)}
                    className={`flex min-h-[76px] cursor-pointer flex-col rounded-md border p-1.5 transition ${dragOverKey === key ? 'border-[#2563eb] bg-[#dbeafe]' : isSelected ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#f1f5f9] hover:bg-[#f8fafc]'} ${inMonth ? '' : 'opacity-40'}`}
                  >
                    <span className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-bold ${isToday ? 'bg-[#1e40af] text-white' : 'text-[#334155]'}`}>{d.getDate()}</span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {items?.tasks.slice(0, 2).map((t) => (<TaskChip key={t.id} t={t} />))}
                      {items?.reminders.slice(0, 1).map((r) => (<ReminderChip key={r.id} r={r} />))}
                      {count > 3 ? (<span className="px-1 text-[10px] text-[#94a3b8]">+{count - 3} daha</span>) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weekGrid.map((d, i) => {
                const key = dayKey(d);
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const items = byDay[key] ?? { tasks: [], reminders: [] };
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    {...dropProps(key)}
                    className={`flex min-h-[220px] cursor-pointer flex-col rounded-md border p-2 transition ${dragOverKey === key ? 'border-[#2563eb] bg-[#dbeafe]' : isSelected ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] hover:bg-[#f8fafc]'}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase text-[#94a3b8]">{WEEKDAYS[i]}</span>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${isToday ? 'bg-[#1e40af] text-white' : 'text-[#334155]'}`}>{d.getDate()}</span>
                    </div>
                    <div className="flex flex-col gap-1 overflow-auto">
                      {items.tasks.map((t) => (<TaskChip key={t.id} t={t} />))}
                      {items.reminders.map((r) => (<ReminderChip key={r.id} r={r} />))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm">
          <div className="border-b border-[#e2e8f0] px-4 py-3">
            <h2 className="text-[15px] font-bold text-[#0f172a]">{selectedLabel}</h2>
            <p className="mt-0.5 text-[12px] text-[#64748b]">{selectedDay.tasks.length} görev · {selectedDay.reminders.length} hatırlatma</p>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }} placeholder="Yeni görev…" className="h-9 flex-1 rounded-md border border-[#cbd5e1] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
              <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="h-9 rounded-md border border-[#cbd5e1] px-2 text-[13px] outline-none focus:border-[#2563eb]">
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
              <button onClick={addTask} disabled={createTaskState.isLoading} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#1e40af] text-white disabled:opacity-50">{createTaskState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</button>
            </div>
            <div className="flex gap-2">
              <input value={reminderInput} onChange={(e) => setReminderInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addReminder(); }} placeholder="Yeni hatırlatma…" className="h-9 flex-1 rounded-md border border-[#cbd5e1] px-3 text-[13px] outline-none focus:border-[#2563eb]" />
              <button onClick={addReminder} disabled={createReminderState.isLoading} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#7c3aed] text-white disabled:opacity-50">{createReminderState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}</button>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-auto pt-1">
              {selectedDay.tasks.length === 0 && selectedDay.reminders.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#94a3b8]">Bu gün için kayıt yok.</p>
              ) : null}
              {selectedDay.tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2 rounded-md border border-[#e2e8f0] p-2.5">
                  <button onClick={() => toggleTask(t)} className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isTaskDone(t) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#cbd5e1] text-transparent hover:border-[#2563eb]'}`}><Check className="h-3.5 w-3.5" /></button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold ${isTaskDone(t) ? 'text-[#94a3b8] line-through' : 'text-[#0f172a]'}`}>{t.subject}</p>
                    <span className="mt-0.5 inline-block rounded px-1.5 text-[11px] font-medium" style={{ backgroundColor: `${prio(t).color}1a`, color: prio(t).color }}>{prio(t).label}</span>
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {selectedDay.reminders.map((r) => (
                <div key={r.id} className="flex items-start gap-2 rounded-md border border-[#e2e8f0] bg-[#faf5ff] p-2.5">
                  <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-[#7c3aed]" />
                  <p className="min-w-0 flex-1 text-[13px] font-semibold text-[#0f172a]">{r.title}</p>
                  <button onClick={() => deleteReminder(r.id)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
