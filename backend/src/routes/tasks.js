import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask
} from '../controllers/taskController.js';
import { 
  validate, 
  createTaskSchema, 
  updateTaskSchema,
  moveTaskSchema,
  paginationSchema
} from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', validate(paginationSchema), getTasks);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:id', getTask);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/move', validate(moveTaskSchema), moveTask);

export default router;
