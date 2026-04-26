import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/analyze', label: '🎙️ Analyze' },
  { to: '/brand-guardian', label: '🛡️ Brand Guardian' },
  { to: '/deep-dive', label: '🔍 Deep Dive' },
  { to: '/optimize', label: '✍️ Optimizer' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-logo-mark">✦</div>
        Sentix
      </Link>
      <ul className="nav-links">
        {links.map(l => (
          <li key={l.to}>
            <Link
              to={l.to}
              className={`nav-link ${pathname === l.to ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
