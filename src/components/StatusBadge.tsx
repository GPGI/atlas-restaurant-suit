import React from 'react';
import { cn } from '@/lib/utils';

type Status = 'free' | 'occupied' | 'alert';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    free: {
      label: 'FREE',
      bgClass: 'bg-success/20',
      textClass: 'text-success',
      dotClass: 'bg-success',
    },
    occupied: {
      label: 'OCCUPIED',
      bgClass: 'bg-primary/20',
      textClass: 'text-primary',
      dotClass: 'bg-primary',
    },
    alert: {
      label: 'ALERT',
      bgClass: 'bg-destructive/20',
      textClass: 'text-destructive',
      dotClass: 'bg-destructive animate-pulse',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
      {config.label}
    </div>
  );
};

export default StatusBadge;
