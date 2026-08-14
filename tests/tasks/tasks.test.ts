import request from 'supertest';
import app from '../../src/app';
import { createTestOrg, createTestUser } from '../helpers';
import { ProjectModel } from '../../src/modules/projects/project.model';
import { TaskModel } from '../../src/modules/tasks/task.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { TASK_STATUS, TASK_PRIORITY } from '../../src/common/constants/task.constant';

describe('Task Endpoints', () => {
  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: user._id
      });

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: project._id.toString(),
          title: 'Implement authentication',
          description: 'Implement JWT authentication',
          priority: 'HIGH',
          dueDate: '2026-08-20'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Implement authentication');
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.organizationId).toBe(org._id.toString());
    });

    it('should return 404 if project does not exist or belongs to another org', async () => {
      const org = await createTestOrg();
      const { token } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          projectId: '66bc6ad804369e5d487211a0',
          title: 'Invalid project task'
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should filter tasks by status and priority', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: user._id
      });

      await TaskModel.create({
        title: 'Task Match',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.IN_PROGRESS,
        priority: TASK_PRIORITY.HIGH
      });

      await TaskModel.create({
        title: 'Task Other',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.TODO,
        priority: TASK_PRIORITY.LOW
      });

      const res = await request(app)
        .get('/api/v1/tasks?status=IN_PROGRESS&priority=HIGH')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Task Match');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/status and /priority', () => {
    it('should update task status', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: user._id
      });

      const task = await TaskModel.create({
        title: 'Task 1',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.TODO
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DONE');
    });

    it('should update task priority', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: user._id
      });

      const task = await TaskModel.create({
        title: 'Task 1',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        priority: TASK_PRIORITY.LOW
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/priority`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'URGENT' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.priority).toBe('URGENT');
    });
  });

  describe('Task Assignment and Notifications', () => {
    it('should assign a user in the same org and create a notification', async () => {
      const org = await createTestOrg();
      const { token: adminToken, user: adminUser } = await createTestUser({
        email: 'admin@example.com',
        organizationId: org._id.toString()
      });

      const { user: memberUser } = await createTestUser({
        email: 'member@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: adminUser._id
      });

      const task = await TaskModel.create({
        title: 'Assignment Task',
        projectId: project._id,
        organizationId: org._id,
        createdById: adminUser._id
      });

      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/assignee`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberUser._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify notification created
      const notification = await NotificationModel.findOne({
        userId: memberUser._id,
        taskId: task._id
      });
      expect(notification).not.toBeNull();
      expect(notification?.type).toBe('TASK_ASSIGNED');
    });

    it('should unassign a user from task', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'user@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project 1',
        organizationId: org._id,
        createdById: user._id
      });

      const task = await TaskModel.create({
        title: 'Unassign Task',
        projectId: project._id,
        organizationId: org._id,
        assigneeId: user._id,
        createdById: user._id
      });

      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}/assignee`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assigneeId).toBeNull();
    });
  });
});
