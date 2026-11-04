import { useState, useEffect, useCallback } from "react";
import { db } from "../../db/db";
import { Investigation, AuditLog, Source } from "../../types/domain";

export interface DashboardMetrics {
  totalSources: number;
  totalInvestigations: number;
  openInvestigations: number;
  inProgressInvestigations: number;
  closedInvestigations: number;
  totalClaims: number;
  totalEvidences: number;
  totalEntities: number;
  totalRelations: number;
  totalEvents: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentInvestigations: Investigation[];
  recentSources: Source[];
  recentAuditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDashboardStats = (): DashboardData => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSources: 0,
    totalInvestigations: 0,
    openInvestigations: 0,
    inProgressInvestigations: 0,
    closedInvestigations: 0,
    totalClaims: 0,
    totalEvidences: 0,
    totalEntities: 0,
    totalRelations: 0,
    totalEvents: 0,
  });

  const [recentInvestigations, setRecentInvestigations] = useState<Investigation[]>([]);
  const [recentSources, setRecentSources] = useState<Source[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        sourcesCount,
        investigationsCount,
        claimsCount,
        evidencesCount,
        entitiesCount,
        relationsCount,
        eventsCount,
        openCount,
        inProgressCount,
        closedCount,
        recentInvs,
        recentSrcs,
        recentLogs,
      ] = await Promise.all([
        db.table("sources").count(),
        db.table("investigations").count(),
        db.table("claims").count(),
        db.table("evidences").count(),
        db.table("entities").count(),
        db.table("relations").count(),
        db.table("timelineEvents").count(),
        db.table("investigations").where("status").equals("open").count(),
        db.table("investigations").where("status").equals("in_progress").count(),
        db.table("investigations").where("status").equals("closed").count(),
        db.table("investigations").orderBy("updatedAt").reverse().limit(5).toArray(),
        db.table("sources").orderBy("createdAt").reverse().limit(5).toArray(),
        db.table("auditLogs").orderBy("timestamp").reverse().limit(10).toArray(),
      ]);

      setMetrics({
        totalSources: sourcesCount,
        totalInvestigations: investigationsCount,
        openInvestigations: openCount,
        inProgressInvestigations: inProgressCount,
        closedInvestigations: closedCount,
        totalClaims: claimsCount,
        totalEvidences: evidencesCount,
        totalEntities: entitiesCount,
        totalRelations: relationsCount,
        totalEvents: eventsCount,
      });

      setRecentInvestigations(recentInvs as Investigation[]);
      setRecentSources(recentSrcs as Source[]);
      setRecentAuditLogs(recentLogs as AuditLog[]);
    } catch (err) {
      console.error("خطأ في جلب بيانات لوحة التحكم:", err);
      setError("تعذر تحميل إحصاءات النظام من قاعدة البيانات المحلية");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    recentInvestigations,
    recentSources,
    recentAuditLogs,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};