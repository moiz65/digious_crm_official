import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "../../components/EmployeeSidebar";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(amount) || 0,
  );

const summaryIconStyles = {
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
};

const BusinessUnitHeadDashboard = () => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [salesTeam, setSalesTeam] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
      const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
        new Date(year, month, 0).getDate(),
      ).padStart(2, "0")}`;
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      };

      const [targetsResponse, expensesResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/sales-targets/all?month=${month}&year=${year}`, {
          headers,
        }),
        fetch(
          `${API_URL}/api/v1/expenses?from=${monthStart}&to=${monthEnd}`,
          { headers },
        ),
      ]);

      if (!targetsResponse.ok) {
        throw new Error(`Unable to load sales performance (${targetsResponse.status})`);
      }
      if (!expensesResponse.ok) {
        throw new Error(`Unable to load monthly expenses (${expensesResponse.status})`);
      }

      const [targetsData, expensesData] = await Promise.all([
        targetsResponse.json(),
        expensesResponse.json(),
      ]);

      if (!targetsData.success) {
        throw new Error(targetsData.message || "Unable to load sales performance");
      }
      if (!expensesData.success) {
        throw new Error(expensesData.message || "Unable to load monthly expenses");
      }

      setSalesTeam(
        (targetsData.data || []).map((employee) => ({
          ...employee,
          monthly_target: Number(employee.monthly_target) || 0,
          achieved: Number(employee.achieved) || 0,
        })),
      );
      setMonthlyExpenses(Number(expensesData.total) || 0);
      setCurrentDate(now);
    } catch (loadError) {
      console.error("Failed to load Business Unit Head dashboard:", loadError);
      setError(loadError.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const refreshInterval = setInterval(loadDashboard, 30000);
    return () => clearInterval(refreshInterval);
  }, [loadDashboard]);

  const totalAchieved = salesTeam.reduce((total, employee) => total + employee.achieved, 0);
  const totalTarget = salesTeam.reduce(
    (total, employee) => total + employee.monthly_target,
    0,
  );
  const rankedSalesTeam = [...salesTeam].sort(
    (first, second) => second.achieved - first.achieved,
  );

  const summaryCards = [
    {
      title: "Monthly Expenses",
      value: monthlyExpenses === null ? "—" : `Rs ${formatAmount(monthlyExpenses)}`,
      detail: currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      icon: Wallet,
      color: "amber",
    },
    {
      title: "Sales Achieved",
      value: `$${formatAmount(totalAchieved)}`,
      detail: "Current month",
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Monthly Sales Target",
      value: `$${formatAmount(totalTarget)}`,
      detail: "Sales team",
      icon: Target,
      color: "blue",
    },
    {
      title: "Sales Representatives",
      value: salesTeam.length,
      detail: "Active sales team",
      icon: Users,
      color: "violet",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <EmployeeSidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="mb-2 text-sm font-medium text-indigo-100">Business Unit Head</p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                👋 Welcome{user?.name ? `, ${user.name}` : ""}
              </h1>
              <p className="mt-2 text-sm text-indigo-100">
                Your sales performance and monthly expense overview.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-2 text-sm text-indigo-100">
                <CalendarDays className="h-4 w-4" />
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <button
                type="button"
                onClick={loadDashboard}
                disabled={isLoading}
                className="rounded-xl bg-white/15 p-2.5 transition hover:bg-white/25 disabled:cursor-wait disabled:opacity-60"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={loadDashboard}
                className="font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          <section
            aria-label="Monthly business summary"
            className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {summaryCards.map(({ title, value, detail, icon: Icon, color }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {isLoading && monthlyExpenses === null && title === "Monthly Expenses" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      ) : (
                        value
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{detail}</p>
                  </div>
                  <span className={`rounded-xl p-3 ${summaryIconStyles[color]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Sales Performance</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly achievements ranked by sales generated.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {salesTeam.length} representatives
              </span>
            </div>

            {isLoading && salesTeam.length === 0 ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                Loading sales performance...
              </div>
            ) : rankedSalesTeam.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-600">No sales representatives found</p>
                <p className="mt-1 text-sm text-slate-400">
                  Sales performance will appear here when the sales team is available.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">
                {rankedSalesTeam.map((employee, index) => {
                  const progress =
                    employee.monthly_target > 0
                      ? (employee.achieved / employee.monthly_target) * 100
                      : 0;

                  return (
                    <article
                      key={employee.employee_id}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 font-semibold text-white">
                          {employee.profile_photo ? (
                            <img
                              src={employee.profile_photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            employee.employee_name
                              ?.split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "?"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-800">
                            {employee.employee_name}
                          </p>
                          <p className="truncate text-xs text-slate-400">{employee.email}</p>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="mb-2 flex justify-between gap-2 text-sm">
                        <span className="text-slate-500">Achieved</span>
                        <span className="text-right font-semibold text-slate-700">
                          ${formatAmount(employee.achieved)} / $
                          {formatAmount(employee.monthly_target)}
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${employee.employee_name} monthly target progress`}
                        aria-valuenow={Math.min(Math.max(progress, 0), 100)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress >= 100 ? "bg-emerald-500" : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-right text-xs font-medium text-slate-500">
                        {Math.round(progress)}% of target
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <p className="mt-6 text-center text-xs text-slate-400">
            Dashboard refreshes automatically every 30 seconds.
          </p>
        </div>
      </main>
    </div>
  );
};

export default BusinessUnitHeadDashboard;
