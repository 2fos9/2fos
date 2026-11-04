import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Claim, Evidence, Source } from '../../types/domain';

interface ClaimSectionProps {
  claims: Claim[];
  evidences: Evidence[];
  sources: Source[];
  onAddClaim: (text: string) => Promise<void>;
  onUpdateClaimStatus: (claimId: string, status: 'unverified' | 'supported' | 'disputed') => Promise<void>;
  onDeleteClaim: (claimId: string) => Promise<void>;
  onEditEvidence: (evidence: Evidence) => void;
  onDeleteEvidence: (evidenceId: string) => Promise<void>;
  onOpenNewEvidenceModal: (claimId?: string) => void;
}

export const ClaimSection: React.FC<ClaimSectionProps> = ({
  claims,
  evidences,
  sources,
  onAddClaim,
  onUpdateClaimStatus,
  onDeleteClaim,
  onEditEvidence,
  onDeleteEvidence,
  onOpenNewEvidenceModal,
}) => {
  const [newClaimText, setNewClaimText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddClaim(newClaimText.trim());
      setNewClaimText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceTitle = (sourceId?: string) => {
    if (!sourceId) return null;
    return sources.find((s) => s.id === sourceId)?.title || 'مصدر غير معروف';
  };

  const toggleExpand = (id: string) => {
    setExpandedClaimId(expandedClaimId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* New Claim Input */}
      <form onSubmit={handleCreateClaim} className="flex gap-2">
        <input
          type="text"
          value={newClaimText}
          onChange={(e) => setNewClaimText(e.target.value)}
          placeholder="أضف ادعاءً جديداً يتطلب التحقق والإثبات..."
          className="flex-1 px-4 py-2.5 bg-[#131B36] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] text-sm"
        />
        <button
          type="submit"
          disabled={!newClaimText.trim() || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold rounded-xl transition-all disabled:opacity-40 text-sm whitespace-nowrap shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ادعاء</span>
        </button>
      </form>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.length === 0 ? (
          <div className="p-8 text-center bg-[#131B36]/40 border border-dashed border-white/10 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">لم يتم تسجيل أي ادعاءات في هذا التحقيق بعد.</p>
            <p className="text-xs text-gray-500 mt-1">
              الادعاءات هي الفرضيات أو التصريحات التي يرتكز عليها التحقيق للتحقق من صحتها.
            </p>
          </div>
        ) : (
          claims.map((claim) => {
            const linkedEvidences = evidences.filter((ev) => ev.claimId === claim.id);
            const supportsCount = linkedEvidences.filter((e) => e.stance === 'supports').length;
            const contradictsCount = linkedEvidences.filter((e) => e.stance === 'contradicts').length;
            const isExpanded = expandedClaimId === claim.id || expandedClaimId === null;

            return (
              <div
                key={claim.id}
                className="bg-[#131B36]/80 border border-white/10 rounded-xl p-4 transition-all hover:border-[#D4AF37]/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                          claim.status === 'supported'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : claim.status === 'disputed'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {claim.status === 'supported' && <CheckCircle2 className="w-3 h-3" />}
                        {claim.status === 'disputed' && <XCircle className="w-3 h-3" />}
                        {claim.status === 'unverified' && <HelpCircle className="w-3 h-3" />}
                        <span>
                          {claim.status === 'supported'
                            ? 'مُثبت'
                            : claim.status === 'disputed'
                            ? 'مطعون فيه'
                            : 'قيد التحقق'}
                        </span>
                      </span>

                      <span className="text-xs text-gray-400">
                        الأدلة: {linkedEvidences.length} (
                        <span className="text-emerald-400 font-semibold">{supportsCount} مؤيد</span> /{' '}
                        <span className="text-rose-400 font-semibold">{contradictsCount} مناقض</span>)
                      </span>
                    </div>
                    <p className="text-white text-base leading-relaxed font-medium">{claim.text}</p>
                  </div>

                  {/* Claim Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={claim.status}
                      onChange={(e) =>
                        onUpdateClaimStatus(
                          claim.id,
                          e.target.value as 'unverified' | 'supported' | 'disputed'
                        )
                      }
                      className="px-2.5 py-1 text-xs bg-[#0B1329] border border-white/10 rounded-lg text-gray-200 focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="unverified">قيد التحقق</option>
                      <option value="supported">مُثبت</option>
                      <option value="disputed">مطعون فيه</option>
                    </select>

                    <button
                      onClick={() => onDeleteClaim(claim.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف الادعاء"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleExpand(claim.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Evidences for this Claim */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="font-semibold text-gray-300 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        الأدلة والقرائن المرتبطة بهذا الادعاء ({linkedEvidences.length})
                      </span>
                      <button
                        onClick={() => onOpenNewEvidenceModal(claim.id)}
                        className="text-[#D4AF37] hover:underline font-medium text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        ربط دليل جديد
                      </button>
                    </div>

                    {linkedEvidences.length === 0 ? (
                      <div className="text-xs text-gray-500 bg-[#0B1329]/50 p-3 rounded-lg border border-white/5">
                        لا توجد أدلة مخصصة لهذا الادعاء حالياً. اضغط "ربط دليل جديد" لتعزيز الموقف التحقيقي.
                      </div>
                    ) : (
                      linkedEvidences.map((evidence) => {
                        const sourceTitle = getSourceTitle(evidence.sourceId);
                        return (
                          <div
                            key={evidence.id}
                            className="bg-[#0B1329]/70 border border-white/5 rounded-lg p-3 text-xs flex items-start justify-between gap-3 hover:border-white/15 transition-all"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    evidence.stance === 'supports'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : evidence.stance === 'contradicts'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {evidence.stance === 'supports'
                                    ? 'مؤيد'
                                    : evidence.stance === 'contradicts'
                                    ? 'مناقض'
                                    : 'محايد'}
                                </span>
                                <span className="font-semibold text-white text-sm">
                                  {evidence.title}
                                </span>
                              </div>
                              {evidence.description && (
                                <p className="text-gray-300 leading-relaxed pl-2">
                                  {evidence.description}
                                </p>
                              )}
                              {sourceTitle && (
                                <div className="text-gray-400 flex items-center gap-1 pt-1">
                                  <span>المصدر:</span>
                                  <span className="text-[#D4AF37] font-medium">{sourceTitle}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onEditEvidence(evidence)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded transition-colors"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => onDeleteEvidence(evidence.id)}
                                className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};