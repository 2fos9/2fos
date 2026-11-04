import { liveQuery } from "dexie";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownUp,
  CalendarDays,
  FileText,
  FolderSearch,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { z } from "zod";
import { db } from "../../db/db";
import {
  AuditLogSchema,
  TimelineEventSchema,
  type Investigation,
  type Source,
  type TimelineEvent,
} from "../../types/domain";
import { useTimelineStore } from "./timelineStore";

const formSchema = z.object({
  title: z.string().trim().min(1, "أدخل عنوان الحدث."),
  description: z.string().trim(),
  occurredAt: z
    .string()
    .min(1, "أدخل تاريخ الحدث ووقته.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "تاريخ الحدث غير صالح."),
  investigationId: z.string(),
  sourceId: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const emptyForm: FormValues = {
  title: "",
  description: "",
  occurredAt: "",
  investigationId: "",
  sourceId: "",
};

const inputClass =
  "w-full rounded-lg border border-white/15 bg-[#0B1329] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]";

function localDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "تاريخ غير صالح";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "حدث خطأ غير متوقع. حاول مجدداً.";
}

export default function TimelinePage() {
  const { search, investigationFilter, order, setSearch, setInvestigationFilter, toggleOrder } =
    useTimelineStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const subscription = liveQuery(() =>
      Promise.all([
        db.timelineEvents.toArray(),
        db.investigations.toArray(),
        db.sources.toArray(),
      ]),
    ).subscribe({
      next: ([nextEvents, nextInvestigations, nextSources]) => {
        setEvents(nextEvents);
        setInvestigations(nextInvestigations);
        setSources(nextSources);
        setLoading(false);
        setLoadError("");
      },
      error: (error) => {
        setLoadError(errorMessage(error));
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const investigationNames = useMemo(
    () => new Map(investigations.map((item) => [item.id, item.title])),
    [investigations],
  );
  const sourceNames = useMemo(
    () => new Map(sources.map((item) => [item.id, item.title])),
    [sources],
  );

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    return events
      .filter((event) => {
        if (investigationFilter === "unlinked" && event.investigationId) return false;
        if (
          investigationFilter !== "all" &&
          investigationFilter !== "unlinked" &&
          event.investigationId !== investigationFilter
        ) return false;
        if (!query) return true;
        return [
          event.title,
          event.description,
          event.investigationId && investigationNames.get(event.investigationId),
          event.sourceId && sourceNames.get(event.sourceId),
        ].some((value) => value?.toLocaleLowerCase("ar").includes(query));
      })
      .sort((a, b) => {
        const difference = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        const chronological = Number.isNaN(difference) ? 0 : difference;
        return (order === "asc" ? chronological : -chronological) || a.id.localeCompare(b.id);
      });
  }, [events, investigationFilter, investigationNames, order, search, sourceNames]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setMessage("");
    setFormOpen(true);
  }

  function openEdit(event: TimelineEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description ?? "",
      occurredAt: localDateTime(event.occurredAt),
      investigationId: event.investigationId ?? "",
      sourceId: event.sourceId ?? "",
    });
    setFormError("");
    setMessage("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "تحقق من بيانات الحدث.");
      return;
    }

    setSaving(true);
    try {
      const values = parsed.data;
      await db.transaction(
        "rw",
        [db.timelineEvents, db.auditLogs, db.investigations, db.sources],
        async () => {
          const current = editing ? await db.timelineEvents.get(editing.id) : undefined;
          if (editing && !current) throw new Error("لم يعد الحدث موجوداً. أعد تحميل القائمة.");
          if (editing && current && current.updatedAt !== editing.updatedAt) {
            throw new Error("تغيّر الحدث منذ فتحه. أغلق النموذج وافتحه مجدداً.");
          }
          if (values.investigationId && !(await db.investigations.get(values.investigationId))) {
            throw new Error("التحقيق المحدد لم يعد موجوداً.");
          }
          if (values.sourceId && !(await db.sources.get(values.sourceId))) {
            throw new Error("المصدر المحدد لم يعد موجوداً.");
          }

          const now = new Date().toISOString();
          const record = TimelineEventSchema.parse({
            ...(current ?? {}),
            id: current?.id ?? crypto.randomUUID(),
            createdAt: current?.createdAt ?? now,
            updatedAt: now,
            title: values.title,
            description: values.description || undefined,
            occurredAt: new Date(values.occurredAt).toISOString(),
            investigationId: values.investigationId || undefined,
            sourceId: values.sourceId || undefined,
          });
          const audit = AuditLogSchema.parse({
            id: crypto.randomUUID(),
            action: current ? "update" : "create",
            tableName: "timelineEvents",
            recordId: record.id,
            timestamp: now,
            details: record.title,
          });
          if (current) {
            await db.timelineEvents.put(record);
          } else {
            await db.timelineEvents.add(record);
          }
          await db.auditLogs.add(audit);
        },
      );
      setMessage(editing ? "تم تحديث الحدث." : "تمت إضافة الحدث.");
      closeForm();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: TimelineEvent) {
    if (saving || !window.confirm(`هل تريد حذف الحدث «${event.title}»؟`)) return;
    setMessage("");
    setSaving(true);
    try {
      await db.transaction("rw", [db.timelineEvents, db.auditLogs], async () => {
        const current = await db.timelineEvents.get(event.id);
        if (!current) throw new Error("لم يعد الحدث موجوداً.");
        if (current.updatedAt !== event.updatedAt) {
          throw new Error("تغيّر الحدث منذ عرضه. حاول الحذف مجدداً بعد تحديث القائمة.");
        }
        const audit = AuditLogSchema.parse({
          id: crypto.randomUUID(),
          action: "delete",
          tableName: "timelineEvents",
          recordId: current.id,
          timestamp: new Date().toISOString(),
          details: current.title,
        });
        await db.timelineEvents.delete(current.id);
        await db.auditLogs.add(audit);
      });
      if (editing?.id === event.id) closeForm();
      setMessage("تم حذف الحدث.");
    } catch (error) {
      setMessage(`تعذّر حذف الحدث: ${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-full bg-[#0B1329] p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#D4AF37]">
              <CalendarDays size={22} aria-hidden="true" />
              <span className="text-sm font-medium">مِرْصاد</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">الخط الزمني</h1>
            <p className="mt-2 text-sm text-slate-400">نظّم الأحداث واربطها بالتحقيقات والمصادر.</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0B1329] hover:bg-[#e5c658] disabled:opacity-50"
          >
            <Plus size={18} aria-hidden="true" />
            إضافة حدث
          </button>
        </header>

        {message && (
          <div role="status" className="rounded-lg border border-[#D4AF37]/30 bg-[#131B36] px-4 py-3 text-sm">
            {message}
          </div>
        )}
        {loadError && (
          <div role="alert" className="rounded-lg border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            تعذّر تحميل البيانات: {loadError}
          </div>
        )}

        {formOpen && (
          <section aria-labelledby="timeline-form-title" className="rounded-xl border border-[#D4AF37]/30 bg-[#131B36] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="timeline-form-title" className="text-lg font-bold">
                {editing ? "تعديل الحدث" : "حدث جديد"}
              </h2>
              <button type="button" onClick={closeForm} disabled={saving} aria-label="إغلاق النموذج" className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} noValidate className="space-y-4">
              {formError && (
                <div role="alert" className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                  {formError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="block">عنوان الحدث <span className="text-[#D4AF37]">*</span></span>
                  <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={saving} required />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="block">تاريخ الحدث ووقته <span className="text-[#D4AF37]">*</span></span>
                  <input className={inputClass} type="datetime-local" step="1" value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} disabled={saving} required />
                  <span className="block text-xs text-slate-400">يُدخل الوقت وفق المنطقة الزمنية لجهازك.</span>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="block">التحقيق</span>
                  <select className={inputClass} value={form.investigationId} onChange={(e) => setForm({ ...form, investigationId: e.target.value })} disabled={saving}>
                    <option value="">بدون تحقيق</option>
                    {form.investigationId && !investigationNames.has(form.investigationId) && (
                      <option value={form.investigationId}>تحقيق غير موجود</option>
                    )}
                    {investigations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="block">المصدر</span>
                  <select className={inputClass} value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} disabled={saving}>
                    <option value="">بدون مصدر</option>
                    {form.sourceId && !sourceNames.has(form.sourceId) && (
                      <option value={form.sourceId}>مصدر غير موجود</option>
                    )}
                    {sources.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                  </select>
                </label>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="block">الوصف</span>
                <textarea className={`${inputClass} min-h-24 resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#0B1329] hover:bg-[#e5c658] disabled:opacity-50">
                  {saving ? "جارٍ الحفظ..." : "حفظ الحدث"}
                </button>
                <button type="button" onClick={closeForm} disabled={saving} className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        )}

        <section aria-label="البحث والتصفية" className="grid gap-3 rounded-xl border border-white/10 bg-[#131B36] p-4 md:grid-cols-[1fr_14rem_auto]">
          <label className="relative">
            <span className="sr-only">البحث في الأحداث</span>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-slate-400" />
            <input className={`${inputClass} pr-10`} placeholder="ابحث في الأحداث والمصادر..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            <span className="sr-only">تصفية حسب التحقيق</span>
            <select className={inputClass} value={investigationFilter} onChange={(e) => setInvestigationFilter(e.target.value)}>
              <option value="all">كل التحقيقات</option>
              <option value="unlinked">أحداث بلا تحقيق</option>
              {investigationFilter !== "all" && investigationFilter !== "unlinked" && !investigationNames.has(investigationFilter) && (
                <option value={investigationFilter}>تحقيق غير موجود</option>
              )}
              {investigations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <button type="button" onClick={toggleOrder} className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
            <ArrowDownUp size={16} aria-hidden="true" />
            {order === "asc" ? "الأقدم أولاً" : "الأحدث أولاً"}
          </button>
        </section>

        <section aria-label="الأحداث الزمنية">
          <p className="mb-4 text-sm text-slate-400">
            {loading ? "جارٍ تحميل الأحداث..." : `${visibleEvents.length} من ${events.length} حدث`}
          </p>
          {!loading && !loadError && visibleEvents.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 bg-[#131B36] px-6 py-12 text-center">
              <CalendarDays className="mx-auto mb-3 text-[#D4AF37]" size={30} aria-hidden="true" />
              <p className="font-medium">لا توجد أحداث لعرضها</p>
              <p className="mt-2 text-sm text-slate-400">أضف حدثاً جديداً أو غيّر خيارات البحث والتصفية.</p>
            </div>
          )}
          <ol className="space-y-4">
            {visibleEvents.map((event) => (
              <li key={event.id} className="relative border-r-2 border-[#D4AF37]/50 pr-5">
                <span aria-hidden="true" className="absolute -right-[7px] top-5 h-3 w-3 rounded-full bg-[#D4AF37]" />
                <article className="rounded-xl border border-white/10 bg-[#131B36] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <time dateTime={event.occurredAt} className="text-sm text-[#D4AF37]">{displayDate(event.occurredAt)}</time>
                      <h2 className="mt-2 break-words text-lg font-bold">{event.title}</h2>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(event)} disabled={saving} aria-label={`تعديل ${event.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50">
                        <Pencil size={18} />
                      </button>
                      <button type="button" onClick={() => void handleDelete(event)} disabled={saving} aria-label={`حذف ${event.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {event.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{event.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                    {event.investigationId && (
                      <span className="flex items-center gap-1.5">
                        <FolderSearch size={15} aria-hidden="true" />
                        {investigationNames.get(event.investigationId) ?? "تحقيق غير موجود"}
                      </span>
                    )}
                    {event.sourceId && (
                      <span className="flex items-center gap-1.5">
                        <FileText size={15} aria-hidden="true" />
                        {sourceNames.get(event.sourceId) ?? "مصدر غير موجود"}
                      </span>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}