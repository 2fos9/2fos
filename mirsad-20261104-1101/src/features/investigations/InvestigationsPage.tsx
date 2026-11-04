import React, { useEffect, useState, useMemo } from 'react';
import {
  FolderSearch,
  Plus,
  Search,
  Filter,
  Trash2,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { useInvestigationsStore } from './useInvestigationsStore';
import { EvidenceModal } from './EvidenceModal';
import { ClaimSection } from './ClaimSection';
import { Evidence } from '../../types/domain';

export default function InvestigationsPage() {
  const {
    investigations,
    selectedInvestigationId,
    activeInvestigation,
    claims,
    evidences,
    sources,
    searchQuery,
    statusFilter,
    loading,
    error,
    fetchInvestigations,
    selectInvestigation,
    setSearchQuery,
    setStatusFilter,
    createInvestigation,
    updateInvestigation,
    deleteInvestigation,
    createClaim,
    updateClaim,
    deleteClaim,
    createEvidence,
    updateEvidence,
    deleteEvidence,
  } = useInvestigationsStore();

  const [activeTab, setActiveTab] = useState<'claims' | 'evidences' | 'details'>('claims');
  const [isNewInvModalOpen, setIsNewInvModalOpen] = useState(false);
  const [newInvTitle, setNewInvTitle] = useState('');
  const [newInvDescription, setNewInvDescription] = useState('');
  const [newInvStatus, setNewInvStatus] = useState<'open' | 'in_progress' | 'closed'>('open');

  // Evidence Modal State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [prefilledClaimId, setPrefilledClaimId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  // Filtered investigations list
  const filteredInvestigations = useMemo(() => {
    return investigations.filter((inv) => {
      const matchesSearch =
        inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.description && inv.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' ? true : inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [investigations, searchQuery, statusFilter]);

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvTitle.trim()) return;

    await createInvestigation({
      title: newInvTitle.trim(),
      description: newInvDescription.trim() || undefined,
      status: newInvStatus,
    });

    setNewInvTitle('');
    setNewInvDescription('');
    setNewInvStatus('open');
    setIsNewInvModalOpen(false);
  };

  const handleOpenEvidenceModal = (evidence?: Evidence, claimId?: string) => {
    setEditingEvidence(evidence || null);
    setPrefilledClaimId(claimId);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceSubmit = async (data: {
    title: string;
    description?: string;
    stance: 'supports' | 'contradicts' | 'neutral';
    claimId?: string;
    sourceId?: string;
  }) => {
    if (!activeInvestigation) return;

    if (editingEvidence) {
      await updateEvidence(editingEvidence.id, {
        ...data,
        claimId: data.claimId || undefined,
        sourceId: data.sourceId || undefined,
      });
    } else {
      await createEvidence({
        investigationId: activeInvestigation.id,
        ...data,
        claimId: data.claimId || prefilledClaimId || undefined,
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0B1329] text-gray-100" dir="rtl">
      {/* Sidebar: Investigations List */}
      <div className="w-80 md:w-96 flex flex-col border-l border-white/10 bg-[#0B1329]">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderSearch className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-bold text-white text-base">ملفات التحقيق</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#131B36] border border-white/10 text-[#D4AF37] font-semibold">
                {filteredInvestigations.length}
              </span>
            </div>
            <button
              onClick={() => setIsNewInvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>تحقيق جديد</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في التحقيقات..."
              className="w-full pr-9 pl-3 py-1.5 bg-[#131B36] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {(['all', 'open', 'in_progress', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#D4AF37] text-[#0B1329] font-bold'
                    : 'bg-[#131B36] text-gray-400 hover:text-white'
                }`}
              >
                {st === 'all'
                  ? 'الكل'
                  : st === 'open'
                  ? 'مفتوح'
                  : st === 'in_progress'
                  ? 'قيد العمل'
                  : 'مغلق'}
              </button>
            ))}
          </div>
        </div>

        {/* List of investigations */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loading && investigations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">جارٍ تحميل التحقيقات...</div>
          ) : filteredInvestigations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              لا توجد تحقيقات مطابقة لمعايير البحث
            </div>
          ) : (
            filteredInvestigations.map((inv) => {
              const isSelected = inv.id === selectedInvestigationId;
              return (
                <div
                  key={inv.id}
                  onClick={() => selectInvestigation(inv.id)}
                  className={`p-4 cursor-pointer transition-all border-r-4 ${
                    isSelected
                      ? 'bg-[#131B36] border-[#D4AF37] shadow-inner'
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-sm line-clamp-1 ${isSelected ? 'text-[#D4AF37]' : 'text-white'}`}>
                      {inv.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                        inv.status === 'open'
                          ? 'bg-blue-500/20 text-blue-300'
                          : inv.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {inv.status === 'open'
                        ? 'مفتوح'
                        : inv.status === 'in_progress'
                        ? 'قيد الإجراء'
                        : 'مغلق'}
                    </span>
                  </div>
                  {inv.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">{inv.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inv.updatedAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Investigation Canvas */}
      <div className="flex-1 flex flex-col bg-[#0B1329]/95 overflow-hidden">
        {error && (
          <div className="bg-red-950/80 border-b border-red-500/40 text-red-200 px-6 py-2.5 text-xs flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {activeInvestigation ? (
          <>
            {/* Header info */}
            <div className="p-6 border-b border-white/10 bg-[#131B36]/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                      {activeInvestigation.title}
                    </h1>
                    <select
                      value={activeInvestigation.status}
                      onChange={(e) =>
                        updateInvestigation(activeInvestigation.id, {
                          status: e.target.value as 'open' | 'in_progress' | 'closed',
                        })
                      }
                      className="px-2.5 py-1 text-xs rounded-lg bg-[#0B1329] border border-white/10 text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="open">مفتوح للتحقيق</option>
                      <option value="in_progress">قيد الفحص والتوثيق</option>
                      <option value="closed">مكتمل ومغلق</option>
                    </select>
                  </div>
                  {activeInvestigation.description && (
                    <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
                      {activeInvestigation.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEvidenceModal()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold text-xs shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دليل مستقل</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا التحقيق وجميع الادعاءات والأدلة المرتبطة به؟')) {
                        deleteInvestigation(activeInvestigation.id);
                      }
                    }}
                    className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                    title="حذف التحقيق بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-3 mt-6 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('claims')}
                  className={`pb-2.5 px-2 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                    activeTab === 'claims' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>الادعاءات والفرضيات</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#131B36] border border-white/10">
                    {claims.length}
                  </span>
                  {activeTab === 'claims' && (
                    <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#D4AF37]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('evidences')}
                  className={`pb-2.5 px-2 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                    activeTab === 'evidences' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>سجل الأدلة والمستندات</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#131B36] border border-white/10">
                    {evidences.length}
                  </span>
                  {activeTab === 'evidences' && (
                    <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#D4AF37]" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 px-2 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                    activeTab === 'details' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>بيانات وسجل التحقيق</span>
                  {activeTab === 'details' && (
                    <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#D4AF37]" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'claims' && (
                <ClaimSection
                  claims={claims}
                  evidences={evidences}
                  sources={sources}
                  onAddClaim={(text) => createClaim(activeInvestigation.id, text)}
                  onUpdateClaimStatus={(claimId, status) => updateClaim(claimId, { status })}
                  onDeleteClaim={(claimId) => deleteClaim(claimId)}
                  onEditEvidence={(ev) => handleOpenEvidenceModal(ev)}
                  onDeleteEvidence={(evId) => deleteEvidence(evId)}
                  onOpenNewEvidenceModal={(claimId) => handleOpenEvidenceModal(undefined, claimId)}
                />
              )}

              {activeTab === 'evidences' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      قائمة بجميع الأدلة والقرائن والمستندات المربوطة بهذا الملف التحقيقي.
                    </p>
                    <button
                      onClick={() => handleOpenEvidenceModal()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold text-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة دليل جديد</span>
                    </button>
                  </div>

                  {evidences.length === 0 ? (
                    <div className="p-8 text-center bg-[#131B36]/30 border border-dashed border-white/10 rounded-2xl">
                      <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">لم يتم تسجيل أدلة بعد في هذا التحقيق.</p>
                      <p className="text-xs text-gray-500 mt-1">
                        يمكنك إضافة وثائق، تسجيلات، أو صور وربطها بالمصادر والادعاءات.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {evidences.map((ev) => {
                        const linkedClaim = claims.find((c) => c.id === ev.claimId);
                        const linkedSource = sources.find((s) => s.id === ev.sourceId);

                        return (
                          <div
                            key={ev.id}
                            className="bg-[#131B36]/80 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                    ev.stance === 'supports'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : ev.stance === 'contradicts'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {ev.stance === 'supports'
                                    ? 'مؤيد'
                                    : ev.stance === 'contradicts'
                                    ? 'مناقض'
                                    : 'محايد'}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEvidenceModal(ev)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300 transition-colors"
                                  >
                                    تعديل
                                  </button>
                                  <button
                                    onClick={() => deleteEvidence(ev.id)}
                                    className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="text-white font-bold text-base">{ev.title}</h4>

                              {ev.description && (
                                <p className="text-xs text-gray-300 leading-relaxed bg-[#0B1329]/50 p-2.5 rounded-lg border border-white/5">
                                  {ev.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs text-gray-400">
                              {linkedClaim && (
                                <div className="line-clamp-1">
                                  <strong className="text-gray-300">الادعاء المرتبط: </strong>
                                  <span className="text-white">{linkedClaim.text}</span>
                                </div>
                              )}
                              {linkedSource && (
                                <div className="line-clamp-1">
                                  <strong className="text-gray-300">المصدر: </strong>
                                  <span className="text-[#D4AF37]">{linkedSource.title}</span>
                                </div>
                              )}
                              <div className="text-[11px] text-gray-500 pt-1">
                                أضيف بتاريخ: {new Date(ev.createdAt).toLocaleString('ar-EG')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="max-w-2xl bg-[#131B36]/60 border border-white/10 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">معلومات الملف التحقيقي</h3>
                    <p className="text-xs text-gray-400">
                      معرف التحقيق الفريد وتواريخ الإنشاء والتحكم بالبيانات.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        معرف التحقيق (ID)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={activeInvestigation.id}
                        className="w-full px-3 py-2 bg-[#0B1329] border border-white/10 rounded-lg text-xs font-mono text-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        تاريخ الإنشاء
                      </label>
                      <div className="text-sm text-white">
                        {new Date(activeInvestigation.createdAt).toLocaleString('ar-EG')}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">
                        آخر تحديث للملف
                      </label>
                      <div className="text-sm text-white">
                        {new Date(activeInvestigation.updatedAt).toLocaleString('ar-EG')}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#0B1329] border border-white/5 flex-1">
                        <div className="text-xs text-gray-400">إجمالي الادعاءات</div>
                        <div className="text-xl font-bold text-[#D4AF37] mt-1">{claims.length}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0B1329] border border-white/5 flex-1">
                        <div className="text-xs text-gray-400">إجمالي الأدلة الموثقة</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {evidences.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-5 rounded-2xl bg-[#131B36] border border-[#D4AF37]/20 mb-4 shadow-xl">
              <FolderSearch className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">اختر ملف تحقيق أو أنشئ تحقيقاً جديداً</h3>
            <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
              تتيح لك منصة مِرْصاد توثيق الادعاءات، ربط الأدلة الجنائية والصحفية بالمصادر، وتتبع سير
              التحقيقات محلياً بأمان كامل.
            </p>
            <button
              onClick={() => setIsNewInvModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold text-sm shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>بدء ملف تحقيق جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* New Investigation Modal */}
      {isNewInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg bg-[#0B1329] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#131B36]/60">
              <h3 className="text-lg font-bold text-white">إنشاء ملف تحقيق جديد</h3>
              <button
                onClick={() => setIsNewInvModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvestigation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  عنوان ملف التحقيق <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newInvTitle}
                  onChange={(e) => setNewInvTitle(e.target.value)}
                  placeholder="مثال: تحقيق حول تسريب وثائق بنك كذا..."
                  className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">الحالة المبدئية</label>
                <select
                  value={newInvStatus}
                  onChange={(e) => setNewInvStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                >
                  <option value="open">مفتوح</option>
                  <option value="in_progress">قيد الإجراء</option>
                  <option value="closed">مغلق</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  نطاق التحقيق ووصف الهدف (اختياري)
                </label>
                <textarea
                  rows={4}
                  value={newInvDescription}
                  onChange={(e) => setNewInvDescription(e.target.value)}
                  placeholder="حدد نطاق البحث، الفرضيات المبدئية، والأطراف ذات الصلة..."
                  className="w-full px-3 py-2 bg-[#131B36] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewInvModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0B1329] font-bold text-sm shadow-md"
                >
                  تأكيد وإنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {activeInvestigation && (
        <EvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => {
            setIsEvidenceModalOpen(false);
            setEditingEvidence(null);
            setPrefilledClaimId(undefined);
          }}
          onSubmit={handleEvidenceSubmit}
          evidenceToEdit={editingEvidence}
          claims={claims}
          sources={sources}
          investigationId={activeInvestigation.id}
        />
      )}
    </div>
  );
}