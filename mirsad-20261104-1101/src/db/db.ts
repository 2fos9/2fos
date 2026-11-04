import Dexie, { type Table } from "dexie";
import type {
  AuditLog,
  Claim,
  Entity,
  Evidence,
  Investigation,
  Relation,
  Source,
  TimelineEvent,
} from "../types/domain";

export class MirsadDatabase extends Dexie {
  declare sources: Table<Source, string>;
  declare investigations: Table<Investigation, string>;
  declare claims: Table<Claim, string>;
  declare evidences: Table<Evidence, string>;
  declare timelineEvents: Table<TimelineEvent, string>;
  declare entities: Table<Entity, string>;
  declare relations: Table<Relation, string>;
  declare auditLogs: Table<AuditLog, string>;

  constructor() {
    super("mirsad");

    this.version(1).stores({
      sources: "id, title, kind, createdAt, updatedAt",
      investigations: "id, title, status, createdAt, updatedAt",
      claims:
        "id, investigationId, status, createdAt, updatedAt, [investigationId+status]",
      evidences:
        "id, investigationId, claimId, sourceId, stance, createdAt, updatedAt",
      timelineEvents:
        "id, investigationId, sourceId, occurredAt, createdAt, updatedAt, [investigationId+occurredAt]",
      entities: "id, name, kind, createdAt, updatedAt",
      relations:
        "id, fromEntityId, toEntityId, investigationId, sourceId, label, createdAt, updatedAt, [fromEntityId+toEntityId]",
      auditLogs: "id, tableName, recordId, timestamp, [tableName+recordId]",
    });
  }
}

export const db = new MirsadDatabase();
export default db;