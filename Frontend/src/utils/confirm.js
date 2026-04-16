import React from "react";
import toast from "react-hot-toast";

/**
 * Shows a styled toast-based confirmation dialog.
 * Returns a Promise<boolean> — true if confirmed, false if cancelled.
 *
 * @param {string} message - The confirmation message to display.
 * @param {object} [options]
 * @param {string} [options.confirmText='Confirm'] - Label for the confirm button.
 * @param {string} [options.cancelText='Cancel'] - Label for the cancel button.
 * @param {'danger'|'warning'|'info'} [options.type='danger'] - Visual style.
 */
export const confirmDialog = (
  message,
  { confirmText = "Confirm", cancelText = "Cancel", type = "danger" } = {},
) => {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-sm w-full bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden pointer-events-auto`}
          style={{ minWidth: 300 }}
        >
          {/* Top accent bar */}
          <div
            className={`h-1 w-full ${
              type === "danger"
                ? "bg-gradient-to-r from-red-400 to-rose-500"
                : type === "warning"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-blue-400 to-indigo-500"
            }`}
          />

          <div className="p-4">
            {/* Icon + Message */}
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  type === "danger"
                    ? "bg-red-50 text-red-500"
                    : type === "warning"
                      ? "bg-amber-50 text-amber-500"
                      : "bg-blue-50 text-blue-500"
                }`}
              >
                {type === "danger" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                ) : type === "warning" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>

              <p className="text-sm text-slate-700 font-medium leading-snug flex-1 pt-1">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-sm ${
                  type === "danger"
                    ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                    : type === "warning"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                }`}
              >
                {confirmText}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  });
};
