import React, { useState, useEffect } from 'react'
import { boardsApi } from '../services/api.js'

const BG_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f59e0b','#10b981','#06b6d4','#3b82f6',
]

export function Dashboard({ onSelectBoard, toast }) {
  const [boards,  setBoards]  = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    boardsApi.list()
      .then(d => setBoards(d.boards))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading">Loading boards…</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Boards</h1>
        <p>Select a board to start collaborating in real-time</p>
      </div>

      <div className="boards-grid">
        {/* Create new board card */}
        <div className="board-card create-board-card" onClick={() => setShowModal(true)}>
          <div className="create-icon">＋</div>
          <h3>Create New Board</h3>
        </div>

        {boards.map(b => (
          <div
            key={b.id}
            className="board-card"
            style={{ background: `linear-gradient(135deg, ${b.background}cc, ${b.background}88)` }}
            onClick={() => onSelectBoard(b)}
          >
            <h3>{b.name}</h3>
            {b.description && <p className="board-card-desc">{b.description}</p>}
            <div className="board-card-meta">
              <span>{b._count?.lists ?? 0} lists</span>
              <span>{b.members?.length ?? 0} members</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreate={() => { load(); setShowModal(false) }}
          toast={toast}
        />
      )}
    </div>
  )
}

function CreateBoardModal({ onClose, onCreate, toast }) {
  const [name,       setName]       = useState('')
  const [description,setDescription]= useState('')
  const [bg,         setBg]         = useState(BG_COLORS[0])
  const [loading,    setLoading]    = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await boardsApi.create({ name, description, background: bg })
      toast.success('Board created!')
      onCreate()
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Board</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label>Board Name *</label>
            <input
              type="text" value={name} onChange={e=>setName(e.target.value)}
              required autoFocus placeholder="e.g. Product Roadmap"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="What is this board about?"
            />
          </div>
          <div className="form-group">
            <label>Background Color</label>
            <div className="color-picker">
              {BG_COLORS.map(c => (
                <button
                  key={c} type="button"
                  className={`color-swatch ${bg === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setBg(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
