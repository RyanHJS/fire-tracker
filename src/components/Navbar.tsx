import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { signOut } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span className="navbar-logo-icon">🔥</span>
          <span className="navbar-logo-text">FIRE Tracker</span>
        </div>

        <div className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Transactions
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Settings
          </NavLink>
        </div>

        <button id="navbar-signout" className="navbar-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
