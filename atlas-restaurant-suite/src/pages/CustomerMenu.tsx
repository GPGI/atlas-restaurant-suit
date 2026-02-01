import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Send, Bell, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/context/RestaurantContext';
import MenuItemCard from '@/components/MenuItemCard';
import CartSummary from '@/components/CartSummary';
import PaymentModal from '@/components/PaymentModal';
import { trackQRScan } from '@/utils/analytics';

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
  
  const {
    menuItems,
    getTableSession,
    addToCart,
    updateCartQuantity,
    submitOrder,
    callWaiter,
    requestBill,
    getCartTotal,
    getCartItemCount,
    loading,
  } = useRestaurant();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  const session = getTableSession(tableId);
  const cartTotal = getCartTotal(tableId);
  const cartItemCount = getCartItemCount(tableId);
  
  // Calculate total bill from completed orders
  const totalBill = useMemo(() => {
    return session.requests.reduce((sum, r) => sum + r.total, 0) + cartTotal;
  }, [session.requests, cartTotal]);

  // Group menu items by category
  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.cat]) {
        acc[item.cat] = [];
      }
      acc[item.cat].push(item);
      return acc;
    }, {} as Record<string, typeof menuItems>);
  }, []);

  const getItemQuantity = (itemId: string) => {
    const cartItem = session.cart.find(i => i.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddItem = async (item: typeof menuItems[0]) => {
    if (session.isLocked) return;
    try {
      await addToCart(tableId, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      });
      // Show success feedback
      toast({
        title: '✅ Добавено',
        description: `${item.name} е добавено в поръчката`,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно добавяне на артикул. Моля опитайте отново.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (session.isLocked) return;
    try {
      const currentQty = getItemQuantity(itemId);
      await updateCartQuantity(tableId, itemId, currentQty - 1);
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const handleSubmitOrder = async () => {
    if (session.isLocked || cartItemCount === 0) return;
    
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
        description: 'Неуспешно изпращане на поръчка',
        variant: 'destructive',
      });
    }
  };

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
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full hover:bg-secondary/50 transition-colors"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="font-display text-2xl font-light text-foreground tracking-wider">
                  ATLAS HOUSE
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-light tracking-wider uppercase">
                  {tableId.replace('_', ' ')}
                </p>
              </div>
            </div>
            <CartSummary itemCount={cartItemCount} total={cartTotal} />
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-16 stagger-children">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="animate-fade-in">
              {/* Elegant Category Header */}
              <div className="mb-8">
                <h2 className="font-display text-2xl font-light text-foreground tracking-wide mb-2">
                  {category}
                </h2>
                <div className="h-px w-16 bg-primary/40" />
              </div>
              
              {/* Menu Items - Classic Restaurant Style */}
              <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/30 p-6 space-y-0">
                {items.map((item, index) => (
                  <MenuItemCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => handleAddItem(item)}
                    onRemove={() => handleRemoveItem(item.id)}
                    disabled={session.isLocked}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/98 backdrop-blur-md border-t border-border/50 p-5 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Submit Order Button */}
          <Button
            className="w-full btn-gold h-12 text-sm font-light tracking-wider uppercase shadow-lg hover:shadow-xl transition-all"
            onClick={handleSubmitOrder}
            disabled={cartItemCount === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Изпрати поръчка
          </Button>
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all text-sm font-light"
              onClick={handleCallWaiter}
            >
              <Bell className="h-4 w-4 mr-2" />
              Сервитьор
            </Button>
            <Button
              variant="outline"
              className="h-11 border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all text-sm font-light"
              onClick={() => setPaymentModalOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Сметка
            </Button>
          </div>
        </div>
      </div>

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
