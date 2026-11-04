import { db } from "../../db/db";
import {
  AuditLogSchema,
  EntitySchema,
  RelationSchema,
  type Entity,
  type Relation,
} from "../../types/domain";

export type EntityInput = {
  name: string;
  kind: Entity["kind"];
  description: string;
};

export type RelationInput = {
  fromEntityId: string;
  toEntityId: string;
  label: string;
  description: string;
  investigationId: string;
  sourceId: string;
};

const optional = (value: string) => value.trim() || undefined;

function audit(action: string, tableName: "entities" | "relations", recordId: string) {
  return AuditLogSchema.parse({
    id: crypto.randomUUID(),
    action,
    tableName,
    recordId,
    timestamp: new Date().toISOString(),
  });
}

export async function saveEntity(input: EntityInput, id?: string) {
  const name = input.name.trim();
  if (!name) throw new Error("أدخل اسم الكيان.");

  await db.transaction("rw", db.entities, db.auditLogs, async () => {
    const existing = id ? await db.entities.get(id) : undefined;
    if (id && !existing) throw new Error("لم يعد الكيان موجوداً. حدّث النموذج وحاول مجدداً.");

    const now = new Date().toISOString();
    const parsed = EntitySchema.safeParse({
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      name,
      kind: input.kind,
      description: optional(input.description),
    });
    if (!parsed.success) throw new Error("تعذّر حفظ الكيان؛ تحقّق من البيانات المدخلة.");

    await db.entities.put(parsed.data);
    await db.auditLogs.add(audit(existing ? "update" : "create", "entities", parsed.data.id));
  });
}

export async function saveRelation(input: RelationInput, id?: string) {
  if (!input.fromEntityId || !input.toEntityId) throw new Error("اختر طرفَي العلاقة.");
  if (input.fromEntityId === input.toEntityId) throw new Error("اختر كيانين مختلفين للعلاقة.");
  if (!input.label.trim()) throw new Error("أدخل وصفاً مختصراً للعلاقة.");

  await db.transaction(
    "rw",
    [db.relations, db.entities, db.investigations, db.sources, db.auditLogs],
    async () => {
      const existing = id ? await db.relations.get(id) : undefined;
      if (id && !existing) throw new Error("لم تعد العلاقة موجودة. حدّث النموذج وحاول مجدداً.");

      const [from, to] = await Promise.all([
        db.entities.get(input.fromEntityId),
        db.entities.get(input.toEntityId),
      ]);
      if (!from || !to) throw new Error("أحد الكيانين لم يعد موجوداً.");

      const investigationId = optional(input.investigationId);
      const sourceId = optional(input.sourceId);
      if (investigationId && !(await db.investigations.get(investigationId))) {
        throw new Error("معرّف التحقيق غير موجود.");
      }
      if (sourceId && !(await db.sources.get(sourceId))) {
        throw new Error("معرّف المصدر غير موجود.");
      }

      const now = new Date().toISOString();
      const parsed = RelationSchema.safeParse({
        id: existing?.id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        fromEntityId: input.fromEntityId,
        toEntityId: input.toEntityId,
        label: input.label.trim(),
        description: optional(input.description),
        investigationId,
        sourceId,
      });
      if (!parsed.success) throw new Error("تعذّر حفظ العلاقة؛ تحقّق من البيانات والمعرّفات المدخلة.");

      await db.relations.put(parsed.data);
      await db.auditLogs.add(audit(existing ? "update" : "create", "relations", parsed.data.id));
    },
  );
}

export async function deleteRelation(id: Relation["id"]) {
  await db.transaction("rw", db.relations, db.auditLogs, async () => {
    if (!(await db.relations.get(id))) throw new Error("لم تعد العلاقة موجودة.");
    await db.relations.delete(id);
    await db.auditLogs.add(audit("delete", "relations", id));
  });
}

export async function deleteEntity(id: Entity["id"]) {
  await db.transaction("rw", db.entities, db.relations, db.auditLogs, async () => {
    if (!(await db.entities.get(id))) throw new Error("لم يعد الكيان موجوداً.");

    const [outgoing, incoming] = await Promise.all([
      db.relations.where("fromEntityId").equals(id).toArray(),
      db.relations.where("toEntityId").equals(id).toArray(),
    ]);
    const relationIds = [...new Set([...outgoing, ...incoming].map((relation) => relation.id))];
    if (relationIds.length) {
      await db.relations.bulkDelete(relationIds);
      await db.auditLogs.bulkAdd(relationIds.map ( (relationId) => audit("delete", "relations", relationId)));
    }
    await db.entities.delete(id);
    await db.auditLogs.add(audit("delete", "entities", id));
  });
}