import { z } from "zod";

export const IdSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();

const RecordFieldsSchema = z.object({
  id: IdSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const SourceSchema = RecordFieldsSchema.extend({
  title: z.string().min(1),
  kind: z.enum(["document", "article", "website", "interview", "other"]),
  description: z.string().optional(),
  url: z.string().url().optional(),
  content: z.string().optional(),
});

export const InvestigationSchema = RecordFieldsSchema.extend({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["open", "in_progress", "closed"]),
});

export const ClaimSchema = RecordFieldsSchema.extend({
  investigationId: IdSchema,
  text: z.string().min(1),
  status: z.enum(["unverified", "supported", "disputed"]),
});

export const EvidenceSchema = RecordFieldsSchema.extend({
  investigationId: IdSchema,
  claimId: IdSchema.optional(),
  sourceId: IdSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  stance: z.enum(["supports", "contradicts", "neutral"]),
});

export const TimelineEventSchema = RecordFieldsSchema.extend({
  investigationId: IdSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  occurredAt: TimestampSchema,
  sourceId: IdSchema.optional(),
});

export const EntitySchema = RecordFieldsSchema.extend({
  name: z.string().min(1),
  kind: z.enum(["person", "organization", "place", "other"]),
  description: z.string().optional(),
});

export const RelationSchema = RecordFieldsSchema.extend({
  fromEntityId: IdSchema,
  toEntityId: IdSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  investigationId: IdSchema.optional(),
  sourceId: IdSchema.optional(),
});

export const AuditLogSchema = z.object({
  id: IdSchema,
  action: z.string().min(1),
  tableName: z.enum([
    "sources",
    "investigations",
    "claims",
    "evidences",
    "timelineEvents",
    "entities",
    "relations",
  ]),
  recordId: IdSchema,
  timestamp: TimestampSchema,
  details: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;
export type Investigation = z.infer<typeof InvestigationSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;