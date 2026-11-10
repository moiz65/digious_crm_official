import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { config } from "../config/api";
import Sidebar from "../components/Sidebar";
import HrSidebar from "../components/HrSidebar";
import EmployeeSidebar from "../components/EmployeeSidebar";

const API_URL = `${config.FULL_API_URL}/desktop-monitor`;

const formatDuration = (seconds = 0) => {
  const totalMinutes = Math.floor(Number(seconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
};

const DesktopMonitoring = () => {
  const { role, token } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("desktop-monitor");
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const normalizedRole = String(role || "").toLowerCase();
  const SidebarComponent = normalizedRole === "hr"
    ? HrSidebar
    : normalizedRole === "employee"
      ? EmployeeSidebar
      : Sidebar;
  const activeEmployees = employees.filter(
    (employee) => String(employee.status || "").trim().toLowerCase() === "active",
  );
  const filteredEmployees = activeEmployees.filter((employee) => {
    const search = employeeSearch.trim().toLowerCase();
    return !search || [
      employee.name,
      employee.employeeCode,
      employee.department,
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });

  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Could not load employees.");
        }
        if (active) setEmployees(result.data);
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load employees.");
      } finally {
        if (active) setLoadingEmployees(false);
      }
    };
    loadEmployees();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!employeeId) {
      setActivity(null);
      return undefined;
    }

    const controller = new AbortController();
    const loadActivity = async () => {
      setLoadingActivity(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/employees/${encodeURIComponent(employeeId)}/activity`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load employee monitoring activity.");
        }
        setActivity(result.data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Could not load employee monitoring activity.");
          setActivity(null);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingActivity(false);
      }
    };
    loadActivity();
    return () => controller.abort();
  }, [employeeId, token]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const openScreenshot = async (screenshot) => {
    setPreviewLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/screenshots/${screenshot.id}/content`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || "Could not load screenshot.");
      }
      const imageUrl = URL.createObjectURL(await response.blob());
      setPreview({ ...screenshot, employeeId });
      setPreviewUrl(imageUrl);
    } catch (loadError) {
      setError(loadError.message || "Could not load screenshot.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const selectedEmployee = employees.find(
    (employee) => String(employee.employeeId) === String(employeeId),
  );
  const selectEmployee = (employee) => {
    setEmployeeId(String(employee.employeeId));
    setEmployeeSearch(`${employee.name} (${employee.employeeCode})`);
    setEmployeeMenuOpen(false);
  };
  const recentIdleEvents = activity?.idleEvents?.slice(0, 20) || [];
  const screenshots = activity?.screenshots || [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarComponent
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <main className="min-w-0 h-[100vh] flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Employee monitoring
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Desktop activity</h1>
            <p className="mt-2 text-sm text-slate-600">
              View recorded idle periods and primary display screenshots after an employee has
              provided consent.
            </p>
          </header>

          <section>
            <label htmlFor="monitor-employee" className="block text-sm font-semibold text-slate-700">
              Select an employee
            </label>
            <input
              id="monitor-employee"
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={employeeMenuOpen}
              aria-controls="monitor-employee-options"
              autoComplete="off"
              placeholder="Search active employees by name, code, or department"
              value={employeeSearch}
              onFocus={() => setEmployeeMenuOpen(true)}
              onChange={(event) => {
                setEmployeeSearch(event.target.value);
                setEmployeeId("");
                setEmployeeMenuOpen(true);
              }}
              disabled={loadingEmployees}
              className="mt-2 w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {employeeMenuOpen && !loadingEmployees && (
              <ul
                id="monitor-employee-options"
                role="listbox"
                className="mt-1 max-h-60 w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                {filteredEmployees.length ? filteredEmployees.map((employee) => (
                  <li key={employee.employeeId} role="option" aria-selected={String(employee.employeeId) === String(employeeId)}>
                    <button
                      type="button"
                      onClick={() => selectEmployee(employee)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                    >
                      <span>
                        <span className="font-medium">{employee.name}</span>
                        <span className="ml-2 text-slate-500">{employee.employeeCode}</span>
                        {employee.department && (
                          <span className="ml-2 text-slate-500">— {employee.department}</span>
                        )}
                      </span>
                      {Boolean(employee.isWorking) && (
                        <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-green-700">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
                          Working
                        </span>
                      )}
                    </button>
                  </li>
                )) : (
                  <li className="px-3 py-2 text-sm text-slate-500">
                    {activeEmployees.length ? "No matching active employees." : "No active employees found."}
                  </li>
                )}
              </ul>
            )}
          </section>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {employeeId && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Recorded idle time</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingActivity ? "..." : formatDuration(activity?.totalIdleSeconds)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmployee?.name || employeeId} — all retained idle records
                  </p>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Saved screenshots</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loadingActivity ? "..." : screenshots.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Most recent 100 records</p>
                </section>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent idle periods</h2>
                {loadingActivity ? (
                  <p className="mt-4 text-sm text-slate-500">Loading idle records...</p>
                ) : recentIdleEvents.length ? (
                  <div className="mt-4 divide-y divide-slate-100">
                    {recentIdleEvents.map((event) => (
                      <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <p className="text-sm text-slate-700">{formatDate(event.occurredAt)}</p>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                          {formatDuration(event.idleSeconds)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No completed idle periods were recorded.</p>
                )}
              </section>

              <section className="rounded-xl h-[600px] overflow-scroll overflow-x-hidden border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Screenshots</h2>
                {loadingActivity ? (
                  <p className="mt-4 text-sm text-slate-500">Loading screenshots...</p>
                ) : screenshots.length ? (
                  <div className="mt-4 divide-y divide-slate-100">
                    {screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{formatDate(screenshot.capturedAt)}</p>
                          <p className="text-xs text-slate-500">
                            {(Number(screenshot.fileSize) / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={previewLoading}
                          onClick={() => openScreenshot(screenshot)}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {previewLoading ? "Loading..." : "View screenshot"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No screenshots were found for this employee.</p>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {previewUrl && preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot preview"
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => { setPreview(null); setPreviewUrl(""); }}
        >
          <div
            className="max-h-full max-w-6xl rounded-xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">{formatDate(preview.capturedAt)}</p>
              <button
                type="button"
                onClick={() => { setPreview(null); setPreviewUrl(""); }}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <img src={previewUrl} alt={`Primary display screenshot for ${preview.employeeId}`} className="max-h-[80vh] max-w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopMonitoring;
