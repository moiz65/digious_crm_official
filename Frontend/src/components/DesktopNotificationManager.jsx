import React, { useEffect, useRef, useState } from "react";
import { resolveValue, useToasterStore, toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { showDesktopNotification } from "../utils/desktopNotifications";

const getPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
};

const getMessageText = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getMessageText).filter(Boolean).join(" ");
  }

  if (React.isValidElement(value)) {
    return getMessageText(value.props.children);
  }

  return "";
};

const DesktopNotificationManager = () => {
  const { isAuthenticated } = useAuth();
  const { toasts } = useToasterStore();
  const [permission, setPermission] = useState(getPermission);
  const [permissionError, setPermissionError] = useState("");
  const previousToastTypes = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      previousToastTypes.current = null;
      return;
    }

    const currentToastTypes = new Map();

    toasts.forEach((currentToast) => {
      currentToastTypes.set(currentToast.id, currentToast.type);

      if (
        previousToastTypes.current &&
        ["success", "error"].includes(currentToast.type) &&
        previousToastTypes.current.get(currentToast.id) !== currentToast.type
      ) {
        const message = getMessageText(
          resolveValue(currentToast.message, currentToast),
        );

        if (message) {
          showDesktopNotification(
            message,
            currentToast.type,
            currentToast.id,
          );
        }
      }
    });

    previousToastTypes.current = currentToastTypes;
  }, [isAuthenticated, permission, toasts]);

  const enableNotifications = async () => {
    setPermissionError("");

    if (typeof window === "undefined" || !window.isSecureContext) {
      setPermissionError(
        "Desktop notifications require HTTPS (or localhost).",
      );
      return;
    }

    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    try {
      const nextPermission = await window.Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission === "granted") {
        toast.success("Desktop notifications enabled");
      } else {
        setPermissionError(
          "Notifications were not allowed. Enable them in your browser's site settings.",
        );
      }
    } catch (error) {
      console.error("Failed to request desktop notification permission:", error);
      setPermissionError(
        "Could not request notification permission. Check your browser settings and try again.",
      );
    }
  };

  if (!isAuthenticated || permission === "granted") {
    return null;
  }

  const isUnsupported = permission === "unsupported";
  const isBlocked = permission === "denied";

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      <h2 className="font-semibold text-slate-900">Desktop notifications</h2>
      <p className="mt-1 text-sm text-slate-600">
        {isUnsupported
          ? "This browser does not support desktop notifications."
          : isBlocked
            ? "Notifications are blocked. Allow them in your browser's site settings, then reload the CRM."
            : ""}
      </p>
      {permissionError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {permissionError}
        </p>
      )}
      {!isUnsupported && !isBlocked && (
        <button
          className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={enableNotifications}
          type="button"
        >
          Enable desktop alerts
        </button>
      )}
    </aside>
  );
};

export default DesktopNotificationManager;
