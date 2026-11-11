import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { config } from "../config/api";

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
      throw new Error(result?.message || `Monitoring request failed (${response.status})`);
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCapture, setLastCapture] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const idleSinceRef = useRef(null);
  const checkingRef = useRef(false);
  const startedRef = useRef(false);
  const lastTokenRef = useRef(token);

  if (token) lastTokenRef.current = token;

  const startSession = useCallback(async () => {
    if (!token || !employeeId) {
      throw new Error("Please sign in again before enabling desktop monitoring.");
    }
    const result = await requestJson(
      `${config.FULL_API_URL}/desktop-monitor/sessions`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ consentVersion: CONSENT_VERSION }),
      },
    );
    setSessionId(result.data.sessionId);
    setConsented(true);
    setError("");
  }, [employeeId, token]);

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

          const screenshot = await bridge.captureScreen();
          if (screenshot) {
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
        if (active) setError(monitorError.message || "Desktop Monitoring request failed.");
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
  }, [bridge, isMonitoringSurface, sessionId, token]);

  useEffect(() => {
    if (!sessionId || !token) return undefined;
    const stopOnClose = () => {
      fetch(`${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/stop`, {
        method: "POST",
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch((stopError) => console.error("Could not close desktop monitoring session", stopError));
    };
    window.addEventListener("pagehide", stopOnClose);
    return () => window.removeEventListener("pagehide", stopOnClose);
  }, [sessionId, token]);

  useEffect(() => {
    if (token || !sessionId || !lastTokenRef.current) return undefined;
    const previousToken = lastTokenRef.current;
    const currentSession = sessionId;
    fetch(`${config.FULL_API_URL}/desktop-monitor/sessions/${currentSession}/stop`, {
      method: "POST",
      keepalive: true,
      headers: {
        Authorization: `Bearer ${previousToken}`,
        "Content-Type": "application/json",
      },
    }).catch((stopError) => console.error("Could not close desktop monitoring session", stopError));
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

  const stopSession = async (withdrawConsent) => {
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
          { method: "POST" },
        );
      }
      setSessionId(null);
      setIdle(false);
      idleSinceRef.current = null;
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
      setError(stopError.message);
    } finally {
      setBusy(false);
    }
  };

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
          <strong style={{ display: "block", fontSize: 15, marginBottom: 8 }}>
            Desktop monitoring consent
          </strong>
          <p style={{ color: "#475569", lineHeight: 1.5, margin: "0 0 12px" }}>
            When the CRM window is active, a primary display screenshot is captured every{" "}
            {SCREENSHOT_INTERVAL_MS / 60000} minutes. Other apps or windows visible on the display
            may also be captured.
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
                {sessionId ? (idle ? "Idle" : "Active") : "Paused"}
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
            onClick={sessionId ? () => stopSession(false) : handleStart}
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
