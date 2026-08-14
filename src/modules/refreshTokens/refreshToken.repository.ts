import { Types } from 'mongoose';
import { IRefreshToken, RefreshTokenModel } from './refreshToken.model';

export class RefreshTokenRepository {
  async create(userId: string | Types.ObjectId, tokenHash: string, expiresAt: Date): Promise<IRefreshToken> {
    return RefreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date()
    });
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ tokenHash });
  }

  async revoke(id: string | Types.ObjectId): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findByIdAndUpdate(id, { revokedAt: new Date() }, { new: true });
  }

  async revokeByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() }, { new: true });
  }

  async revokeAllForUser(userId: string | Types.ObjectId): Promise<void> {
    await RefreshTokenModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }

  async deleteExpired(): Promise<void> {
    await RefreshTokenModel.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
