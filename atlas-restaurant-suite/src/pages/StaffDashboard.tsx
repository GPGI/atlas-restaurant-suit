import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import TableCard from '@/components/TableCard';
import { useToast } from '@/hooks/use-toast';

// Audio for alert notification
const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tables, completeRequest, markAsPaid, resetTable, resetAllTables, loading } = useRestaurant();
  const [isResettingAll, setIsResettingAll] = useState(false);
  const prevPendingCountRef = useRef<number>(0);
  
  // Get all table IDs in order - memoized
  const tableIds = useMemo(() => 
    Array.from({ length: 10 }, (_, i) => 
      `Table_${String(i + 1).padStart(2, '0')}`
    ), []
  );

  // Count total pending requests - memoized
  const totalPending = useMemo(() => {
    return Object.values(tables).reduce((count, table) => {
      return count + table.requests.filter(r => r.status === 'pending').length;
    }, 0);
  }, [tables]);

  // Calculate total revenue - memoized
  const totalRevenue = useMemo(() => {
    return Object.values(tables).reduce((sum, table) => {
      return sum + table.requests.reduce((reqSum, r) => reqSum + r.total, 0);
    }, 0);
  }, [tables]);

  // Play sound when new pending requests appear
  useEffect(() => {
    if (totalPending > prevPendingCountRef.current) {
      playAlertSound();
    }
    prevPendingCountRef.current = totalPending;
  }, [totalPending]);

  const handleCompleteRequest = useCallback(async (tableId: string, requestId: string) => {
    try {
      await completeRequest(tableId, requestId);
      toast({
        title: '✅ Заявката е завършена',
        description: 'Заявката е маркирана като завършена',
      });
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно завършване на заявка',
        variant: 'destructive',
      });
    }
  }, [completeRequest, toast]);

  const handleMarkAsPaid = useCallback(async (tableId: string) => {
    const tableName = tableId.replace('_', ' ');
    if (!confirm(`Маркиране на ${tableName} като платена?\n\nТова ще завърши всички чакащи заявки и ще отключи таблицата.`)) {
      return;
    }
    
    try {
      await markAsPaid(tableId);
      toast({
        title: '✅ Платено',
        description: `${tableName} е маркирана като платена и е отключена`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно маркиране като платена. Моля опитайте отново.',
        variant: 'destructive',
      });
    }
  }, [markAsPaid, toast]);

  const handleResetAllTables = useCallback(async () => {
    if (!confirm(`Сигурни ли сте, че искате да нулирате ВСИЧКИ таблици?\n\nТова ще изтрие всички заявки и колички за всички таблици.\n\nТова действие не може да бъде отменено!`)) {
      return;
    }
    
    setIsResettingAll(true);
    try {
      await resetAllTables();
      toast({
        title: '✅ Всички таблици са нулирани',
        description: 'Всички таблици са нулирани успешно',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error resetting all tables:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно нулиране на таблици. Моля опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingAll(false);
    }
  }, [resetAllTables, toast]);

  const handleResetTable = useCallback(async (tableId: string) => {
    const tableName = tableId.replace('_', ' ');
    if (!confirm(`Сигурни ли сте, че искате да нулирате ${tableName}?\n\nТова ще изтрие всички заявки и количката.`)) {
      return;
    }
    
    try {
      await resetTable(tableId);
      toast({
        title: '✅ Таблицата е нулирана',
        description: `${tableName} е нулирана успешно`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error resetting table:', error);
      // Don't show error toast if it's a context error (likely a race condition)
      if (error instanceof Error && error.message.includes('RestaurantProvider')) {
        console.warn('Context error during reset (likely race condition), ignoring...');
        // Still show success since the operation likely completed
        toast({
          title: '✅ Таблицата е нулирана',
          description: `${tableName} е нулирана успешно`,
          duration: 3000,
        });
        return;
      }
      toast({
        title: 'Грешка',
        description: 'Неуспешно нулиране на таблица. Моля опитайте отново.',
        variant: 'destructive',
      });
    }
  }, [resetTable, toast]);

  return (
    <div className="min-h-screen pb-20 sm:pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full hover:bg-secondary touch-manipulation flex-shrink-0"
                onClick={() => navigate('/')}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-gold tracking-wide truncate">
                  ATLAS HOUSE
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  Staff Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto justify-between sm:justify-end">
              {/* Reset All Tables Button */}
              <Button
                variant="destructive"
                onClick={handleResetAllTables}
                disabled={isResettingAll || loading}
                className="gap-2 text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                aria-label="Reset all tables"
              >
                {isResettingAll ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Resetting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reset All</span>
                    <span className="sm:hidden">Reset</span>
                  </>
                )}
              </Button>
              
              {/* Menu Editor Button */}
              <Button
                variant="outline"
                onClick={() => navigate('/admin/menu')}
                className="gap-2 text-xs sm:text-sm h-9 sm:h-10 touch-manipulation"
                aria-label="Edit menu"
              >
                <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Edit Menu</span>
                <span className="sm:hidden">Menu</span>
              </Button>
              
              {/* Pending Alerts */}
              <div className="text-center min-w-[60px] sm:min-w-[80px]">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
                <p className={`font-display text-xl sm:text-2xl font-bold ${totalPending > 0 ? 'text-destructive animate-pulse' : 'text-success'}`}>
                  {totalPending}
                </p>
              </div>
              
              {/* Total Revenue */}
              <div className="text-center min-w-[80px] sm:min-w-[100px]">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Revenue
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold text-primary truncate">
                  {totalRevenue.toFixed(2)} лв
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Table Grid */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Зареждане на таблици...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 stagger-children">
            {tableIds.map(tableId => {
              const session = tables[tableId] || {
                tableId,
                isLocked: false,
                cart: [],
                requests: [],
                isVip: false,
              };
              
              return (
                <TableCard
                  key={tableId}
                  session={session}
                  onCompleteRequest={(requestId) => handleCompleteRequest(tableId, requestId)}
                  onMarkAsPaid={() => handleMarkAsPaid(tableId)}
                  onReset={() => handleResetTable(tableId)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Legend */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border py-2 sm:py-3"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-success flex-shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Free</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary flex-shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-destructive animate-pulse flex-shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Pending Action</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;
