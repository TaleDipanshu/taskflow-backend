import request from 'supertest';
import app from '../../src/app';
import { createTestOrg, createTestUser } from '../helpers';
import { ROLES } from '../../src/common/constants/roles.constant';

describe('User and Organization Endpoints', () => {
  describe('GET /api/v1/users/me', () => {
    it('should return current user profile and organization info', async () => {
      const org = await createTestOrg('My Organization');
      const { token, user } = await createTestUser({
        name: 'Alice Profile',
        email: 'alice.profile@example.com',
        role: ROLES.ADMIN,
        organizationId: org._id.toString()
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(user._id.toString());
      expect(res.body.data.name).toBe('Alice Profile');
      expect(res.body.data.email).toBe('alice.profile@example.com');
      expect(res.body.data.role).toBe('ADMIN');
      expect(res.body.data.organization).toEqual({
        id: org._id.toString(),
        name: 'My Organization'
      });
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/organizations/members', () => {
    it('should return only members belonging to the authenticated user organization', async () => {
      const orgA = await createTestOrg('Org A');
      const orgB = await createTestOrg('Org B');

      const { token: tokenA } = await createTestUser({
        name: 'User A1',
        email: 'user.a1@example.com',
        organizationId: orgA._id.toString()
      });

      await createTestUser({
        name: 'User A2',
        email: 'user.a2@example.com',
        organizationId: orgA._id.toString()
      });

      await createTestUser({
        name: 'User B1',
        email: 'user.b1@example.com',
        organizationId: orgB._id.toString()
      });

      const res = await request(app)
        .get('/api/v1/organizations/members')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
      const emails = res.body.data.map((u: { email: string }) => u.email);
      expect(emails).toContain('user.a1@example.com');
      expect(emails).toContain('user.a2@example.com');
      expect(emails).not.toContain('user.b1@example.com');
    });
  });
});
