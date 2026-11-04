import { Link, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./features/dashboard/DashboardPage";
import LibraryPage from "./features/library/LibraryPage";
import InvestigationsPage from "./features/investigations/InvestigationsPage";
import TimelinePage from "./features/timeline/TimelinePage";
import RelationsPage from "./features/relations/RelationsPage";
import AssistantPage from "./features/assistant/AssistantPage";
import ReportsPage from "./features/reports/ReportsPage";

function NotFoundPage() {
  return (
    <section className="rounded-xl border border-white/10 bg-navy-800 p-6">
      <h1 className="text-2xl font-bold text-gold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-slate-300">تعذر العثور على الصفحة المطلوبة.</p>
      <Link
        to="/dashboard"
        className="mt-5 inline-block rounded text-gold underline underline-offset-4"
      >
        العودة إلى لوحة التحكم
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="investigations" element={<InvestigationsPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="relations" element={<RelationsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}