import React, { useEffect, useState } from 'react';
import { Bell, Menu, X, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logOut } from '../../services/authService';
import { subscribeToNotifications, markAllRead } from '../../services/notificationService';
import { Notification } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { timeAgo } from '../../utils/calculations';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const { userProfile, currentUser, logoutMock } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, setNotifications);
    return unsub;
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      logoutMock();
      await logOut();
      navigate('/login');
    } catch {
      error('Logout failed', 'Please try again.');
    }
  };

  const handleMarkAllRead = async () => {
    if (currentUser) await markAllRead(currentUser.uid);
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    FLEET_MANAGER: 'Fleet Manager',
    DISPATCHER: 'Dispatcher',
    DRIVER: 'Driver',
  };
  const roleLabel = roleLabels[userProfile?.role ?? ''] || '';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Brand — shown on mobile */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 bg-transit-blue rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <span className="font-bold text-gray-800 text-sm">TransitOps</span>
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {userProfile?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">{userProfile?.name}</p>
              <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
