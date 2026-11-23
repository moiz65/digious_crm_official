import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { config } from "../config/api";
import { blurScreenshot } from "../utils/blurScreenshot";
import { DESKTOP_MONITOR_EVENTS } from "../utils/desktopMonitoringEvents";

const CONSENT_VERSION = "desktop-monitor-v2";
const IDLE_THRESHOLD_SECONDS = 3 * 60;
const SCREENSHOT_INTERVAL_MS = 3 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL_MS = 15 * 1000;
const SENSITIVE_PATHS = /^\/(login|change-password|forgot-password|verify-otp)(\/|$)/;
const PUBLIC_PATHS = /^\/(login|signup|change-password|forgot-password|verify-otp|unauthorized)(\/|$)/;

const requestJson = async (url, token, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const requestError = new Error(result?.message || `Monitoring request failed (${response.status})`);
      requestError.status = response.status;
      throw requestError;
    }
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Monitoring request timed out; CRM usage is unaffected.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

const DesktopMonitor = () => {
  const { user, token, isAuthenticated } = useAuth();
  const location = useLocation();
  const employeeId = user?.employeeId || user?.employee_id || user?.userId || user?.id;
  const bridge = window.desktopMonitor;
  const isMonitoringSurface = isAuthenticated && !PUBLIC_PATHS.test(location.pathname);
  const consentKey = `desktop-monitor-consent:${employeeId || ""}`;
  const enabledKey = `desktop-monitor-enabled:${employeeId || ""}`;
  const [consentChecked, setConsentChecked] = useState(false);
  const [consented, setConsented] = useState(
    () => localStorage.getItem(consentKey) === CONSENT_VERSION,
  );
  const [sessionId, setSessionId] = useState(null);
  const [idle, setIdle] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("paused");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCapture, setLastCapture] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const idleSinceRef = useRef(null);
  const attendanceStatusRef = useRef("paused");
  const checkingRef = useRef(false);
  const startedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const startSessionRef = useRef(null);
  const stopSessionRef = useRef(null);
  const lastTokenRef = useRef(token);

  if (token) lastTokenRef.current = token;

  const updateAttendanceStatus = useCallback((status) => {
    attendanceStatusRef.current = status;
    setAttendanceStatus(status);
  }, []);

  const startSession = useCallback(async () => {
    if (!token || !employeeId) {
      throw new Error("Please sign in again before enabling desktop monitoring.");
    }
    if (sessionIdRef.current) return sessionIdRef.current;
    const result = await requestJson(
      `${config.FULL_API_URL}/desktop-monitor/sessions`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ consentVersion: CONSENT_VERSION }),
      },
    );
    sessionIdRef.current = result.data.sessionId;
    setSessionId(result.data.sessionId);
    updateAttendanceStatus("working");
    setConsented(true);
    setError("");
    return result.data.sessionId;
  }, [employeeId, token, updateAttendanceStatus]);

  useEffect(() => {
    if (!bridge || !employeeId || !isMonitoringSurface) return undefined;
    const hasConsent = localStorage.getItem(consentKey) === CONSENT_VERSION;
    setConsented(hasConsent);
    const shouldResume = localStorage.getItem(enabledKey) === "true";
    if (hasConsent && shouldResume && token && !startedRef.current) {
      startedRef.current = true;
      startSession().catch((startError) => setError(startError.message));
    }
    return undefined;
  }, [bridge, consentKey, employeeId, enabledKey, isMonitoringSurface, startSession, token]);

  useEffect(() => {
    if (!sessionId || !token || !bridge) return undefined;
    let active = true;
    let nextScreenshotAt = Date.now() + SCREENSHOT_INTERVAL_MS;

    const postEvent = (eventType, idleSeconds) => requestJson(
      `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/events`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ eventType, idleSeconds }),
      },
    );
    const sendHeartbeat = () => requestJson(
      `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/heartbeat`,
      token,
      { method: "POST" },
    );

    const uploadScreenshot = async (dataUrl) => {
      const image = await fetch(dataUrl).then((response) => response.blob());
      const formData = new FormData();
      formData.append("screenshot", image, "primary-display.jpg");
      await requestJson(
        `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/screenshots`,
        token,
        { method: "POST", body: formData },
      );
    };

    const check = async () => {
      if (!active || checkingRef.current || !isMonitoringSurface) return;
      checkingRef.current = true;
      try {
        await sendHeartbeat();
        const state = await bridge.getSystemState();
        if (!active) return;

        const isIdle = state.idleSeconds >= IDLE_THRESHOLD_SECONDS;
        if (isIdle !== (idleSinceRef.current !== null)) {
          if (isIdle) {
            await postEvent("idle_started");
            idleSinceRef.current = Date.now();
          } else {
            const duration = Math.floor((Date.now() - idleSinceRef.current) / 1000);
            await postEvent("idle_ended", duration);
            idleSinceRef.current = null;
          }
          setIdle(isIdle);
        }

        const passwordInputFocused = document.activeElement?.matches?.('input[type="password"]');
        const sensitivePage = SENSITIVE_PATHS.test(window.location.pathname);
        if (
          Date.now() >= nextScreenshotAt
          && !isIdle
          && !passwordInputFocused
          && !sensitivePage
        ) {
          if (typeof bridge.captureScreen !== "function") {
            nextScreenshotAt = Number.POSITIVE_INFINITY;
            setError(
              "This desktop app version does not support full-display capture. Install the latest Digious CRM Desktop app and restart it.",
            );
            return;
          }

          const capturedScreenshot = await bridge.captureScreen();
          if (capturedScreenshot) {
            const screenshot = await blurScreenshot(capturedScreenshot);
            let lastError;
            for (let attempt = 0; attempt < 3; attempt += 1) {
              try {
                await uploadScreenshot(screenshot);
                lastError = null;
                break;
              } catch (uploadError) {
                lastError = uploadError;
                if (attempt < 2) {
                  await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
                }
              }
            }
            if (lastError) throw lastError;
            setLastCapture(new Date());
            setError("");
            nextScreenshotAt = Date.now() + SCREENSHOT_INTERVAL_MS;
          }
        }
      } catch (monitorError) {
        if (active && [404, 409].includes(monitorError.status)) {
          sessionIdRef.current = null;
          setSessionId(null);
          setIdle(false);
          idleSinceRef.current = null;
          startedRef.current = false;
          localStorage.setItem(enabledKey, "false");
          if (!["break", "checked-out"].includes(attendanceStatusRef.current)) {
            updateAttendanceStatus(
              monitorError.status === 409
                ? (monitorError.message.toLowerCase().includes("checked out") ? "checked-out" : "break")
                : "paused",
            );
          }
          setError("");
        } else if (active) {
          setError(monitorError.message || "Desktop Monitoring request failed.");
        }
      } finally {
        checkingRef.current = false;
      }
    };

    check();
    const timer = window.setInterval(check, ACTIVITY_CHECK_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
      checkingRef.current = false;
    };
  }, [bridge, enabledKey, isMonitoringSurface, sessionId, token, updateAttendanceStatus]);

  useEffect(() => {
    if (!token) return undefined;
    const stopOnClose = () => {
      if (!sessionId) {
        if (consented) {
          fetch(`${config.FULL_API_URL}/desktop-monitor/sessions/disconnect`, {
            method: "POST",
            keepalive: true,
            headers: { Authorization: `Bearer ${token}` },
          }).catch((stopError) => console.error("Could not close desktop monitoring session", stopError));
        }
        return;
      }
      fetch(`${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/stop`, {
        method: "POST",
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "disconnected" }),
      }).catch((stopError) => console.error("Could not close desktop monitoring session", stopError));
    };
    window.addEventListener("pagehide", stopOnClose);
    return () => window.removeEventListener("pagehide", stopOnClose);
  }, [consented, sessionId, token]);

  useEffect(() => {
    if (token || !lastTokenRef.current) return undefined;
    const previousToken = lastTokenRef.current;
    const currentSession = sessionId;
    const endpoint = currentSession
      ? `${config.FULL_API_URL}/desktop-monitor/sessions/${currentSession}/stop`
      : `${config.FULL_API_URL}/desktop-monitor/sessions/disconnect`;
    fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: {
        Authorization: `Bearer ${previousToken}`,
        "Content-Type": "application/json",
      },
      ...(currentSession ? { body: JSON.stringify({ reason: "disconnected" }) } : {}),
    }).catch((stopError) => console.error("Could not close desktop monitoring session", stopError));
    sessionIdRef.current = null;
    setSessionId(null);
    return undefined;
  }, [sessionId, token]);

  const handleStart = async () => {
    setBusy(true);
    setError("");
    const hadConsent = localStorage.getItem(consentKey) === CONSENT_VERSION;
    startedRef.current = true;
    try {
      localStorage.setItem(consentKey, CONSENT_VERSION);
      localStorage.setItem(enabledKey, "true");
      setConsented(true);
      await startSession();
    } catch (startError) {
      startedRef.current = false;
      localStorage.setItem(enabledKey, "false");
      if (!hadConsent) {
        localStorage.removeItem(consentKey);
        setConsented(false);
      }
      setError(startError.message);
    } finally {
      setBusy(false);
    }
  };

  const stopSession = async (withdrawConsent, reason = "disconnected") => {
    setBusy(true);
    setError("");
    try {
      if (sessionId && token) {
        if (idleSinceRef.current !== null) {
          await requestJson(
            `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/events`,
            token,
            {
              method: "POST",
              body: JSON.stringify({
                eventType: "idle_ended",
                idleSeconds: Math.floor((Date.now() - idleSinceRef.current) / 1000),
              }),
            },
          );
        }
        await requestJson(
          `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/stop`,
          token,
          {
            method: "POST",
            body: JSON.stringify({ reason }),
          },
        );
      } else if (withdrawConsent && token) {
        await requestJson(
          `${config.FULL_API_URL}/desktop-monitor/sessions/disconnect`,
          token,
          { method: "POST" },
        );
      }
      sessionIdRef.current = null;
      setSessionId(null);
      setIdle(false);
      idleSinceRef.current = null;
      startedRef.current = false;
      updateAttendanceStatus(reason === "break" ? "break" : reason === "checked-out" ? "checked-out" : "paused");
      startedRef.current = false;
      if (withdrawConsent) {
        localStorage.removeItem(consentKey);
        localStorage.removeItem(enabledKey);
        setConsented(false);
        setConsentChecked(false);
      } else {
        localStorage.setItem(enabledKey, "false");
      }
    } catch (stopError) {
      if (stopError.status === 404) {
        sessionIdRef.current = null;
        setSessionId(null);
        setIdle(false);
        idleSinceRef.current = null;
        startedRef.current = false;
        updateAttendanceStatus(reason === "break" ? "break" : reason === "checked-out" ? "checked-out" : "paused");
        setError("");
      } else {
        setError(stopError.message);
      }
    } finally {
      setBusy(false);
    }
  };

  startSessionRef.current = startSession;
  stopSessionRef.current = stopSession;

  useEffect(() => {
    if (!bridge || !employeeId || !token) return undefined;

    const stopForBreak = () => {
      localStorage.setItem(enabledKey, "false");
      updateAttendanceStatus("break");
      stopSessionRef.current?.(false, "break");
    };
    const startForWork = () => {
      const hasConsent = localStorage.getItem(consentKey) === CONSENT_VERSION;
      if (!hasConsent) return;
      localStorage.setItem(enabledKey, "true");
      updateAttendanceStatus("working");
      startSessionRef.current?.().catch((startError) => setError(startError.message));
    };
    const stopForCheckout = () => {
      localStorage.setItem(enabledKey, "false");
      updateAttendanceStatus("checked-out");
      stopSessionRef.current?.(false, "checked-out");
    };

    window.addEventListener(DESKTOP_MONITOR_EVENTS.BREAK_STARTED, stopForBreak);
    window.addEventListener(DESKTOP_MONITOR_EVENTS.BREAK_ENDED, startForWork);
    window.addEventListener(DESKTOP_MONITOR_EVENTS.CHECKED_IN, startForWork);
    window.addEventListener(DESKTOP_MONITOR_EVENTS.CHECKED_OUT, stopForCheckout);
    return () => {
      window.removeEventListener(DESKTOP_MONITOR_EVENTS.BREAK_STARTED, stopForBreak);
      window.removeEventListener(DESKTOP_MONITOR_EVENTS.BREAK_ENDED, startForWork);
      window.removeEventListener(DESKTOP_MONITOR_EVENTS.CHECKED_IN, startForWork);
      window.removeEventListener(DESKTOP_MONITOR_EVENTS.CHECKED_OUT, stopForCheckout);
    };
  }, [bridge, consentKey, enabledKey, employeeId, token, updateAttendanceStatus]);

  useEffect(() => {
    if (!bridge || !employeeId || !token) return undefined;
    let active = true;

    const syncWithAttendance = async () => {
      const hasConsent = localStorage.getItem(consentKey) === CONSENT_VERSION;
      if (!hasConsent) return;
      try {
        const [todayResponse, breaksResponse] = await Promise.all([
          fetch(`${config.FULL_API_URL}/attendance/today/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((response) => response.json()),
          fetch(`${config.FULL_API_URL}/attendance/ongoing-breaks/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((response) => response.json()),
        ]);
        if (!active) return;
        const isCheckedIn = todayResponse?.success && todayResponse.isCheckedIn;
        const isOnBreak = breaksResponse?.success && Array.isArray(breaksResponse.data)
          && breaksResponse.data.length > 0;
        updateAttendanceStatus(isOnBreak ? "break" : isCheckedIn ? "working" : "checked-out");

        if (!isCheckedIn || isOnBreak) {
          if (sessionIdRef.current) {
            localStorage.setItem(enabledKey, "false");
            await stopSessionRef.current?.(false, isOnBreak ? "break" : "checked-out");
          }
        } else if (localStorage.getItem(enabledKey) !== "false") {
          await startSessionRef.current?.();
        }
      } catch (syncError) {
        console.error("Could not sync desktop monitoring with attendance:", syncError);
      }
    };

    syncWithAttendance();
    const timer = window.setInterval(syncWithAttendance, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [bridge, consentKey, enabledKey, employeeId, token, updateAttendanceStatus]);

  if (!bridge || !isAuthenticated || !isMonitoringSurface || !token || !employeeId) return null;

  const panelStyle = {
    position: "fixed",
    top: "50%",
    right: 68,
    zIndex: 10000,
    width: "min(420px, calc(100vw - 84px))",
    maxHeight: "calc(100dvh - 32px)",
    overflowY: "auto",
    padding: 18,
    borderRadius: 18,
    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
    color: "#172033",
    border: "1px solid #dbe3ee",
    boxShadow: "0 16px 48px rgba(15, 23, 42, .22)",
    fontSize: 13,
    boxSizing: "border-box",
    transform: `translate(${isPanelOpen ? "0" : "calc(100% + 24px)"}, -50%)`,
    opacity: isPanelOpen ? 1 : 0,
    visibility: isPanelOpen ? "visible" : "hidden",
    pointerEvents: isPanelOpen ? "auto" : "none",
    transition: `transform 240ms ease, opacity 180ms ease, visibility 0s linear ${isPanelOpen ? "0s" : "240ms"}`,
  };
  const buttonStyle = {
    border: 0,
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPanelOpen((open) => !open)}
        aria-label={isPanelOpen ? "Close desktop monitoring controls" : "Open desktop monitoring controls"}
        aria-expanded={isPanelOpen}
        aria-controls="desktop-monitor-panel"
        title="Desktop Monitoring"
        style={{
          position: "fixed",
          top: "50%",
          right: 12,
          transform: "translateY(-50%)",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          width: 44,
          minHeight: 76,
          padding: "10px 0",
          border: "1px solid #cbd5e1",
          borderRadius: 14,
          color: "#fff",
          background: "#1e40af",
          boxShadow: "0 8px 24px rgba(15, 23, 42, .22)",
          cursor: "pointer",
        }}
      >
        {isPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        <span style={{ position: "relative", display: "flex" }}>
          <Monitor size={20} />
          {sessionId && (
            <span
              aria-label={idle ? "Monitoring idle" : "Monitoring active"}
              style={{
                position: "absolute",
                top: -3,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: idle ? "#fbbf24" : "#4ade80",
                border: "1px solid #1e40af",
              }}
            />
          )}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, writingMode: "vertical-rl", letterSpacing: ".04em" }}>
        </span>
      </button>
      <aside
        id="desktop-monitor-panel"
        style={panelStyle}
        aria-live="polite"
        aria-hidden={!isPanelOpen}
        inert={!isPanelOpen}
      >
      {!consented ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <strong style={{ fontSize: 15 }}>Desktop monitoring consent</strong>
            <span style={{ borderRadius: 999, padding: "4px 8px", background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 700 }}>
              Disconnected
            </span>
          </div>
          <p style={{ color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>
            When the CRM window is active, a primary display screenshot is captured every{" "}
            {SCREENSHOT_INTERVAL_MS / 60000} minutes. Other apps or windows visible on the display
            may also be captured. Screenshots are lightly blurred before upload.
          </p>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <strong style={{ fontSize: 15 }}>Desktop Monitoring</strong>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 10px", color: "#64748b", fontSize: 12, marginTop: 3 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 9,
                    height: 9,
                    flexShrink: 0,
                  }}
                >
                  {sessionId && !idle && (
                    <span
                      className="animate-ping"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background: "#22c55e",
                        opacity: 0.6,
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: "relative",
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: sessionId ? (idle ? "#f59e0b" : "#22c55e") : "#94a3b8",
                    }}
                  />
                </span>
                {sessionId
                  ? (idle ? "Idle" : "Working")
                  : attendanceStatus === "break"
                    ? "On break"
                    : attendanceStatus === "checked-out"
                      ? "Checked out"
                      : "Paused"}
              </span>
              {lastCapture && ` · Last screenshot ${lastCapture.toLocaleTimeString()}`}
            </div>
          </div>

        </div>
      )}
      {error && <p role="alert" style={{ color: "#b91c1c", margin: "6px 0" }}>{error}</p>}
      {!consented ? (
        <>
          <label style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "10px 0 14px" }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
            />
            <span>
              I consent to system-wide idle tracking and primary-display screenshots. I can pause
              monitoring or withdraw my consent at any time.
            </span>
          </label>
          <button
            type="button"
            disabled={!consentChecked || busy}
            onClick={handleStart}
            style={{
              ...buttonStyle,
              width: "100%",
              color: "#fff",
              background: !consentChecked || busy ? "#94a3b8" : "#2563eb",
            }}
          >
            {busy ? "Starting..." : "Agree and start"}
          </button>
        </>
      ) : (
        <div id="desktop-monitor-controls" style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            type="button"
            disabled={busy}
            onClick={sessionId ? () => stopSession(false, "paused") : handleStart}
            style={{
              ...buttonStyle,
              flex: 1,
              color: "#fff",
              background: sessionId ? "#334155" : "#2563eb",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Saving..." : sessionId ? "Pause monitoring" : "Resume monitoring"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => stopSession(true)}
            style={{
              ...buttonStyle,
              color: "#b91c1c",
              background: "#fee2e2",
              opacity: busy ? 0.7 : 1,
            }}
          >
            Withdraw consent
          </button>
        </div>
      )}
      </aside>
    </>
  );
};

export default DesktopMonitor;
