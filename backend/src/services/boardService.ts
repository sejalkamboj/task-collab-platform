import { query, getClient } from '../db/pool';
import { CreateBoardDTO, UpdateBoardDTO, BoardWithDetails } from '../types';

export class BoardService {
  async createBoard(userId: string, dto: CreateBoardDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create board
      const boardResult = await client.query(
        `INSERT INTO boards (title, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [dto.title, dto.description || null, userId]
      );

      const board = boardResult.rows[0];

      // Add owner as member
      await client.query(
        `INSERT INTO board_members (board_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [board.id, userId]
      );

      // Log activity
      await client.query(
        `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'board_created', 'board', $3, $4)`,
        [board.id, userId, board.id, JSON.stringify({ title: board.title })]
      );

      await client.query('COMMIT');
      return board;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserBoards(userId: string) {
    const result = await query(
      `SELECT b.*, u.full_name as owner_name, u.email as owner_email
       FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       JOIN users u ON b.owner_id = u.id
       WHERE bm.user_id = $1
       ORDER BY b.updated_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getBoardDetails(boardId: string, userId: string): Promise<BoardWithDetails> {
    // Check access
    const accessCheck = await query(
      'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    // Get board
    const boardResult = await query(
      `SELECT b.*, u.id as owner_id, u.full_name as owner_name, u.email as owner_email
       FROM boards b
       JOIN users u ON b.owner_id = u.id
       WHERE b.id = $1`,
      [boardId]
    );

    if (boardResult.rows.length === 0) {
      throw new Error('Board not found');
    }

    const boardData = boardResult.rows[0];

    // Get lists with tasks
    const listsResult = await query(
      `SELECT l.* FROM lists l
       WHERE l.board_id = $1
       ORDER BY l.position ASC`,
      [boardId]
    );

    const tasksResult = await query(
      `SELECT t.*, 
       json_agg(json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email, 'avatar_url', u.avatar_url)) 
       FILTER (WHERE u.id IS NOT NULL) as assignees
       FROM tasks t
       LEFT JOIN task_assignees ta ON t.id = ta.task_id
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE t.list_id = ANY($1)
       GROUP BY t.id
       ORDER BY t.position ASC`,
      [listsResult.rows.map(l => l.id)]
    );

    // Get members
    const membersResult = await query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, bm.role
       FROM board_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.board_id = $1`,
      [boardId]
    );

    // Organize tasks by list
    const lists = listsResult.rows.map(list => ({
      ...list,
      tasks: tasksResult.rows.filter(task => task.list_id === list.id),
    }));

    return {
      id: boardData.id,
      title: boardData.title,
      description: boardData.description,
      owner_id: boardData.owner_id,
      created_at: boardData.created_at,
      updated_at: boardData.updated_at,
      owner: {
        id: boardData.owner_id,
        full_name: boardData.owner_name,
        email: boardData.owner_email,
      },
      lists,
      members: membersResult.rows,
    } as BoardWithDetails;
  }

  async updateBoard(boardId: string, userId: string, dto: UpdateBoardDTO) {
    // Check if user is owner or admin
    const roleCheck = await query(
      `SELECT role FROM board_members 
       WHERE board_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
      [boardId, userId]
    );

    if (roleCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

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

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(boardId);

    const result = await query(
      `UPDATE boards SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    // Log activity
    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, 'board_updated', 'board', $3, $4)`,
      [boardId, userId, boardId, JSON.stringify(dto)]
    );

    return result.rows[0];
  }

  async deleteBoard(boardId: string, userId: string) {
    const roleCheck = await query(
      `SELECT role FROM board_members 
       WHERE board_id = $1 AND user_id = $2 AND role = 'owner'`,
      [boardId, userId]
    );

    if (roleCheck.rows.length === 0) {
      throw new Error('Only owners can delete boards');
    }

    await query('DELETE FROM boards WHERE id = $1', [boardId]);
    return { success: true };
  }

  async addMember(boardId: string, userId: string, memberEmail: string) {
    const roleCheck = await query(
      `SELECT role FROM board_members 
       WHERE board_id = $1 AND user_id = $2 AND role IN ('owner', 'admin')`,
      [boardId, userId]
    );

    if (roleCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [memberEmail]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const newMemberId = userResult.rows[0].id;

    await query(
      `INSERT INTO board_members (board_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (board_id, user_id) DO NOTHING`,
      [boardId, newMemberId]
    );

    return { success: true };
  }
}
