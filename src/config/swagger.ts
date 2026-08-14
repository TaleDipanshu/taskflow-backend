import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'TaskFlow REST API',
    version: '1.0.0',
    description:
      'Backend REST API for the TaskFlow project management mobile application. Enforces strict multi-tenant organization-level isolation and JWT authentication.'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Root'
    },
    {
      url: '/',
      description: 'Server Root (Health check)'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT Access Token in format: Bearer <token>'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request' },
              details: { type: 'object' }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 50 },
          totalPages: { type: 'integer', example: 3 }
        }
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bc6ad804369e5d487211a1' },
          name: { type: 'string', example: 'Admin User' },
          email: { type: 'string', example: 'adminA@taskflow.test' },
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'], example: 'ADMIN' },
          organizationId: { type: 'string', example: '66bc6ad804369e5d487211a0' }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bc6ad804369e5d487211a1' },
          name: { type: 'string', example: 'Admin User' },
          email: { type: 'string', example: 'adminA@taskflow.test' },
          role: { type: 'string', example: 'ADMIN' },
          organization: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '66bc6ad804369e5d487211a0' },
              name: { type: 'string', example: 'Acme Corp' }
            }
          }
        }
      },
      ProjectItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bc6ad804369e5d487211a2' },
          name: { type: 'string', example: 'Mobile App' },
          description: { type: 'string', example: 'TaskFlow mobile application' },
          taskCount: { type: 'integer', example: 10 },
          progress: { type: 'integer', example: 80 },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'], example: 'IN_PROGRESS' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      TaskItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bc6ad804369e5d487211a3' },
          title: { type: 'string', example: 'Implement authentication' },
          description: { type: 'string', example: 'Implement JWT authentication' },
          projectId: { type: 'string', example: '66bc6ad804369e5d487211a2' },
          organizationId: { type: 'string', example: '66bc6ad804369e5d487211a0' },
          assigneeId: { type: 'string', nullable: true, example: '66bc6ad804369e5d487211a1' },
          createdById: { type: 'string', example: '66bc6ad804369e5d487211a1' },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], example: 'IN_PROGRESS' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      NotificationItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66bc6ad804369e5d487211a4' },
          userId: { type: 'string', example: '66bc6ad804369e5d487211a1' },
          type: { type: 'string', example: 'TASK_ASSIGNED' },
          title: { type: 'string', example: 'New task assigned' },
          message: { type: 'string', example: 'You have been assigned to task: "Implement authentication"' },
          taskId: { type: 'string', example: '66bc6ad804369e5d487211a3' },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'organizationId'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, example: 'Password123!' },
                  organizationId: { type: 'string', example: '66bc6ad804369e5d487211a0' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created and logged in' },
          409: { description: 'Email already in use' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'adminA@taskflow.test' },
                  password: { type: 'string', example: 'Admin123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access and refresh tokens',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Tokens rotated and returned' },
          401: { description: 'Invalid, revoked or expired refresh token' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user / revoke refresh token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Logged out successfully' }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Forgot password placeholder',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Generic confirmation message' }
        }
      }
    },
    '/users/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile with organization details' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/organizations/members': {
      get: {
        summary: 'List organization members',
        tags: ['Organizations'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of organization members' }
        }
      }
    },
    '/projects': {
      get: {
        summary: 'List projects in organization',
        tags: ['Projects'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'List of projects with task counts and progress' }
        }
      },
      post: {
        summary: 'Create project (Admin only)',
        tags: ['Projects'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Mobile App' },
                  description: { type: 'string', example: 'TaskFlow Flutter Application' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Project created' },
          403: { description: 'Forbidden (Admin role required)' }
        }
      }
    },
    '/projects/{projectId}': {
      get: {
        summary: 'Get project details with task breakdown',
        tags: ['Projects'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Project details, summary counts, and task list' },
          404: { description: 'Project not found' }
        }
      },
      patch: {
        summary: 'Update project (Admin only)',
        tags: ['Projects'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Updated Project Name' },
                  description: { type: 'string', example: 'Updated description' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Project updated' },
          403: { description: 'Forbidden' },
          404: { description: 'Project not found' }
        }
      },
      delete: {
        summary: 'Delete project and cascade delete its tasks (Admin only)',
        tags: ['Projects'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Project and tasks deleted successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Project not found' }
        }
      }
    },
    '/tasks': {
      get: {
        summary: 'List and filter tasks',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] } },
          { name: 'assigneeId', in: 'query', schema: { type: 'string' } },
          { name: 'projectId', in: 'query', schema: { type: 'string' } },
          { name: 'dueDateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dueDateTo', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of tasks' }
        }
      },
      post: {
        summary: 'Create task',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'title'],
                properties: {
                  projectId: { type: 'string', example: '66bc6ad804369e5d487211a2' },
                  title: { type: 'string', example: 'Implement authentication' },
                  description: { type: 'string', example: 'Implement JWT authentication' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
                  dueDate: { type: 'string', format: 'date-time', example: '2026-08-20T00:00:00.000Z' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Task created' },
          404: { description: 'Project not found in organization' }
        }
      }
    },
    '/tasks/{taskId}': {
      get: {
        summary: 'Get task details',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task details' },
          404: { description: 'Task not found' }
        }
      },
      patch: {
        summary: 'Update task',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                  dueDate: { type: 'string', format: 'date-time', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Task updated' },
          404: { description: 'Task not found' }
        }
      },
      delete: {
        summary: 'Delete task',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task deleted successfully' },
          404: { description: 'Task not found' }
        }
      }
    },
    '/tasks/{taskId}/status': {
      patch: {
        summary: 'Update task status',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'], example: 'DONE' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Task status updated' },
          404: { description: 'Task not found' }
        }
      }
    },
    '/tasks/{taskId}/priority': {
      patch: {
        summary: 'Update task priority',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['priority'],
                properties: {
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'URGENT' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Task priority updated' },
          404: { description: 'Task not found' }
        }
      }
    },
    '/tasks/{taskId}/assignee': {
      patch: {
        summary: 'Assign task to user in organization',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', example: '66bc6ad804369e5d487211a1' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Task assigned and notification created' },
          400: { description: 'User does not belong to same organization' },
          404: { description: 'Task not found' }
        }
      },
      delete: {
        summary: 'Unassign task',
        tags: ['Tasks'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task unassigned successfully' },
          404: { description: 'Task not found' }
        }
      }
    },
    '/notifications': {
      get: {
        summary: 'Get notifications for current user',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated notifications for user' }
        }
      }
    },
    '/notifications/{notificationId}/read': {
      patch: {
        summary: 'Mark notification as read',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Notification marked as read' },
          404: { description: 'Notification not found' }
        }
      }
    }
  }
};

export const swaggerDocsRouter = Router();
swaggerDocsRouter.use('/', swaggerUi.serve);
swaggerDocsRouter.get('/', swaggerUi.setup(swaggerSpec, { explorer: true }));
