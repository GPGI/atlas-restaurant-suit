import React, { useState, useCallback } from 'react';
import { Utensils, QrCode } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';
import { getTranslations, getStoredLanguage, type Language } from '@/utils/i18n';
import QRCodeCard from '@/components/QRCodeCard';

const ClientTables: React.FC = () => {
  const [language] = useState<Language>(getStoredLanguage());
  const t = getTranslations(language);

  // Get all tables 1-10
  const tableIds = Array.from({ length: 10 }, (_, i) => 
    `Table_${String(i + 1).padStart(2, '0')}`
  );

  // Get shorter URL format (/t/1 instead of /menu?table=Table_01)
  const getMenuUrl = useCallback((tableId: string) => {
    try {
      const origin = window.location.origin;
      const tableNumber = tableId.replace('Table_', '');
      // Use shorter URL format
      return `${origin}/t/${parseInt(tableNumber)}`;
    } catch (error) {
      console.error('Error generating URL:', error);
      // Fallback to longer format
      return `${window.location.origin}/menu?table=${tableId}`;
    }
  }, []);

  // Get table number for display
  const getTableNumber = useCallback((tableId: string) => {
    return tableId.replace('Table_', '');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                ATLAS HOUSE
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t.scanQRCode}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* QR Codes Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {tableIds.map((tableId) => {
            const menuUrl = getMenuUrl(tableId);
            const tableNumber = getTableNumber(tableId);
            
            return (
              <QRCodeCard
                key={tableId}
                tableId={tableId}
                tableNumber={tableNumber}
                menuUrl={menuUrl}
                translations={t}
              />
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-10 sm:mt-12 p-6 bg-card border border-border rounded-xl">
          <div className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                {t.scanWithPhone}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.instructions}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientTables;
