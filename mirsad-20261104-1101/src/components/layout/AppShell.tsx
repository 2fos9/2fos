import {
  BookOpen,
  Bot,
  FileBarChart,
  GitBranch,
  LayoutDashboard,
  SearchCheck,
  Timeline,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

type NavigationItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/library", label: "المكتبة", icon: BookOpen },
  { to: "/investigations", label: "التحقيقات", icon: SearchCheck },
  { to: "/timeline", label: "الخط الزمني", icon: Timeline },
  { to: "/relations", label: "العلاقات", icon: GitBranch },
  { to: "/assistant", label: "المساعد", icon: Bot },
  { to: "/reports", label: "التقارير", icon: FileBarChart },
];

export default function AppShell() {
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-white/10 bg-navy-800 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-e">
        <div className="px-5 py-5">
          <NavLink to="/dashboard" className="inline-block rounded">
            <span className="block text-2xl font-bold text-gold">مِرْصاد</span>
            <span className="block text-xs tracking-widest text-slate-400">
              MIRSAD
            </span>
          </NavLink>
          <p className="mt-3 text-sm text-slate-400">
            منصة البحث والتحقيق المحلية
          </p>
        </div>

        <nav aria-label="أقسام التطبيق" className="px-3 pb-4">
          <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {navigation.map(({ to, label, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gold/15 text-gold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}