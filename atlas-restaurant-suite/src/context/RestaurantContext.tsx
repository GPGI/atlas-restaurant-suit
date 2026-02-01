import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { debounce, retryWithBackoff } from '@/utils/optimization';

// Default menu items data
export const defaultMenuItems = [
  { id: '1', cat: "🥣 Супи", name: "Пилешка супа", price: 3.50 },
  { id: '2', cat: "🥣 Супи", name: "Супа топчета", price: 3.80 },
  { id: '3', cat: "🥗 Салати", name: "Шопска салата", price: 5.50 },
  { id: '4', cat: "🥗 Салати", name: "Зелена салата", price: 4.80 },
  { id: '5', cat: "🍛 Основни", name: "Свинско с ориз", price: 6.90 },
  { id: '6', cat: "🍛 Основни", name: "Мусака", price: 5.50 },
  { id: '7', cat: "🍛 Основни", name: "Пилешко филе с картофи", price: 7.50 },
];

export interface MenuItem {
  id: string;
  cat: string;
  name: string;
  price: number;
  desc?: string;
  description?: string; // Database field name
}

// Premium menu items
export const premiumMenuItems = [
  { id: 'p1', cat: "🥂 Appetizers", name: "Truffle Carpaccio", desc: "Aged beef with black truffle shavings", price: 18.50 },
  { id: 'p2', cat: "🥂 Appetizers", name: "Lobster Bisque", desc: "Creamy soup with cognac finish", price: 14.00 },
  { id: 'p3', cat: "🍷 Mains", name: "Wagyu Ribeye", desc: "A5 Japanese wagyu, 250g", price: 85.00 },
  { id: 'p4', cat: "🍷 Mains", name: "Dover Sole Meunière", desc: "Whole fish, brown butter, capers", price: 45.00 },
  { id: 'p5', cat: "🍷 Mains", name: "Duck à l'Orange", desc: "Classic French preparation", price: 38.00 },
  { id: 'p6', cat: "🍰 Desserts", name: "Crème Brûlée", desc: "Madagascar vanilla, caramelized", price: 12.00 },
  { id: 'p7', cat: "🍰 Desserts", name: "Chocolate Soufflé", desc: "Valrhona dark, 15min preparation", price: 16.00 },
];

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TableRequest {
  id: string;
  action: string;
  details: string;
  total: number;
  status: 'pending' | 'completed';
  timestamp: number;
  paymentMethod?: 'cash' | 'card';
}

export interface TableSession {
  tableId: string;
  isLocked: boolean;
  cart: CartItem[];
  requests: TableRequest[];
  isVip: boolean;
}

interface RestaurantContextType {
  tables: Record<string, TableSession>;
  menuItems: MenuItem[];
  loading: boolean;
  getTableSession: (tableId: string, isVip?: boolean) => TableSession;
  addToCart: (tableId: string, item: CartItem) => Promise<void>;
  removeFromCart: (tableId: string, itemId: string) => Promise<void>;
  updateCartQuantity: (tableId: string, itemId: string, quantity: number) => Promise<void>;
  clearCart: (tableId: string) => Promise<void>;
  submitOrder: (tableId: string) => Promise<void>;
  callWaiter: (tableId: string) => Promise<void>;
  requestBill: (tableId: string, paymentMethod: 'cash' | 'card') => Promise<void>;
  completeRequest: (tableId: string, requestId: string) => Promise<void>;
  markAsPaid: (tableId: string) => Promise<void>;
  resetTable: (tableId: string) => Promise<void>;
  resetAllTables: () => Promise<void>;
  getCartTotal: (tableId: string) => number;
  getCartItemCount: (tableId: string) => number;
  // Menu management
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const defaultTables: Record<string, TableSession> = {};
for (let i = 1; i <= 10; i++) {
  const tableId = `Table_${String(i).padStart(2, '0')}`;
  defaultTables[tableId] = {
    tableId,
    isLocked: false,
    cart: [],
    requests: [],
    isVip: false,
  };
}

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Record<string, TableSession>>(defaultTables);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [loading, setLoading] = useState(true);
  const [paidTables, setPaidTables] = useState<Set<string>>(new Set()); // Track tables that were just marked as paid

  // Load menu items from Supabase
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('cat', { ascending: true });

        if (error) {
          console.error('Supabase error loading menu items:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          // Fallback to default menu items if Supabase fails
          setMenuItems(defaultMenuItems);
          return;
        }

        if (data && data.length > 0) {
          // Map database fields to interface
          const mappedItems: MenuItem[] = data.map(item => ({
            id: item.id,
            cat: item.cat,
            name: item.name,
            price: parseFloat(item.price),
            desc: item.description || undefined,
            description: item.description || undefined,
          }));
          setMenuItems(mappedItems);
        } else {
          // If no data, use defaults
          setMenuItems(defaultMenuItems);
        }
      } catch (error) {
        console.error('Error loading menu items:', error);
        // Fallback to default menu items
        setMenuItems(defaultMenuItems);
      }
    };

    loadMenuItems();
  }, []);

  // Load table sessions from Supabase
  const loadTableSessions = useCallback(async () => {
    try {
      setLoading(true);
      // Load all tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('*');

      if (tablesError) {
        console.error('Supabase error loading tables:', tablesError);
        console.error('Error details:', {
          message: tablesError.message,
          details: tablesError.details,
          hint: tablesError.hint,
          code: tablesError.code,
        });
        // Fallback to default tables
        setTables(defaultTables);
        setLoading(false);
        return;
      }

      // Load all cart items with menu item details
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (id, name, price)
        `);

      if (cartError) {
        console.error('Supabase error loading cart items:', cartError);
        // Continue with empty cart if cart fails
      }

      // Load all table requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('table_requests')
        .select('*')
        .order('timestamp', { ascending: false });

      if (requestsError) {
        console.error('Supabase error loading requests:', requestsError);
        // Continue with empty requests if requests fail
      }

      // Build table sessions
      const sessions: Record<string, TableSession> = {};
      
      (tablesData || []).forEach(table => {
        const tableId = table.table_id;
        
        // Get cart items for this table
        const cartItems: CartItem[] = (cartData || [])
          .filter(ci => ci.table_id === tableId)
          .map(ci => ({
            id: ci.menu_item_id,
            name: (ci.menu_items as any)?.name || '',
            price: parseFloat((ci.menu_items as any)?.price || '0'),
            quantity: ci.quantity,
          }));

        // Get requests for this table - only show current session requests
        // Filter by session_started_at to hide previous session orders
        // Also hide requests for tables that were just marked as paid
        // IMPORTANT: Never show requests from completed_orders or table_history_archive
        // Only fetch from table_requests and filter by session
        const sessionStartedAt = table.session_started_at 
          ? new Date(table.session_started_at).getTime() 
          : 0;
        
        const requests: TableRequest[] = (requestsData || [])
          .filter(r => {
            // Don't show requests for tables that were just marked as paid
            if (paidTables.has(tableId)) {
              return false;
            }
            
            // Only show requests from current session (created after session_started_at)
            if (r.table_id === tableId) {
              // If session_started_at exists, only show requests after that time
              // This ensures archived/completed orders stay hidden
              if (sessionStartedAt > 0) {
                const requestTime = typeof r.timestamp === 'string' 
                  ? new Date(r.timestamp).getTime() 
                  : r.timestamp;
                return requestTime >= sessionStartedAt;
              }
              // If no session_started_at, show all (backward compatibility)
              return true;
            }
            return false;
          })
          .map(r => ({
            id: r.id,
            action: r.action,
            details: r.details || '',
            total: parseFloat(r.total || '0'),
            status: r.status as 'pending' | 'completed',
            timestamp: r.timestamp,
            paymentMethod: r.payment_method as 'cash' | 'card' | undefined,
          }));

        sessions[tableId] = {
          tableId,
          isLocked: table.is_locked,
          cart: cartItems,
          requests,
          isVip: table.is_vip,
        };
      });

      setTables(sessions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading table sessions:', error);
      // Fallback to default tables on error
      setTables(defaultTables);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTableSessions();

    // Debounced reload to prevent excessive API calls
    const debouncedReload = debounce(() => {
      loadTableSessions();
    }, 500);

    // Set up real-time subscriptions with debouncing
    const cartSubscription = supabase
      .channel('cart_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cart_items' },
        () => {
          // Debounced reload to prevent excessive calls
          debouncedReload();
        }
      )
      .subscribe();

    const requestsSubscription = supabase
      .channel('requests_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'table_requests' },
        () => {
          debouncedReload();
        }
      )
      .subscribe();

    const menuSubscription = supabase
      .channel('menu_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        async () => {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .order('cat', { ascending: true });

          if (!error && data) {
            const mappedItems: MenuItem[] = data.map(item => ({
              id: item.id,
              cat: item.cat,
              name: item.name,
              price: parseFloat(item.price),
              desc: item.description || undefined,
              description: item.description || undefined,
            }));
            setMenuItems(mappedItems);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cartSubscription);
      supabase.removeChannel(requestsSubscription);
      supabase.removeChannel(menuSubscription);
    };
  }, [loadTableSessions]);

  const getTableSession = useCallback((tableId: string, isVip = false): TableSession => {
    if (tables[tableId]) {
      return { ...tables[tableId], isVip };
    }
    return {
      tableId,
      isLocked: false,
      cart: [],
      requests: [],
      isVip,
    };
  }, [tables]);

  const addToCart = useCallback(async (tableId: string, item: CartItem) => {
    // Optimistic update: update local state immediately
    setTables(prev => {
      const updated = { ...prev };
      if (!updated[tableId]) {
        updated[tableId] = {
          tableId,
          isLocked: false,
          cart: [],
          requests: [],
          isVip: false,
        };
      }
      
      const existingCartItem = updated[tableId].cart.find(ci => ci.id === item.id);
      if (existingCartItem) {
        updated[tableId] = {
          ...updated[tableId],
          cart: updated[tableId].cart.map(ci =>
            ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
          ),
        };
      } else {
        updated[tableId] = {
          ...updated[tableId],
          cart: [...updated[tableId].cart, { ...item, quantity: 1 }],
        };
      }
      return updated;
    });

    try {
      // Check if item already exists in cart (use maybeSingle to avoid error when not found)
      const { data: existingCartItem, error: selectError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('table_id', tableId)
        .eq('menu_item_id', item.id)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected, ignore it
        throw selectError;
      }

      if (existingCartItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingCartItem.quantity + 1 })
          .eq('id', existingCartItem.id);
        
        if (updateError) {
          console.error('Error updating cart item:', updateError);
          // Rollback optimistic update on error
          loadTableSessions();
          throw updateError;
        }
      } else {
        // Insert new cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            table_id: tableId,
            menu_item_id: item.id,
            quantity: 1,
          });
        
        if (insertError) {
          console.error('Error inserting cart item:', insertError);
          // Rollback optimistic update on error
          loadTableSessions();
          throw insertError;
        }
      }
      // Real-time subscription will sync the state, but optimistic update makes UI feel instant
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Rollback on error - reload from server
      loadTableSessions();
      // Retry with exponential backoff for network errors
      if ((error as any)?.code === 'PGRST301' || (error as any)?.message?.includes('fetch')) {
        try {
          await retryWithBackoff(async () => {
            const { data: existingCartItem } = await supabase
              .from('cart_items')
              .select('*')
              .eq('table_id', tableId)
              .eq('menu_item_id', item.id)
              .maybeSingle();
            
            if (existingCartItem) {
              await supabase
                .from('cart_items')
                .update({ quantity: existingCartItem.quantity + 1 })
                .eq('id', existingCartItem.id);
            } else {
              await supabase
                .from('cart_items')
                .insert({
                  id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  table_id: tableId,
                  menu_item_id: item.id,
                  quantity: 1,
                });
            }
          }, 3, 1000);
          loadTableSessions(); // Reload after successful retry
        } catch (retryError) {
          throw error; // Throw original error if retry fails
        }
      } else {
        throw error; // Re-throw so UI can handle it
      }
    }
  }, [loadTableSessions]);

  const removeFromCart = useCallback(async (tableId: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId)
        .eq('menu_item_id', itemId);
      
      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }, []);

  const updateCartQuantity = useCallback(async (tableId: string, itemId: string, quantity: number) => {
    // Optimistic update
    setTables(prev => {
      const updated = { ...prev };
      if (!updated[tableId]) return updated;
      
      if (quantity <= 0) {
        updated[tableId] = {
          ...updated[tableId],
          cart: updated[tableId].cart.filter(ci => ci.id !== itemId),
        };
      } else {
        updated[tableId] = {
          ...updated[tableId],
          cart: updated[tableId].cart.map(ci =>
            ci.id === itemId ? { ...ci, quantity } : ci
          ),
        };
      }
      return updated;
    });

    try {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('table_id', tableId)
          .eq('menu_item_id', itemId);
        
        if (error) {
          loadTableSessions(); // Rollback
          throw error;
        }
      } else {
        const { data: cartItem, error: selectError } = await supabase
          .from('cart_items')
          .select('id')
          .eq('table_id', tableId)
          .eq('menu_item_id', itemId)
          .maybeSingle();

        if (selectError && selectError.code !== 'PGRST116') {
          loadTableSessions(); // Rollback
          throw selectError;
        }

        if (cartItem) {
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItem.id);
          
          if (updateError) {
            loadTableSessions(); // Rollback
            throw updateError;
          }
        }
      }
      // Real-time subscription will sync
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  }, [loadTableSessions]);

  const clearCart = useCallback(async (tableId: string) => {
    // Optimistic update
    setTables(prev => {
      const updated = { ...prev };
      if (updated[tableId]) {
        updated[tableId] = {
          ...updated[tableId],
          cart: [],
        };
      }
      return updated;
    });

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Reload on error
      loadTableSessions();
      throw error;
    }
  }, [loadTableSessions, tables]);

  const submitOrder = useCallback(async (tableId: string) => {
    try {
      // Get current cart
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (id, name, price)
        `)
        .eq('table_id', tableId);

      if (cartError) throw cartError;
      if (!cartItems || cartItems.length === 0) return;

      const orderDetails = cartItems
        .map(ci => `${ci.quantity}x ${(ci.menu_items as any)?.name}`)
        .join(', ');
      const orderTotal = cartItems.reduce(
        (sum, ci) => sum + (parseFloat((ci.menu_items as any)?.price || '0') * ci.quantity),
        0
      );

      // Create order request
      const requestId = `req_${Date.now()}`;
      await supabase
        .from('table_requests')
        .insert({
          id: requestId,
          table_id: tableId,
          action: '🍽️ NEW ORDER',
          details: orderDetails,
          total: orderTotal,
          status: 'pending',
          timestamp: Date.now(),
        });

      // Clear cart immediately after order submission
      // This resets the menu to clean state, but bill requests remain visible
      await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);

      // Optimistic update: clear cart in UI immediately
      setTables(prev => {
        const updated = { ...prev };
        if (updated[tableId]) {
          updated[tableId] = {
            ...updated[tableId],
            cart: [], // Clear cart immediately
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  }, [tables]);

  const callWaiter = useCallback(async (tableId: string) => {
    try {
      await supabase
        .from('table_requests')
        .insert({
          id: `req_${Date.now()}`,
          table_id: tableId,
          action: '🔔 WAITER CALL',
          details: 'Customer requested assistance',
          total: 0,
          status: 'pending',
          timestamp: Date.now(),
        });
    } catch (error) {
      console.error('Error calling waiter:', error);
    }
  }, []);

  const requestBill = useCallback(async (tableId: string, paymentMethod: 'cash' | 'card') => {
    try {
      // Get total from all completed orders
      const { data: requests } = await supabase
        .from('table_requests')
        .select('total')
        .eq('table_id', tableId)
        .eq('status', 'completed');

      const totalBill = (requests || []).reduce((sum, r) => sum + parseFloat(r.total || '0'), 0);

      // Create bill request
      await supabase
        .from('table_requests')
        .insert({
          id: `req_${Date.now()}`,
          table_id: tableId,
          action: '💳 BILL REQUEST',
          details: `Payment: ${paymentMethod === 'cash' ? 'Cash' : 'Card'}`,
          total: totalBill,
          status: 'pending',
          timestamp: Date.now(),
          payment_method: paymentMethod,
        });

      // Lock table
      await supabase
        .from('restaurant_tables')
        .update({ is_locked: true })
        .eq('table_id', tableId);
    } catch (error) {
      console.error('Error requesting bill:', error);
    }
  }, []);

  const completeRequest = useCallback(async (tableId: string, requestId: string) => {
    // Optimistic update: update local state immediately
    setTables(prev => {
      const updated = { ...prev };
      if (!updated[tableId]) return updated;
      
      updated[tableId] = {
        ...updated[tableId],
        requests: updated[tableId].requests.map(req =>
          req.id === requestId ? { ...req, status: 'completed' as const } : req
        ),
      };
      
      return updated;
    });

    try {
      const { error } = await supabase
        .from('table_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);
      
      if (error) {
        console.error('Error completing request:', error);
        // Rollback on error
        loadTableSessions();
        throw error;
      }
      // Real-time subscription will sync
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }, [loadTableSessions]);

  const markAsPaid = useCallback(async (tableId: string) => {
    // Get current table data before clearing for archive
    const currentTable = tables[tableId];
    
    // Optimistic update: clear paid orders immediately
    setTables(prev => {
      const updated = { ...prev };
      if (!updated[tableId]) return updated;
      
      // Remove all requests (they're being paid, so remove from view)
      updated[tableId] = {
        ...updated[tableId],
        isLocked: false,
        requests: [], // Clear all orders when paid
      };
      
      return updated;
    });

    try {
      // Get all requests from database to move to completed_orders
      const { data: requestsData, error: fetchError } = await supabase
        .from('table_requests')
        .select('*')
        .eq('table_id', tableId);

      if (fetchError) {
        console.error('Error fetching requests:', fetchError);
        loadTableSessions();
        throw fetchError;
      }

      // Move all requests to completed_orders table immediately
      if (requestsData && requestsData.length > 0) {
        const completedOrders = requestsData.map(req => ({
          id: req.id,
          table_id: req.table_id,
          action: req.action,
          details: req.details || '',
          total: parseFloat(req.total || '0'),
          status: 'completed',
          timestamp: req.timestamp,
          payment_method: req.payment_method || null,
        }));

        const { error: insertError } = await supabase
          .from('completed_orders')
          .insert(completedOrders);

        if (insertError) {
          console.error('Error moving to completed_orders:', insertError);
          // Continue even if insert fails, but log it
        } else {
          console.log(`Moved ${completedOrders.length} orders to completed_orders for ${tableId}`);
        }
      }

      // Archive the paid session for historical records
      if (currentTable && currentTable.requests.length > 0) {
        const totalRevenue = currentTable.requests.reduce((sum, r) => sum + r.total, 0);
        const sessionStartTime = currentTable.requests.length > 0 
          ? Math.min(...currentTable.requests.map(r => r.timestamp))
          : Date.now();
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);

        // Archive the paid session
        const { error: archiveError } = await supabase
          .from('table_history_archive')
          .insert({
            id: `archive_${tableId}_${Date.now()}`,
            table_id: tableId,
            cart_items: [],
            requests: requestsData || [],
            total_revenue: totalRevenue,
            session_duration_minutes: sessionDuration,
          });

        if (archiveError) {
          console.error('Error archiving paid session:', archiveError);
          // Continue even if archive fails
        }
      }

      // Delete ALL requests from table_requests immediately (remove from active view)
      const { data: deletedRequests, error: deleteError } = await supabase
        .from('table_requests')
        .delete()
        .eq('table_id', tableId)
        .select();
      
      if (deleteError) {
        console.error('Error deleting requests:', deleteError);
        // Rollback on error
        loadTableSessions();
        throw deleteError;
      }
      
      console.log(`Deleted ${deletedRequests?.length || 0} requests from table_requests for ${tableId}`);

      // Clear cart as well (paid orders shouldn't have active cart)
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);

      if (cartError) {
        console.error('Error clearing cart after payment:', cartError);
        // Continue even if cart clear fails
      }

      // Unlock the table and start new session (do this BEFORE real-time reload)
      // This ensures the next data load filters out old orders
      const newSessionStart = new Date().toISOString();
      const { error: unlockError } = await supabase
        .from('restaurant_tables')
        .update({ 
          is_locked: false,
          session_started_at: newSessionStart // Start new session when marking as paid
        })
        .eq('table_id', tableId);
      
      if (unlockError) {
        console.error('Error unlocking table:', unlockError);
        // Rollback on error
        loadTableSessions();
        throw unlockError;
      }

      // Mark this table as paid to prevent showing old orders
      setPaidTables(prev => new Set(prev).add(tableId));
      
      // Double-check optimistic update to ensure requests stay cleared
      // This prevents real-time subscription from showing old orders
      setTables(prev => {
        const updated = { ...prev };
        if (updated[tableId]) {
          updated[tableId] = {
            ...updated[tableId],
            isLocked: false,
            requests: [], // Ensure requests stay empty
          };
        }
        return updated;
      });

      // Clear the paid flag after a short delay to allow deletion to complete
      // This gives time for the database deletion to finish
      setTimeout(() => {
        setPaidTables(prev => {
          const next = new Set(prev);
          next.delete(tableId);
          return next;
        });
      }, 2000); // 2 second delay to ensure deletion completes

      // Real-time subscription will sync, but optimistic update makes UI feel instant
    } catch (error) {
      console.error('Error marking as paid:', error);
      throw error;
    }
  }, [loadTableSessions, tables]);

  const resetTable = useCallback(async (tableId: string) => {
    // Optimistic update: clear everything immediately
    setTables(prev => {
      const updated = { ...prev };
      if (!updated[tableId]) return updated;
      
      updated[tableId] = {
        ...updated[tableId],
        isLocked: false,
        isVip: false,
        cart: [],
        requests: [],
      };
      
      return updated;
    });

    try {
      console.log(`Starting reset for ${tableId} - fetching data directly from database...`);

      // Step 1: Get all data directly from database (direct database connection)
      const [cartResult, requestsResult] = await Promise.all([
        supabase
          .from('cart_items')
          .select('*')
          .eq('table_id', tableId),
        supabase
          .from('table_requests')
          .select('*')
          .eq('table_id', tableId)
      ]);

      if (cartResult.error) {
        console.error('Error fetching cart:', cartResult.error);
        throw cartResult.error;
      }
      if (requestsResult.error) {
        console.error('Error fetching requests:', requestsResult.error);
        throw requestsResult.error;
      }

      const cartData = cartResult.data || [];
      const requestsData = requestsResult.data || [];

      console.log(`Found ${cartData.length} cart items and ${requestsData.length} requests for ${tableId}`);

      // Step 2: Move ALL requests to completed_orders (direct database operation)
      // This includes: orders, waiter calls, bill requests - everything
      if (requestsData.length > 0) {
        // Generate unique IDs to avoid conflicts (use timestamp + random)
        const completedOrders = requestsData.map(req => ({
          id: `completed_${req.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          table_id: req.table_id,
          action: req.action,
          details: req.details || '',
          total: parseFloat(req.total || '0'),
          status: 'completed',
          timestamp: req.timestamp,
          payment_method: req.payment_method || null,
        }));

        // Use upsert to handle potential conflicts gracefully
        const { data: insertedOrders, error: moveError } = await supabase
          .from('completed_orders')
          .upsert(completedOrders, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select();

        if (moveError) {
          console.error('Error moving to completed_orders:', moveError);
          // If upsert fails, try insert with conflict handling
          const { error: insertError } = await supabase
            .from('completed_orders')
            .insert(completedOrders)
            .select();
          
          if (insertError) {
            console.error('Error inserting to completed_orders (fallback):', insertError);
            // Continue even if insert fails - we'll still delete from table_requests
            console.warn('Continuing reset despite completed_orders error...');
          } else {
            console.log(`✅ Moved ${completedOrders.length} requests to completed_orders for ${tableId} (fallback)`);
          }
        } else {
          console.log(`✅ Moved ${insertedOrders?.length || completedOrders.length} requests to completed_orders for ${tableId}`);
        }
      }

      // Step 3: Archive the session (direct database operation)
      if (cartData.length > 0 || requestsData.length > 0) {
        const sessionStartTime = requestsData.length > 0 
          ? Math.min(...requestsData.map(r => r.timestamp))
          : Date.now();
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 60000);
        const totalRevenue = requestsData.reduce((sum, r) => sum + parseFloat(r.total || '0'), 0);

        const { error: archiveError } = await supabase
          .from('table_history_archive')
          .insert({
            id: `archive_${tableId}_${Date.now()}`,
            table_id: tableId,
            cart_items: cartData,
            requests: requestsData,
            total_revenue: totalRevenue,
            session_duration_minutes: sessionDuration,
          });

        if (archiveError) {
          console.error('Error archiving (non-critical):', archiveError);
          // Continue even if archive fails
        } else {
          console.log(`✅ Archived session for ${tableId}`);
        }
      }

      // Step 4: Delete ALL requests from table_requests (including bill requests)
      // This clears everything: orders, waiter calls, and bill requests
      const { data: deletedRequests, error: requestsError } = await supabase
        .from('table_requests')
        .delete()
        .eq('table_id', tableId) // Delete ALL requests, no filtering
        .select();

      if (requestsError) {
        console.error('Error deleting requests:', requestsError);
        loadTableSessions();
        throw requestsError;
      }
      console.log(`✅ Deleted ${deletedRequests?.length || 0} requests (including bills) from table_requests for ${tableId}`);
      
      // Double-check: Verify deletion was successful
      const { data: remainingRequests } = await supabase
        .from('table_requests')
        .select('id')
        .eq('table_id', tableId);
      
      if (remainingRequests && remainingRequests.length > 0) {
        console.warn(`⚠️ Warning: ${remainingRequests.length} requests still exist for ${tableId} after deletion. Force deleting...`);
        // Force delete any remaining requests
        await supabase
          .from('table_requests')
          .delete()
          .eq('table_id', tableId);
      }

      // Step 5: Delete ALL cart items (direct database operation)
      const { data: deletedCart, error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId)
        .select();

      if (cartError) {
        console.error('Error deleting cart:', cartError);
        loadTableSessions();
        throw cartError;
      }
      console.log(`✅ Deleted ${deletedCart?.length || 0} cart items for ${tableId}`);

      // Step 6: Reset table status and start new session (direct database operation)
      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ 
          is_locked: false, 
          is_vip: false,
          session_started_at: new Date().toISOString() // Start new session
        })
        .eq('table_id', tableId);

      if (tableError) {
        console.error('Error resetting table status:', tableError);
        loadTableSessions();
        throw tableError;
      }
      console.log(`✅ Reset table status for ${tableId}`);

      console.log(`🎉 Successfully reset ${tableId}: All data moved to completed_orders and cleared from active tables`);

      // Step 7: Force reload to ensure UI is in sync with database
      await loadTableSessions();

    } catch (error) {
      console.error('❌ Error resetting table:', error);
      // Reload on error to show actual database state
      loadTableSessions();
      throw error;
    }
  }, [loadTableSessions, tables]);

  const resetAllTables = useCallback(async () => {
    try {
      console.log('Starting reset for ALL tables...');
      
      // Get all table IDs (Table_01 through Table_10)
      const allTableIds = Array.from({ length: 10 }, (_, i) => 
        `Table_${String(i + 1).padStart(2, '0')}`
      );

      // Reset all tables in parallel
      const resetPromises = allTableIds.map(tableId => resetTable(tableId));
      await Promise.all(resetPromises);

      console.log('🎉 Successfully reset ALL tables');
    } catch (error) {
      console.error('Error resetting all tables:', error);
      throw error;
    }
  }, [resetTable]);

  const getCartTotal = useCallback((tableId: string): number => {
    const table = tables[tableId];
    if (!table) return 0;
    return table.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }, [tables]);

  const getCartItemCount = useCallback((tableId: string): number => {
    const table = tables[tableId];
    if (!table) return 0;
    return table.cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [tables]);

  // Menu management functions
  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const newId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await supabase
        .from('menu_items')
        .insert({
          id: newId,
          cat: item.cat,
          name: item.name,
          price: item.price,
          description: item.desc || item.description || null,
        });
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  }, []);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    try {
      const updateData: any = {};
      if (updates.cat !== undefined) updateData.cat = updates.cat;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.desc !== undefined || updates.description !== undefined) {
        updateData.description = updates.desc || updates.description || null;
      }

      await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    tables,
    menuItems,
    loading,
    getTableSession,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    submitOrder,
    callWaiter,
    requestBill,
    completeRequest,
    markAsPaid,
    resetTable,
    resetAllTables,
    getCartTotal,
    getCartItemCount,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  }), [
    tables,
    menuItems,
    loading,
    getTableSession,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    submitOrder,
    callWaiter,
    requestBill,
    completeRequest,
    markAsPaid,
    resetTable,
    resetAllTables,
    getCartTotal,
    getCartItemCount,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  ]);

  return (
    <RestaurantContext.Provider value={contextValue}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
