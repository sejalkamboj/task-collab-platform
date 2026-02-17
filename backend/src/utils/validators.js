import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Board schemas
export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100),
  description: z.string().optional(),
  background: z.string().optional()
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  background: z.string().optional()
});

// List schemas
export const createListSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1, 'List name is required').max(100)
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().nonnegative().optional()
});

// Task schemas
export const createTaskSchema = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigneeId: z.string().uuid().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable()
});

export const moveTaskSchema = z.object({
  listId: z.string().uuid(),
  position: z.number().int().nonnegative()
});

// Member schemas
export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['member', 'admin']).optional()
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional()
});

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const data = req.method === 'GET' ? req.query : req.body;
      req.validatedData = schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  };
};
