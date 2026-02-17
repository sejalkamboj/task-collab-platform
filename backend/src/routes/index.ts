import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as boardController from '../controllers/boardController';
import * as taskController from '../controllers/taskController';

const router = Router();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authMiddleware, authController.getProfile);

// Board routes
router.post('/boards', authMiddleware, boardController.createBoard);
router.get('/boards', authMiddleware, boardController.getUserBoards);
router.get('/boards/:boardId', authMiddleware, boardController.getBoardDetails);
router.put('/boards/:boardId', authMiddleware, boardController.updateBoard);
router.delete('/boards/:boardId', authMiddleware, boardController.deleteBoard);
router.post('/boards/:boardId/members', authMiddleware, boardController.addMember);

// List routes
router.post('/boards/:boardId/lists', authMiddleware, taskController.createList);
router.put('/lists/:listId', authMiddleware, taskController.updateList);
router.delete('/lists/:listId', authMiddleware, taskController.deleteList);

// Task routes
router.post('/lists/:listId/tasks', authMiddleware, taskController.createTask);
router.put('/tasks/:taskId', authMiddleware, taskController.updateTask);
router.delete('/tasks/:taskId', authMiddleware, taskController.deleteTask);
router.post('/tasks/:taskId/assign', authMiddleware, taskController.assignUser);
router.delete('/tasks/:taskId/unassign', authMiddleware, taskController.unassignUser);
router.get('/boards/:boardId/tasks/search', authMiddleware, taskController.searchTasks);

// Activity routes
router.get('/boards/:boardId/activities', authMiddleware, taskController.getActivities);

export default router;
