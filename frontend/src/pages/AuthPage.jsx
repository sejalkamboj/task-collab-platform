import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export function AuthPage({ onToast }) {
  const [mode, setMode] = useState('login')
  return mode === 'login'
    ? <LoginForm onSwitch={() => setMode('signup')} onToast={onToast} />
    : <SignupForm onSwitch={() => setMode('login')}  onToast={onToast} />
}

function LoginForm({ onSwitch, onToast }) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(email, password)
      onToast?.('Welcome back!', 'success')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          No account? <button className="link-button" onClick={onSwitch}>Sign up</button>
        </p>
      </div>
    </div>
  )
}

function SignupForm({ onSwitch, onToast }) {
  const { signup } = useAuth()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await signup(name, email, password)
      onToast?.('Account created!', 'success')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Get Started</h1>
        <p className="auth-subtitle">Create your free account</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <button className="link-button" onClick={onSwitch}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
