export interface QRScanData {
  tableId: string;
  timestamp: number;
  source: 'qr_code' | 'direct';
}

export const trackQRScan = (tableId: string) => {
  const scanData: QRScanData = {
    tableId,
    timestamp: Date.now(),
    source: 'qr_code',
  };
  
  const scans = JSON.parse(localStorage.getItem('qr_scans') || '[]');
  scans.push(scanData);
  
  // Keep only last 1000 scans
  if (scans.length > 1000) {
    scans.shift();
  }
  
  localStorage.setItem('qr_scans', JSON.stringify(scans));
};

export const getQRScanStats = () => {
  const scans: QRScanData[] = JSON.parse(localStorage.getItem('qr_scans') || '[]');
  
  const stats = {
    total: scans.length,
    byTable: {} as Record<string, number>,
    recent: scans.slice(-10),
  };
  
  scans.forEach(scan => {
    stats.byTable[scan.tableId] = (stats.byTable[scan.tableId] || 0) + 1;
  });
  
  return stats;
};
