import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { swaggerDocsRouter } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './common/errors/app.error';
import { sendSuccess } from './common/utils/response.util';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import organizationRoutes from './modules/organizations/organization.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import notificationRoutes from './modules/notifications/notification.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok' });
});

// Swagger API Documentation
app.use('/api-docs', swaggerDocsRouter);

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 Handler
app.use((req: Request) => {
  throw new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' not found`);
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
