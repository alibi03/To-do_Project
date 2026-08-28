interface NotificationResponse {
  id: string;
  event_type: "task.assigned.v1";
  task_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

interface NotificationListResponse {
  notifications: NotificationResponse[];
}

export type { NotificationListResponse };
export default NotificationResponse;
