import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bell, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant, menuItems } from '@/context/RestaurantContext';
import MenuItemCard from '@/components/MenuItemCard';
import CartSummary from '@/components/CartSummary';
import PaymentModal from '@/components/PaymentModal';

const CustomerMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || 'Table_01';
  const { toast } = useToast();
  
  const {
    getTableSession,
    addToCart,
    updateCartQuantity,
    submitOrder,
    callWaiter,
    requestBill,
    getCartTotal,
    getCartItemCount,
  } = useRestaurant();

  const navigate = useNavigate();
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

  const handleAddItem = (item: typeof menuItems[0]) => {
    if (session.isLocked) return;
    addToCart(tableId, {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (session.isLocked) return;
    const currentQty = getItemQuantity(itemId);
    updateCartQuantity(tableId, itemId, currentQty - 1);
  };

  const handleSubmitOrder = () => {
    if (session.isLocked || cartItemCount === 0) return;
    
    submitOrder(tableId);
    toast({
      title: '✅ Поръчката е изпратена',
      description: 'Благодарим ви! Ще я приготвим скоро.',
    });
  };

  const handleCallWaiter = () => {
    if (session.isLocked) return;
    
    callWaiter(tableId);
    toast({
      title: '🔔 Сервитьорът е повикан',
      description: 'Моля, изчакайте.',
    });
  };

  const handlePaymentSelect = (method: 'cash' | 'card') => {
    setPaymentModalOpen(false);
    requestBill(tableId, method);
    toast({
      title: '💳 Заявка за сметка',
      description: `Плащане: ${method === 'cash' ? 'В брой' : 'С карта'}`,
    });
  };

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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full hover:bg-secondary"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl font-bold text-gold">
                  ATLAS HOUSE
                </h1>
                <p className="text-xs text-muted-foreground">
                  {tableId.replace('_', ' ')}
                </p>
              </div>
            </div>
            <CartSummary itemCount={cartItemCount} total={cartTotal} />
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-8 stagger-children">
          {Object.entries(groupedItems).map(([category, items]) => (
            <section key={category}>
              <h2 className="font-display text-lg font-semibold mb-4 text-foreground">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map(item => (
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
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border p-4">
        <div className="max-w-md mx-auto space-y-3">
          {/* Submit Order Button */}
          <Button
            className="w-full btn-gold h-12 text-base font-semibold"
            onClick={handleSubmitOrder}
            disabled={cartItemCount === 0}
          >
            <Send className="h-5 w-5 mr-2" />
            🍽️ Изпрати поръчка
          </Button>
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 border-primary/30 hover:bg-primary/10"
              onClick={handleCallWaiter}
            >
              <Bell className="h-4 w-4 mr-2" />
              🔔 Сервитьор
            </Button>
            <Button
              variant="outline"
              className="h-11 border-primary/30 hover:bg-primary/10"
              onClick={() => setPaymentModalOpen(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              💳 Сметка
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
