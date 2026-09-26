import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { notificationApi } from '../../api';
import { NotificationItem } from '../../types';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifs = async () => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Layout title="Notifications Center" subtitle="View all your portal notifications and real-time updates">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-end">
          <button
            onClick={handleMarkAll}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-600" /> Mark All as Read
          </button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : notifications.length === 0 ? (
          <EmptyState title="No Notifications" description="You're all caught up! No notifications to show." />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={async () => {
                  if (!n.read) await notificationApi.markAsRead(n.id);
                  if (n.link) navigate(n.link);
                }}
                className={`p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                  !n.read ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-3xs text-slate-400 mt-2 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {n.link && <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
