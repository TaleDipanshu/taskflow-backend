import { userRepository } from '../users/user.repository';
import { organizationRepository } from '../organizations/organization.repository';
import { refreshTokenRepository } from '../refreshTokens/refreshToken.repository';
import { hashPassword, comparePassword, hashToken } from '../../common/utils/hash.util';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../common/utils/jwt.util';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../../common/errors/app.error';
import { ROLES } from '../../common/constants/roles.constant';
import { IUser } from '../users/user.model';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface LoginResult extends AuthTokens {
  user: UserResponse;
}

export class AuthService {
  private formatUser(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString()
    };
  }

  private async createSession(user: IUser): Promise<AuthTokens> {
    const payload = {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Refresh token expiry date (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenHash = hashToken(refreshToken);
    await refreshTokenRepository.create(user._id, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 mins in seconds
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    organizationId: string
  ): Promise<LoginResult> {
    const orgExists = await organizationRepository.exists(organizationId);
    if (!orgExists) {
      throw new NotFoundError('Organization not found');
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const newUser = await userRepository.create({
      name,
      email,
      passwordHash,
      role: ROLES.MEMBER,
      organizationId
    });

    const tokens = await this.createSession(newUser);

    return {
      user: this.formatUser(newUser),
      ...tokens
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.createSession(user);

    return {
      user: this.formatUser(user),
      ...tokens
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshTokenStr);
    const tokenHash = hashToken(refreshTokenStr);

    const tokenRecord = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User associated with token no longer exists');
    }

    // Token rotation: Revoke old token and issue new pair
    await refreshTokenRepository.revoke(tokenRecord._id);

    return this.createSession(user);
  }

  async logout(refreshTokenStr: string): Promise<void> {
    const tokenHash = hashToken(refreshTokenStr);
    await refreshTokenRepository.revokeByTokenHash(tokenHash);
  }

  async forgotPassword(_email: string): Promise<string> {
    // Safe placeholder: never reveal if email exists
    return 'If the account exists, password reset instructions will be sent.';
  }
}

export const authService = new AuthService();
