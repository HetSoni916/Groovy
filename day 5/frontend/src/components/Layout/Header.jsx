import { HiOutlineMenu, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <HiOutlineMenu className="h-6 w-6" />
        </button>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user && getInitials(user.first_name, user.last_name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <HiOutlineLogout className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
