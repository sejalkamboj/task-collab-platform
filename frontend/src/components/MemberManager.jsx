import React, { useState } from 'react'

const API_BASE = 'https://taskcollab-api.onrender.com'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function MemberManager({ board, onClose, onUpdated, toast }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleInvite = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      // Step 1: find user by email
      const { users } = await request(`/users/search?email=${encodeURIComponent(email.trim())}`)
      if (!users || users.length === 0) {
        setError('No user found with that email. They must sign up first.')
        setLoading(false); return
      }
      const found = users[0]

      // Step 2: add them to the board
      await request(`/boards/${board.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: found.id, role: 'member' }),
      })

      toast.success(`${found.name} added to the board!`)
      setEmail('')
      onUpdated()
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this board?`)) return
    try {
      await request(`/boards/${board.id}/members/${userId}`, { method: 'DELETE' })
      toast.success(`${userName} removed`)
      onUpdated()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>Board Members</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Current members list */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem', fontWeight: 600 }}>
            Current Members ({board.members?.length ?? 0})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {board.members?.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.75rem', borderRadius: 10,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid var(--border-color)',
              }}>
                <img
                  src={m.user.avatar} alt={m.user.name}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '.9375rem' }}>
                    {m.user.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>
                    {m.user.email} · {m.role}
                  </div>
                </div>
                {m.role !== 'owner' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(m.userId, m.user.name)}
                    style={{ padding: '.375rem .75rem', fontSize: '.75rem' }}
                  >
                    Remove
                  </button>
                )}
                {m.role === 'owner' && (
                  <span style={{
                    background: 'rgba(14,165,233,.15)', color: 'var(--primary)',
                    padding: '.25rem .625rem', borderRadius: 6,
                    fontSize: '.6875rem', fontWeight: 700, textTransform: 'uppercase'
                  }}>Owner</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite by email form */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.25rem',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem', fontWeight: 600 }}>
            Invite by Email
          </p>
          {error && (
            <div className="error-message" style={{ marginBottom: '.75rem' }}>{error}</div>
          )}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '.75rem' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
              style={{
                flex: 1, background: 'rgba(15,23,42,.6)',
                border: '1px solid var(--border-color)', borderRadius: 10,
                padding: '.75rem 1rem', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: '.9375rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Adding…' : '+ Invite'}
            </button>
          </form>
          <p style={{ color: 'var(--text-muted)', fontSize: '.8rem', marginTop: '.625rem' }}>
            The person must already have a TaskFlow account.
          </p>
        </div>
      </div>
    </div>
  )
}
