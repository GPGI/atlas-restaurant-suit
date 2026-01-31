import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSession } from '@/context/RestaurantContext';
import StatusBadge from './StatusBadge';
import RequestRow from './RequestRow';
import { cn } from '@/lib/utils';

interface TableCardProps {
  session: TableSession;
  onCompleteRequest: (requestId: string) => void;
  onReset: () => void;
}

const TableCard: React.FC<TableCardProps> = ({
  session,
  onCompleteRequest,
  onReset,
}) => {
  const pendingRequests = session.requests.filter(r => r.status === 'pending');
  const completedRequests = session.requests.filter(r => r.status === 'completed');
  const hasPending = pendingRequests.length > 0;
  const hasActivity = session.requests.length > 0;
  const billPaid = session.requests.some(
    r => r.action === '💳 BILL REQUEST' && r.status === 'completed'
  );

  const totalBill = session.requests.reduce((sum, r) => sum + r.total, 0);

  const getStatus = () => {
    if (hasPending) return 'alert';
    if (hasActivity) return 'occupied';
    return 'free';
  };

  const status = getStatus();

  return (
    <div
      className={cn(
        'card-premium rounded-xl overflow-hidden transition-all',
        status === 'alert' && 'border-destructive pulse-alert',
        status === 'occupied' && 'border-primary',
        status === 'free' && 'border-success/30'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-semibold">
            {session.tableId.replace('_', ' ')}
          </h3>
          <StatusBadge status={status} />
        </div>
        
        {billPaid && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-primary/30 hover:bg-primary/10"
            onClick={onReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto scrollbar-premium">
        {session.requests.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6">
            No activity
          </p>
        ) : (
          <div className="space-y-2 stagger-children">
            {/* Show pending first, then completed */}
            {[...pendingRequests, ...completedRequests]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(request => (
                <RequestRow
                  key={request.id}
                  request={request}
                  onComplete={() => onCompleteRequest(request.id)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Footer with total */}
      {hasActivity && (
        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Running Total</span>
            <span className="font-display text-xl font-bold text-primary">
              {totalBill.toFixed(2)} лв
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCard;
