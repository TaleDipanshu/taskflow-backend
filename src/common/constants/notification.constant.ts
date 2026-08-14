export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'TASK_ASSIGNED'
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
