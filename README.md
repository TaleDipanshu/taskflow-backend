# TaskFlow Backend REST API

Production-ready REST API backend for the **TaskFlow Project Management Flutter Application**. Built with Node.js, TypeScript, Express, MongoDB, and Mongoose adhering strictly to layered clean architecture and enterprise multi-tenant isolation.

---

## 📑 Quick Links & URLs

* **Base API URL**: `http://localhost:4000/api/v1`
* **Interactive Swagger UI**: `http://localhost:4000/api-docs`
* **Health Check**: `http://localhost:4000/health`

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Runtime & Language** | Node.js (v18+) & TypeScript |
| **HTTP Framework** | Express.js |
| **Database & ODM** | MongoDB & Mongoose |
| **Authentication & Tokens** | JWT (`jsonwebtoken`) & SHA-256 Hashed Refresh Tokens |
| **Password Security** | `bcryptjs` (10 salt rounds) |
| **Schema Validation** | Zod (Body, Query, Params) |
| **API Documentation** | Swagger / OpenAPI 3.0 (`swagger-ui-express`) |
| **Security Middleware** | Helmet, CORS, Express Rate Limit |
| **Testing Suite** | Jest, Supertest, MongoDB Memory Server |

---

## 🏛️ Layered Architecture

The application enforces a strict unidirectional layered architecture:

```text
HTTP Request
     │
     ▼
Routes (Route definition & Zod validation middleware)
     │
     ▼
Controllers (Thin HTTP request/response handlers)
     │
     ▼
Services (Business logic, multi-tenant enforcement, transactions)
     │
     ▼
Repositories (Encapsulated database queries & aggregations)
     │
     ▼
Mongoose Models (Schema definitions & indexes)
     │
     ▼
MongoDB Database
```

### Key Architectural Principles
* **Thin Controllers**: Controllers extract parameters, call services, and return standard JSON response envelopes.
* **Pure Services**: All business rules (e.g. cross-org assignment checks, token rotation, cascade deletion) reside in services.
* **Scoped Repositories**: Repositories encapsulate Mongoose queries and always accept `organizationId` scoping where applicable.
* **No Leaked Secrets**: `passwordHash` is excluded from user schema queries (`select: false`) and stripped in JSON transforms.

---

## 📁 Folder Structure

```text
src/
├── config/
│   ├── env.ts                     # Zod-validated environment config
│   ├── database.ts                # Mongoose connection & lifecycle
│   └── swagger.ts                 # OpenAPI 3.0 specification & Swagger UI
│
├── common/
│   ├── constants/                 # Roles, TaskStatus, TaskPriority, NotificationType
│   ├── errors/                    # AppError, NotFoundError, UnauthorizedError, etc.
│   ├── types/                     # Express Request user augmentation & common interfaces
│   └── utils/                     # JWT, bcrypt, token hash, response builders, pagination
│
├── middleware/
│   ├── auth.middleware.ts         # Bearer JWT verification & req.user injection
│   ├── role.middleware.ts         # Role-based access control (e.g. requireRole('ADMIN'))
│   ├── validation.middleware.ts   # Zod request validation (body, query, params)
│   ├── rateLimiter.middleware.ts  # Rate limiter for auth endpoints
│   └── error.middleware.ts        # Centralized global error handler
│
├── modules/
│   ├── auth/                      # Register, Login, Refresh, Logout, Forgot Password
│   ├── users/                     # GET /users/me
│   ├── organizations/             # GET /organizations/members
│   ├── projects/                  # CRUD projects with task summary & progress
│   ├── tasks/                     # CRUD tasks, status, priority, assignment
│   ├── notifications/             # GET /notifications, PATCH /:id/read
│   └── refreshTokens/             # Hashed refresh token storage & rotation
│
├── database/
│   └── seed.ts                    # Realistic multi-tenant database seed script
│
├── app.ts                         # Express app configuration & middleware
└── server.ts                      # Server listener & graceful shutdown handlers

tests/
├── auth/                          # Auth integration tests
├── users/                         # User profile integration tests
├── organizations/                 # Organization members integration tests
├── projects/                      # Project CRUD & role restriction tests
├── tasks/                         # Task CRUD, filters, assignment tests
├── notifications/                 # Notifications tests
├── isolation/                     # Organization A vs B isolation & security tests
├── helpers.ts                     # Test setup helpers
└── setup.ts                       # In-memory MongoDB lifecycle for tests
```

---

## 🗄️ Database Collections & Indexes

1. **`organizations`**
   - `_id`, `name`, `createdAt`, `updatedAt`
2. **`users`**
   - `_id`, `name`, `email` (unique, lowercase), `passwordHash`, `role` (`ADMIN` | `MEMBER`), `organizationId`, timestamps
   - Indexes: `email`, `organizationId`
3. **`projects`**
   - `_id`, `name`, `description`, `organizationId`, `createdById`, timestamps
   - Indexes: `organizationId`
4. **`tasks`**
   - `_id`, `title`, `description`, `projectId`, `organizationId`, `assigneeId`, `createdById`, `status`, `priority`, `dueDate`, timestamps
   - Indexes: `(organizationId, projectId)`, `(organizationId, status)`, `(organizationId, priority)`, `(organizationId, assigneeId)`, `(organizationId, dueDate)`
5. **`notifications`**
   - `_id`, `userId`, `type` (`TASK_ASSIGNED`), `title`, `message`, `taskId`, `readAt`, `createdAt`
   - Indexes: `(userId, createdAt)`
6. **`refreshTokens`**
   - `_id`, `userId`, `tokenHash` (SHA-256), `expiresAt`, `revokedAt`, `createdAt`
   - Indexes: `(userId, expiresAt)`, `tokenHash`

---

## 🔒 Security & Multi-Tenant Organization Isolation

### 1. Source of Truth for Tenant Scoping
The backend **never trusts an `organizationId` supplied in client request bodies or query parameters**. 
Upon JWT authentication, `req.user.organizationId` is extracted from the cryptographically signed JWT payload. Every database query, project creation, task lookup, update, and deletion is hard-scoped to `req.user.organizationId`.

### 2. Cross-Organization Assignment Prevention
When assigning a task to a user:
1. The backend verifies the task belongs to `req.user.organizationId`.
2. The backend verifies the target user belongs to `req.user.organizationId`.
3. Any attempt to assign a task to a user belonging to another organization is rejected with `400 Bad Request`.

### 3. Refresh Token Rotation & Revocation
* Raw refresh tokens are never stored in the database. Only SHA-256 hashes are persisted.
* When `/api/v1/auth/refresh` is invoked, the used refresh token is immediately marked as revoked, and a brand new token pair is issued.
* Attempting to replay an old or revoked refresh token results in `401 Unauthorized`.

### 4. Role Authorization
* `ADMIN`: Create, update, delete projects.
* `MEMBER`: View projects, view/filter tasks, create tasks, update task status/priority, assign/unassign tasks, read notifications.

---

## 🔑 Seed Test Credentials

Run `npm run seed` to populate the database with realistic multi-tenant data:

### Organization A (Acme Corporation)
* **Admin**: `admina@taskflow.test` / `Admin123!`
* **Member**: `membera@taskflow.test` / `Member123!`
* Includes: 3 Projects, 4 Tasks (various statuses & priorities), 2 Notifications.

### Organization B (Globex Dynamics)
* **Admin**: `adminb@taskflow.test` / `Admin123!`
* **Member**: `memberb@taskflow.test` / `Member123!`
* Includes: 2 Projects, 2 Tasks, 1 Notification.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
* Node.js v18+
* MongoDB instance (Local or MongoDB Atlas)

### 1. Installation
```bash
cd test-backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` settings:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_ACCESS_SECRET=change-this-access-secret-taskflow-2026-super-secret-key-32chars
JWT_REFRESH_SECRET=change-this-refresh-secret-taskflow-2026-super-secret-key-32chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=*
```

For **MongoDB Atlas**, simply set:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskflow?retryWrites=true&w=majority
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build and Start Production Server
```bash
npm run build
npm start
```

### 6. Run Automated Tests
Tests use an in-memory MongoDB server (`mongodb-memory-server`) so they run completely self-contained without needing a local database daemon running.
```bash
npm test
```

---

## 📱 Flutter (Dio) Integration Guide

### Standard API Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Paginated List Response
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for request data",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

### Flutter Dio Interceptor Example (Automatic Token Refresh)

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:4000/api/v1'));
  final FlutterSecureStorage storage = const FlutterSecureStorage();

  ApiClient() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final accessToken = await storage.read(key: 'accessToken');
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401 && error.requestOptions.path != '/auth/refresh') {
            final refreshToken = await storage.read(key: 'refreshToken');
            if (refreshToken != null) {
              try {
                final refreshResponse = await dio.post('/auth/refresh', data: {
                  'refreshToken': refreshToken,
                });
                
                final newAccessToken = refreshResponse.data['data']['accessToken'];
                final newRefreshToken = refreshResponse.data['data']['refreshToken'];

                await storage.write(key: 'accessToken', value: newAccessToken);
                await storage.write(key: 'refreshToken', value: newRefreshToken);

                // Retry original request
                error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final clonedRequest = await dio.fetch(error.requestOptions);
                return handler.resolve(clonedRequest);
              } catch (e) {
                // Refresh failed: clear storage and route to Login
                await storage.deleteAll();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }
}
```

> **Note for Android Emulator**: Use `http://10.0.2.2:4000` instead of `http://localhost:4000` to connect to the host machine.

---

## 📌 Complete API Endpoint List

### Health & Docs
* `GET /health` - System health status
* `GET /api-docs` - Interactive Swagger documentation

### Authentication (`/api/v1/auth`)
* `POST /register` - Register a new user
* `POST /login` - User login (returns access & refresh tokens)
* `POST /refresh` - Refresh access & refresh tokens (token rotation)
* `POST /logout` - Logout & revoke refresh token
* `POST /forgot-password` - Forgot password placeholder

### Users (`/api/v1/users`)
* `GET /me` - Get authenticated user profile & organization

### Organizations (`/api/v1/organizations`)
* `GET /members` - List users in authenticated user's organization (`?page=1&limit=20`)

### Projects (`/api/v1/projects`)
* `GET /` - List organization projects with progress & task count (`?page=1&limit=20`)
* `GET /:projectId` - Get project details, task summary counts, and tasks
* `POST /` - Create project (**Admin only**)
* `PATCH /:projectId` - Update project (**Admin only**)
* `DELETE /:projectId` - Delete project & cascade delete tasks (**Admin only**)

### Tasks (`/api/v1/tasks`)
* `GET /` - List tasks with filters (`status`, `priority`, `assigneeId`, `projectId`, `dueDateFrom`, `dueDateTo`, `page`, `limit`)
* `GET /:taskId` - Get task details
* `POST /` - Create task
* `PATCH /:taskId` - Update task fields
* `DELETE /:taskId` - Delete task
* `PATCH /:taskId/status` - Update status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`)
* `PATCH /:taskId/priority` - Update priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
* `PATCH /:taskId/assignee` - Assign task to organization user
* `DELETE /:taskId/assignee` - Unassign task

### Notifications (`/api/v1/notifications`)
* `GET /` - Get paginated notifications for current user
* `PATCH /:notificationId/read` - Mark notification as read
# taskflow-backend
