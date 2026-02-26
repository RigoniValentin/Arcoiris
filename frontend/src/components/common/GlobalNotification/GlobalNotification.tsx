import React, { useState, useEffect } from "react";
import styles from "./GlobalNotification.module.css";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface GlobalNotificationProps {
  notification: NotificationData | null;
  onClose: () => void;
}

export const GlobalNotification: React.FC<GlobalNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300); // Wait for animation
      }, notification.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div
      className={`${styles.notification} ${styles[notification.type]} ${
        isVisible ? styles.show : ""
      }`}
    >
      <div className={styles.content}>
        <div className={styles.icon}>{getIcon()}</div>
        <div className={styles.text}>
          <div className={styles.title}>{notification.title}</div>
          <div className={styles.message}>{notification.message}</div>
        </div>
        <button
          className={styles.closeButton}
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
