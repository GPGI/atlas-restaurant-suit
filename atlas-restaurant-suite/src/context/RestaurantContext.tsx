import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  resetTable: (tableId: string) => Promise<void>;
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

  // Load menu items from Supabase
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('cat', { ascending: true });

        if (error) throw error;

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
        }
      } catch (error) {
        console.error('Error loading menu items:', error);
      }
    };

    loadMenuItems();
  }, []);

  // Load table sessions from Supabase
  useEffect(() => {
    const loadTableSessions = async () => {
      try {
        // Load all tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('restaurant_tables')
          .select('*');

        if (tablesError) throw tablesError;

        // Load all cart items
        const { data: cartData, error: cartError } = await supabase
          .from('cart_items')
          .select(`
            *,
            menu_items (id, name, price)
          `);

        if (cartError) throw cartError;

        // Load all table requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('table_requests')
          .select('*')
          .order('timestamp', { ascending: false });

        if (requestsError) throw requestsError;

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

          // Get requests for this table
          const requests: TableRequest[] = (requestsData || [])
            .filter(r => r.table_id === tableId)
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
        setLoading(false);
      }
    };

    loadTableSessions();

    // Set up real-time subscriptions
    const cartSubscription = supabase
      .channel('cart_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cart_items' },
        () => {
          loadTableSessions();
        }
      )
      .subscribe();

    const requestsSubscription = supabase
      .channel('requests_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'table_requests' },
        () => {
          loadTableSessions();
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
  }, []);

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
    try {
      // Check if item already exists in cart
      const { data: existingCartItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('table_id', tableId)
        .eq('menu_item_id', item.id)
        .single();

      if (existingCartItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingCartItem.quantity + 1 })
          .eq('id', existingCartItem.id);
      } else {
        // Insert new cart item
        await supabase
          .from('cart_items')
          .insert({
            id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            table_id: tableId,
            menu_item_id: item.id,
            quantity: 1,
          });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, []);

  const removeFromCart = useCallback(async (tableId: string, itemId: string) => {
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId)
        .eq('menu_item_id', itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }, []);

  const updateCartQuantity = useCallback(async (tableId: string, itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('table_id', tableId)
          .eq('menu_item_id', itemId);
      } else {
        const { data: cartItem } = await supabase
          .from('cart_items')
          .select('id')
          .eq('table_id', tableId)
          .eq('menu_item_id', itemId)
          .single();

        if (cartItem) {
          await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItem.id);
        }
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  }, []);

  const clearCart = useCallback(async (tableId: string) => {
    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, []);

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

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  }, []);

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
    try {
      await supabase
        .from('table_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);
    } catch (error) {
      console.error('Error completing request:', error);
    }
  }, []);

  const resetTable = useCallback(async (tableId: string) => {
    try {
      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('table_id', tableId);

      // Delete all requests
      await supabase
        .from('table_requests')
        .delete()
        .eq('table_id', tableId);

      // Reset table status
      await supabase
        .from('restaurant_tables')
        .update({ is_locked: false, is_vip: false })
        .eq('table_id', tableId);
    } catch (error) {
      console.error('Error resetting table:', error);
    }
  }, []);

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

  return (
    <RestaurantContext.Provider value={{
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
      resetTable,
      getCartTotal,
      getCartItemCount,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
    }}>
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
