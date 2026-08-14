import request from 'supertest';
import app from '../../src/app';
import { createTestOrg, createTestUser } from '../helpers';
import { ROLES } from '../../src/common/constants/roles.constant';
import { ProjectModel } from '../../src/modules/projects/project.model';
import { TaskModel } from '../../src/modules/tasks/task.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { NOTIFICATION_TYPE } from '../../src/common/constants/notification.constant';

describe('Critical Security & Organization Isolation', () => {
  let orgAId: string;
  let orgBId: string;
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    const orgA = await createTestOrg('Organization A');
    const orgB = await createTestOrg('Organization B');

    orgAId = orgA._id.toString();
    orgBId = orgB._id.toString();

    const userA = await createTestUser({
      name: 'Admin A',
      email: 'admina@taskflow.test',
      role: ROLES.ADMIN,
      organizationId: orgAId
    });

    const userB = await createTestUser({
      name: 'Admin B',
      email: 'adminb@taskflow.test',
      role: ROLES.ADMIN,
      organizationId: orgBId
    });

    tokenA = userA.token;
    tokenB = userB.token;
    userAId = userA.user._id.toString();
    userBId = userB.user._id.toString();
  });

  describe('Project Isolation', () => {
    it('Org A user should NOT be able to view Org B project', async () => {
      const projB = await ProjectModel.create({
        name: 'Project in Org B',
        organizationId: orgBId,
        createdById: userBId
      });

      const res = await request(app)
        .get(`/api/v1/projects/${projB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Org A user should NOT be able to update Org B project', async () => {
      const projB = await ProjectModel.create({
        name: 'Project in Org B',
        organizationId: orgBId,
        createdById: userBId
      });

      const res = await request(app)
        .patch(`/api/v1/projects/${projB._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const unchanged = await ProjectModel.findById(projB._id);
      expect(unchanged?.name).toBe('Project in Org B');
    });

    it('Org A user should NOT be able to delete Org B project', async () => {
      const projB = await ProjectModel.create({
        name: 'Project in Org B',
        organizationId: orgBId,
        createdById: userBId
      });

      const res = await request(app)
        .delete(`/api/v1/projects/${projB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const stillExists = await ProjectModel.findById(projB._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Task Isolation', () => {
    it('Org A user should NOT be able to view Org B task', async () => {
      const projB = await ProjectModel.create({
        name: 'Project B',
        organizationId: orgBId,
        createdById: userBId
      });

      const taskB = await TaskModel.create({
        title: 'Task in Org B',
        projectId: projB._id,
        organizationId: orgBId,
        createdById: userBId
      });

      const res = await request(app)
        .get(`/api/v1/tasks/${taskB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Org A user should NOT be able to update Org B task status', async () => {
      const projB = await ProjectModel.create({
        name: 'Project B',
        organizationId: orgBId,
        createdById: userBId
      });

      const taskB = await TaskModel.create({
        title: 'Task in Org B',
        projectId: projB._id,
        organizationId: orgBId,
        createdById: userBId,
        status: 'TODO'
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskB._id}/status`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const unchanged = await TaskModel.findById(taskB._id);
      expect(unchanged?.status).toBe('TODO');
    });

    it('Org A user should NOT be able to delete Org B task', async () => {
      const projB = await ProjectModel.create({
        name: 'Project B',
        organizationId: orgBId,
        createdById: userBId
      });

      const taskB = await TaskModel.create({
        title: 'Task in Org B',
        projectId: projB._id,
        organizationId: orgBId,
        createdById: userBId
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${taskB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const stillExists = await TaskModel.findById(taskB._id);
      expect(stillExists).not.toBeNull();
    });

    it('Cross-organization assignment MUST fail with 400', async () => {
      const projA = await ProjectModel.create({
        name: 'Project A',
        organizationId: orgAId,
        createdById: userAId
      });

      const taskA = await TaskModel.create({
        title: 'Task in Org A',
        projectId: projA._id,
        organizationId: orgAId,
        createdById: userAId
      });

      // Attempt to assign user from Org B to task in Org A
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskA._id}/assignee`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userBId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Target user does not belong to your organization');
    });
  });

  describe('Organization Id Spoofing Defense', () => {
    it('Backend must ignore organizationId passed in request body when creating resources', async () => {
      // User A creates project and passes organizationId: orgBId
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Spoof Attempt Project',
          organizationId: orgBId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.organizationId).toBe(orgAId); // strictly Org A
      expect(res.body.data.organizationId).not.toBe(orgBId);
    });
  });

  describe('Notification Isolation', () => {
    it('Org A user should NOT be able to view Org B user notification', async () => {
      const projB = await ProjectModel.create({
        name: 'Project B',
        organizationId: orgBId,
        createdById: userBId
      });

      const taskB = await TaskModel.create({
        title: 'Task in Org B',
        projectId: projB._id,
        organizationId: orgBId,
        createdById: userBId
      });

      const notifB = await NotificationModel.create({
        userId: userBId,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'Notification for User B',
        message: 'Private message',
        taskId: taskB._id
      });

      // User A attempts to mark User B's notification as read
      const res = await request(app)
        .patch(`/api/v1/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
