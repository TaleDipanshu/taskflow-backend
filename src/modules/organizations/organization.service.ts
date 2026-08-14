import { userRepository } from '../users/user.repository';
import { PaginationParams, PaginatedResult } from '../../common/types/pagination.types';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { IUser } from '../users/user.model';

export class OrganizationService {
  async getMembers(
    organizationId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<IUser>> {
    const [members, total] = await Promise.all([
      userRepository.findMembersByOrganization(organizationId, pagination),
      userRepository.countByOrganization(organizationId)
    ]);

    const meta = buildPaginationMeta(total, pagination.page, pagination.limit);
    return {
      data: members,
      meta
    };
  }
}

export const organizationService = new OrganizationService();
