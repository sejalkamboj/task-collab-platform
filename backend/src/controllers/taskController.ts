import { Response } from 'express';
import { ListService } from '../services/listService';
import { TaskService } from '../services/taskService';
import { ActivityService } from '../services/activityService';
import { AuthRequest } from '../middleware/auth';

const listService = new ListService();
const taskService = new TaskService();
const activityService = new ActivityService();

// List Controllers
export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const list = await listService.createList(
      req.params.boardId,
      req.user!.userId,
      req.body
    );
    res.status(201).json(list);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateList = async (req: AuthRequest, res: Response) => {
  try {
    const list = await listService.updateList(
      req.params.listId,
      req.user!.userId,
      req.body
    );
    res.json(list);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
  try {
    await listService.deleteList(req.params.listId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Task Controllers
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.createTask(
      req.params.listId,
      req.user!.userId,
      req.body
    );
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.user!.userId,
      req.body
    );
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    await taskService.deleteTask(req.params.taskId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const assignUser = async (req: AuthRequest, res: Response) => {
  try {
    await taskService.assignUser(
      req.params.taskId,
      req.user!.userId,
      req.body.assigneeId
    );
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const unassignUser = async (req: AuthRequest, res: Response) => {
  try {
    await taskService.unassignUser(
      req.params.taskId,
      req.user!.userId,
      req.body.assigneeId
    );
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const searchTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await taskService.searchTasks(
      req.params.boardId,
      req.user!.userId,
      req.query.q as string
    );
    res.json(tasks);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Activity Controller
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await activityService.getBoardActivities(
      req.params.boardId,
      req.user!.userId,
      page,
      limit
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
