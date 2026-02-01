import React from 'react';
import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRequest } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';

interface RequestRowProps {
  request: TableRequest;
  onComplete: () => void;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, onComplete }) => {
  const isPending = request.status === 'pending';
  const time = new Date(request.timestamp).toLocaleTimeString('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'p-2.5 sm:p-3 rounded-lg border transition-all',
        isPending
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-border bg-secondary/30'
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-xs sm:text-sm truncate">{request.action}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {request.details}
          </p>
          {request.total > 0 && (
            <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
              {request.total.toFixed(2)} лв
            </p>
          )}
        </div>
        
        {isPending ? (
          <Button
            size="sm"
            className="btn-gold h-9 w-9 sm:h-10 sm:w-auto sm:px-4 text-xs font-semibold touch-manipulation flex-shrink-0"
            onClick={onComplete}
            aria-label="Complete request"
          >
            <span className="hidden sm:inline">OK</span>
            <span className="sm:hidden">✓</span>
          </Button>
        ) : (
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-success" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestRow;
