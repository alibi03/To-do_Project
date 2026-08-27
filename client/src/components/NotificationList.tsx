import { useEffect, useState } from "react";

import NotificationApiClient from "../NotificationApiClient";
import type { Notification } from "../types";

const POLL_INTERVAL_MS = 5_000;
const notificationApiClient = new NotificationApiClient();

function formatCreatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function newestFirst(notifications: Notification[]): Notification[] {
  return [...notifications].sort((left, right) =>
    right.created_at.localeCompare(left.created_at)
  );
}

function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    let isRequestInFlight = false;

    async function loadNotifications() {
      if (isRequestInFlight) {
        return;
      }

      isRequestInFlight = true;

      try {
        const data = await notificationApiClient.getNotifications();

        if (isActive) {
          setNotifications(newestFirst(data.notifications));
          setError("");
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Notifications could not be loaded."
          );
        }
      } finally {
        isRequestInFlight = false;

        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(
      () => void loadNotifications(),
      POLL_INTERVAL_MS
    );

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section
      className="card notification-section"
      aria-labelledby="notifications-title"
    >
      <div className="notification-heading">
        <h2 id="notifications-title">Notifications</h2>
        <span>Updates automatically</span>
      </div>

      {isLoading && (
        <p className="notification-state" role="status">
          Loading notifications...
        </p>
      )}

      {!isLoading && error && (
        <p className="notification-state notification-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <p className="notification-state">No notifications yet.</p>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <ol className="notification-list">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <div>
                <p>{notification.message}</p>
                <time dateTime={notification.created_at}>
                  {formatCreatedAt(notification.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default NotificationList;
