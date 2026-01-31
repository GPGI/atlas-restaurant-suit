import React, { useEffect, useState } from 'react';
import { supabaseService } from '@/lib/supabaseService';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SupabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (!supabaseService.isAvailable()) {
        setStatus('disconnected');
        setError('Supabase not configured');
        return;
      }

      try {
        // Try to load tables to verify connection
        await supabaseService.loadTables();
        setStatus('connected');
        setError(null);
      } catch (err: any) {
        setStatus('disconnected');
        setError(err.message || 'Connection failed');
      }
    };

    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 glass-card rounded-lg p-3 border border-border/50 flex items-center gap-2 text-xs">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Checking Supabase...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 glass-card rounded-lg p-3 border flex items-center gap-2 text-xs transition-all',
        status === 'connected'
          ? 'border-success/50 bg-success/10'
          : 'border-destructive/50 bg-destructive/10'
      )}
      title={error || undefined}
    >
      {status === 'connected' ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-success font-medium">Supabase Connected</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">
            {error || 'Supabase Disconnected'}
          </span>
        </>
      )}
    </div>
  );
};

export default SupabaseStatus;
