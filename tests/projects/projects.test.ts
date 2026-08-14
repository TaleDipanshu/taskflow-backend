import request from 'supertest';
import app from '../../src/app';
import { createTestOrg, createTestUser } from '../helpers';
import { ROLES } from '../../src/common/constants/roles.constant';
import { ProjectModel } from '../../src/modules/projects/project.model';
import { TaskModel } from '../../src/modules/tasks/task.model';
import { TASK_STATUS } from '../../src/common/constants/task.constant';

describe('Project Endpoints', () => {
  describe('POST /api/v1/projects', () => {
    it('should allow ADMIN to create a project', async () => {
      const org = await createTestOrg();
      const { token } = await createTestUser({
        email: 'admin@example.com',
        role: ROLES.ADMIN,
        organizationId: org._id.toString()
      });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Mobile App',
          description: 'TaskFlow mobile application'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mobile App');
      expect(res.body.data.organizationId).toBe(org._id.toString());
    });

    it('should forbid MEMBER from creating a project (403)', async () => {
      const org = await createTestOrg();
      const { token } = await createTestUser({
        email: 'member@example.com',
        role: ROLES.MEMBER,
        organizationId: org._id.toString()
      });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unauthorized Project'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects with task counts and progress for the current organization', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'member@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project Alpha',
        description: 'Test project Alpha',
        organizationId: org._id,
        createdById: user._id
      });

      // Create 2 tasks (1 DONE, 1 IN_PROGRESS)
      await TaskModel.create({
        title: 'Task 1',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.DONE
      });

      await TaskModel.create({
        title: 'Task 2',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.IN_PROGRESS
      });

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Project Alpha');
      expect(res.body.data[0].taskCount).toBe(2);
      expect(res.body.data[0].progress).toBe(50);
      expect(res.body.data[0].status).toBe('IN_PROGRESS');
    });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('should return project details with task summary breakdown and tasks list', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'member@example.com',
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Detailed Project',
        organizationId: org._id,
        createdById: user._id
      });

      await TaskModel.create({
        title: 'Task Todo',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.TODO
      });

      await TaskModel.create({
        title: 'Task Done',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id,
        status: TASK_STATUS.DONE
      });

      const res = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Detailed Project');
      expect(res.body.data.taskSummary).toEqual({
        todo: 1,
        inProgress: 0,
        review: 0,
        done: 1
      });
      expect(res.body.data.tasks).toHaveLength(2);
    });

    it('should return 404 for non-existent project', async () => {
      const org = await createTestOrg();
      const { token } = await createTestUser({
        email: 'member@example.com',
        organizationId: org._id.toString()
      });

      const res = await request(app)
        .get('/api/v1/projects/66bc6ad804369e5d487211a0')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/projects/:projectId', () => {
    it('should allow ADMIN to update project', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'admin@example.com',
        role: ROLES.ADMIN,
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Initial Name',
        organizationId: org._id,
        createdById: user._id
      });

      const res = await request(app)
        .patch(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.description).toBe('Updated Description');
    });
  });

  describe('DELETE /api/v1/projects/:projectId', () => {
    it('should allow ADMIN to delete project and cascade delete tasks', async () => {
      const org = await createTestOrg();
      const { token, user } = await createTestUser({
        email: 'admin@example.com',
        role: ROLES.ADMIN,
        organizationId: org._id.toString()
      });

      const project = await ProjectModel.create({
        name: 'Project to Delete',
        organizationId: org._id,
        createdById: user._id
      });

      await TaskModel.create({
        title: 'Cascade Task',
        projectId: project._id,
        organizationId: org._id,
        createdById: user._id
      });

      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const foundProj = await ProjectModel.findById(project._id);
      expect(foundProj).toBeNull();

      const remainingTasks = await TaskModel.find({ projectId: project._id });
      expect(remainingTasks).toHaveLength(0);
    });
  });
});
