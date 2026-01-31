import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabaseService } from '@/lib/supabaseService';

// Menu items data
export const menuItems = [
  { id: '1', cat: "🥣 Супи", name: "Пилешка супа", price: 3.50 },
  { id: '2', cat: "🥣 Супи", name: "Супа топчета", price: 3.80 },
  { id: '3', cat: "🥗 Салати", name: "Шопска салата", price: 5.50 },
  { id: '4', cat: "🥗 Салати", name: "Зелена салата", price: 4.80 },
  { id: '5', cat: "🍛 Основни", name: "Свинско с ориз", price: 6.90 },
  { id: '6', cat: "🍛 Основни", name: "Мусака", price: 5.50 },
  { id: '7', cat: "🍛 Основни", name: "Пилешко филе с картофи", price: 7.50 },
];

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
  getTableSession: (tableId: string, isVip?: boolean) => TableSession;
  addToCart: (tableId: string, item: CartItem) => void;
  removeFromCart: (tableId: string, itemId: string) => void;
  updateCartQuantity: (tableId: string, itemId: string, quantity: number) => void;
  clearCart: (tableId: string) => void;
  submitOrder: (tableId: string) => void;
  callWaiter: (tableId: string) => void;
  requestBill: (tableId: string, paymentMethod: 'cash' | 'card') => void;
  completeRequest: (tableId: string, requestId: string) => void;
  resetTable: (tableId: string) => void;
  getCartTotal: (tableId: string) => number;
  getCartItemCount: (tableId: string) => number;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const STORAGE_KEY = 'atlas_house_tables';

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
  const [isLoading, setIsLoading] = useState(true);
  const useSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Load tables from Supabase or localStorage on mount
  useEffect(() => {
    const loadTables = async () => {
      if (useSupabase) {
        try {
          const loadedTables = await supabaseService.loadTables();
          if (Object.keys(loadedTables).length > 0) {
            setTables(loadedTables);
          } else {
            // Initialize default tables in Supabase
            for (const table of Object.values(defaultTables)) {
              await supabaseService.saveTable(table);
            }
            setTables(defaultTables);
          }
        } catch (error) {
          console.error('Error loading from Supabase, falling back to localStorage:', error);
          // Fallback to localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setTables(JSON.parse(stored));
            } catch {
              setTables(defaultTables);
            }
          }
        }
      } else {
        // Use localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setTables(JSON.parse(stored));
          } catch {
            setTables(defaultTables);
          }
        }
      }
      setIsLoading(false);
    };

    loadTables();
  }, [useSupabase]);

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    if (!useSupabase) return;

    const unsubscribe = supabaseService.subscribeToTables((session) => {
      setTables((prev) => ({
        ...prev,
        [session.tableId]: session,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [useSupabase]);

  // Sync tables to localStorage (for fallback)
  useEffect(() => {
    if (isLoading) return;
    if (!useSupabase) {
      // Only sync to localStorage if Supabase is not available
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    }
  }, [tables, isLoading, useSupabase]);

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

  const addToCart = useCallback((tableId: string, item: CartItem) => {
    setTables(prev => {
      const table = prev[tableId] || { tableId, isLocked: false, cart: [], requests: [], isVip: false };
      const existingItem = table.cart.find(i => i.id === item.id);
      
      let newCart: CartItem[];
      if (existingItem) {
        newCart = table.cart.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newCart = [...table.cart, { ...item, quantity: 1 }];
      }
      
      const updatedTable = { ...table, cart: newCart };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const removeFromCart = useCallback((tableId: string, itemId: string) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      const updatedTable = {
        ...table,
        cart: table.cart.filter(i => i.id !== itemId)
      };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const updateCartQuantity = useCallback((tableId: string, itemId: string, quantity: number) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      let updatedTable;
      if (quantity <= 0) {
        updatedTable = {
          ...table,
          cart: table.cart.filter(i => i.id !== itemId)
        };
      } else {
        updatedTable = {
          ...table,
          cart: table.cart.map(i => 
            i.id === itemId ? { ...i, quantity } : i
          )
        };
      }
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const clearCart = useCallback((tableId: string) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      const updatedTable = { ...table, cart: [] };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const submitOrder = useCallback((tableId: string) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table || table.cart.length === 0) return prev;
      
      const orderDetails = table.cart.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const orderTotal = table.cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      const newRequest: TableRequest = {
        id: `req_${Date.now()}`,
        action: '🍽️ NEW ORDER',
        details: orderDetails,
        total: orderTotal,
        status: 'pending',
        timestamp: Date.now(),
      };
      
      const updatedTable = {
        ...table,
        cart: [],
        requests: [...table.requests, newRequest]
      };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const callWaiter = useCallback((tableId: string) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      const newRequest: TableRequest = {
        id: `req_${Date.now()}`,
        action: '🔔 WAITER CALL',
        details: 'Customer requested assistance',
        total: 0,
        status: 'pending',
        timestamp: Date.now(),
      };
      
      const updatedTable = {
        ...table,
        requests: [...table.requests, newRequest]
      };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const requestBill = useCallback((tableId: string, paymentMethod: 'cash' | 'card') => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      const totalBill = table.requests.reduce((sum, r) => sum + r.total, 0);
      
      const newRequest: TableRequest = {
        id: `req_${Date.now()}`,
        action: '💳 BILL REQUEST',
        details: `Payment: ${paymentMethod === 'cash' ? 'Cash' : 'Card'}`,
        total: totalBill,
        status: 'pending',
        timestamp: Date.now(),
        paymentMethod,
      };
      
      const updatedTable = {
        ...table,
        isLocked: true,
        requests: [...table.requests, newRequest]
      };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const completeRequest = useCallback((tableId: string, requestId: string) => {
    setTables(prev => {
      const table = prev[tableId];
      if (!table) return prev;
      
      const updatedTable = {
        ...table,
        requests: table.requests.map(r => 
          r.id === requestId ? { ...r, status: 'completed' as const } : r
        )
      };
      
      // Sync immediately for better UX
      if (useSupabase) {
        supabaseService.saveTable(updatedTable).catch(console.error);
      }
      
      return {
        ...prev,
        [tableId]: updatedTable
      };
    });
  }, [useSupabase]);

  const resetTable = useCallback((tableId: string) => {
    const resetSession: TableSession = {
      tableId,
      isLocked: false,
      cart: [],
      requests: [],
      isVip: false,
    };
    
    setTables(prev => ({
      ...prev,
      [tableId]: resetSession
    }));
    
    // Sync immediately for better UX
    if (useSupabase) {
      supabaseService.saveTable(resetSession).catch(console.error);
    }
  }, [useSupabase]);

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

  return (
    <RestaurantContext.Provider value={{
      tables,
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
