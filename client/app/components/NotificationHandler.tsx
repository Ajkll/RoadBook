import React from 'react';
import Toast from 'react-native-toast-message';
import { useNotification } from '../services/notification/notificationToast';

export const NotificationHandler: React.FC = () => {
  return <Toast />;
};

export const useNotifications = () => {
  const { showNotification } = useNotification();

  return {
    showSuccess: (text1: string, text2?: string, options?: any) =>
      showNotification('success', text1, text2, options),
    showError: (text1: string, text2?: string, options?: any) =>
      showNotification('error', text1, text2, options),
    showWarning: (text1: string, text2?: string, options?: any) =>
      showNotification('warning', text1, text2, options),
    showInfo: (text1: string, text2?: string, options?: any) =>
      showNotification('info', text1, text2, options),
  };
};