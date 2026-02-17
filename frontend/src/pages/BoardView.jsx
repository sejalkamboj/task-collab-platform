import React, { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { boardsApi, listsApi, tasksApi } from '../services/api.js'
import { useSocket } from '../contexts/SocketContext.jsx'
import { format, isPast, parseISO } from 'date-fns'
import { MemberManager } from '../components/MemberManager.jsx'

export function BoardView({ board: initialBoard, onBack, toast }) {
  const [board,        setBoard]        = useState(initialBoard)
  const [loading,      setLoading]      = useState(true)
  const [showAddTask,  setShowAddTask]  = useState(null)
  const [showAddList,  setShowAddList]  = useState(false)
  const [showTaskModal,setShowTaskModal]= useState(null)
  const [showMembers,  setShowMembers]  = useState(false)
  const [isDragging,   setIsDragging]   = useState(false)
  const socket = useSocket()

  const loadBoard = useCallback(async () => {
    try {
      const data = await boardsApi.get(initialBoard.id)
      setBoard(data.board)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [initialBoard.id])

  useEffect(() => { loadBoard() }, [loadBoard])

  // ── Socket real-time ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return
    socket.emit('join:board', initialBoard.id)
    const refresh = () => { if (!isDragging) loadBoard() }
    socket.on('task:created', refresh)
    socket.on('task:updated', refresh)
    socket.on('task:moved',   refresh)
    socket.on('task:deleted', refresh)
    socket.on('list:created', refresh)
    socket.on('list:updated', refresh)
    socket.on('list:deleted', refresh)
    return () => {
      socket.emit('leave:board', initialBoard.id)
      ;['task:created','task:updated','task:moved','task:deleted',
        'list:created','list:updated','list:deleted'].forEach(e => socket.off(e, refresh))
    }
  }, [socket, initialBoard.id, loadBoard, isDragging])

  // ── Drag & Drop ───────────────────────────────────────────
  const handleDragStart = () => setIsDragging(true)

  const handleDragEnd = async (result) => {
    setIsDragging(false)
    const { draggableId, source, destination } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return

    // Optimistic UI update — move card instantly in state
    const newLists = board.lists.map(l => ({ ...l, tasks: [...l.tasks] }))
    const srcList  = newLists.find(l => l.id === source.droppableId)
    const dstList  = newLists.find(l => l.id === destination.droppableId)
    const [movedTask] = srcList.tasks.splice(source.index, 1)
    dstList.tasks.splice(destination.index, 0, movedTask)
    setBoard(prev => ({ ...prev, lists: newLists }))

    try {
      await tasksApi.move(draggableId, {
        listId:   destination.droppableId,
        position: destination.index,
      })
      socket?.emit('task:move', {
        boardId:    board.id,
        taskId:     draggableId,
        fromListId: source.droppableId,
        toListId:   destination.droppableId,
        position:   destination.index,
      })
    } catch (e) {
      toast.error('Move failed — refreshing')
      loadBoard()
    }
  }

  // ── Add Task ──────────────────────────────────────────────
  const handleAddTask = async (listId, title) => {
    if (!title.trim()) return
    try {
      await tasksApi.create({ listId, title })
      socket?.emit('task:create', { boardId: board.id })
      toast.success('Task added!')
      loadBoard()
    } catch (e) { toast.error(e.message) }
  }

  // ── Add List ──────────────────────────────────────────────
  const handleAddList = async (name) => {
    if (!name.trim()) return
    try {
      await listsApi.create({ boardId: board.id, name })
      socket?.emit('list:create', { boardId: board.id })
      toast.success('List added!')
      setShowAddList(false)
      loadBoard()
    } catch (e) { toast.error(e.message) }
  }

  // ── Delete List ───────────────────────────────────────────
  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list and all its tasks?')) return
    try {
      await listsApi.delete(listId)
      socket?.emit('list:delete', { boardId: board.id, listId })
      toast.success('List deleted')
      loadBoard()
    } catch (e) { toast.error(e.message) }
  }

  // ── Delete Task ───────────────────────────────────────────
  const handleDeleteTask = async (taskId) => {
    try {
      await tasksApi.delete(taskId)
      socket?.emit('task:delete', { boardId: board.id, taskId })
      toast.success('Task deleted')
      setShowTaskModal(null)
      loadBoard()
    } catch (e) { toast.error(e.message) }
  }

  // ── Update Task ───────────────────────────────────────────
  const handleUpdateTask = async (taskId, updates) => {
    try {
      await tasksApi.update(taskId, updates)
      socket?.emit('task:update', { boardId: board.id, taskId })
      toast.success('Task updated!')
      setShowTaskModal(null)
      loadBoard()
    } catch (e) { toast.error(e.message) }
  }

  if (loading) return <div className="loading">Loading board…</div>

  return (
    <div className="board-view">
      {/* Top bar */}
      <div className="board-topbar">
        <div className="board-topbar-left">
          <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
          <span className="board-title">{board.name}</span>
          {board.description && (
            <span style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>
              {board.description}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="board-members">
            {board.members?.map(m => (
              <img
                key={m.id}
                className="board-member-avatar"
                src={m.user.avatar}
                alt={m.user.name}
                title={m.user.name}
              />
            ))}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMembers(true)}
            style={{ whiteSpace: 'nowrap' }}
          >
            👥 Members ({board.members?.length ?? 0})
          </button>
        </div>
      </div>

      {/* Lists with Drag & Drop */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="lists-scroll">
          {board.lists?.map(list => (
            <List
              key={list.id}
              list={list}
              onAddTask={(title) => handleAddTask(list.id, title)}
              onDeleteList={() => handleDeleteList(list.id)}
              onOpenTask={setShowTaskModal}
              showAdd={showAddTask === list.id}
              setShowAdd={(v) => setShowAddTask(v ? list.id : null)}
            />
          ))}

          {/* Add list */}
          {showAddList ? (
            <AddListForm onAdd={handleAddList} onCancel={() => setShowAddList(false)} />
          ) : (
            <button className="add-list-btn" onClick={() => setShowAddList(true)}>
              ＋ Add list
            </button>
          )}
        </div>
      </DragDropContext>

      {/* Task detail modal */}
      {showTaskModal && (
        <TaskModal
          task={showTaskModal}
          members={board.members}
          onClose={() => setShowTaskModal(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Member manager modal */}
      {showMembers && (
        <MemberManager
          board={board}
          onClose={() => setShowMembers(false)}
          onUpdated={() => { loadBoard(); setShowMembers(false) }}
          toast={toast}
        />
      )}
    </div>
  )
}

/* ── List ─────────────────────────────────────────────────── */
function List({ list, onAddTask, onDeleteList, onOpenTask, showAdd, setShowAdd }) {
  const [taskTitle, setTaskTitle] = useState('')

  const submit = () => {
    if (!taskTitle.trim()) return
    onAddTask(taskTitle)
    setTaskTitle('')
    setShowAdd(false)
  }

  return (
    <div className="list">
      <div className="list-header">
        <span className="list-name">{list.name}</span>
        <span className="list-count">{list.tasks?.length ?? 0}</span>
        <button className="btn-icon" onClick={onDeleteList} title="Delete list">✕</button>
      </div>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-scroll ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            style={{ minHeight: 8 }}
          >
            {list.tasks?.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(prov, snap) => (
                  <TaskCard
                    task={task}
                    provided={prov}
                    isDragging={snap.isDragging}
                    onClick={() => onOpenTask(task)}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {showAdd ? (
        <div className="add-task-form">
          <input
            autoFocus
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') setShowAdd(false)
            }}
            placeholder="Task title…"
          />
          <div className="form-actions">
            <button className="btn btn-primary btn-sm" onClick={submit}>Add</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-add-task" onClick={() => setShowAdd(true)}>＋ Add task</button>
      )}
    </div>
  )
}

/* ── Task Card ────────────────────────────────────────────── */
function TaskCard({ task, provided, isDragging, onClick }) {
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate))

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="task-card"
      onClick={onClick}
      style={{
        ...provided.draggableProps.style,
        opacity:   isDragging ? 0.9 : 1,
        boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.6)' : undefined,
        transform: provided.draggableProps.style?.transform,
        cursor:    isDragging ? 'grabbing' : 'grab',
      }}
    >
      <div className="task-card-title">{task.title}</div>
      {task.description && (
        <div className="task-card-desc">{task.description}</div>
      )}
      <div className="task-card-footer">
        {task.assignee ? (
          <div className="task-assignee">
            <img src={task.assignee.avatar} alt={task.assignee.name} />
            <span>{task.assignee.name}</span>
          </div>
        ) : <span />}
        <div style={{ display: 'flex', gap: '.375rem', alignItems: 'center' }}>
          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              {format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.priority && (
            <span className={`priority priority-${task.priority}`}>{task.priority}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Add List Form ────────────────────────────────────────── */
function AddListForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  return (
    <div className="add-list-form" style={{ minWidth: 288 }}>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onAdd(name); onCancel() }
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="List name…"
      />
      <div className="form-actions">
        <button className="btn btn-primary btn-sm" onClick={() => { onAdd(name); onCancel() }}>
          Add List
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ── Task Detail Modal ────────────────────────────────────── */
function TaskModal({ task, members, onClose, onUpdate, onDelete }) {
  const [title,       setTitle]       = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority,    setPriority]    = useState(task.priority    || '')
  const [dueDate,     setDueDate]     = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ''
  )
  const [assigneeId,  setAssigneeId]  = useState(task.assigneeId  || '')
  const [saving,      setSaving]      = useState(false)

  const save = async () => {
    setSaving(true)
    await onUpdate(task.id, {
      title,
      description: description || null,
      priority:    priority    || null,
      dueDate:     dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId:  assigneeId  || null,
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details…"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Assignee</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {members?.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>
              Delete Task
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
