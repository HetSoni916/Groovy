import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/students/new', icon: UserPlus, label: 'Add Student' },
];

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-primary-900 text-white flex flex-col
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-primary-700">
          <div>
            <h1 className="text-xl font-bold">SMS</h1>
            <p className="text-xs text-primary-300">Student Management</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-primary-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-primary-700">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-primary-300 truncate">{user?.email}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
