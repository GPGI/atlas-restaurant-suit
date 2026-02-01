import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Send, Bell, CreditCard, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/context/RestaurantContext';
import MenuItemCard from '@/components/MenuItemCard';
import CartSummary from '@/components/CartSummary';
import CartDrawer from '@/components/CartDrawer';
import PaymentModal from '@/components/PaymentModal';
import { trackQRScan } from '@/utils/analytics';
import { triggerHapticFeedback, isOnline } from '@/utils/optimization';

const CustomerMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Support both /menu?table=Table_01 and /t/1 formats
  const getTableId = () => {
    if (tableNumber) {
      // Convert /t/1 to Table_01 format
      const num = parseInt(tableNumber);
      if (!isNaN(num) && num >= 1 && num <= 10) {
        return `Table_${String(num).padStart(2, '0')}`;
      }
    }
    return searchParams.get('table') || 'Table_01';
  };
  
  const tableId = getTableId();
  
  // Track QR code scan analytics
  useEffect(() => {
    if (tableNumber) {
      trackQRScan(tableId);
    }
  }, [tableNumber, tableId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const {
    menuItems,
    getTableSession,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    submitOrder,
    callWaiter,
    requestBill,
    getCartTotal,
    getCartItemCount,
    loading,
  } = useRestaurant();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!isOnline());
  
  const session = getTableSession(tableId);
  const cartTotal = getCartTotal(tableId);
  const cartItemCount = getCartItemCount(tableId);
  
  // Calculate total bill from completed orders
  const totalBill = useMemo(() => {
    return session.requests.reduce((sum, r) => sum + r.total, 0) + cartTotal;
  }, [session.requests, cartTotal]);

  // Group menu items by category - memoized with proper dependency
  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.cat]) {
        acc[item.cat] = [];
      }
      acc[item.cat].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);
  }, [menuItems]);

  const getItemQuantity = useCallback((itemId: string) => {
    const cartItem = session.cart.find(i => i.id === itemId);
    return cartItem?.quantity || 0;
  }, [session.cart]);

  // Debounce helper
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  const handleAddItem = useCallback(async (item: typeof menuItems[0]) => {
    if (session.isLocked || loadingItems.has(item.id)) return;
    
    triggerHapticFeedback('light');
    setLoadingItems(prev => new Set(prev).add(item.id));
    
    try {
      await addToCart(tableId, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
      // Only show toast on first add, not on subsequent adds
      const currentQty = getItemQuantity(item.id);
      if (currentQty === 1) {
        toast({
          title: '✅ Добавено',
          description: `${item.name} е добавено в поръчката`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      triggerHapticFeedback('heavy');
      toast({
        title: 'Грешка',
        description: 'Неуспешно добавяне на артикул. Моля опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [session.isLocked, loadingItems, tableId, addToCart, getItemQuantity, toast]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    if (session.isLocked || loadingItems.has(itemId)) return;
    
    triggerHapticFeedback('light');
    setLoadingItems(prev => new Set(prev).add(itemId));
    
    try {
      const currentQty = getItemQuantity(itemId);
      await updateCartQuantity(tableId, itemId, currentQty - 1);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      triggerHapticFeedback('heavy');
      toast({
        title: 'Грешка',
        description: 'Неуспешно премахване на артикул',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [session.isLocked, loadingItems, tableId, updateCartQuantity, getItemQuantity, toast]);

  const handleUpdateCartQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (session.isLocked || loadingItems.has(itemId)) return;
    
    triggerHapticFeedback('light');
    setLoadingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateCartQuantity(tableId, itemId, quantity);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      triggerHapticFeedback('heavy');
      toast({
        title: 'Грешка',
        description: 'Неуспешно обновяване на количество',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [session.isLocked, loadingItems, tableId, updateCartQuantity, toast]);

  const handleRemoveFromCart = useCallback(async (itemId: string) => {
    if (session.isLocked || loadingItems.has(itemId)) return;
    
    triggerHapticFeedback('medium');
    setLoadingItems(prev => new Set(prev).add(itemId));
    
    try {
      await removeFromCart(tableId, itemId);
      toast({
        title: '✅ Премахнато',
        description: 'Артикулът е премахнат от кошницата',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      triggerHapticFeedback('heavy');
      toast({
        title: 'Грешка',
        description: 'Неуспешно премахване на артикул',
        variant: 'destructive',
      });
    } finally {
      setLoadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [session.isLocked, loadingItems, tableId, removeFromCart, toast]);

  const handleClearCart = useCallback(async () => {
    if (session.isLocked || session.cart.length === 0) return;
    
    try {
      await clearCart(tableId);
      toast({
        title: '✅ Кошницата е изчистена',
        description: 'Всички артикули са премахнати',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно изчистване на кошницата',
        variant: 'destructive',
      });
    }
  }, [session.isLocked, session.cart.length, tableId, clearCart, toast]);

  const handleSubmitOrder = useCallback(async () => {
    if (session.isLocked || cartItemCount === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitOrder(tableId);
      toast({
        title: '✅ Поръчката е изпратена',
        description: 'Благодарим ви! Ще я приготвим скоро.',
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно изпращане на поръчка. Моля опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [session.isLocked, cartItemCount, isSubmitting, tableId, submitOrder, toast]);

  const handleCallWaiter = async () => {
    if (session.isLocked) return;
    
    try {
      await callWaiter(tableId);
      toast({
        title: '🔔 Сервитьорът е повикан',
        description: 'Моля, изчакайте.',
      });
    } catch (error) {
      console.error('Error calling waiter:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно повикване на сервитьор',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSelect = async (method: 'cash' | 'card') => {
    setPaymentModalOpen(false);
    try {
      await requestBill(tableId, method);
      toast({
        title: '💳 Заявка за сметка',
        description: `Плащане: ${method === 'cash' ? 'В брой' : 'С карта'}`,
      });
    } catch (error) {
      console.error('Error requesting bill:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешна заявка за сметка',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Зареждане на менюто...</p>
        </div>
      </div>
    );
  }

  if (session.isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-premium rounded-2xl p-8 text-center max-w-sm animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">
            Сесията е приключена
          </h2>
          <p className="text-muted-foreground">
            Благодарим ви, че посетихте ATLAS HOUSE!
          </p>
          <p className="text-primary font-semibold mt-4 text-lg">
            Обща сметка: {totalBill.toFixed(2)} лв
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-28 md:pb-32" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-md border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {isOffline && (
            <div className="mb-3 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-200 animate-fade-in">
              ⚠️ Няма интернет връзка. Някои функции може да не работят.
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full hover:bg-secondary/50 transition-colors touch-manipulation flex-shrink-0"
                onClick={() => navigate('/')}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl sm:text-2xl font-light text-foreground tracking-wider truncate">
                  ATLAS HOUSE
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-light tracking-wider uppercase truncate">
                  {tableId.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0" onClick={() => setCartDrawerOpen(true)}>
              <CartSummary itemCount={cartItemCount} total={cartTotal} />
            </div>
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="space-y-8 sm:space-y-12 md:space-y-16 stagger-children">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="animate-fade-in">
              {/* Elegant Category Header */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <h2 className="font-display text-xl sm:text-2xl font-light text-foreground tracking-wide mb-2">
                  {category}
                </h2>
                <div className="h-px w-12 sm:w-16 bg-primary/40" />
              </div>
              
              {/* Menu Items - Classic Restaurant Style */}
              <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/30 p-4 sm:p-6 space-y-0">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => handleAddItem(item)}
                    onRemove={() => handleRemoveItem(item.id)}
                    disabled={session.isLocked}
                    isLoading={loadingItems.has(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t border-border/50 p-4 sm:p-5 shadow-2xl"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3">
          {/* Submit Order Button */}
          <Button
            className="w-full btn-gold h-12 sm:h-14 text-sm font-light tracking-wider uppercase shadow-lg hover:shadow-xl transition-all touch-manipulation"
            onClick={handleSubmitOrder}
            disabled={cartItemCount === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Изпращане...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Изпрати поръчка
              </>
            )}
          </Button>
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-11 sm:h-12 border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all text-sm font-light touch-manipulation"
              onClick={handleCallWaiter}
              disabled={session.isLocked}
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Сервитьор</span>
              <span className="xs:hidden">Серв.</span>
            </Button>
            <Button
              variant="outline"
              className="h-11 sm:h-12 border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all text-sm font-light touch-manipulation"
              onClick={() => setPaymentModalOpen(true)}
              disabled={session.isLocked}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Сметка
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        cartItems={session.cart}
        total={cartTotal}
        itemCount={cartItemCount}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        isLoading={loadingItems.size > 0}
        disabled={session.isLocked}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSelectPayment={handlePaymentSelect}
        total={totalBill}
      />
    </div>
  );
};

export default CustomerMenu;
