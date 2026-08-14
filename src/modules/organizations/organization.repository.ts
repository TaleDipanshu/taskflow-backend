import { Types } from 'mongoose';
import { IOrganization, OrganizationModel } from './organization.model';

export class OrganizationRepository {
  async findById(id: string | Types.ObjectId): Promise<IOrganization | null> {
    return OrganizationModel.findById(id);
  }

  async findByName(name: string): Promise<IOrganization | null> {
    return OrganizationModel.findOne({ name });
  }

  async create(name: string): Promise<IOrganization> {
    return OrganizationModel.create({ name });
  }

  async exists(id: string | Types.ObjectId): Promise<boolean> {
    const org = await OrganizationModel.findById(id).select('_id');
    return !!org;
  }
}

export const organizationRepository = new OrganizationRepository();
