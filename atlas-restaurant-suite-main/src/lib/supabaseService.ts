import { supabase } from './supabase';
import { TableSession, CartItem, TableRequest } from '@/context/RestaurantContext';

// Convert TableSession to database format
const sessionToDb = (session: TableSession) => ({
  table_id: session.tableId,
  is_locked: session.isLocked,
  is_vip: session.isVip,
  cart: session.cart,
  requests: session.requests,
  updated_at: new Date().toISOString(),
});

// Convert database row to TableSession
const dbToSession = (row: any): TableSession => ({
  tableId: row.table_id,
  isLocked: row.is_locked,
  isVip: row.is_vip,
  cart: row.cart || [],
  requests: row.requests || [],
});

export const supabaseService = {
  // Check if Supabase is available
  isAvailable(): boolean {
    return supabase !== null;
  },

  // Load all tables
  async loadTables(): Promise<Record<string, TableSession>> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_id', { ascending: true });

      if (error) {
        console.error('Error loading tables:', error);
        throw error;
      }

      const tables: Record<string, TableSession> = {};
      if (data) {
        data.forEach((row) => {
          tables[row.table_id] = dbToSession(row);
        });
      }

      return tables;
    } catch (error) {
      console.error('Error loading tables:', error);
      throw error;
    }
  },

  // Upsert a table session
  async saveTable(session: TableSession): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('tables')
        .upsert({
          table_id: session.tableId,
          is_locked: session.isLocked,
          is_vip: session.isVip,
          cart: session.cart,
          requests: session.requests,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'table_id',
        });

      if (error) {
        console.error('Error saving table:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving table:', error);
      throw error;
    }
  },

  // Subscribe to table changes
  subscribeToTables(
    callback: (session: TableSession) => void
  ): () => void {
    if (!supabase) {
      return () => {}; // Return no-op unsubscribe function
    }

    const channel = supabase
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        (payload) => {
          if (payload.new) {
            callback(dbToSession(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },
};
