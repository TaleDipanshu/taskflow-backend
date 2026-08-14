export const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
