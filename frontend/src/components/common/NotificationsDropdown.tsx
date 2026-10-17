import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../../api/client.js';
import { NotificationItem } from '../../types/index.js';

export const NotificationsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // Polling every 45s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getIcon = (type: string) => {
    if (type.includes('100') || type.includes('SUSPENDED')) {
      return <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />;
    }
    if (type.includes('LOW_STOCK') || type.includes('80') || type.includes('90') || type.includes('OVERDUE')) {
      return <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />;
    }
    return <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Ogeysiisyada</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-brand-navy hover:underline flex items-center space-x-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Akhri Dhammaan
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Ma jiraan ogeysiisyada cusub</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 text-xs flex space-x-2.5 transition-colors ${
                      n.isRead ? 'bg-white' : 'bg-amber-50/50'
                    }`}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{n.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

