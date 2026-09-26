import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Check, ChevronRight, User as UserIcon, LogOut } from 'lucide-react';
import { notificationApi } from '../../api';
import { NotificationItem } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

let cachedNotificationsData: { notifications: NotificationItem[]; unreadCount: number } | null = null;
let lastNotifFetchTime = 0;

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'Manage and track your leave requests',
  activeFilter = 'This Month',
  onFilterChange,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showBellMenu, setShowBellMenu] = useState<boolean>(false);

  const filterTabs = ['Today', 'This Week', 'This Month', 'All Time'];

  // Clean user name from parentheses like "(HR Lead)" or "(Tech Lead)"
  const cleanName = user?.name ? user.name.replace(/\s*\([^)]*\)/, '') : 'User';

  const fetchNotifications = async (force = false) => {
    // Return cached notifications immediately if fetched within last 20 seconds
    const now = Date.now();
    if (!force && cachedNotificationsData && now - lastNotifFetchTime < 20000) {
      setNotifications(cachedNotificationsData.notifications);
      setUnreadCount(cachedNotificationsData.unreadCount);
      return;
    }

    try {
      const res = await notificationApi.getNotifications();
      cachedNotificationsData = {
        notifications: res.notifications || [],
        unreadCount: res.unreadCount || 0,
      };
      lastNotifFetchTime = now;
      setNotifications(cachedNotificationsData.notifications);
      setUnreadCount(cachedNotificationsData.unreadCount);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      const handleSocketNotif = () => {
        fetchNotifications(true);
      };
      socket.on('new_notification', handleSocketNotif);
      return () => {
        socket.off('new_notification', handleSocketNotif);
      };
    }
  }, [socket]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.read) {
        await notificationApi.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setShowBellMenu(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200/70">
      {/* ========================================================
          Top Navigation Bar (Clean, Unified, No Duplicate Logo)
          ======================================================== */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-100 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Breadcrumbs on Desktop, Brand on Mobile */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile Brand Mark (Sidebar is hidden on mobile) */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              E
            </div>
            <span className="font-extrabold text-slate-950 text-sm tracking-tight">ELAP</span>
          </div>

          {/* Desktop Breadcrumb Hierarchy */}
          <nav className="hidden lg:flex items-center gap-2 text-xs truncate">
            <span className="font-semibold text-slate-400">Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            <span className="font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg truncate">
              {title}
            </span>
          </nav>
        </div>

        {/* Center: Contextual Time Filters (Desktop / Tablet view) */}
        {onFilterChange && (
          <div className="hidden sm:flex items-center gap-1 p-1 bg-[#f1f4f9] rounded-full border border-slate-200/80 shadow-2xs text-xs">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onFilterChange(tab)}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-[#090D1A] text-white ring-2 ring-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60 font-semibold'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}

        {/* Right Actions: Notifications & Unified User Chip */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowBellMenu(!showBellMenu)}
              className="relative w-9 h-9 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-4xs rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Menu Dropdown (Clamped to viewport on mobile) */}
            {showBellMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-3xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-xs text-slate-400 text-center italic">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 text-xs cursor-pointer transition-colors hover:bg-slate-50 ${
                          !n.read ? 'bg-indigo-50/40 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-900 truncate">{n.title}</span>
                          <span className="text-4xs text-slate-400 ml-2 flex-shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-3xs line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200" />

          {/* Unified User Profile Chip */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1 sm:pr-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all group"
            title="View Profile & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">
                {cleanName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">
                {user?.role} • {user?.department?.name || 'Org'}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* ========================================================
          Main Page Title Section (Spacious & Clean Hierarchy)
          ======================================================== */}
      <div className="px-4 sm:px-8 pt-4 pb-4 sm:pt-5 sm:pb-5">
        {subtitle && (
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {subtitle}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
          {title}
        </h1>

        {/* Mobile Horizontal Filter Bar (renders directly under title on mobile) */}
        {onFilterChange && (
          <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 -mx-4 px-4">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onFilterChange(tab)}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap text-xs transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-[#090D1A] text-white ring-2 ring-blue-600 shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 font-semibold'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
