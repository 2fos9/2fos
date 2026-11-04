import React, { useEffect, useMemo } from "react";
import {
  Library,
  Plus,
  Search,
  Filter,
  FileText,
  AlertCircle,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";
import { useLibraryStore, type SourceKindFilter } from "./useLibraryStore";
import { SourceCard } from "./SourceCard";
import { SourceModal } from "./SourceModal";

export default function LibraryPage() {
  const {
    sources,
    isLoading,
    error,
    searchQuery,
    selectedKind,
    activeSourceForModal,
    isModalOpen,
    selectedSourceForView,
    loadSources,
    setSearchQuery,
    setSelectedKind,
    openCreateModal,
    openEditModal,
    closeModal,
    setSelectedSourceForView,
    saveSource,
    removeSource,
  } = useLibraryStore();

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const filteredSources = useMemo(() => {
    return sources.filter((item) => {
      const matchKind =
        selectedKind === "all" ? true : item.kind === selectedKind;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q));
      return matchKind && matchSearch;
    });
  }, [sources, selectedKind, searchQuery]);

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المصدر نهائياً من قاعدة البيانات المحلية؟")) {
      await removeSource(id);
    }
  };

  const countsByKind = useMemo(() => {
    const counts = {
      all: sources.length,
      document: 0,
      article: 0,
      website: 0,
      interview: 0,
      other: 0,
    };
    for (const s of sources) {
      if (counts[s.kind] !== undefined) {
        counts[s.kind]++;
      }
    }
    return counts;
  }, [sources]);

  return (
    <div className="min-h-screen bg-[#0B1329] text-slate-100 p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#131B36] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#131B36] border border-[#D4AF37]/30 text-[#D4AF37]">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">
                مكتبة المصادر والوثائق
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                أرشيف محلي أولاً (Local-First) لحفظ وتنظيم المراجع والوثائق ومزامنتها مع سجل التدقيق
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1329] font-bold hover:bg-[#c29f2f] transition-all shadow-lg hover:shadow-[#D4AF37]/20"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مصدر جديد</span>
        </button>
      </div>

      {/* لوحة المؤشرات والإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            { id: "all", label: "الكل" },
            { id: "document", label: "وثائق" },
            { id: "article", label: "مقالات" },
            { id: "website", label: "مواقع" },
            { id: "interview", label: "مقابلات" },
            { id: "other", label: "أخرى" },
          ] as { id: SourceKindFilter; label: string }[]
        ).map((tab) => {
          const isSelected = selectedKind === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedKind(tab.id)}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-[#131B36] border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#131B36]/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span className="text-xs">{tab.label}</span>
              <span className="text-xl font-bold mt-1 text-[#D4AF37]">
                {countsByKind[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#131B36]/60 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو المحتوى أو التفاصيل..."
            className="w-full pr-11 pl-4 py-2.5 bg-[#0B1329] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value as SourceKindFilter)}
            className="w-full md:w-48 px-3 py-2.5 bg-[#0B1329] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
          >
            <option value="all">كافة الأنواع</option>
            <option value="document">وثيقة</option>
            <option value="article">مقال</option>
            <option value="website">موقع إلكتروني</option>
            <option value="interview">مقابلة</option>
            <option value="other">أخرى</option>
          </select>
        </div>
      </div>

      {/* رسالة الخطأ إن وجدت */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* شبكة البطاقات أو الحالة الفارغة */}
      {isLoading && sources.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3" />
          <p>جارٍ تحميل المصادر من المستودع المحلي...</p>
        </div>
      ) : filteredSources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onView={setSelectedSourceForView}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#131B36]/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            لا توجد مصادر مطابقة
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            {searchQuery
              ? "لم يتم العثور على مصادر تطابق استعلام البحث الحالي، جرب كلمات مفتاحية أخرى."
              : "لم تقم بإضافة أي مصادر بعد في هذا التصنيف. ابدأ الآن بتوثيق المراجع والأدلة."}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#0B1329] font-bold hover:bg-[#c29f2f] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول مصدر</span>
          </button>
        </div>
      )}

      {/* نموذج الإضافة والتعديل */}
      <SourceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveSource}
        initialData={activeSourceForModal}
      />

      {/* معاينة تفاصيل المصدر */}
      {selectedSourceForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#0B1329] border border-[#131B36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#131B36] bg-[#131B36]/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                معاينة تفاصيل المصدر
              </h2>
              <button
                onClick={() => setSelectedSourceForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131B36] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1">العنوان</span>
                <h3 className="text-xl font-bold text-white">
                  {selectedSourceForView.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#131B36]/50 p-4 rounded-lg">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">النوع</span>
                  <span className="text-sm text-[#D4AF37] font-semibold">
                    {selectedSourceForView.kind}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    تاريخ الإضافة
                  </span>
                  <span className="text-sm text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {new Date(selectedSourceForView.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
              </div>

              {selectedSourceForView.url && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    الرابط المرجعي
                  </span>
                  <a
                    href={selectedSourceForView.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#D4AF37] hover:underline break-all"
                    dir="ltr"
                  >
                    <span>{selectedSourceForView.url}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedSourceForView.description && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    الوصف والملخص
                  </span>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap bg-[#131B36]/30 p-3 rounded-lg border border-slate-800">
                    {selectedSourceForView.description}
                  </p>
                </div>
              )}

              {selectedSourceForView.content && (
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    النص الكامل والمحتوى المستخرج
                  </span>
                  <div className="p-4 bg-[#131B36] border border-slate-800 rounded-lg text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {selectedSourceForView.content}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-[#131B36] bg-[#131B36]/20">
              <button
                onClick={() => {
                  const s = selectedSourceForView;
                  setSelectedSourceForView(null);
                  openEditModal(s);
                }}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0B1329] font-bold hover:bg-[#c29f2f] transition-colors text-sm"
              >
                تعديل المصدر
              </button>
              <button
                onClick={() => setSelectedSourceForView(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-[#131B36] hover:text-white transition-colors text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}