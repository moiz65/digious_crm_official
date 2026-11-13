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

const getEmployeeInitials = (name) => String(name || "Employee")
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join("") || "E";

const DesktopMonitoring = () => {
  const { role, token } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("desktop-monitor");
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
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
  const selectEmployee = (employee) => setEmployeeId(String(employee.employeeId));
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Select an employee</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loadingEmployees
                    ? "Loading employees..."
                    : `${filteredEmployees.length} of ${activeEmployees.length} active employees`}
                </p>
              </div>
              <label className="w-full sm:max-w-sm">
                <span className="sr-only">Search employees</span>
                <input
                  type="search"
                  autoComplete="off"
                  placeholder="Search by name, code, or department"
                  value={employeeSearch}
                  onChange={(event) => setEmployeeSearch(event.target.value)}
                  disabled={loadingEmployees}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                />
              </label>
            </div>
            {loadingEmployees ? (
              <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                Loading active employees...
              </p>
            ) : filteredEmployees.length ? (
              <div className={`mt-4 grid items-start gap-4 ${selectedEmployee ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredEmployees.map((employee) => {
                    const isSelected = String(employee.employeeId) === String(employeeId);
                    return (
                      <button
                        key={employee.employeeId}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectEmployee(employee)}
                        className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {getEmployeeInitials(employee.name)}
                            {(employee.profilePhoto || employee.profile_photo || employee.profile_picture) && (
                              <img
                                src={employee.profilePhoto || employee.profile_photo || employee.profile_picture}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = "none"; }}
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-slate-900">
                              {employee.name}
                            </span>
                            <span className="mt-1 block truncate text-sm text-slate-500">
                              {employee.employeeCode}
                            </span>
                          </span>
                        </span>
                        <span className="mt-4 flex min-h-8 items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <span className="truncate text-xs text-slate-500">
                            {employee.department || "No department"}
                          </span>
                          {Boolean(employee.isWorking) && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
                              Working
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedEmployee && (
                  <aside
                    aria-label={`${selectedEmployee.name} employee details`}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-2xl font-bold text-blue-700 ring-4 ring-blue-50">
                        {getEmployeeInitials(selectedEmployee.name)}
                        {(selectedEmployee.profilePhoto || selectedEmployee.profile_photo || selectedEmployee.profile_picture) && (
                          <img
                            src={selectedEmployee.profilePhoto || selectedEmployee.profile_photo || selectedEmployee.profile_picture}
                            alt={`${selectedEmployee.name} profile`}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={(event) => { event.currentTarget.style.display = "none"; }}
                          />
                        )}
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-slate-900">{selectedEmployee.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{selectedEmployee.employeeCode}</p>
                      <span className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedEmployee.isWorking
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {selectedEmployee.isWorking ? "Working now" : "Not currently working"}
                      </span>
                    </div>
                    <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Department</dt>
                        <dd className="text-right font-medium text-slate-800">
                          {selectedEmployee.department || "Not specified"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Employment status</dt>
                        <dd className="font-medium text-slate-800">{selectedEmployee.status || "Active"}</dd>
                      </div>
                    </dl>
                  </aside>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                {activeEmployees.length ? "No matching active employees." : "No active employees found."}
              </p>
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
