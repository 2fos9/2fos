import React from "react";
import { AuditLog } from "../../types/domain";
import { Badge } from "../../components/ui";
import { Clock, PlusCircle, RefreshCw, Trash2, ShieldAlert } from "lucide-react";

interface RecentActivityListProps {
  logs: AuditLog[];
  isLoading: boolean;
}

const tableNamesInArabic: Record<string, string> = {
  sources: "المصادر",
  investigations: "التحقيقات",
  claims: "الادعاءات",
  evidences: "الأدلة",
  timelineEvents: "الأحداث الزمنية",
  entities: "الكيانات",
  relations: "العلاقات",
  auditLogs: "سجل العمليات",
};

const formatActionBadge = (action: string) => {
  const normalized = action.toLowerCase();
  if (normalized.includes("create") || normalized.includes("add") || normalized.includes("إضافة")) {
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <PlusCircle className="w-3 h-3" />
        إنشاء
      </Badge>
    );
  }
  if (normalized.includes("update") || normalized.includes("edit") || normalized.includes("تعديل")) {
    return (
      <Badge variant="warning" size="sm" className="gap-1">
        <RefreshCw className="w-3 h-3" />
        تحديث
      </Badge>
    );
  }
  if (normalized.includes("delete") || normalized.includes("remove") || normalized.includes("حذف")) {
    return (
      <Badge variant="danger" size="sm" className="gap-1">
        <Trash2 className="w-3 h-3" />
        حذف
      </Badge>
    );
  }
  return <Badge variant="neutral" size="sm">{action}</Badge>;
};

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ logs, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 animate-pulse border border-slate-800/40"
          >
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <ShieldAlert className="w-10 h-10 text-slate-600 mb-2" />
        <p className="text-sm">لا توجد أنشطة مسجلة حتى الآن في السجل الجنائي المحلي.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/70 overflow-hidden">
      {logs.map((log) => {
        const arabicTable = tableNamesInArabic[log.tableName] || log.tableName;
        const timeFormatted = new Date(log.timestamp).toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        });

        return (
          <div
            key={log.id}
            className="py-3 px-1 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {formatActionBadge(log.action)}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  سجل في جدول <span className="text-[#D4AF37]">{arabicTable}</span>
                </p>
                {log.details && (
                  <p className="text-xs text-slate-400 truncate mt-0.5 max-w-md">{log.details}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeFormatted}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};