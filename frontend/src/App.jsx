import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { SocketProvider } from './contexts/SocketContext.jsx'
import { AuthPage } from './pages/AuthPage.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { BoardView } from './pages/BoardView.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { ToastContainer } from './components/Toast.jsx'
import { useToast } from './hooks/useToast.js'
import { boardsApi } from './services/api.js'

function Inner() {
  const { user, loading } = useAuth()
  const { toasts, toast } = useToast()
  const [activeBoard,  setActiveBoard]  = useState(null)
  const [boards,       setBoards]       = useState([])
  const [showDashboard,setShowDashboard]= useState(false)

  const loadBoards = () => {
    if (!user) return
    boardsApi.list()
      .then(d => setBoards(d.boards))
      .catch(() => {})
  }

  useEffect(() => { loadBoards() }, [user])

  if (loading) return <div className="loading">Loading…</div>

  if (!user) return (
    <>
      <AuthPage onToast={(msg, t) => toast[t]?.(msg)} />
      <ToastContainer toasts={toasts} />
    </>
  )

  const handleSelectBoard = (board) => {
    setActiveBoard(board)
    setShowDashboard(false)
  }

  const handleBack = () => {
    setActiveBoard(null)
    setShowDashboard(false)
    loadBoards()
  }

  const showingBoard = activeBoard && !showDashboard

  return (
    <>
      <div className="app-layout">
        <Sidebar
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={handleSelectBoard}
          onShowDashboard={() => { setActiveBoard(null); setShowDashboard(true) }}
        />
        <div className="main-content">
          {showingBoard ? (
            <BoardView
              board={activeBoard}
              onBack={handleBack}
              toast={toast}
            />
          ) : (
            <Dashboard
              onSelectBoard={handleSelectBoard}
              toast={toast}
            />
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Inner />
      </SocketProvider>
    </AuthProvider>
  )
}
