import { create } from 'zustand';
import { db } from '../../db/db';
import {
  Investigation,
  Claim,
  Evidence,
  Source,
  InvestigationSchema,
  ClaimSchema,
  EvidenceSchema,
} from '../../types/domain';

export type InvestigationFilter = 'all' | 'open' | 'in_progress' | 'closed';

interface InvestigationsState {
  investigations: Investigation[];
  selectedInvestigationId: string | null;
  activeInvestigation: Investigation | null;
  claims: Claim[];
  evidences: Evidence[];
  sources: Source[];
  searchQuery: string;
  statusFilter: InvestigationFilter;
  loading: boolean;
  error: string | null;

  // Actions
  fetchInvestigations: () => Promise<void>;
  selectInvestigation: (id: string | null) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: InvestigationFilter) => void;
  fetchSources: () => Promise<void>;

  // CRUD Investigations
  createInvestigation: (data: { title: string; description?: string; status: 'open' | 'in_progress' | 'closed' }) => Promise<string>;
  updateInvestigation: (id: string, data: Partial<Pick<Investigation, 'title' | 'description' | 'status'>>) => Promise<void>;
  deleteInvestigation: (id: string) => Promise<void>;

  // CRUD Claims
  createClaim: (investigationId: string, text: string) => Promise<void>;
  updateClaim: (id: string, data: Partial<Pick<Claim, 'text' | 'status'>>) => Promise<void>;
  deleteClaim: (id: string) => Promise<void>;

  // CRUD Evidences
  createEvidence: (data: {
    investigationId: string;
    claimId?: string;
    sourceId?: string;
    title: string;
    description?: string;
    stance: 'supports' | 'contradicts' | 'neutral';
  }) => Promise<void>;
  updateEvidence: (
    id: string,
    data: Partial<Pick<Evidence, 'title' | 'description' | 'stance' | 'claimId' | 'sourceId'>>
  ) => Promise<void>;
  deleteEvidence: (id: string) => Promise<void>;
}

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'rec_' + Math.random().toString(36).substring(2, 11);
};

const createAudit = async (action: string, tableName: 'investigations' | 'claims' | 'evidences', recordId: string, details?: string) => {
  try {
    await db.auditLogs.add({
      id: generateId(),
      action,
      tableName,
      recordId,
      timestamp: new Date().toISOString(),
      details,
    });
  } catch (err) {
    console.error('فشل في كتابة سجل التدقيق:', err);
  }
};

export const useInvestigationsStore = create<InvestigationsState>((set, get) => ({
  investigations: [],
  selectedInvestigationId: null,
  activeInvestigation: null,
  claims: [],
  evidences: [],
  sources: [],
  searchQuery: '',
  statusFilter: 'all',
  loading: false,
  error: null,

  fetchInvestigations: async () => {
    set({ loading: true, error: null });
    try {
      const items = await db.investigations.orderBy('updatedAt').reverse().toArray();
      set({ investigations: items, loading: false });
      const currentSelected = get().selectedInvestigationId;
      if (currentSelected) {
        await get().selectInvestigation(currentSelected);
      } else if (items.length > 0) {
        await get().selectInvestigation(items[0].id);
      }
    } catch (err: any) {
      set({ error: err?.message || 'خطأ أثناء تحميل التحقيقات', loading: false });
    }
  },

  selectInvestigation: async (id: string | null) => {
    if (!id) {
      set({ selectedInvestigationId: null, activeInvestigation: null, claims: [], evidences: [] });
      return;
    }
    set({ loading: true, selectedInvestigationId: id });
    try {
      const inv = await db.investigations.get(id);
      if (!inv) {
        set({ selectedInvestigationId: null, activeInvestigation: null, claims: [], evidences: [], loading: false });
        return;
      }
      const [claims, evidences, sources] = await Promise.all([
        db.claims.where('investigationId').equals(id).reverse().sortBy('createdAt'),
        db.evidences.where('investigationId').equals(id).reverse().sortBy('createdAt'),
        db.sources.toArray(),
      ]);
      set({
        activeInvestigation: inv,
        claims,
        evidences,
        sources,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || 'خطأ أثناء تحديد التحقيق', loading: false });
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setStatusFilter: (statusFilter: InvestigationFilter) => set({ statusFilter }),

  fetchSources: async () => {
    try {
      const sources = await db.sources.toArray();
      set({ sources });
    } catch (err) {
      console.error('خطأ في تحميل المصادر:', err);
    }
  },

  createInvestigation: async (data) => {
    const now = new Date().toISOString();
    const newInv: Investigation = {
      id: generateId(),
      title: data.title.trim(),
      description: data.description?.trim(),
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };

    const parsed = InvestigationSchema.parse(newInv);
    await db.investigations.add(parsed);
    await createAudit('create', 'investigations', parsed.id, `إنشاء التحقيق: ${parsed.title}`);

    await get().fetchInvestigations();
    await get().selectInvestigation(parsed.id);
    return parsed.id;
  },

  updateInvestigation: async (id, data) => {
    const existing = await db.investigations.get(id);
    if (!existing) return;

    const updated: Investigation = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const parsed = InvestigationSchema.parse(updated);
    await db.investigations.put(parsed);
    await createAudit('update', 'investigations', id, `تعديل التحقيق: ${parsed.title}`);

    await get().fetchInvestigations();
    if (get().selectedInvestigationId === id) {
      set({ activeInvestigation: parsed });
    }
  },

  deleteInvestigation: async (id) => {
    const existing = await db.investigations.get(id);
    if (!existing) return;

    // Delete related claims and evidences
    await db.transaction('rw', [db.investigations, db.claims, db.evidences, db.auditLogs], async () => {
      await db.evidences.where('investigationId').equals(id).delete();
      await db.claims.where('investigationId').equals(id).delete();
      await db.investigations.delete(id);
      await createAudit('delete', 'investigations', id, `حذف التحقيق: ${existing.title}`);
    });

    const remaining = get().investigations.filter((i) => i.id !== id);
    set({
      investigations: remaining,
      selectedInvestigationId: remaining.length > 0 ? remaining[0].id : null,
    });
    if (remaining.length > 0) {
      await get().selectInvestigation(remaining[0].id);
    } else {
      set({ activeInvestigation: null, claims: [], evidences: [] });
    }
  },

  createClaim: async (investigationId, text) => {
    const now = new Date().toISOString();
    const newClaim: Claim = {
      id: generateId(),
      investigationId,
      text: text.trim(),
      status: 'unverified',
      createdAt: now,
      updatedAt: now,
    };

    const parsed = ClaimSchema.parse(newClaim);
    await db.claims.add(parsed);
    await createAudit('create', 'claims', parsed.id, `إضافة ادعاء: ${parsed.text.substring(0, 40)}...`);

    const claims = await db.claims.where('investigationId').equals(investigationId).reverse().sortBy('createdAt');
    set({ claims });
  },

  updateClaim: async (id, data) => {
    const existing = await db.claims.get(id);
    if (!existing) return;

    const updated: Claim = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const parsed = ClaimSchema.parse(updated);
    await db.claims.put(parsed);
    await createAudit('update', 'claims', id, `تعديل الادعاء: ${parsed.status}`);

    const claims = await db.claims.where('investigationId').equals(parsed.investigationId).reverse().sortBy('createdAt');
    set({ claims });
  },

  deleteClaim: async (id) => {
    const existing = await db.claims.get(id);
    if (!existing) return;

    await db.transaction('rw', [db.claims, db.evidences, db.auditLogs], async () => {
      // Unlink evidence from this claim
      const linkedEvidences = await db.evidences.where('claimId').equals(id).toArray();
      for (const ev of linkedEvidences) {
        await db.evidences.update(ev.id, { claimId: undefined, updatedAt: new Date().toISOString() });
      }
      await db.claims.delete(id);
      await createAudit('delete', 'claims', id, `حذف الادعاء: ${existing.text.substring(0, 30)}`);
    });

    const investigationId = existing.investigationId;
    const [claims, evidences] = await Promise.all([
      db.claims.where('investigationId').equals(investigationId).reverse().sortBy('createdAt'),
      db.evidences.where('investigationId').equals(investigationId).reverse().sortBy('createdAt'),
    ]);
    set({ claims, evidences });
  },

  createEvidence: async (data) => {
    const now = new Date().toISOString();
    const newEvidence: Evidence = {
      id: generateId(),
      investigationId: data.investigationId,
      claimId: data.claimId || undefined,
      sourceId: data.sourceId || undefined,
      title: data.title.trim(),
      description: data.description?.trim(),
      stance: data.stance,
      createdAt: now,
      updatedAt: now,
    };

    const parsed = EvidenceSchema.parse(newEvidence);
    await db.evidences.add(parsed);
    await createAudit('create', 'evidences', parsed.id, `إضافة دليل: ${parsed.title}`);

    const evidences = await db.evidences.where('investigationId').equals(data.investigationId).reverse().sortBy('createdAt');
    set({ evidences });
  },

  updateEvidence: async (id, data) => {
    const existing = await db.evidences.get(id);
    if (!existing) return;

    const updated: Evidence = {
      ...existing,
      ...data,
      claimId: data.claimId === '' ? undefined : (data.claimId ?? existing.claimId),
      sourceId: data.sourceId === '' ? undefined : (data.sourceId ?? existing.sourceId),
      updatedAt: new Date().toISOString(),
    };

    const parsed = EvidenceSchema.parse(updated);
    await db.evidences.put(parsed);
    await createAudit('update', 'evidences', id, `تعديل الدليل: ${parsed.title}`);

    const evidences = await db.evidences.where('investigationId').equals(parsed.investigationId).reverse().sortBy('createdAt');
    set({ evidences });
  },

  deleteEvidence: async (id) => {
    const existing = await db.evidences.get(id);
    if (!existing) return;

    await db.evidences.delete(id);
    await createAudit('delete', 'evidences', id, `حذف الدليل: ${existing.title}`);

    const evidences = await db.evidences.where('investigationId').equals(existing.investigationId).reverse().sortBy('createdAt');
    set({ evidences });
  },
}));