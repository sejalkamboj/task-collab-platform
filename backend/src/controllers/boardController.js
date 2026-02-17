import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getBoards = async (req, res, next) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          { 
            members: {
              some: { userId: req.userId }
            }
          }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { lists: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ boards });
  } catch (error) {
    next(error);
  }
};

export const getBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true }
            }
          }
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, avatar: true }
                },
                createdBy: {
                  select: { id: true, name: true, avatar: true }
                },
                labels: {
                  include: { label: true }
                }
              }
            }
          }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check access
    const hasAccess = board.ownerId === req.userId || 
                      board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ board });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req, res, next) => {
  try {
    const { name, description, background } = req.validatedData;

    const board = await prisma.board.create({
      data: {
        name,
        description,
        background: background || '#6366f1',
        ownerId: req.userId,
        members: {
          create: {
            userId: req.userId,
            role: 'owner'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: board.id,
        userId: req.userId,
        action: 'board_created',
        metadata: { boardName: board.name }
      }
    });

    res.status(201).json({ board });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.validatedData;

    // Check ownership or admin access
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        members: true
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const member = board.members.find(m => m.userId === req.userId);
    const canEdit = board.ownerId === req.userId || member?.role === 'admin';

    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updatedBoard = await prisma.board.update({
      where: { id },
      data: updates,
      include: {
        owner: {
          select: { id: true, name: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: id,
        userId: req.userId,
        action: 'board_updated',
        metadata: { updates }
      }
    });

    res.json({ board: updatedBoard });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const board = await prisma.board.findUnique({
      where: { id }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can delete board' });
    }

    await prisma.board.delete({
      where: { id }
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId, role } = req.validatedData;

    // Check if requester is owner or admin
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const requesterMember = board.members.find(m => m.userId === req.userId);
    const canAddMembers = board.ownerId === req.userId || requesterMember?.role === 'admin';

    if (!canAddMembers) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const member = await prisma.boardMember.create({
      data: {
        boardId,
        userId,
        role: role || 'member'
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, email: true }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId,
        action: 'member_added',
        metadata: { 
          addedUserId: userId,
          addedUserName: userExists.name 
        }
      }
    });

    res.status(201).json({ member });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User is already a member' });
    }
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { boardId, userId } = req.params;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Owner cannot be removed
    if (userId === board.ownerId) {
      return res.status(400).json({ error: 'Cannot remove board owner' });
    }

    // Check permissions
    const requesterMember = board.members.find(m => m.userId === req.userId);
    const canRemove = board.ownerId === req.userId || 
                     requesterMember?.role === 'admin' ||
                     userId === req.userId; // Can remove self

    if (!canRemove) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.boardMember.delete({
      where: {
        boardId_userId: { boardId, userId }
      }
    });

    // Log activity
    const removedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId,
        action: 'member_removed',
        metadata: { 
          removedUserId: userId,
          removedUserName: removedUser.name 
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};
