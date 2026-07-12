import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../config/axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('notifications/');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        console.warn('Notifications response data is not an array', res.data);
        setNotifications([]);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`notifications/${id}/read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 shrink-0" />;
      case 'WARNING': return <AlertTriangle className="text-yellow-500 w-5 h-5 mt-0.5 shrink-0" />;
      case 'ERROR': return <AlertTriangle className="text-red-500 w-5 h-5 mt-0.5 shrink-0" />;
      default: return <Info className="text-blue-500 w-5 h-5 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-dark-surface"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 flex gap-3 transition-colors ${!n.is_read ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                  {getIcon(n.type)}
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {n.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-slate-400 hover:text-primary-500 p-1 rounded-full transition-colors h-fit shrink-0"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
