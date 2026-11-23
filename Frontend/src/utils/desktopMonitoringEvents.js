export const DESKTOP_MONITOR_EVENTS = {
  CHECKED_IN: "desktop-monitor:checked-in",
  CHECKED_OUT: "desktop-monitor:checked-out",
  BREAK_STARTED: "desktop-monitor:break-started",
  BREAK_ENDED: "desktop-monitor:break-ended",
};

export function emitDesktopMonitorEvent(type) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(type));
  }
}
