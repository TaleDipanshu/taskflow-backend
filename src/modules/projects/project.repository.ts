import { Types } from 'mongoose';
import { IProject, ProjectModel } from './project.model';
import { PaginationParams } from '../../common/types/pagination.types';

export interface CreateProjectData {
  name: string;
  description?: string;
  organizationId: string | Types.ObjectId;
  createdById: string | Types.ObjectId;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export class ProjectRepository {
  async findByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<IProject | null> {
    return ProjectModel.findOne({ _id: id, organizationId });
  }

  async findByOrg(
    organizationId: string | Types.ObjectId,
    pagination: PaginationParams
  ): Promise<IProject[]> {
    const { page, limit } = pagination;
    return ProjectModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async countByOrg(organizationId: string | Types.ObjectId): Promise<number> {
    return ProjectModel.countDocuments({ organizationId });
  }

  async create(data: CreateProjectData): Promise<IProject> {
    return ProjectModel.create(data);
  }

  async updateByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
    data: UpdateProjectData
  ): Promise<IProject | null> {
    return ProjectModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<IProject | null> {
    return ProjectModel.findOneAndDelete({ _id: id, organizationId });
  }

  async existsInOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<boolean> {
    const proj = await ProjectModel.findOne({ _id: id, organizationId }).select('_id');
    return !!proj;
  }
}

export const projectRepository = new ProjectRepository();
