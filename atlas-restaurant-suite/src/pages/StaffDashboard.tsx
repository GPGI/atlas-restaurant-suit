import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import TableCard from '@/components/TableCard';

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
  const { tables, completeRequest, resetTable, loading } = useRestaurant();
  const prevPendingCountRef = useRef<number>(0);
  
  // Get all table IDs in order
  const tableIds = Array.from({ length: 10 }, (_, i) => 
    `Table_${String(i + 1).padStart(2, '0')}`
  );

  // Count total pending requests
  const getTotalPendingCount = useCallback(() => {
    return Object.values(tables).reduce((count, table) => {
      return count + table.requests.filter(r => r.status === 'pending').length;
    }, 0);
  }, [tables]);

  // Play sound when new pending requests appear
  useEffect(() => {
    const currentPendingCount = getTotalPendingCount();
    
    if (currentPendingCount > prevPendingCountRef.current) {
      playAlertSound();
    }
    
    prevPendingCountRef.current = currentPendingCount;
  }, [tables, getTotalPendingCount]);

  const handleCompleteRequest = useCallback(async (tableId: string, requestId: string) => {
    try {
      await completeRequest(tableId, requestId);
    } catch (error) {
      console.error('Error completing request:', error);
    }
  }, [completeRequest]);

  const handleResetTable = useCallback(async (tableId: string) => {
    try {
      await resetTable(tableId);
    } catch (error) {
      console.error('Error resetting table:', error);
    }
  }, [resetTable]);

  const totalPending = getTotalPendingCount();
  const totalRevenue = Object.values(tables).reduce((sum, table) => {
    return sum + table.requests.reduce((reqSum, r) => reqSum + r.total, 0);
  }, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full hover:bg-secondary"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold text-gold tracking-wide">
                  ATLAS HOUSE
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Staff Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Menu Editor Button */}
              <Button
                variant="outline"
                onClick={() => navigate('/admin/menu')}
                className="gap-2"
              >
                <Utensils className="h-4 w-4" />
                Edit Menu
              </Button>
              
              {/* Pending Alerts */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
                <p className={`font-display text-2xl font-bold ${totalPending > 0 ? 'text-destructive' : 'text-success'}`}>
                  {totalPending}
                </p>
              </div>
              
              {/* Total Revenue */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Revenue
                </p>
                <p className="font-display text-2xl font-bold text-primary">
                  {totalRevenue.toFixed(2)} лв
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Table Grid */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tables...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 stagger-children">
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
                  onReset={() => handleResetTable(tableId)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Legend */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border py-3">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Free</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-muted-foreground">Pending Action</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;
