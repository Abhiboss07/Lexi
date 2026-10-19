import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { SmartNotification } from '../../types/notifications';

export interface NotificationToastProps {
  notification: SmartNotification | null;
  onAction: (notification: SmartNotification) => void;
  onDismiss: (notification: SmartNotification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onAction,
  onDismiss,
}) => {
  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-md border border-[#E0E3FA] shadow-lg rounded-2xl p-3.5 flex items-start gap-3 text-left">
        {/* Category Icon Badge */}
        <div className="w-9 h-9 rounded-xl bg-[#F0F2FE] border border-[#E0E3FA] flex items-center justify-center shrink-0 text-lg select-none">
          {notification.icon || '✦'}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-[#232655] tracking-tight truncate">
              {notification.title}
            </h4>
          </div>
          <p className="text-[11px] leading-snug font-medium text-[#646AA4] mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          {/* Action Row */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => onAction(notification)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#232655] hover:bg-[#1E1C44] active:scale-95 text-white text-[11px] font-semibold rounded-full transition-all focus:outline-hidden focus:ring-2 focus:ring-[#646AA4]"
              aria-label={`${notification.actionLabel}: ${notification.title}`}
            >
              <span>{notification.actionLabel}</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(notification)}
          className="text-[#7D82A8] hover:text-[#232655] p-1 rounded-full hover:bg-[#F0F2FE] transition-colors shrink-0 focus:outline-hidden focus:ring-2 focus:ring-[#646AA4]"
          aria-label="Dismiss reminder"
        >
          <X className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
