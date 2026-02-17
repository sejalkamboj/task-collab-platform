import { query, getClient } from '../db/pool';
import { CreateTaskDTO, UpdateTaskDTO } from '../types';

export class TaskService {
  async createTask(listId: string, userId: string, dto: CreateTaskDTO) {
    // Verify access to board through list
    const accessCheck = await query(
      `SELECT l.board_id FROM lists l
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE l.id = $1 AND bm.user_id = $2`,
      [listId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = accessCheck.rows[0].board_id;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO tasks (list_id, title, description, position, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          listId,
          dto.title,
          dto.description || null,
          dto.position,
          dto.priority || 'medium',
          dto.due_date || null,
        ]
      );

      const task = result.rows[0];

      await client.query(
        `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'task_created', 'task', $3, $4)`,
        [boardId, userId, task.id, JSON.stringify({ title: task.title, list_id: listId })]
      );

      await client.query('COMMIT');
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTask(taskId: string, userId: string, dto: UpdateTaskDTO) {
    // Get task and verify access
    const taskCheck = await query(
      `SELECT t.*, l.board_id FROM tasks t
       JOIN lists l ON t.list_id = l.id
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE t.id = $1 AND bm.user_id = $2`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const currentTask = taskCheck.rows[0];
    const boardId = currentTask.board_id;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (dto.title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(dto.title);
      }

      if (dto.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(dto.description);
      }

      if (dto.position !== undefined) {
        updates.push(`position = $${paramCount++}`);
        values.push(dto.position);
      }

      if (dto.list_id !== undefined) {
        updates.push(`list_id = $${paramCount++}`);
        values.push(dto.list_id);
      }

      if (dto.priority !== undefined) {
        updates.push(`priority = $${paramCount++}`);
        values.push(dto.priority);
      }

      if (dto.due_date !== undefined) {
        updates.push(`due_date = $${paramCount++}`);
        values.push(dto.due_date);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(taskId);

      const result = await client.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const actionType = dto.list_id && dto.list_id !== currentTask.list_id
        ? 'task_moved'
        : 'task_updated';

      await client.query(
        `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
         VALUES ($1, $2, $3, 'task', $4, $5)`,
        [
          boardId,
          userId,
          actionType,
          taskId,
          JSON.stringify({
            ...dto,
            previous_list_id: currentTask.list_id,
          }),
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTask(taskId: string, userId: string) {
    const taskCheck = await query(
      `SELECT l.board_id FROM tasks t
       JOIN lists l ON t.list_id = l.id
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE t.id = $1 AND bm.user_id = $2`,
      [taskId, userId]
    );

    if (taskCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = taskCheck.rows[0].board_id;

    await query('DELETE FROM tasks WHERE id = $1', [taskId]);

    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id)
       VALUES ($1, $2, 'task_deleted', 'task', $3)`,
      [boardId, userId, taskId]
    );

    return { success: true };
  }

  async assignUser(taskId: string, userId: string, assigneeId: string) {
    // Verify access
    const accessCheck = await query(
      `SELECT l.board_id FROM tasks t
       JOIN lists l ON t.list_id = l.id
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE t.id = $1 AND bm.user_id = $2`,
      [taskId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = accessCheck.rows[0].board_id;

    // Verify assignee is board member
    const memberCheck = await query(
      'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, assigneeId]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error('Assignee is not a board member');
    }

    await query(
      `INSERT INTO task_assignees (task_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (task_id, user_id) DO NOTHING`,
      [taskId, assigneeId]
    );

    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, 'task_assigned', 'task', $3, $4)`,
      [boardId, userId, taskId, JSON.stringify({ assignee_id: assigneeId })]
    );

    return { success: true };
  }

  async unassignUser(taskId: string, userId: string, assigneeId: string) {
    const accessCheck = await query(
      `SELECT l.board_id FROM tasks t
       JOIN lists l ON t.list_id = l.id
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE t.id = $1 AND bm.user_id = $2`,
      [taskId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = accessCheck.rows[0].board_id;

    await query(
      'DELETE FROM task_assignees WHERE task_id = $1 AND user_id = $2',
      [taskId, assigneeId]
    );

    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, 'task_unassigned', 'task', $3, $4)`,
      [boardId, userId, taskId, JSON.stringify({ assignee_id: assigneeId })]
    );

    return { success: true };
  }

  async searchTasks(boardId: string, userId: string, searchTerm: string) {
    const accessCheck = await query(
      'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const result = await query(
      `SELECT t.*, l.title as list_title,
       json_agg(json_build_object('id', u.id, 'full_name', u.full_name)) 
       FILTER (WHERE u.id IS NOT NULL) as assignees
       FROM tasks t
       JOIN lists l ON t.list_id = l.id
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE l.board_id = $1 
       AND (t.title ILIKE $2 OR t.description ILIKE $2)
       GROUP BY t.id, l.title
       ORDER BY t.updated_at DESC
       LIMIT 50`,
      [boardId, `%${searchTerm}%`]
    );

    return result.rows;
  }
}
