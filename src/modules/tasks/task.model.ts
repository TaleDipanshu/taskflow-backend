import mongoose, { Document, Schema, Types } from 'mongoose';
import { TASK_STATUS, TASK_PRIORITY, TaskStatus, TaskPriority } from '../../common/constants/task.constant';

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: Types.ObjectId;
  organizationId: Types.ObjectId;
  assigneeId?: Types.ObjectId | null;
  createdById: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required']
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true
    },
    dueDate: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret.projectId = ret.projectId ? ret.projectId.toString() : undefined;
        ret.organizationId = ret.organizationId ? ret.organizationId.toString() : undefined;
        ret.assigneeId = ret.assigneeId ? ret.assigneeId.toString() : null;
        ret.createdById = ret.createdById ? ret.createdById.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

taskSchema.index({ organizationId: 1, projectId: 1 });
taskSchema.index({ organizationId: 1, status: 1 });
taskSchema.index({ organizationId: 1, priority: 1 });
taskSchema.index({ organizationId: 1, assigneeId: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });

export const TaskModel = mongoose.model<ITask>('Task', taskSchema);
