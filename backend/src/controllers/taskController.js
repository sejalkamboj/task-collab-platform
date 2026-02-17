import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTasks = async (req, res, next) => {
  try {
    const { page, limit, search } = req.validatedData;
    const skip = (page - 1) * limit;

    const where = {
      list: {
        board: {
          OR: [
            { ownerId: req.userId },
            { members: { some: { userId: req.userId } } }
          ]
        }
      },
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignee: {
            select: { id: true, name: true, avatar: true }
          },
          createdBy: {
            select: { id: true, name: true, avatar: true }
          },
          list: {
            select: { id: true, name: true, boardId: true }
          },
          labels: {
            include: { label: true }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        },
        list: {
          include: {
            board: {
              include: { members: true }
            }
          }
        },
        labels: {
          include: { label: true }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const hasAccess = task.list.board.ownerId === req.userId || 
                      task.list.board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { listId, title, description, dueDate, priority, assigneeId } = req.validatedData;

    // Check list access
    const list = await prisma.list.findUnique({
      where: { id: listId },
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

    // If assignee specified, verify they have board access
    if (assigneeId) {
      const assigneeHasAccess = list.board.ownerId === assigneeId || 
                                list.board.members.some(m => m.userId === assigneeId);
      
      if (!assigneeHasAccess) {
        return res.status(400).json({ error: 'Assignee must be a board member' });
      }
    }

    // Get the highest position
    const maxPosition = await prisma.task.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const task = await prisma.task.create({
      data: {
        listId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        assigneeId,
        createdById: req.userId,
        position: (maxPosition?.position ?? -1) + 1
      },
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
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: list.boardId,
        userId: req.userId,
        taskId: task.id,
        action: 'task_created',
        metadata: { 
          taskTitle: task.title,
          listName: list.name
        }
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.validatedData;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: { include: { members: true } }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const hasAccess = task.list.board.ownerId === req.userId || 
                      task.list.board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If changing assignee, verify they have board access
    if (updates.assigneeId !== undefined && updates.assigneeId !== null) {
      const assigneeHasAccess = task.list.board.ownerId === updates.assigneeId || 
                                task.list.board.members.some(m => m.userId === updates.assigneeId);
      
      if (!assigneeHasAccess) {
        return res.status(400).json({ error: 'Assignee must be a board member' });
      }
    }

    // Convert dueDate if provided
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updates,
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
    });

    // Log activity
    const actionsMap = {
      assigneeId: 'task_assigned',
      title: 'task_updated',
      description: 'task_updated',
      dueDate: 'task_updated',
      priority: 'task_updated'
    };

    const action = Object.keys(updates).map(key => actionsMap[key] || 'task_updated')[0];

    await prisma.activity.create({
      data: {
        boardId: task.list.boardId,
        userId: req.userId,
        taskId: task.id,
        action,
        metadata: { 
          taskTitle: updatedTask.title,
          updates 
        }
      }
    });

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: { include: { members: true } }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const member = task.list.board.members.find(m => m.userId === req.userId);
    const canDelete = task.list.board.ownerId === req.userId || 
                     member?.role === 'admin' ||
                     task.createdById === req.userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.task.delete({
      where: { id }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: task.list.boardId,
        userId: req.userId,
        action: 'task_deleted',
        metadata: { taskTitle: task.title }
      }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const moveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { listId, position } = req.validatedData;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: { include: { members: true } }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const hasAccess = task.list.board.ownerId === req.userId || 
                      task.list.board.members.some(m => m.userId === req.userId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify target list belongs to same board
    const targetList = await prisma.list.findUnique({
      where: { id: listId }
    });

    if (!targetList || targetList.boardId !== task.list.boardId) {
      return res.status(400).json({ error: 'Invalid target list' });
    }

    const oldListId = task.listId;
    const oldPosition = task.position;

    // Moving within same list
    if (listId === oldListId) {
      if (position !== oldPosition) {
        const tasks = await prisma.task.findMany({
          where: { listId },
          orderBy: { position: 'asc' }
        });

        if (position > oldPosition) {
          await prisma.$transaction(
            tasks
              .filter(t => t.position > oldPosition && t.position <= position)
              .map(t => 
                prisma.task.update({
                  where: { id: t.id },
                  data: { position: t.position - 1 }
                })
              )
          );
        } else {
          await prisma.$transaction(
            tasks
              .filter(t => t.position >= position && t.position < oldPosition)
              .map(t => 
                prisma.task.update({
                  where: { id: t.id },
                  data: { position: t.position + 1 }
                })
              )
          );
        }
      }
    } else {
      // Moving to different list
      // Adjust positions in old list
      const oldListTasks = await prisma.task.findMany({
        where: { listId: oldListId, position: { gt: oldPosition } }
      });

      await prisma.$transaction(
        oldListTasks.map(t => 
          prisma.task.update({
            where: { id: t.id },
            data: { position: t.position - 1 }
          })
        )
      );

      // Adjust positions in new list
      const newListTasks = await prisma.task.findMany({
        where: { listId, position: { gte: position } }
      });

      await prisma.$transaction(
        newListTasks.map(t => 
          prisma.task.update({
            where: { id: t.id },
            data: { position: t.position + 1 }
          })
        )
      );
    }

    // Update task
    const movedTask = await prisma.task.update({
      where: { id },
      data: { listId, position },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        },
        list: {
          select: { id: true, name: true }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: task.list.boardId,
        userId: req.userId,
        taskId: task.id,
        action: 'task_moved',
        metadata: { 
          taskTitle: task.title,
          fromList: task.list.name,
          toList: targetList.name
        }
      }
    });

    res.json({ task: movedTask });
  } catch (error) {
    next(error);
  }
};
