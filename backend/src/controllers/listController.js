import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createList = async (req, res, next) => {
  try {
    const { boardId, name } = req.validatedData;

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

    // Get the highest position
    const maxPosition = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const list = await prisma.list.create({
      data: {
        boardId,
        name,
        position: (maxPosition?.position ?? -1) + 1
      },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId,
        action: 'list_created',
        metadata: { listName: list.name }
      }
    });

    res.status(201).json({ list });
  } catch (error) {
    next(error);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.validatedData;

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        board: { include: { members: true } }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const hasAccess = list.board.ownerId === req.userId || 
                      list.board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedList = await prisma.list.update({
      where: { id },
      data: updates,
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: list.boardId,
        userId: req.userId,
        action: 'list_updated',
        metadata: { 
          listName: updatedList.name,
          updates 
        }
      }
    });

    res.json({ list: updatedList });
  } catch (error) {
    next(error);
  }
};

export const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        board: { include: { members: true } }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const member = list.board.members.find(m => m.userId === req.userId);
    const canDelete = list.board.ownerId === req.userId || member?.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.list.delete({
      where: { id }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: list.boardId,
        userId: req.userId,
        action: 'list_deleted',
        metadata: { listName: list.name }
      }
    });

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateListPosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.validatedData;

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        board: { include: { members: true } }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const hasAccess = list.board.ownerId === req.userId || 
                      list.board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Reorder lists
    const lists = await prisma.list.findMany({
      where: { boardId: list.boardId },
      orderBy: { position: 'asc' }
    });

    const oldPosition = list.position;
    
    if (position !== oldPosition) {
      // Update positions
      if (position > oldPosition) {
        // Moving down
        await prisma.$transaction(
          lists
            .filter(l => l.position > oldPosition && l.position <= position)
            .map(l => 
              prisma.list.update({
                where: { id: l.id },
                data: { position: l.position - 1 }
              })
            )
        );
      } else {
        // Moving up
        await prisma.$transaction(
          lists
            .filter(l => l.position >= position && l.position < oldPosition)
            .map(l => 
              prisma.list.update({
                where: { id: l.id },
                data: { position: l.position + 1 }
              })
            )
        );
      }

      await prisma.list.update({
        where: { id },
        data: { position }
      });
    }

    res.json({ message: 'List position updated' });
  } catch (error) {
    next(error);
  }
};
