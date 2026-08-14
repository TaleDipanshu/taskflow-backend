import { OrganizationModel } from '../src/modules/organizations/organization.model';
import { UserModel } from '../src/modules/users/user.model';
import { hashPassword } from '../src/common/utils/hash.util';
import { signAccessToken } from '../src/common/utils/jwt.util';
import { ROLES, UserRole } from '../src/common/constants/roles.constant';

export const createTestOrg = async (name = 'Test Org') => {
  return OrganizationModel.create({ name });
};

export const createTestUser = async (options: {
  name?: string;
  email: string;
  password?: string;
  role?: UserRole;
  organizationId: string;
}) => {
  const passwordHash = await hashPassword(options.password || 'Password123!');
  const user = await UserModel.create({
    name: options.name || 'Test User',
    email: options.email.toLowerCase(),
    passwordHash,
    role: options.role || ROLES.MEMBER,
    organizationId: options.organizationId
  });

  const token = signAccessToken({
    userId: user._id.toString(),
    organizationId: options.organizationId,
    role: user.role
  });

  return { user, token };
};
