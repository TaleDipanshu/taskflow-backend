import request from 'supertest';
import app from '../../src/app';
import { createTestOrg } from '../helpers';
import { RefreshTokenModel } from '../../src/modules/refreshTokens/refreshToken.model';
import { hashToken } from '../../src/common/utils/hash.util';

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user and return tokens', async () => {
      const org = await createTestOrg('Org Test');

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
          organizationId: org._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('MEMBER');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.expiresIn).toBe(900);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 409 when registering with duplicate email', async () => {
      const org = await createTestOrg('Org Test');

      await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'duplicate@example.com',
        password: 'Password123!',
        organizationId: org._id.toString()
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Another Jane',
        email: 'duplicate@example.com',
        password: 'Password123!',
        organizationId: org._id.toString()
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 404 if organization does not exist', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        organizationId: '66bc6ad804369e5d487211a0'
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const org = await createTestOrg();
      await request(app).post('/api/v1/auth/register').send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'Secret123!',
        organizationId: org._id.toString()
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login@example.com',
        password: 'Secret123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('should return 401 on invalid password', async () => {
      const org = await createTestOrg();
      await request(app).post('/api/v1/auth/register').send({
        name: 'Login User',
        email: 'login2@example.com',
        password: 'Secret123!',
        organizationId: org._id.toString()
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login2@example.com',
        password: 'WrongPassword!'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should return 401 on non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'WrongPassword!'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue new access and refresh tokens and revoke old refresh token', async () => {
      const org = await createTestOrg();
      const regRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Refresh User',
        email: 'refresh@example.com',
        password: 'Password123!',
        organizationId: org._id.toString()
      });

      const initialRefreshToken = regRes.body.data.refreshToken;

      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(initialRefreshToken);

      // Old refresh token must be revoked
      const oldTokenRecord = await RefreshTokenModel.findOne({
        tokenHash: hashToken(initialRefreshToken)
      });
      expect(oldTokenRecord?.revokedAt).not.toBeNull();

      // Trying to reuse the old refresh token must return 401
      const reuseRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken
      });
      expect(reuseRes.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke refresh token on logout', async () => {
      const org = await createTestOrg();
      const regRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'Password123!',
        organizationId: org._id.toString()
      });

      const refreshToken = regRes.body.data.refreshToken;

      const res = await request(app).post('/api/v1/auth/logout').send({
        refreshToken
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logged out successfully');

      // Attempting to refresh with the logged out token must fail
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken
      });
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return generic safe message', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'user@example.com'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('password reset instructions will be sent');
    });
  });
});
