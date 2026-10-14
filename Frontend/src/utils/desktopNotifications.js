export const showDesktopNotification = (message, type, id) => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    window.Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    const notification = new window.Notification(
      type === "error" ? "Digious CRM - Error" : "Digious CRM - Success",
      {
        body: message,
        icon: "/favicon.ico",
        tag: `digious-crm-${id}`,
      },
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Failed to show desktop notification:", error);
  }
};
