import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { config } from "../config/api";

const CONSENT_VERSION = "desktop-monitor-v1";
const IDLE_THRESHOLD_SECONDS = 3 * 60;
const SCREENSHOT_INTERVAL_MS = 15 * 60 * 1000;
const ACTIVITY_CHECK_INTERVAL_MS = 15 * 1000;
const SENSITIVE_PATHS = /^\/(login|change-password|forgot-password|verify-otp)(\/|$)/;

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
  const { user, token } = useAuth();
  const employeeId = user?.employeeId || user?.employee_id || user?.userId || user?.id;
  const bridge = window.desktopMonitor;
  const consentKey = `desktop-monitor-consent:${employeeId || ""}`;
  const enabledKey = `desktop-monitor-enabled:${employeeId || ""}`;
  const [consentChecked, setConsentChecked] = useState(false);
  const [consented, setConsented] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [idle, setIdle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCapture, setLastCapture] = useState(null);
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
    if (!bridge || !employeeId) return undefined;
    const hasConsent = localStorage.getItem(consentKey) === CONSENT_VERSION;
    setConsented(hasConsent);
    const shouldResume = localStorage.getItem(enabledKey) === "true";
    if (hasConsent && shouldResume && token && !startedRef.current) {
      startedRef.current = true;
      startSession().catch((startError) => setError(startError.message));
    }
    return undefined;
  }, [bridge, consentKey, employeeId, enabledKey, startSession, token]);

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
      formData.append("screenshot", image, "crm-window.jpg");
      await requestJson(
        `${config.FULL_API_URL}/desktop-monitor/sessions/${sessionId}/screenshots`,
        token,
        { method: "POST", body: formData },
      );
    };

    const check = async () => {
      if (!active || checkingRef.current) return;
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
          && state.isFocused
          && !document.hidden
          && !passwordInputFocused
          && !sensitivePage
        ) {
          const screenshot = await bridge.captureCrmWindow();
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
        if (active) setError(monitorError.message || "Desktop monitoring request failed.");
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
  }, [bridge, sessionId, token]);

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
      } else {
        localStorage.setItem(enabledKey, "false");
      }
    } catch (stopError) {
      setError(stopError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!bridge || !token || !employeeId) return null;

  const panelStyle = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 10000,
    width: 330,
    padding: 14,
    borderRadius: 10,
    background: "#fff",
    color: "#172033",
    border: "1px solid #cbd5e1",
    boxShadow: "0 6px 24px rgba(15, 23, 42, .2)",
    fontSize: 13,
  };

  return (
    <aside style={panelStyle} aria-live="polite">
      <strong>Desktop monitoring {sessionId ? (idle ? "— idle" : "— active") : "— paused"}</strong>
      <p style={{ margin: "8px 0" }}>
        Sirf is CRM window ka screenshot har 15 minute; 3 minute inactivity par idle.
        Idle ya window unfocused ho to screenshot nahi liya jayega.
      </p>
      {lastCapture && (
        <p style={{ margin: "6px 0" }}>
          Last screenshot: {lastCapture.toLocaleTimeString()}
        </p>
      )}
      {error && <p role="alert" style={{ color: "#b91c1c", margin: "6px 0" }}>{error}</p>}
      {!consented ? (
        <>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "8px 0" }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
            />
            <span>Main idle tracking aur sirf CRM window ke screenshots ki ijazat deta/deti hoon.</span>
          </label>
          <button type="button" disabled={!consentChecked || busy} onClick={handleStart}>
            {busy ? "Starting..." : "Agree and start"}
          </button>
        </>
      ) : sessionId ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={busy} onClick={() => stopSession(false)}>
            {busy ? "Saving..." : "Pause"}
          </button>
          <button type="button" disabled={busy} onClick={() => stopSession(true)}>
            Stop and withdraw consent
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={busy} onClick={handleStart}>
            {busy ? "Starting..." : "Resume"}
          </button>
          <button type="button" disabled={busy} onClick={() => stopSession(true)}>
            Withdraw consent
          </button>
        </div>
      )}
    </aside>
  );
};

export default DesktopMonitor;
