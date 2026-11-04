import { db } from "../../db/db";
import { type Source, type AuditLog, SourceSchema } from "../../types/domain";

export type SourceFormInput = {
  title: string;
  kind: "document" | "article" | "website" | "interview" | "other";
  description?: string;
  url?: string;
  content?: string;
};

export async function fetchAllSources(): Promise<Source[]> {
  return await db.sources.orderBy("createdAt").reverse().toArray();
}

export async function createSource(input: SourceFormInput): Promise<Source> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const rawData: Source = {
    id,
    title: input.title.trim(),
    kind: input.kind,
    description: input.description?.trim() ? input.description.trim() : undefined,
    url: input.url?.trim() ? input.url.trim() : undefined,
    content: input.content?.trim() ? input.content.trim() : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const validatedSource = SourceSchema.parse(rawData);

  const auditEntry: AuditLog = {
    id: crypto.randomUUID(),
    action: "create",
    tableName: "sources",
    recordId: id,
    timestamp: now,
    details: JSON.stringify({
      title: validatedSource.title,
      kind: validatedSource.kind,
    }),
  };

  await db.transaction("rw", db.sources, db.auditLogs, async () => {
    await db.sources.add(validatedSource);
    await db.auditLogs.add(auditEntry);
  });

  return validatedSource;
}

export async function updateSource(
  id: string,
  input: SourceFormInput
): Promise<Source> {
  const existing = await db.sources.get(id);
  if (!existing) {
    throw new Error("المصدر المطلوب غير موجود.");
  }

  const now = new Date().toISOString();
  const rawData: Source = {
    ...existing,
    title: input.title.trim(),
    kind: input.kind,
    description: input.description?.trim() ? input.description.trim() : undefined,
    url: input.url?.trim() ? input.url.trim() : undefined,
    content: input.content?.trim() ? input.content.trim() : undefined,
    updatedAt: now,
  };

  const validatedSource = SourceSchema.parse(rawData);

  const auditEntry: AuditLog = {
    id: crypto.randomUUID(),
    action: "update",
    tableName: "sources",
    recordId: id,
    timestamp: now,
    details: JSON.stringify({
      title: validatedSource.title,
      kind: validatedSource.kind,
    }),
  };

  await db.transaction("rw", db.sources, db.auditLogs, async () => {
    await db.sources.put(validatedSource);
    await db.auditLogs.add(auditEntry);
  });

  return validatedSource;
}

export async function deleteSource(id: string): Promise<void> {
  const existing = await db.sources.get(id);
  if (!existing) {
    throw new Error("المصدر غير موجود لحذفه.");
  }

  const now = new Date().toISOString();
  const auditEntry: AuditLog = {
    id: crypto.randomUUID(),
    action: "delete",
    tableName: "sources",
    recordId: id,
    timestamp: now,
    details: JSON.stringify({
      title: existing.title,
      kind: existing.kind,
    }),
  };

  await db.transaction("rw", db.sources, db.auditLogs, async () => {
    await db.sources.delete(id);
    await db.auditLogs.add(auditEntry);
  });
}