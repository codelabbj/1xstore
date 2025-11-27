'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, RefreshCw, Loader2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { notificationApi } from '@/lib/api-client';
import { Notification } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { fcmService } from '@/lib/firebase';
import type { MessagePayload } from 'firebase/messaging';

interface FCMNotification {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_fcm: true;
  payload?: MessagePayload;
}

type CombinedNotification = Notification | FCMNotification;

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fcmNotifications, setFcmNotifications] = useState<FCMNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setIsRefreshing(pageNum === 1);
      setIsLoading(pageNum === 1);
      
      const response = await notificationApi.getAll(pageNum);
      setNotifications(response.results);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setPage(pageNum);
    } catch (error) {
      toast.error('Échec du chargement');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchNotifications(page);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [page]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFcmNotifications = localStorage.getItem('fcm_notifications');
      if (storedFcmNotifications) {
        try {
          setFcmNotifications(JSON.parse(storedFcmNotifications));
        } catch (error) {
          console.error('Error loading FCM notifications:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFCMMessage = (payload: MessagePayload) => {
      const fcmNotification: FCMNotification = {
        id: `fcm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: payload.notification?.title || 'Nouvelle notification',
        content: payload.notification?.body || payload.data?.body || '',
        created_at: new Date().toISOString(),
        is_read: false,
        is_fcm: true,
        payload,
      };

      setFcmNotifications(prev => {
        const updated = [fcmNotification, ...prev];
        localStorage.setItem('fcm_notifications', JSON.stringify(updated));
        return updated;
      });
    };

    fcmService.setupForegroundListener(handleFCMMessage);

    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.firebaseMessaging) handleFCMMessage(event.data.firebaseMessaging);
      };
      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => navigator.serviceWorker.removeEventListener('message', messageHandler);
    }
  }, []);

  const markAsRead = async (notificationId: number | string) => {
    if (typeof notificationId === 'string' && notificationId.startsWith('fcm-')) {
      setFcmNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
        localStorage.setItem('fcm_notifications', JSON.stringify(updated));
        return updated;
      });
      toast.success('Marqué comme lu');
      return;
    }
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    toast.success('Marqué comme lu');
  };

  const formatDate = (dateString: string) => {
    try { return format(parseISO(dateString), 'dd MMM yyyy, HH:mm', { locale: fr }); }
    catch { return dateString; }
  };

  const allNotifications: CombinedNotification[] = [...fcmNotifications, ...notifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3FA9FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchNotifications()}
          disabled={isRefreshing}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#3FA9FF] animate-spin" />
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Aucune notification</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 text-center">
            Vos notifications apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {allNotifications.map((notification, index) => {
            const isFCM = 'is_fcm' in notification && notification.is_fcm;
            
            return (
              <div
                key={notification.id}
                className={`p-4 ${index !== allNotifications.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''} ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isFCM ? 'bg-violet-500/10 text-violet-500' : 'bg-[#3FA9FF]/10 text-[#3FA9FF]'}`}>
                    {isFCM ? <MessageSquare className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#3FA9FF]" />
                      )}
                      {isFCM && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                          Push
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-1 text-xs text-[#3FA9FF] hover:text-[#0066FF] font-medium transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Marquer lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {(hasNext || hasPrevious) && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">Page {page}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchNotifications(page - 1)}
                  disabled={!hasPrevious || isLoading}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchNotifications(page + 1)}
                  disabled={!hasNext || isLoading}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-[#3FA9FF] hover:text-[#3FA9FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
