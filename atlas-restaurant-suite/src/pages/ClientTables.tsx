import React from 'react';
import { Utensils } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import ClientTableCard from '@/components/ClientTableCard';

const ClientTables: React.FC = () => {
  const { tables } = useRestaurant();
  
  // Get all tables 1-10
  const tableIds = Array.from({ length: 10 }, (_, i) => 
    `Table_${String(i + 1).padStart(2, '0')}`
  );

  // Count available tables
  const availableCount = tableIds.filter(tableId => {
    const session = tables[tableId];
    if (!session) return true;
    return session.requests.length === 0 && session.cart.length === 0 && !session.isLocked;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                ATLAS HOUSE
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {availableCount} of {tableIds.length} tables available
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Tables Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tableIds.map((tableId, index) => {
            const session = tables[tableId] || {
              tableId,
              isLocked: false,
              cart: [],
              requests: [],
              isVip: false,
            };
            
            return (
              <ClientTableCard
                key={tableId}
                session={session}
                index={index}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-10 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Occupied</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientTables;
