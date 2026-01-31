import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Bell, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant, menuItems } from '@/context/RestaurantContext';
import MenuItemCard from '@/components/MenuItemCard';
import CartSummary from '@/components/CartSummary';
import PaymentModal from '@/components/PaymentModal';
import { cn } from '@/lib/utils';

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
  
  // Store current table in localStorage
  React.useEffect(() => {
    if (tableId) {
      localStorage.setItem('currentTable', tableId);
    }
  }, [tableId]);
  
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
    <div className="min-h-screen pb-40 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,215,0,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-b border-border/50 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full hover:bg-primary/10 transition-all hover:scale-110"
                  onClick={() => navigate(`/tables?currentTable=${tableId}`)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-display text-2xl font-bold text-gold tracking-wide">
                    ATLAS HOUSE
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs text-muted-foreground font-medium">
                      {tableId.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
              <CartSummary itemCount={cartItemCount} total={cartTotal} />
            </div>
          </div>
        </header>

        {/* Menu */}
        <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          <div className="space-y-10 md:space-y-12 stagger-children">
            {Object.entries(groupedItems).map(([category, items], categoryIndex) => {
              // Extract emoji and category name
              const emojiMatch = category.match(/^([^\s]+)\s(.+)$/);
              const emoji = emojiMatch ? emojiMatch[1] : '';
              const categoryName = emojiMatch ? emojiMatch[2] : category;
              
              return (
                <section 
                  key={category}
                  className="animate-fade-in"
                  style={{ animationDelay: `${categoryIndex * 100}ms` }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6 group">
                    <div className="text-3xl md:text-4xl transition-transform group-hover:scale-110">
                      {emoji}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-wide">
                        {categoryName}
                      </h2>
                      <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/0 rounded-full mt-2" />
                    </div>
                  </div>
                  
                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${(categoryIndex * 100) + (itemIndex * 50)}ms` }}
                      >
                        <MenuItemCard
                          id={item.id}
                          name={item.name}
                          price={item.price}
                          quantity={getItemQuantity(item.id)}
                          onAdd={() => handleAddItem(item)}
                          onRemove={() => handleRemoveItem(item.id)}
                          disabled={session.isLocked}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-3">
            {/* Cart Summary Bar */}
            {cartItemCount > 0 && (
              <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 mb-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-foreground">
                    {cartItemCount} {cartItemCount === 1 ? 'артикул' : 'артикула'} в количката
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {cartTotal.toFixed(2)} лв
                </span>
              </div>
            )}
            
            {/* Submit Order Button */}
            <Button
              className={cn(
                "w-full h-14 text-base font-semibold transition-all duration-300",
                "btn-gold shadow-lg hover:shadow-xl",
                cartItemCount === 0 && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleSubmitOrder}
              disabled={cartItemCount === 0}
            >
              <Send className="h-5 w-5 mr-2" />
              🍽️ Изпрати поръчка
              {cartItemCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
                onClick={handleCallWaiter}
              >
                <Bell className="h-4 w-4 mr-2" />
                🔔 Сервитьор
              </Button>
              <Button
                variant="outline"
                className="h-12 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105"
                onClick={() => setPaymentModalOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                💳 Сметка
              </Button>
            </div>
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
