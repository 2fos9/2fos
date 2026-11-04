import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, CheckCircle, ShieldAlert, HelpCircle } from 'lucide-react';
import { Evidence, Claim, Source } from '../../types/domain';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    stance: 'supports' | 'contradicts' | 'neutral';
    claimId?: string;
    sourceId?: string;
  }) => Promise<void>;
  evidenceToEdit?: Evidence | null;
  claims: Claim[];
  sources: Source[];
  investigationId: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  evidenceToEdit,
  claims,
  sources,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stance, setStance] = useState<'supports' | 'contradicts' | 'neutral'>('neutral');
  const [claimId, setClaimId] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (evidenceToEdit) {
      setTitle(evidenceToEdit.title);
      setDescription(evidenceToEdit.description || '');
      setStance(evidenceToEdit.stance);
      setClaimId(evidenceToEdit.claimId || '');
      setSourceId(evidenceToEdit.sourceId || '');
    } else {
      setTitle('');
      setDescription('');
      setStance('neutral');
      setClaimId('');
      setSourceId('');
    }
    setValidationError(null);
  }, [evidenceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('عنوان الدليل مطلوب');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        stance,
        claimId: claimId || undefined,
        sourceId: sourceId || undefined,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'حدث خطأ أثناء حفظ الدليل');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-xl bg-[#0B1329] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#131B36]/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg font-bold text-white">
              {evidenceToEdit ? 'تعديل الدليل والقرينة' : 'إضافة دليل جديد للتحقيق'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-sm rounded-lg">
              {validationError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              عنوان الدليل أو الوثيقة <span className="text-[#D4AF37]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تسجيل صوتي، كشف حساب بنكي، صورة قمر صناعي..."
              required
              className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              موقف الدليل (الموثوقية والاتجاه)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStance('supports')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  stance === 'supports'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'border-white/10 bg-[#131B36] text-gray-400 hover:bg-white/5'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>مؤيد (Supports)</span>
              </button>
              <button
                type="button"
                onClick={() => setStance('contradicts')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  stance === 'contradicts'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-sm'
                    : 'border-white/10 bg-[#131B36] text-gray-400 hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>مناقض (Contradicts)</span>
              </button>
              <button
                type="button"
                onClick={() => setStance('neutral')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  stance === 'neutral'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                    : 'border-white/10 bg-[#131B36] text-gray-400 hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>محايد (Neutral)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ربط بادعاء محدد (اختياري)
              </label>
              <select
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
              >
                <option value="">-- بدون ربط بادعاء محدد --</option>
                {claims.map((claim) => (
                  <option key={claim.id} value={claim.id}>
                    {claim.text.length > 45 ? claim.text.substring(0, 45) + '...' : claim.text}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                ربط بمصدر من المكتبة (اختياري)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
              >
                <option value="">-- بدون ربط بمصدر --</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    [{src.kind}] {src.title.length > 35 ? src.title.substring(0, 35) + '...' : src.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              شرح تفصيلي أو اقتباس من الدليل
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="اكتب تفاصيل الدليل، الاقتباس الحرفي، دلالته الميدانية..."
              className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
            />
          </div>

          {sourceId && (
            <div className="p-3 bg-[#131B36]/90 border border-[#D4AF37]/20 rounded-lg text-xs text-gray-300 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                مرتبط بالمصدر:{' '}
                <strong className="text-white">
                  {sources.find((s) => s.id === sourceId)?.title}
                </strong>
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold transition-colors text-sm shadow-md"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : evidenceToEdit ? 'تحديث الدليل' : 'إضافة الدليل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};