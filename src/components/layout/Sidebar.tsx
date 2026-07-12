import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel,
  Receipt, Upload, UserCog, Activity, Settings,
  Route, BarChart3, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/fleet/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', roles: ['FLEET_MANAGER'] },
  { to: '/dispatcher/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', roles: ['DISPATCHER'] },
  { to: '/driver/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'My Dashboard', roles: ['DRIVER'] },
  { to: '/vehicles', icon: <Truck className="w-5 h-5" />, label: 'Vehicles', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER'] },
  { to: '/drivers', icon: <Users className="w-5 h-5" />, label: 'Drivers', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER'] },
  { to: '/trips', icon: <Route className="w-5 h-5" />, label: 'Trips', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER'] },
  { to: '/driver/trips', icon: <Route className="w-5 h-5" />, label: 'My Trips', roles: ['DRIVER'] },
  { to: '/maintenance', icon: <Wrench className="w-5 h-5" />, label: 'Maintenance', roles: ['ADMIN', 'FLEET_MANAGER'] },
  { to: '/fuel', icon: <Fuel className="w-5 h-5" />, label: 'Fuel Logs', roles: ['ADMIN', 'FLEET_MANAGER'] },
  { to: '/expenses', icon: <Receipt className="w-5 h-5" />, label: 'Expenses', roles: ['ADMIN', 'FLEET_MANAGER'] },
  { to: '/admin/import', icon: <Upload className="w-5 h-5" />, label: 'Import Data', roles: ['ADMIN'] },
  { to: '/admin/users', icon: <UserCog className="w-5 h-5" />, label: 'Users', roles: ['ADMIN'] },
  { to: '/admin/activity', icon: <Activity className="w-5 h-5" />, label: 'Activity Logs', roles: ['ADMIN'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const role = userProfile?.role || '';

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#0f2240] text-white z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="TransitOps Logo" className="h-10 w-auto rounded-lg object-contain bg-white p-1" referrerPolicy="no-referrer" />
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3">
          <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            {role.replace('_', ' ')}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        {userProfile && (
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">
                  {userProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userProfile.name}</p>
                <p className="text-xs text-blue-300 truncate">{userProfile.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
