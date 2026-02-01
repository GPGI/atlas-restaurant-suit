import React from 'react';
import { Utensils } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ClientTables: React.FC = () => {
  // Get all tables 1-10
  const tableIds = Array.from({ length: 10 }, (_, i) => 
    `Table_${String(i + 1).padStart(2, '0')}`
  );

  // Get the current origin (domain) to generate full URLs
  const getMenuUrl = (tableId: string) => {
    // Use window.location to get the full URL
    const protocol = window.location.protocol; // http: or https:
    const host = window.location.host; // domain:port
    const url = `${protocol}//${host}/menu?table=${encodeURIComponent(tableId)}`;
    return url;
  };

  // Get table number for display (e.g., "01" -> "1")
  const getTableNumber = (tableId: string) => {
    return tableId.replace('Table_', '');
  };

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
                Scan QR code to view menu
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* QR Codes Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tableIds.map((tableId) => {
            const menuUrl = getMenuUrl(tableId);
            const tableNumber = getTableNumber(tableId);
            
            return (
              <div
                key={tableId}
                className="flex flex-col items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
              >
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG
                    value={menuUrl}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Table {tableNumber}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ClientTables;
