"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const colors = {
  success: "from-emerald-600 to-emerald-700 border-emerald-500",
  error: "from-red-600 to-red-700 border-red-500",
  info: "from-blue-600 to-blue-700 border-blue-500",
  warning: "from-amber-600 to-amber-700 border-amber-500",
};

export const NotificationItem = ({ notification, onClose }: NotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(notification.id), 300);
    }, notification.duration || 4000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 rounded-xl border-2 bg-gradient-to-r p-4 shadow-2xl
        transition-all duration-300 ease-out
        ${colors[notification.type]}
        ${isExiting ? "translate-x-[-400px] opacity-0" : "translate-x-0 opacity-100"}
      `}
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      <Icon className="h-5 w-5 flex-shrink-0 text-white" />
      <p className="flex-1 text-sm font-medium text-white">{notification.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(notification.id), 300);
        }}
        className="flex-shrink-0 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onClose }: NotificationContainerProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onClose={onClose} />
      ))}
    </div>
  );
};

