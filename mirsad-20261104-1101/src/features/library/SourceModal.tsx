import React, { useState, useEffect } from "react";
import { X, AlertCircle, Save } from "lucide-react";
import { type Source } from "../../types/domain";
import { type SourceFormInput } from "./sourceService";

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SourceFormInput) => Promise<void>;
  initialData: Source | null;
}

const KIND_OPTIONS: { label: string; value: Source["kind"] }[] = [
  { label: "وثيقة رسمية", value: "document" },
  { label: "مقال تحليلي/صحفي", value: "article" },
  { label: "موقع إلكتروني", value: "website" },
  { label: "مقابلة أو شهادة", value: "interview" },
  { label: "أخرى", value: "other" },
];

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Source["kind"]>("document");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setKind(initialData.kind);
      setDescription(initialData.description || "");
      setUrl(initialData.url || "");
      setContent(initialData.content || "");
    } else {
      setTitle("");
      setKind("document");
      setDescription("");
      setUrl("");
      setContent("");
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("يرجى إدخال عنوان المصدر.");
      return;
    }

    if (url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        setErrorMsg("صيغة الرابط غير صحيحة، يرجى تضمين http:// أو https://");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        kind,
        description,
        url,
        content,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-[#0B1329] border border-[#131B36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#131B36] bg-[#131B36]/40">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            {initialData ? "تعديل بيانات المصدر" : "إضافة مصدر جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131B36] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              عنوان المصدر <span className="text-[#D4AF37]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: وثيقة سجل الأراضي أو تقرير منظمة..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#131B36] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                نوع المصدر <span className="text-[#D4AF37]">*</span>
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Source["kind"])}
                className="w-full px-4 py-2.5 rounded-lg bg-[#131B36] border border-slate-700 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              >
                {KIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                الرابط المرجعي (URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-lg bg-[#131B36] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              الوصف أو ملخص التوثيق
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="نبذة سريعة عن أهمية وموثوقية المصدر..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#131B36] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              المحتوى النصي المستخرج أو الملاحظات التفصيلية
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="انسخ النص المفرغ أو المحتوى الخام للاستفادة منه في البحث والتقاط الأدلة..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#131B36] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#131B36]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-[#131B36] hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D4AF37] text-[#0B1329] font-bold hover:bg-[#c29f2f] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "جارٍ الحفظ..." : "حفظ المصدر"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};