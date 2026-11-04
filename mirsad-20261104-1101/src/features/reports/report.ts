import type { Claim, Evidence, Investigation, Source } from "../../types/domain";

export type ReportData = {
  investigation: Investigation;
  claims: Claim[];
  evidences: Evidence[];
  sources: Source[];
};

export const investigationStatuses: Record<Investigation["status"], string> = {
  open: "مفتوح",
  in_progress: "قيد العمل",
  closed: "مغلق",
};

export const claimStatuses: Record<Claim["status"], string> = {
  unverified: "غير متحقق",
  supported: "مدعوم",
  disputed: "متنازع عليه",
};

export const stances: Record<Evidence["stance"], string> = {
  supports: "يدعم",
  contradicts: "يناقض",
  neutral: "محايد",
};

export const sourceKinds: Record<Source["kind"], string> = {
  document: "وثيقة",
  article: "مقال",
  website: "موقع إلكتروني",
  interview: "مقابلة",
  other: "أخرى",
};

export function sourceLabel(
  sourceId: string | undefined,
  sources: Source[],
): string {
  if (!sourceId) return "لا يوجد مصدر مرتبط";
  return sources.find((source) => source.id === sourceId)?.title ??
    `مصدر غير متاح (${sourceId})`;
}

function markdownText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([`*_{}\[\]()#+.!|<>~-])/g, "\\$1")
    .replace(/\r\n?/g, "\n")
    .replace(/\n/g, "  \n");
}

export function reportMarkdown(report: ReportData): string {
  const { investigation, claims, evidences, sources } = report;
  const lines: string[] = [
    `# تقرير التحقيق: ${markdownText(investigation.title)}`,
    "",
    `**الحالة:** ${investigationStatuses[investigation.status]}`,
  ];

  if (investigation.description) {
    lines.push("", markdownText(investigation.description));
  }

  const appendEvidence = (evidence: Evidence) => {
    lines.push(
      `#### ${markdownText(evidence.title)}`,
      "",
      `- الموقف: ${stances[evidence.stance]}`,
      `- المصدر: ${markdownText(sourceLabel(evidence.sourceId, sources))}`,
    );
    if (evidence.description) {
      lines.push("", markdownText(evidence.description));
    }
    lines.push("");
  };

  lines.push("", "## الادعاءات والأدلة", "");
  if (claims.length === 0) lines.push("لا توجد ادعاءات مسجلة.", "");

  for (const claim of claims) {
    lines.push(
      `### ${markdownText(claim.text)}`,
      "",
      `**الحالة:** ${claimStatuses[claim.status]}`,
      "",
    );
    const linked = evidences.filter((evidence) => evidence.claimId === claim.id);
    if (linked.length === 0) lines.push("لا توجد أدلة مرتبطة.", "");
    linked.forEach(appendEvidence);
  }

  const claimIds = new Set(claims.map((claim) => claim.id));
  const unlinked = evidences.filter(
    (evidence) => !evidence.claimId || !claimIds.has(evidence.claimId),
  );
  lines.push("## أدلة غير مرتبطة بادعاء في التحقيق", "");
  if (unlinked.length === 0) lines.push("لا توجد أدلة غير مرتبطة.", "");
  unlinked.forEach(appendEvidence);

  lines.push("## المصادر", "");
  if (sources.length === 0) lines.push("لا توجد مصادر متاحة مرتبطة بالأدلة.", "");
  for (const source of sources) {
    lines.push(
      `### ${markdownText(source.title)}`,
      "",
      `- النوع: ${sourceKinds[source.kind]}`,
    );
    if (source.url) lines.push(`- الرابط: ${markdownText(source.url)}`);
    if (source.description) {
      lines.push("", markdownText(source.description));
    }
    if (source.content) {
      lines.push("", "**المحتوى:**", "", markdownText(source.content));
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}