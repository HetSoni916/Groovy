import { Link, useLocation } from 'react-router-dom'
import { Film, Github, LogOut } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <nav className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
              <Film className="w-5 h-5 text-accent-light" />
            </div>
            <span className="text-lg font-bold gradient-text">AI Video Editor</span>
          </Link>

          <div className="flex items-center gap-4">
            {token && location.pathname !== '/' && (
              <Link to="/dashboard" className="text-sm text-dark-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            )}
            {token ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-dark-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-primary text-sm py-2 px-4"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
