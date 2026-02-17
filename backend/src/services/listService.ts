import { query, getClient } from '../db/pool';
import { CreateListDTO, UpdateListDTO } from '../types';

export class ListService {
  async createList(boardId: string, userId: string, dto: CreateListDTO) {
    // Verify access
    const accessCheck = await query(
      'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO lists (board_id, title, position)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [boardId, dto.title, dto.position]
      );

      await client.query(
        `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'list_created', 'list', $3, $4)`,
        [boardId, userId, result.rows[0].id, JSON.stringify({ title: dto.title })]
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

  async updateList(listId: string, userId: string, dto: UpdateListDTO) {
    // Get board_id and verify access
    const listCheck = await query(
      `SELECT l.board_id FROM lists l
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE l.id = $1 AND bm.user_id = $2`,
      [listId, userId]
    );

    if (listCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = listCheck.rows[0].board_id;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(dto.title);
    }

    if (dto.position !== undefined) {
      updates.push(`position = $${paramCount++}`);
      values.push(dto.position);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(listId);

    const result = await query(
      `UPDATE lists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id, details)
       VALUES ($1, $2, 'list_updated', 'list', $3, $4)`,
      [boardId, userId, listId, JSON.stringify(dto)]
    );

    return result.rows[0];
  }

  async deleteList(listId: string, userId: string) {
    const listCheck = await query(
      `SELECT l.board_id FROM lists l
       JOIN board_members bm ON l.board_id = bm.board_id
       WHERE l.id = $1 AND bm.user_id = $2`,
      [listId, userId]
    );

    if (listCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const boardId = listCheck.rows[0].board_id;

    await query('DELETE FROM lists WHERE id = $1', [listId]);

    await query(
      `INSERT INTO activities (board_id, user_id, action_type, entity_type, entity_id)
       VALUES ($1, $2, 'list_deleted', 'list', $3)`,
      [boardId, userId, listId]
    );

    return { success: true };
  }
}
