import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getBoardActivity = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check board access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const hasAccess = board.ownerId === req.userId || 
                      board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          task: {
            select: { id: true, title: true }
          }
        }
      }),
      prisma.activity.count({ where: { boardId } })
    ]);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
