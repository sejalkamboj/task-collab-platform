import { query } from '../db/pool';

export class ActivityService {
  async getBoardActivities(
    boardId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    // Verify access
    const accessCheck = await query(
      'SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2',
      [boardId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied');
    }

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT a.*, u.full_name as user_name, u.email as user_email
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.board_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [boardId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM activities WHERE board_id = $1',
      [boardId]
    );

    return {
      activities: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    };
  }
}
