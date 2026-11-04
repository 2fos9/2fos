import { useEffect, useMemo, useState, type FormEvent } from "react";
import { liveQuery } from "dexie";
import {
  ArrowLeft,
  Link2,
  LoaderCircle,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { db } from "../../db/db";
import type { Entity, Relation } from "../../types/domain";
import {
  deleteEntity,
  deleteRelation,
  saveEntity,
  saveRelation,
  type EntityInput,
  type RelationInput,
} from "./data";
import { useRelationsView } from "./store";

const kindLabels: Record<Entity["kind"], string> = {
  person: "شخص",
  organization: "منظمة",
  place: "مكان",
  other: "أخرى",
};

const emptyEntity = (): EntityInput => ({ name: "", kind: "person", description: "" });
const emptyRelation = (): RelationInput => ({
  fromEntityId: "",
  toEntityId: "",
  label: "",
  description: "",
  investigationId: "",
  sourceId: "",
});

const inputClass =
  "w-full rounded-lg border border-slate-600 bg-[#0B1329] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#D4AF37]";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-300";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1329] hover:bg-[#e3c45b] disabled:cursor-not-allowed disabled:opacity-50";
const iconButtonClass =
  "rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50";

export default function RelationsPage() {
  const { search, kind, setSearch, setKind } = useRelationsView();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [entityDraft, setEntityDraft] = useState<EntityInput>(emptyEntity);
  const [relationDraft, setRelationDraft] = useState<RelationInput>(emptyRelation);
  const [editingEntity, setEditingEntity] = useState<string>();
  const [editingRelation, setEditingRelation] = useState<string>();

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [entityRows, relationRows] = await Promise.all([
        db.entities.toArray(),
        db.relations.toArray(),
      ]);
      return { entityRows, relationRows };
    }).subscribe({
      next: ({ entityRows, relationRows }) => {
        setEntities(entityRows);
        setRelations(relationRows);
        setLoadError("");
        setLoading(false);
      },
      error: () => {
        setLoadError("تعذّر تحميل البيانات من قاعدة البيانات المحلية.");
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const sortedEntities = useMemo(
    () => [...entities].sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [entities],
  );
  const entityById = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity])),
    [entities],
  );
  const visibleEntities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sortedEntities.filter(
      (entity) =>
        (kind === "all" || entity.kind === kind) &&
        (!query ||
          entity.name.toLocaleLowerCase().includes(query) ||
          (entity.description ?? "").toLocaleLowerCase().includes(query)),
    );
  }, [sortedEntities, search, kind]);
  const visibleIds = useMemo(() => new Set(visibleEntities.map((entity) => entity.id)), [visibleEntities]);
  const visibleRelations = useMemo(
    () =>
      [...relations]
        .filter((relation) => visibleIds.has(relation.fromEntityId) || visibleIds.has(relation.toEntityId))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [relations, visibleIds],
  );

  function resetEntity() {
    setEditingEntity(undefined);
    setEntityDraft(emptyEntity());
  }

  function resetRelation() {
    setEditingRelation(undefined);
    setRelationDraft(emptyRelation());
  }

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  function submitEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await saveEntity(entityDraft, editingEntity);
      resetEntity();
    }, editingEntity ? "تم تحديث الكيان." : "تمت إضافة الكيان.");
  }

  function submitRelation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await saveRelation(relationDraft, editingRelation);
      resetRelation();
    }, editingRelation ? "تم تحديث العلاقة." : "تمت إضافة العلاقة.");
  }

  function editEntity(entity: Entity) {
    setEditingEntity(entity.id);
    setEntityDraft({
      name: entity.name,
      kind: entity.kind,
      description: entity.description ?? "",
    });
    setError("");
    setMessage("");
  }

  function editRelation(relation: Relation) {
    setEditingRelation(relation.id);
    setRelationDraft({
      fromEntityId: relation.fromEntityId,
      toEntityId: relation.toEntityId,
      label: relation.label,
      description: relation.description ?? "",
      investigationId: relation.investigationId ?? "",
      sourceId: relation.sourceId ?? "",
    });
    setError("");
    setMessage("");
  }

  function removeEntity(entity: Entity) {
    const count = relations.filter(
      (relation) => relation.fromEntityId === entity.id || relation.toEntityId === entity.id,
    ).length;
    if (!window.confirm(`حذف «${entity.name}»؟ ستُحذف أيضاً علاقاته المرتبطة (${count}).`)) return;
    void run(async () => {
      await deleteEntity(entity.id);
      if (editingEntity === entity.id) resetEntity();
      if (relationDraft.fromEntityId === entity.id || relationDraft.toEntityId === entity.id) resetRelation();
    }, "تم حذف الكيان وعلاقاته.");
  }

  function removeRelation(relation: Relation) {
    if (!window.confirm("هل تريد حذف هذه العلاقة؟")) return;
    void run(async () => {
      await deleteRelation(relation.id);
      if (editingRelation === relation.id) resetRelation();
    }, "تم حذف العلاقة.");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#0B1329] p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#D4AF37]">
              <Network size={22} aria-hidden="true" />
              <span className="text-sm font-semibold">مِرْصاد</span>
            </div>
            <h1 className="text-2xl font-bold">شبكة العلاقات</h1>
            <p className="mt-2 text-sm text-slate-400">أدر الكيانات والروابط الموجّهة بينها في قاعدة بياناتك المحلية.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="rounded-xl border border-slate-700 bg-[#131B36] px-4 py-3">
              <span className="flex items-center gap-2 text-slate-400"><Users size={16} /> الكيانات</span>
              <strong className="mt-1 block text-lg text-white">{entities.length}</strong>
            </div>
            <div className="rounded-xl border border-slate-700 bg-[#131B36] px-4 py-3">
              <span className="flex items-center gap-2 text-slate-400"><Link2 size={16} /> العلاقات</span>
              <strong className="mt-1 block text-lg text-white">{relations.length}</strong>
            </div>
          </div>
        </header>

        {loadError && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{loadError}</div>}
        {error && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</div>}
        {message && <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-3 text-sm text-emerald-200">{message}</div>}

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-700 bg-[#131B36] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{editingEntity ? "تعديل الكيان" : "إضافة كيان"}</h2>
              {editingEntity && <button type="button" onClick={resetEntity} disabled={busy} className={iconButtonClass} aria-label="إلغاء تعديل الكيان"><X size={18} /></button>}
            </div>
            <form onSubmit={submitEntity} className="space-y-4">
              <div>
                <label htmlFor="entity-name" className={labelClass}>اسم الكيان</label>
                <input id="entity-name" className={inputClass} required maxLength={200} value={entityDraft.name} onChange={(event) => setEntityDraft({ ...entityDraft, name: event.target.value })} placeholder="مثال: مؤسسة أو شخص" />
              </div>
              <div>
                <label htmlFor="entity-kind" className={labelClass}>النوع</label>
                <select id="entity-kind" className={inputClass} value={entityDraft.kind} onChange={(event) => setEntityDraft({ ...entityDraft, kind: event.target.value as Entity["kind"] })}>
                  {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="entity-description" className={labelClass}>الوصف <span className="text-slate-500">(اختياري)</span></label>
                <textarea id="entity-description" className={inputClass} rows={2} value={entityDraft.description} onChange={(event) => setEntityDraft({ ...entityDraft, description: event.target.value })} />
              </div>
              <button className={buttonClass} disabled={busy || loading || !!loadError} type="submit">
                <Plus size={16} /> {editingEntity ? "حفظ التعديلات" : "إضافة الكيان"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-700 bg-[#131B36] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{editingRelation ? "تعديل العلاقة" : "إضافة علاقة"}</h2>
              {editingRelation && <button type="button" onClick={resetRelation} disabled={busy} className={iconButtonClass} aria-label="إلغاء تعديل العلاقة"><X size={18} /></button>}
            </div>
            <form onSubmit={submitRelation} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="relation-from" className={labelClass}>من الكيان</label>
                  <select id="relation-from" required className={inputClass} value={relationDraft.fromEntityId} onChange={(event) => setRelationDraft({ ...relationDraft, fromEntityId: event.target.value })}>
                    <option value="">اختر كياناً</option>
                    {sortedEntities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name} — {kindLabels[entity.kind]} ({entity.id.slice(0, 8)})</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="relation-to" className={labelClass}>إلى الكيان</label>
                  <select id="relation-to" required className={inputClass} value={relationDraft.toEntityId} onChange={(event) => setRelationDraft({ ...relationDraft, toEntityId: event.target.value })}>
                    <option value="">اختر كياناً</option>
                    {sortedEntities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name} — {kindLabels[entity.kind]} ({entity.id.slice(0, 8)})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="relation-label" className={labelClass}>نوع العلاقة أو عنوانها</label>
                <input id="relation-label" required maxLength={200} className={inputClass} value={relationDraft.label} onChange={(event) => setRelationDraft({ ...relationDraft, label: event.target.value })} placeholder="مثال: يعمل لدى" />
              </div>
              <div>
                <label htmlFor="relation-description" className={labelClass}>التفاصيل <span className="text-slate-500">(اختياري)</span></label>
                <textarea id="relation-description" className={inputClass} rows={2} value={relationDraft.description} onChange={(event) => setRelationDraft({ ...relationDraft, description: event.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="relation-investigation" className={labelClass}>معرّف التحقيق <span className="text-slate-500">(اختياري)</span></label>
                  <input id="relation-investigation" dir="ltr" className={inputClass} value={relationDraft.investigationId} onChange={(event) => setRelationDraft({ ...relationDraft, investigationId: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="relation-source" className={labelClass}>معرّف المصدر <span className="text-slate-500">(اختياري)</span></label>
                  <input id="relation-source" dir="ltr" className={inputClass} value={relationDraft.sourceId} onChange={(event) => setRelationDraft({ ...relationDraft, sourceId: event.target.value })} />
                </div>
              </div>
              <button className={buttonClass} disabled={busy || loading || !!loadError || entities.length < 2} type="submit">
                <Plus size={16} /> {editingRelation ? "حفظ التعديلات" : "إضافة العلاقة"}
              </button>
              {entities.length < 2 && !loading && <p className="text-xs text-slate-400">أضف كيانين على الأقل لإنشاء علاقة.</p>}
            </form>
          </section>
        </div>

        <section className="rounded-xl border border-slate-700 bg-[#131B36] p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">الكيانات والروابط</h2>
              <p className="mt-1 text-sm text-slate-400">تظهر العلاقات التي يتطابق أحد طرفيها مع المرشح.</p>
            </div>
            <div className="flex w-full flex-wrap gap-3 md:w-auto">
              <div className="relative flex-1 md:w-64">
                <label htmlFor="relations-search" className="sr-only">البحث عن كيان</label>
                <Search size={17} className="pointer-events-none absolute right-3 top-3 text-slate-500" />
                <input id="relations-search" className={`${inputClass} pr-9`} placeholder="البحث عن كيان" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <div>
                <label htmlFor="relations-kind-filter" className="sr-only">تصفية حسب النوع</label>
                <select id="relations-kind-filter" className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
                  <option value="all">كل الأنواع</option>
                  {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-400" role="status"><LoaderCircle size={18} className="animate-spin" /> جارٍ تحميل البيانات...</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold text-slate-300">الكيانات <span className="text-slate-500">({visibleEntities.length})</span></h3>
                {visibleEntities.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">لا توجد كيانات مطابقة.</p>
                ) : (
                  <ul className="space-y-2">
                    {visibleEntities.map((entity) => (
                      <li key={entity.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-700 bg-[#0B1329] p-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-words font-medium">{entity.name}</span>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-[#D4AF37]">{kindLabels[entity.kind]}</span>
                          </div>
                          {entity.description && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">{entity.description}</p>}
                        </div>
                        <div className="flex shrink-0">
                          <button type="button" className={iconButtonClass} disabled={busy} onClick={() => editEntity(entity)} aria-label={`تعديل ${entity.name}`}><Pencil size={16} /></button>
                          <button type="button" className={`${iconButtonClass} hover:text-red-300`} disabled={busy} onClick={() => removeEntity(entity)} aria-label={`حذف ${entity.name}`}><Trash2 size={16} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="mb-3 font-semibold text-slate-300">العلاقات <span className="text-slate-500">({visibleRelations.length})</span></h3>
                {visibleRelations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">لا توجد علاقات مطابقة.</p>
                ) : (
                  <ul className="space-y-2">
                    {visibleRelations.map((relation) => (
                      <li key={relation.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-700 bg-[#0B1329] p-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="break-words font-medium">{entityById.get(relation.fromEntityId)?.name ?? "كيان غير موجود"}</span>
                            <span className="rounded bg-[#D4AF37]/10 px-2 py-1 text-[#D4AF37]">{relation.label}</span>
                            <ArrowLeft size={16} className="text-slate-500" aria-label="إلى" />
                            <span className="break-words font-medium">{entityById.get(relation.toEntityId)?.name ?? "كيان غير موجود"}</span>
                          </div>
                          {relation.description && <p className="whitespace-pre-wrap break-words text-sm text-slate-400">{relation.description}</p>}
                          {relation.investigationId && <p className="break-all text-xs text-slate-500">التحقيق: <span dir="ltr">{relation.investigationId}</span></p>}
                          {relation.sourceId && <p className="break-all text-xs text-slate-500">المصدر: <span dir="ltr">{relation.sourceId}</span></p>}
                        </div>
                        <div className="flex shrink-0">
                          <button type="button" className={iconButtonClass} disabled={busy} onClick={() => editRelation(relation)} aria-label={`تعديل علاقة ${relation.label}`}><Pencil size={16} /></button>
                          <button type="button" className={`${iconButtonClass} hover:text-red-300`} disabled={busy} onClick={() => removeRelation(relation)} aria-label={`حذف علاقة ${relation.label}`}><Trash2 size={16} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}