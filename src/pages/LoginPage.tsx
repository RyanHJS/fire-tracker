import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './LoginPage.css'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Mouse-tracking spotlight
  const [mouse, setMouse] = useState({ x: '50%', y: '40%' })
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({ x: `${e.clientX}px`, y: `${e.clientY}px` })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else {
        setSuccess('Account created! You can now sign in.')
        setMode('signin')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Mouse-following spotlight */}
      <div
        className="mouse-spotlight"
        style={{
          background: `radial-gradient(700px circle at ${mouse.x} ${mouse.y},
            rgba(124, 58, 237, 0.18) 0%,
            rgba(249, 115, 22, 0.08) 45%,
            transparent 70%)`
        }}
      />

      {/* Static ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Card */}
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🔥</span>
          <span className="login-logo-text">FIRE Tracker</span>
        </div>

        <h1 className="login-title">
          {mode === 'signin' ? 'Welcome back' : 'Get started'}
        </h1>
        <p className="login-subtitle">
          Your path to{' '}
          <span className="gradient-word">financial freedom</span>{' '}
          starts here.
        </p>

        {/* Tabs */}
        <div className="login-tabs" role="tablist">
          <button
            id="tab-signin"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`login-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}
          >
            Sign In
          </button>
          <button
            id="tab-signup"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form id="login-form" className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div id="login-error" className="form-message form-message--error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div id="login-success" className="form-message form-message--success" role="status">
              {success}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="login-footer">Your data is private and secure.</p>
      </div>
    </div>
  )
}
