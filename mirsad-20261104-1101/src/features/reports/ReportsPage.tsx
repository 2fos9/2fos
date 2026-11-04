import { useEffect, useRef, useState } from "react";
import { liveQuery } from "dexie";
import { Download, FileText, Printer, RefreshCw } from "lucide-react";
import { db } from "../../db/db";
import type { Evidence, Investigation } from "../../types/domain";
import {
  claimStatuses,
  investigationStatuses,
  reportMarkdown,
  sourceKinds,
  sourceLabel,
  stances,
  type ReportData,
} from "./report";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-40";

function safeWebUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function EvidenceList({
  evidences,
  report,
}: {
  evidences: Evidence[];
  report: ReportData;
}) {
  if (evidences.length === 0) {
    return <p className="text-sm text-slate-400">لا توجد أدلة مرتبطة.</p>;
  }

  return (
    <div className="space-y-3">
      {evidences.map((evidence) => (
        <article key={evidence.id} className="report-card rounded-lg border border-slate-700 p-4">
          <h4 className="font-semibold text-slate-100">{evidence.title}</h4>
          <p className="mt-2 text-sm text-slate-300">
            الموقف: {stances[evidence.stance]}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            المصدر: {sourceLabel(evidence.sourceId, report.sources)}
          </p>
          {evidence.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
              {evidence.description}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function ReportView({ report }: { report: ReportData }) {
  const claimIds = new Set(report.claims.map((claim) => claim.id));
  const unlinked = report.evidences.filter(
    (evidence) => !evidence.claimId || !claimIds.has(evidence.claimId),
  );

  return (
    <div dir="rtl" className="report-document space-y-8 text-slate-100">
      <header>
        <p className="text-sm font-medium text-[#D4AF37]">تقرير تحقيق</p>
        <h1 className="mt-2 text-2xl font-bold">{report.investigation.title}</h1>
        <p className="mt-3 text-sm text-slate-300">
          الحالة: {investigationStatuses[report.investigation.status]}
        </p>
        {report.investigation.description && (
          <p className="mt-3 whitespace-pre-wrap text-slate-300">
            {report.investigation.description}
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-4 text-xl font-bold text-[#D4AF37]">الادعاءات والأدلة</h2>
        {report.claims.length === 0 && (
          <p className="text-sm text-slate-400">لا توجد ادعاءات مسجلة.</p>
        )}
        <div className="space-y-5">
          {report.claims.map((claim) => (
            <article key={claim.id} className="report-section rounded-xl border border-slate-700 p-4">
              <h3 className="whitespace-pre-wrap text-lg font-semibold">{claim.text}</h3>
              <p className="mb-4 mt-2 text-sm text-slate-300">
                الحالة: {claimStatuses[claim.status]}
              </p>
              <EvidenceList
                report={report}
                evidences={report.evidences.filter((evidence) => evidence.claimId === claim.id)}
              />
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-[#D4AF37]">
          أدلة غير مرتبطة بادعاء في التحقيق
        </h2>
        <EvidenceList report={report} evidences={unlinked} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-[#D4AF37]">المصادر</h2>
        {report.sources.length === 0 && (
          <p className="text-sm text-slate-400">لا توجد مصادر متاحة مرتبطة بالأدلة.</p>
        )}
        <div className="space-y-3">
          {report.sources.map((source) => {
            const url = safeWebUrl(source.url);
            return (
              <article key={source.id} className="report-card rounded-lg border border-slate-700 p-4">
                <h3 className="font-semibold">{source.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  النوع: {sourceKinds[source.kind]}
                </p>
                {source.url && (
                  <p className="mt-2 break-all text-sm">
                    الرابط:{" "}
                    {url ? (
                      <a className="text-[#D4AF37] underline" href={url} target="_blank" rel="noreferrer">
                        {source.url}
                      </a>
                    ) : (
                      source.url
                    )}
                  </p>
                )}
                {source.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {source.description}
                  </p>
                )}
                {source.content && (
                  <div className="mt-3 text-sm text-slate-300">
                    <p className="font-semibold">المحتوى:</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{source.content}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function ReportsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [detail, setDetail] = useState<{ id: string; report: ReportData | null } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [retry, setRetry] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setListLoading(true);
    setListError(false);
    const subscription = liveQuery(() => db.investigations.toArray()).subscribe({
      next: (items) => {
        setInvestigations(items);
        setSelectedId((current) =>
          items.some((item) => item.id === current) ? current : items[0]?.id ?? "",
        );
        setListLoading(false);
      },
      error: () => {
        setListError(true);
        setListLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [retry]);

  useEffect(() => {
    setDetail(null);
    setDetailError(null);
    setActionError("");
    if (!selectedId) return;

    const subscription = liveQuery(async () => {
      const [investigation, claims, evidences] = await Promise.all([
        db.investigations.get(selectedId),
        db.claims.where("investigationId").equals(selectedId).toArray(),
        db.evidences.where("investigationId").equals(selectedId).toArray(),
      ]);
      if (!investigation) return null;
      const sourceIds = Array.from(
        new Set(evidences.flatMap((evidence) => (evidence.sourceId ? [evidence.sourceId] : []))),
      );
      const found = await db.sources.bulkGet(sourceIds);
      const sources = found.filter((source): source is NonNullable<typeof source> => source != null);
      return { investigation, claims, evidences, sources };
    }).subscribe({
      next: (report) => {
        setDetail({ id: selectedId, report });
        setDetailError(null);
      },
      error: () => setDetailError(selectedId),
    });

    return () => subscription.unsubscribe();
  }, [selectedId, retry]);

  const report = detail?.id === selectedId ? detail.report : null;
  const detailLoading = Boolean(selectedId && detail?.id !== selectedId && detailError !== selectedId);

  function downloadReport() {
    if (!report) return;
    try {
      const blob = new Blob([reportMarkdown(report)], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mirsad-report-${report.investigation.id}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setActionError("");
    } catch {
      setActionError("تعذّر تنزيل التقرير. حاول مجدداً.");
    }
  }

  function printReport() {
    if (!report || !reportRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setActionError("تعذّر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مجدداً.");
      return;
    }

    try {
      const doc = printWindow.document;
      doc.documentElement.lang = "ar";
      doc.documentElement.dir = "rtl";
      doc.title = `تقرير التحقيق: ${report.investigation.title}`;
      const style = doc.createElement("style");
      style.textContent = `
        @page { margin: 18mm; }
        body { font-family: Arial, sans-serif; color: #111; line-height: 1.7; direction: rtl; }
        h1, h2, h3, h4 { margin: 1em 0 0.4em; }
        h2 { border-bottom: 1px solid #999; padding-bottom: 0.3em; }
        p { margin: 0.4em 0; white-space: pre-wrap; overflow-wrap: anywhere; }
        .report-card, .report-section { border: 1px solid #ccc; padding: 12px; margin: 10px 0; }
        .report-card { break-inside: avoid; }
        a { color: #111; overflow-wrap: anywhere; }
      `;
      doc.head.appendChild(style);
      doc.body.appendChild(reportRef.current.cloneNode(true));
      setActionError("");
      printWindow.focus();
      printWindow.print();
    } catch {
      printWindow.close();
      setActionError("تعذّرت طباعة التقرير. حاول مجدداً.");
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#0B1329] p-4 text-slate-100 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <FileText size={22} aria-hidden="true" />
              <h1 className="text-2xl font-bold">التقارير</h1>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              تقرير يجمع ادعاءات التحقيق وأدلته ومصادره.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={!report} onClick={printReport}>
              <Printer size={17} aria-hidden="true" /> طباعة
            </button>
            <button type="button" className={buttonClass} disabled={!report} onClick={downloadReport}>
              <Download size={17} aria-hidden="true" /> تنزيل Markdown
            </button>
          </div>
        </header>

        <div className="rounded-xl border border-slate-700 bg-[#131B36] p-4">
          <label htmlFor="report-investigation" className="mb-2 block text-sm font-medium">
            اختر التحقيق
          </label>
          <select
            id="report-investigation"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={listLoading || listError || investigations.length === 0}
            className="w-full rounded-lg border border-slate-600 bg-[#0B1329] px-3 py-2 text-slate-100 outline-none focus:border-[#D4AF37] disabled:opacity-60"
          >
            {investigations.length === 0 && (
              <option value="">{listLoading ? "جارٍ التحميل…" : "لا توجد تحقيقات"}</option>
            )}
            {investigations.map((investigation) => (
              <option key={investigation.id} value={investigation.id}>
                {investigation.title}
              </option>
            ))}
          </select>
        </div>

        {(listError || detailError === selectedId) && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
            <span>تعذّر تحميل البيانات من قاعدة البيانات المحلية.</span>
            <button
              type="button"
              className={buttonClass}
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={16} aria-hidden="true" /> إعادة المحاولة
            </button>
          </div>
        )}
        {actionError && (
          <p role="alert" className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
            {actionError}
          </p>
        )}
        {!listError && (listLoading || detailLoading) && (
          <p role="status" className="text-sm text-slate-400">جارٍ إعداد التقرير…</p>
        )}
        {!listLoading && !listError && investigations.length === 0 && (
          <p className="rounded-xl border border-slate-700 bg-[#131B36] p-6 text-slate-300">
            لا توجد تحقيقات بعد. أضف تحقيقاً لعرض تقريره.
          </p>
        )}
        {selectedId && detail?.id === selectedId && !detail.report && !detailError && (
          <p className="text-sm text-slate-400">لم يعد التحقيق المحدد متاحاً.</p>
        )}
        {report && (
          <div ref={reportRef} className="rounded-xl border border-slate-700 bg-[#131B36] p-5 sm:p-8">
            <ReportView report={report} />
          </div>
        )}
      </div>
    </main>
  );
}