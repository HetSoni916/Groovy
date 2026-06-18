import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiUsers, FiCalendar, FiLogOut } from 'react-icons/fi';

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/students', icon: FiUsers, label: 'Students' },
  { to: '/attendance', icon: FiCalendar, label: 'Attendance' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">SMS</h1>
          <p className="text-xs text-gray-500 mt-0.5">Student Management</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="text-lg" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300 truncate">{user?.name}</div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors p-1">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
