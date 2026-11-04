import React from "react";
import {
  FileText,
  Search,
  Activity,
  Network,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FolderOpen,
  ArrowUpLeft,
} from "lucide-react";
import { useDashboardStats } from "./useDashboardStats";
import { Card, StatCard, Badge, Button } from "../../components/ui";
import { RecentActivityList } from "./RecentActivityList";
import { Investigation, Source } from "../../types/domain";

const sourceKindLabels: Record<string, string> = {
  document: "وثيقة",
  article: "مقال",
  website: "موقع",
  interview: "مقابلة",
  other: "أخرى",
};

export const DashboardPage: React.FC = () => {
  const {
    metrics,
    recentInvestigations,
    recentSources,
    recentAuditLogs,
    isLoading,
    error,
    refresh,
  } = useDashboardStats();

  const getInvestigationStatusBadge = (status: Investigation["status"]) => {
    switch (status) {
      case "open":
        return <Badge variant="warning">قيد الفتح</Badge>;
      case "in_progress":
        return <Badge variant="gold">جارٍ العمل</Badge>;
      case "closed":
        return <Badge variant="success">مغلق ومحقق</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1329] text-slate-100 p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-8 bg-[#D4AF37] rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              غرفة عمليات مِرْصاد
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 mr-5">
            لوحة الرصد والتحليل الميداني والمكتبي (وضع العمل المستقل Local-First)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refresh()}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#D4AF37]" : ""}`} />}
            disabled={isLoading}
          >
            تحديث البيانات
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المصادر"
          value={metrics.totalSources}
          icon={<FileText className="w-5 h-5" />}
          changeLabel="أرشيف المواد والوثائق"
        />
        <StatCard
          title="ملفات التحقيق"
          value={metrics.totalInvestigations}
          icon={<Search className="w-5 h-5" />}
          changeLabel={`${metrics.inProgressInvestigations} نشطة الآن`}
          trend={metrics.inProgressInvestigations > 0 ? "up" : "neutral"}
        />
        <StatCard
          title="الأدلة المربوطة"
          value={metrics.totalEvidences}
          icon={<CheckCircle2 className="w-5 h-5" />}
          changeLabel={`تدعم ${metrics.totalClaims} ادعاءات`}
        />
        <StatCard
          title="الكيانات والعلاقات"
          value={`${metrics.totalEntities} / ${metrics.totalRelations}`}
          icon={<Network className="w-5 h-5" />}
          changeLabel="شبكة الارتباط الجرمي"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#131B36]/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">تحقيقات مفتوحة</div>
            <div className="text-lg font-bold text-slate-100">{metrics.openInvestigations}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">قيد التحقيق الميداني</div>
            <div className="text-lg font-bold text-slate-100">{metrics.inProgressInvestigations}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">تحقيقات منجزة ومغلقة</div>
            <div className="text-lg font-bold text-slate-100">{metrics.closedInvestigations}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">أحداث الخط الزمني</div>
            <div className="text-lg font-bold text-slate-100">{metrics.totalEvents}</div>
          </div>
        </div>
      </div>

      {/* Tables and Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Investigations (2 columns on large) */}
        <Card
          title="أحدث التحقيقات المفتوحة"
          subtitle="آخر ملفات التحقيق التي خضعت للتحديث"
          className="lg:col-span-2"
        >
          {recentInvestigations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <FolderOpen className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm">لا توجد ملفات تحقيق حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th className="pb-3 pr-2">عنوان التحقيق</th>
                    <th className="pb-3 px-2">الحالة</th>
                    <th className="pb-3 px-2">تاريخ التحديث</th>
                    <th className="pb-3 pl-2 text-left">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentInvestigations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-3 pr-2 font-medium text-slate-200">
                        <div className="truncate max-w-xs md:max-w-md">{inv.title}</div>
                        {inv.description && (
                          <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                            {inv.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {getInvestigationStatusBadge(inv.status)}
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(inv.updatedAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="py-3 pl-2 text-left whitespace-nowrap">
                        <span className="inline-flex items-center text-xs text-[#D4AF37] hover:underline cursor-pointer gap-0.5">
                          استعراض
                          <ArrowUpLeft className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Added Sources */}
        <Card
          title="أحدث الوثائق والمصادر"
          subtitle="آخر المواد المضافة للأرشيف"
          className="lg:col-span-1"
        >
          {recentSources.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">لم يتم تسجيل أي مصادر بعد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSources.map((source: Source) => (
                <div
                  key={source.id}
                  className="p-3 rounded-lg bg-[#0B1329] border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-slate-200 truncate">
                      {source.title}
                    </span>
                    <Badge variant="navy" size="sm">
                      {sourceKindLabels[source.kind] || source.kind}
                    </Badge>
                  </div>
                  {source.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  <div className="mt-2 text-[10px] text-slate-400">
                    {new Date(source.createdAt).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Audit Log (Recent System Activity) */}
      <Card
        title="سجل الأنشطة والتدقيق المحلي"
        subtitle="توثيق الحركات والعمليات المحلية تلقائياً (Audit Trail)"
      >
        <RecentActivityList logs={recentAuditLogs} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default DashboardPage;