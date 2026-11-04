import React from "react";
import {
  FileText,
  Globe,
  Newspaper,
  Mic,
  Folder,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import { type Source } from "../../types/domain";

interface SourceCardProps {
  source: Source;
  onEdit: (source: Source) => void;
  onDelete: (id: string) => void;
  onView: (source: Source) => void;
}

const KIND_LABELS: Record<Source["kind"], string> = {
  document: "وثيقة",
  article: "مقال",
  website: "موقع",
  interview: "مقابلة",
  other: "أخرى",
};

const KIND_ICONS: Record<Source["kind"], React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  article: <Newspaper className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  interview: <Mic className="w-4 h-4" />,
  other: <Folder className="w-4 h-4" />,
};

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  onEdit,
  onDelete,
  onView,
}) => {
  const formattedDate = new Date(source.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="bg-[#131B36] border border-slate-800 rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all shadow-lg flex flex-col justify-between"
      dir="rtl"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0B1329] border border-[#D4AF37]/30 text-[#D4AF37]">
            {KIND_ICONS[source.kind]}
            {KIND_LABELS[source.kind]}
          </span>
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => onView(source)}
              title="معاينة المصدر"
              className="p-1.5 hover:text-white hover:bg-[#0B1329] rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(source)}
              title="تعديل"
              className="p-1.5 hover:text-[#D4AF37] hover:bg-[#0B1329] rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(source.id)}
              title="حذف"
              className="p-1.5 hover:text-red-400 hover:bg-[#0B1329] rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-relaxed">
          {source.title}
        </h3>

        {source.description && (
          <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
            {source.description}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </span>

        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#D4AF37] hover:underline"
          >
            <span>فتح الرابط</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};