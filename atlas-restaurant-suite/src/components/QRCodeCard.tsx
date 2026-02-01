import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { trackQRScan } from '@/utils/analytics';
import { cn } from '@/lib/utils';

interface QRCodeCardProps {
  tableId: string;
  tableNumber: string;
  menuUrl: string;
  translations: {
    table: string;
    copyUrl: string;
    urlCopied: string;
    share: string;
    download: string;
  };
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({
  tableId,
  tableNumber,
  menuUrl,
  translations,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast({
        title: translations.urlCopied,
        description: menuUrl,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      });
    }
  }, [menuUrl, toast, translations]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${translations.table} ${tableNumber} - ATLAS HOUSE`,
          text: 'Scan QR code to view menu',
          url: menuUrl,
        });
        trackQRScan(tableId);
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopyUrl();
    }
  }, [menuUrl, tableId, tableNumber, translations, handleCopyUrl]);

  const handleDownload = useCallback(() => {
    try {
      // Find the SVG element
      const svgElement = document.querySelector(`[data-qr-id="${tableId}"] svg`) as SVGElement;
      if (!svgElement) {
        toast({
          title: translations.download,
          description: 'Right-click the QR code and select "Save image as"',
        });
        return;
      }

      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = svgUrl;
      a.download = `qr-code-table-${tableNumber}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(svgUrl);
      
      toast({
        title: translations.download,
        description: 'QR code downloaded successfully',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to download QR code. Try right-clicking and saving the image.',
        variant: 'destructive',
      });
    }
  }, [tableId, tableNumber, translations, toast]);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 p-4 sm:p-5 bg-card border border-border rounded-xl',
        'transition-all duration-200 hover:shadow-lg hover:border-primary/30'
      )}
    >
      {/* QR Code */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm" data-qr-id={tableId}>
        <QRCodeSVG
          value={menuUrl}
          size={220}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Table Number */}
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-bold text-foreground">
          {translations.table} {tableNumber}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 w-full justify-center">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleCopyUrl}
          title={translations.copyUrl}
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        
        {navigator.share && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleShare}
            title={translations.share}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleDownload}
          title={translations.download}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QRCodeCard;
