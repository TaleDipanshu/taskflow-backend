import { Types } from 'mongoose';
import { IUser, UserModel } from './user.model';
import { UserRole } from '../../common/constants/roles.constant';
import { PaginationParams } from '../../common/types/pagination.types';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string | Types.ObjectId;
}

export class UserRepository {
  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async findByIdWithPassword(id: string | Types.ObjectId): Promise<IUser | null> {
    return UserModel.findById(id).select('+passwordHash');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  }

  async create(data: CreateUserData): Promise<IUser> {
    return UserModel.create({
      ...data,
      email: data.email.toLowerCase().trim()
    });
  }

  async findMembersByOrganization(
    organizationId: string | Types.ObjectId,
    pagination: PaginationParams
  ): Promise<IUser[]> {
    const { page, limit } = pagination;
    return UserModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async countByOrganization(organizationId: string | Types.ObjectId): Promise<number> {
    return UserModel.countDocuments({ organizationId });
  }

  async existsInOrganization(
    userId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<boolean> {
    const user = await UserModel.findOne({ _id: userId, organizationId }).select('_id');
    return !!user;
  }
}

export const userRepository = new UserRepository();
