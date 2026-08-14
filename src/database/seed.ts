import mongoose from 'mongoose';
import { env } from '../config/env';
import { hashPassword } from '../common/utils/hash.util';
import { ROLES } from '../common/constants/roles.constant';
import { TASK_STATUS, TASK_PRIORITY } from '../common/constants/task.constant';
import { NOTIFICATION_TYPE } from '../common/constants/notification.constant';

import { OrganizationModel } from '../modules/organizations/organization.model';
import { UserModel } from '../modules/users/user.model';
import { ProjectModel } from '../modules/projects/project.model';
import { TaskModel } from '../modules/tasks/task.model';
import { NotificationModel } from '../modules/notifications/notification.model';
import { RefreshTokenModel } from '../modules/refreshTokens/refreshToken.model';

export const runSeed = async (): Promise<void> => {
  console.log('🌱 Starting database seeding process...');

  const mongoUri = env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB for seeding: ${mongoUri}`);

  // Clear existing collections
  await Promise.all([
    OrganizationModel.deleteMany({}),
    UserModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    TaskModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    RefreshTokenModel.deleteMany({})
  ]);
  console.log('🧹 Cleared existing database records.');

  // 1. Create Organizations
  const orgA = await OrganizationModel.create({
    name: 'Acme Corporation (Org A)'
  });

  const orgB = await OrganizationModel.create({
    name: 'Globex Dynamics (Org B)'
  });

  console.log(`🏢 Created Organizations: ${orgA.name} and ${orgB.name}`);

  // 2. Hash passwords
  const adminAPasswordHash = await hashPassword('Admin123!');
  const memberAPasswordHash = await hashPassword('Member123!');
  const adminBPasswordHash = await hashPassword('Admin123!');
  const memberBPasswordHash = await hashPassword('Member123!');

  // 3. Create Users
  const adminA = await UserModel.create({
    name: 'Admin Alice',
    email: 'admina@taskflow.test',
    passwordHash: adminAPasswordHash,
    role: ROLES.ADMIN,
    organizationId: orgA._id
  });

  const memberA = await UserModel.create({
    name: 'Member Alex',
    email: 'membera@taskflow.test',
    passwordHash: memberAPasswordHash,
    role: ROLES.MEMBER,
    organizationId: orgA._id
  });

  const adminB = await UserModel.create({
    name: 'Admin Bob',
    email: 'adminb@taskflow.test',
    passwordHash: adminBPasswordHash,
    role: ROLES.ADMIN,
    organizationId: orgB._id
  });

  const memberB = await UserModel.create({
    name: 'Member Bella',
    email: 'memberb@taskflow.test',
    passwordHash: memberBPasswordHash,
    role: ROLES.MEMBER,
    organizationId: orgB._id
  });

  console.log('👥 Created Users:');
  console.log('   Org A: adminA@taskflow.test, memberA@taskflow.test');
  console.log('   Org B: adminB@taskflow.test, memberB@taskflow.test');

  // 4. Projects for Org A
  const projA1 = await ProjectModel.create({
    name: 'TaskFlow Mobile Application',
    description: 'Flutter cross-platform client for TaskFlow with offline-first support',
    organizationId: orgA._id,
    createdById: adminA._id
  });

  const projA2 = await ProjectModel.create({
    name: 'TaskFlow Cloud Backend',
    description: 'Node.js Express REST API backend with strict multi-tenant isolation',
    organizationId: orgA._id,
    createdById: adminA._id
  });

  const projA3 = await ProjectModel.create({
    name: 'Brand Identity & Design System',
    description: 'Figma UI/UX design tokens and Flutter theme components',
    organizationId: orgA._id,
    createdById: adminA._id
  });

  // 5. Tasks for Org A
  const taskA1 = await TaskModel.create({
    title: 'Implement JWT Authentication in Flutter',
    description: 'Store access and refresh tokens securely in Flutter Keychain / Encrypted Shared Preferences',
    projectId: projA1._id,
    organizationId: orgA._id,
    assigneeId: memberA._id,
    createdById: adminA._id,
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.URGENT,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  });

  const taskA2 = await TaskModel.create({
    title: 'Build Task List & Filter UI',
    description: 'Display tasks grouped by status with priority chips and due date badges',
    projectId: projA1._id,
    organizationId: orgA._id,
    assigneeId: memberA._id,
    createdById: adminA._id,
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.HIGH,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
  });

  const taskA3 = await TaskModel.create({
    title: 'Setup MongoDB Multi-tenant Schema',
    description: 'Ensure all collections have indexes on organizationId for fast scoping',
    projectId: projA2._id,
    organizationId: orgA._id,
    assigneeId: adminA._id,
    createdById: adminA._id,
    status: TASK_STATUS.DONE,
    priority: TASK_PRIORITY.HIGH,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  const taskA4 = await TaskModel.create({
    title: 'Design Dark Mode Color Palette',
    description: 'Ensure accessible contrast ratios for status tags and backgrounds',
    projectId: projA3._id,
    organizationId: orgA._id,
    assigneeId: null, // Unassigned
    createdById: adminA._id,
    status: TASK_STATUS.REVIEW,
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });

  // 6. Notifications for Org A
  await NotificationModel.create({
    userId: memberA._id,
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: 'New task assigned',
    message: `You have been assigned to task: "${taskA1.title}"`,
    taskId: taskA1._id,
    readAt: null,
    createdAt: new Date()
  });

  await NotificationModel.create({
    userId: memberA._id,
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: 'New task assigned',
    message: `You have been assigned to task: "${taskA2.title}"`,
    taskId: taskA2._id,
    readAt: new Date(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  // 7. Projects for Org B
  const projB1 = await ProjectModel.create({
    name: 'Globex Logistics Portal',
    description: 'Enterprise freight tracking and fleet optimization portal',
    organizationId: orgB._id,
    createdById: adminB._id
  });

  const projB2 = await ProjectModel.create({
    name: 'Globex Telematics API',
    description: 'Real-time telemetry stream ingestion microservice',
    organizationId: orgB._id,
    createdById: adminB._id
  });

  // 8. Tasks for Org B
  const taskB1 = await TaskModel.create({
    title: 'GPS Stream Ingestion Worker',
    description: 'Parse incoming NMEA coordinates and batch insert to timeseries storage',
    projectId: projB2._id,
    organizationId: orgB._id,
    assigneeId: memberB._id,
    createdById: adminB._id,
    status: TASK_STATUS.IN_PROGRESS,
    priority: TASK_PRIORITY.URGENT,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
  });

  const taskB2 = await TaskModel.create({
    title: 'Fleet Map Dashboard Widget',
    description: 'Interactive map showing active vehicle locations with status indicators',
    projectId: projB1._id,
    organizationId: orgB._id,
    assigneeId: null,
    createdById: adminB._id,
    status: TASK_STATUS.TODO,
    priority: TASK_PRIORITY.LOW,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  });

  // 9. Notifications for Org B
  await NotificationModel.create({
    userId: memberB._id,
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: 'New task assigned',
    message: `You have been assigned to task: "${taskB1.title}"`,
    taskId: taskB1._id,
    readAt: null,
    createdAt: new Date()
  });

  console.log('✅ Seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - 2 Organizations`);
  console.log(`   - 4 Users (2 Admins, 2 Members)`);
  console.log(`   - 5 Projects`);
  console.log(`   - 6 Tasks (Assigned, Unassigned, various priorities and statuses)`);
  console.log(`   - 3 Notifications`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
};

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
