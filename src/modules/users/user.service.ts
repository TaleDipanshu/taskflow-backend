import { userRepository } from './user.repository';
import { organizationRepository } from '../organizations/organization.repository';
import { NotFoundError } from '../../common/errors/app.error';

export interface UserMeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

export class UserService {
  async getCurrentUserProfile(userId: string): Promise<UserMeProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const organization = await organizationRepository.findById(user.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organization: {
        id: organization._id.toString(),
        name: organization.name
      }
    };
  }
}

export const userService = new UserService();
