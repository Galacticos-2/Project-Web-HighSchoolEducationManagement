import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { NotificationContext } from "./notification-context";
import { authStorage } from "../auth/authStorage";
import { notificationApi } from "../api/notificationApi";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

export function NotificationProvider({ children }) {
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastItems, setToastItems] = useState([]);

    const connectionRef = useRef(null);
    const seenIdsRef = useRef(new Set());
    

    const { profile } = useAuth();
    const nav = useNavigate();

    const resetNotifications = useCallback(() => {
        setItems([]);
        setUnreadCount(0);
        setToastItems([]);
        seenIdsRef.current = new Set();
        
    }, []);

    const stopConnection = useCallback(async () => {
        if (!connectionRef.current) return;

        try {
            await connectionRef.current.stop();
        } catch {
            // ignore
        } finally {
            connectionRef.current = null;
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        if (!authStorage.getToken()) {
            setItems([]);
            setUnreadCount(0);
            seenIdsRef.current = new Set();
            return;
        }

        const { data } = await notificationApi.getMine(20);
        const loadedItems = data?.items || [];

        setItems(loadedItems);
        setUnreadCount(data?.unreadCount || 0);

        seenIdsRef.current = new Set(loadedItems.map((x) => x.id));
    }, []);

    const removeToast = useCallback((toastId) => {
        setToastItems((prev) => prev.filter((x) => x.toastId !== toastId));
    }, []);

    const pushToast = useCallback((notification) => {
        const toastId = `${notification.id}-${Date.now()}-${Math.random()}`;

        setToastItems((prev) => [
            {
                ...notification,
                toastId,
            },
            ...prev
        ].slice(0, 3));

        setTimeout(() => {
            setToastItems((prev) => prev.filter((x) => x.toastId !== toastId));
        }, 30000);
    }, []);

    const handleToastClick = useCallback(async (item) => {
        try {
            if (!item.isRead) {
                await notificationApi.markAsRead(item.id);
                await loadNotifications();
            }
        } catch {
            // ignore
        }

        setToastItems((prev) => prev.filter((x) => x.toastId !== item.toastId));

        if (item.navigationUrl) {
            nav(item.navigationUrl);
        }
    }, [loadNotifications, nav]);

    const connect = useCallback(async () => {
        const token = authStorage.getToken();
        if (!token) return;

        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/notifications", {
                accessTokenFactory: () => authStorage.getToken() || ""
            })
            .withAutomaticReconnect()
            .build();

        connection.on("notification:refresh", (payload) => {
            const incomingItems = payload?.items || [];
            const incomingUnreadCount = payload?.unreadCount || 0;

            setUnreadCount(incomingUnreadCount);
            setItems(incomingItems);

            const currentSeenIds = seenIdsRef.current;
            const now = Date.now();

            const newUnreadItems = incomingItems.filter((x) => {
                if (x.isRead) return false;
                if (currentSeenIds.has(x.id)) return false;

                const createdMs = new Date(x.createdAtUtc).getTime();
                const ageMs = now - createdMs;

                // chỉ toast nếu là thông báo thực sự mới, ví dụ trong 60 giây gần đây
                return ageMs >= 0 && ageMs <= 60 * 1000;
            });

            newUnreadItems
                .sort((a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc))
                .slice(0, 3)
                .forEach((item) => pushToast(item));
            
                
            

            seenIdsRef.current = new Set(incomingItems.map((x) => x.id));
        });

        await connection.start();
        connectionRef.current = connection;
    }, [pushToast]);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            const token = authStorage.getToken();

            await stopConnection();
            resetNotifications();

            if (!token || !profile?.role) return;

            try {
                if (!cancelled) {
                    await connect(); 
                }
            } catch {
                // ignore
            }

            try {
                if (!cancelled) {
                    await loadNotifications();
                }
            } catch {
                // ignore
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
            stopConnection().catch(() => { });
        };
    }, [profile?.role, loadNotifications, connect, stopConnection, resetNotifications]);

    const deleteNotification = useCallback(async (id) => {
        await notificationApi.deleteMine(id);
        await loadNotifications();
    }, [loadNotifications]);

    const markAsRead = useCallback(async (id) => {
        await notificationApi.markAsRead(id);
        await loadNotifications();
    }, [loadNotifications]);

    const formatNotificationTime = useCallback((utcString) => {
        if (!utcString) return "";

        const date = new Date(utcString);
        const now = new Date();
        const diffMs = now - date;

        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return "Vừa xong";
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleString("vi-VN");
    }, []);

    const value = useMemo(() => ({
        items,
        unreadCount,
        toastItems,
        loadNotifications,
        markAsRead,
        deleteNotification,
        removeToast,
        handleToastClick,
        formatNotificationTime,
    }), [
        items,
        unreadCount,
        toastItems,
        loadNotifications,
        markAsRead,
        deleteNotification,
        removeToast,
        handleToastClick,
        formatNotificationTime,
    ]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}