import { FilterQuery, Types } from 'mongoose';
import { ITask, TaskModel } from './task.model';
import { TaskStatus, TaskPriority, TASK_STATUS } from '../../common/constants/task.constant';
import { PaginationParams } from '../../common/types/pagination.types';

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string | Types.ObjectId;
  organizationId: string | Types.ObjectId;
  createdById: string | Types.ObjectId;
  assigneeId?: string | Types.ObjectId | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | Types.ObjectId | null;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface TaskSummary {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export class TaskRepository {
  async create(data: CreateTaskData): Promise<ITask> {
    return TaskModel.create(data);
  }

  async findByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<ITask | null> {
    return TaskModel.findOne({ _id: id, organizationId })
      .populate('projectId', 'name description')
      .populate('assigneeId', 'name email role')
      .populate('createdById', 'name email role');
  }

  async findRawByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<ITask | null> {
    return TaskModel.findOne({ _id: id, organizationId });
  }

  async findByOrgWithFilters(
    organizationId: string | Types.ObjectId,
    filters: TaskFilterParams,
    pagination: PaginationParams
  ): Promise<ITask[]> {
    const query: FilterQuery<ITask> = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.projectId) query.projectId = filters.projectId;

    if (filters.dueDateFrom || filters.dueDateTo) {
      query.dueDate = {};
      if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom;
      if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo;
    }

    const { page, limit } = pagination;

    return TaskModel.find(query)
      .populate('projectId', 'name description')
      .populate('assigneeId', 'name email role')
      .populate('createdById', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async countByOrgWithFilters(
    organizationId: string | Types.ObjectId,
    filters: TaskFilterParams
  ): Promise<number> {
    const query: FilterQuery<ITask> = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.projectId) query.projectId = filters.projectId;

    if (filters.dueDateFrom || filters.dueDateTo) {
      query.dueDate = {};
      if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom;
      if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo;
    }

    return TaskModel.countDocuments(query);
  }

  async findByProjectId(
    projectId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<ITask[]> {
    return TaskModel.find({ projectId, organizationId })
      .populate('assigneeId', 'name email role')
      .populate('createdById', 'name email role')
      .sort({ createdAt: -1 });
  }

  async countByProjectAndStatus(
    projectId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<TaskSummary> {
    const counts = await TaskModel.aggregate([
      {
        $match: {
          projectId: new Types.ObjectId(projectId.toString()),
          organizationId: new Types.ObjectId(organizationId.toString())
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary: TaskSummary = {
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0
    };

    counts.forEach((item) => {
      if (item._id === TASK_STATUS.TODO) summary.todo = item.count;
      else if (item._id === TASK_STATUS.IN_PROGRESS) summary.inProgress = item.count;
      else if (item._id === TASK_STATUS.REVIEW) summary.review = item.count;
      else if (item._id === TASK_STATUS.DONE) summary.done = item.count;
    });

    return summary;
  }

  async updateByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId,
    data: UpdateTaskData
  ): Promise<ITask | null> {
    return TaskModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name description')
      .populate('assigneeId', 'name email role')
      .populate('createdById', 'name email role');
  }

  async deleteByIdAndOrg(
    id: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<ITask | null> {
    return TaskModel.findOneAndDelete({ _id: id, organizationId });
  }

  async deleteByProjectIdAndOrg(
    projectId: string | Types.ObjectId,
    organizationId: string | Types.ObjectId
  ): Promise<{ deletedTaskIds: Types.ObjectId[] }> {
    const tasks = await TaskModel.find({ projectId, organizationId }).select('_id');
    const taskIds = tasks.map((t) => t._id as Types.ObjectId);
    await TaskModel.deleteMany({ projectId, organizationId });
    return { deletedTaskIds: taskIds };
  }
}

export const taskRepository = new TaskRepository();
