import request from 'supertest';
import app from '../../src/app';
import { createTestOrg, createTestUser } from '../helpers';
import { ProjectModel } from '../../src/modules/projects/project.model';
import { TaskModel } from '../../src/modules/tasks/task.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { NOTIFICATION_TYPE } from '../../src/common/constants/notification.constant';

describe('Notification Endpoints', () => {
  it('should list notifications belonging to the current user', async () => {
    const org = await createTestOrg();
    const { token: token1, user: user1 } = await createTestUser({
      email: 'user1@example.com',
      organizationId: org._id.toString()
    });

    const { user: user2 } = await createTestUser({
      email: 'user2@example.com',
      organizationId: org._id.toString()
    });

    const project = await ProjectModel.create({
      name: 'Project',
      organizationId: org._id,
      createdById: user1._id
    });

    const task = await TaskModel.create({
      title: 'Task',
      projectId: project._id,
      organizationId: org._id,
      createdById: user1._id
    });

    // Notification for user1
    await NotificationModel.create({
      userId: user1._id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: 'Notification for User 1',
      message: 'Msg 1',
      taskId: task._id
    });

    // Notification for user2
    await NotificationModel.create({
      userId: user2._id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: 'Notification for User 2',
      message: 'Msg 2',
      taskId: task._id
    });

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Notification for User 1');
  });

  it('should mark a notification as read', async () => {
    const org = await createTestOrg();
    const { token, user } = await createTestUser({
      email: 'user@example.com',
      organizationId: org._id.toString()
    });

    const project = await ProjectModel.create({
      name: 'Project',
      organizationId: org._id,
      createdById: user._id
    });

    const task = await TaskModel.create({
      title: 'Task',
      projectId: project._id,
      organizationId: org._id,
      createdById: user._id
    });

    const notification = await NotificationModel.create({
      userId: user._id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: 'Unread Notification',
      message: 'Msg',
      taskId: task._id,
      readAt: null
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.readAt).not.toBeNull();
  });
});
