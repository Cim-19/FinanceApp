import { useState, useEffect, useCallback } from 'react';
import { listNotifications, markRead, markAllRead, removeNotification } from '../api/notifications';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread       ] = useState(0);
  const [loading,       setLoading      ] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications();
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unread);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    // Poll every 60s for new notifications
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  const read = async (id) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
  };

  const readAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const remove = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    await removeNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.read) setUnread((u) => Math.max(0, u - 1));
  };

  return { notifications, unread, loading, read, readAll, remove, refresh: fetch };
}
