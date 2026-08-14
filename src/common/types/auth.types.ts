import { UserRole } from '../constants/roles.constant';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role: UserRole;
}
