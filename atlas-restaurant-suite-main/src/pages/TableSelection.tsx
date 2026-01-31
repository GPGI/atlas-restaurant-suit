import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurant } from '@/context/RestaurantContext';
import { Utensils, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TableSelection: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTable = searchParams.get('currentTable');
  const { tables } = useRestaurant();
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  // Generate table IDs (Table_01 to Table_10)
  const tableIds = Array.from({ length: 10 }, (_, i) => 
    `Table_${String(i + 1).padStart(2, '0')}`
  );

  const getTableStatus = (tableId: string) => {
    const session = tables[tableId];
    if (!session) return 'open';
    
    // Table is occupied if it has cart items or requests
    const hasActivity = session.cart.length > 0 || session.requests.length > 0;
    return hasActivity ? 'occupied' : 'open';
  };

  const handleTableClick = (tableId: string) => {
    navigate(`/menu?table=${tableId}`);
  };

  // Store current table in localStorage when navigating from menu
  React.useEffect(() => {
    if (currentTable) {
      localStorage.setItem('currentTable', currentTable);
    }
  }, [currentTable]);

  // Get current table from URL or localStorage
  const activeTable = currentTable || localStorage.getItem('currentTable') || null;

  const getTableInfo = (tableId: string) => {
    const session = tables[tableId];
    if (!session) return { cartItems: 0, requests: 0 };
    return {
      cartItems: session.cart.reduce((sum, item) => sum + item.quantity, 0),
      requests: session.requests.filter(r => r.status === 'pending').length
    };
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h1 className="font-display text-5xl md:text-6xl font-bold text-gold tracking-wide">
                ATLAS HOUSE
              </h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg">Select your table to begin</p>
          </div>

          {/* Table Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
            {tableIds.map((tableId, index) => {
              const status = getTableStatus(tableId);
              const isCurrentTable = activeTable === tableId;
              const isOccupied = status === 'occupied';
              const isOpen = status === 'open';
              const isHovered = hoveredTable === tableId;
              const tableInfo = getTableInfo(tableId);

              return (
                <button
                  key={tableId}
                  onClick={() => handleTableClick(tableId)}
                  onMouseEnter={() => setHoveredTable(tableId)}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={cn(
                    'group relative rounded-2xl p-6 transition-all duration-300',
                    'flex flex-col items-center justify-center gap-4',
                    'border-2 font-display overflow-hidden',
                    'hover:scale-105 active:scale-95',
                    'backdrop-blur-sm',
                    // Open table styling
                    isOpen && [
                      'bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent',
                      'border-green-500/50 hover:border-green-500',
                      'hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]',
                      'hover:bg-green-500/20'
                    ],
                    // Occupied table styling
                    isOccupied && [
                      'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent',
                      'border-red-500/50 hover:border-red-500',
                      'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
                      'hover:bg-red-500/20'
                    ],
                    // Current table styling
                    isCurrentTable && [
                      'ring-4 ring-primary/50 ring-offset-2 ring-offset-background',
                      'shadow-[0_0_40px_rgba(255,215,0,0.4)]',
                      'border-primary/70'
                    ]
                  )}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'fade-in 0.5s ease-out forwards'
                  }}
                >
                  {/* Animated background glow */}
                  <div className={cn(
                    'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    isOpen && 'bg-gradient-to-br from-green-500/20 to-transparent',
                    isOccupied && 'bg-gradient-to-br from-red-500/20 to-transparent'
                  )} />

                  {/* Status indicator dot */}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      'h-3 w-3 rounded-full transition-all duration-300',
                      isOpen && 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]',
                      isOccupied && 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse'
                    )} />
                  </div>

                  {/* Icon container */}
                  <div className={cn(
                    'relative h-20 w-20 rounded-2xl flex items-center justify-center',
                    'transition-all duration-300 group-hover:scale-110',
                    isOpen && [
                      'bg-gradient-to-br from-green-500/30 to-green-500/10',
                      'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
                      'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                    ],
                    isOccupied && [
                      'bg-gradient-to-br from-red-500/30 to-red-500/10',
                      'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
                      'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                    ],
                    isCurrentTable && 'ring-2 ring-primary/50'
                  )}>
                    <Utensils className={cn(
                      'h-10 w-10 transition-all duration-300',
                      'group-hover:rotate-12',
                      isOpen && 'text-green-400',
                      isOccupied && 'text-red-400'
                    )} />
                    
                    {/* Current table badge */}
                    {isCurrentTable && (
                      <div className="absolute -top-2 -right-2">
                        <CheckCircle2 className="h-6 w-6 text-primary fill-primary/20" />
                      </div>
                    )}
                  </div>

                  {/* Table info */}
                  <div className="text-center space-y-1 relative z-10">
                    <h3 className="text-xl font-bold tracking-wide">
                      {tableId.replace('_', ' ')}
                    </h3>
                    <p className={cn(
                      'text-sm font-medium transition-colors',
                      isOpen && 'text-green-400',
                      isOccupied && 'text-red-400'
                    )}>
                      {isOpen ? 'Available' : 'Occupied'}
                    </p>
                    
                    {/* Current table label */}
                    {isCurrentTable && (
                      <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold text-primary">Your Table</span>
                      </div>
                    )}

                    {/* Hover info */}
                    {isHovered && isOccupied && (
                      <div className="mt-2 space-y-1 animate-fade-in">
                        {tableInfo.cartItems > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Users className="h-3 w-3" />
                            {tableInfo.cartItems} items
                          </p>
                        )}
                        {tableInfo.requests > 0 && (
                          <p className="text-xs text-yellow-400 flex items-center justify-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {tableInfo.requests} pending
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Click ripple effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 group-active:bg-white transition-opacity duration-200" />
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto border border-border/50">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm">
              <div className="flex items-center gap-3 group cursor-default">
                <div className="relative">
                  <div className="h-5 w-5 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
                </div>
                <span className="text-muted-foreground font-medium">Available</span>
              </div>
              <div className="flex items-center gap-3 group cursor-default">
                <div className="relative">
                  <div className="h-5 w-5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" />
                </div>
                <span className="text-muted-foreground font-medium">Occupied</span>
              </div>
              {activeTable && (
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="relative">
                    <div className="h-5 w-5 rounded-full bg-primary shadow-[0_0_15px_rgba(255,215,0,0.6)] ring-2 ring-primary/50" />
                  </div>
                  <span className="text-primary font-medium">Your Selection</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSelection;
