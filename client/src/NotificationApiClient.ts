import type { MessageResponse, NotificationsResponse } from "./types";

class NotificationApiClient {
  readonly baseUrl: string;

  constructor(
    baseUrl =
      import.meta.env.VITE_NOTIFICATION_API_URL ?? "http://localhost:3001"
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getNotifications(): Promise<NotificationsResponse> {
    const response = await fetch(`${this.baseUrl}/api/notifications`, {
      headers: this.getBearerHeaders(),
    });
    const data = (await response.json()) as NotificationsResponse &
      Partial<MessageResponse>;

    if (!response.ok) {
      throw new Error(data.message ?? "Notifications could not be loaded.");
    }

    return data;
  }

  private getBearerHeaders(): HeadersInit {
    const token = localStorage.getItem("token");

    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default NotificationApiClient;
