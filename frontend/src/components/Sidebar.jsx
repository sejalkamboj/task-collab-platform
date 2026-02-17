import React from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export function Sidebar({ boards, activeBoard, onSelectBoard, onShowDashboard }) {
  const { user, logout } = useAuth()

  return (
    <div className="sidebar">
      <div className="sidebar-logo">TaskFlow</div>

      <div className="sidebar-section">
        <h4>Boards</h4>
        <div className="sidebar-boards">
          {boards.map(b => (
            <button
              key={b.id}
              className={`sidebar-board-item ${activeBoard?.id === b.id ? 'active' : ''}`}
              onClick={() => onSelectBoard(b)}
            >
              <span className="sidebar-board-dot" style={{ background: b.background }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.name}
              </span>
            </button>
          ))}
          <button className="sidebar-board-item" onClick={onShowDashboard}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>＋</span>
            <span>New Board</span>
          </button>
        </div>
      </div>

      <div className="sidebar-bottom">
        {user && (
          <div className="sidebar-user">
            <img className="sidebar-user-avatar" src={user.avatar} alt={user.name} />
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={logout}>Sign out</button>
      </div>
    </div>
  )
}
