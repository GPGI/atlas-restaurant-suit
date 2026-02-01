import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { CartItem } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/utils/optimization';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  total: number;
  itemCount: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onOpenChange,
  cartItems,
  total,
  itemCount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isLoading = false,
  disabled = false,
}) => {
  const handleIncrement = (itemId: string, currentQty: number) => {
    if (disabled || isLoading) return;
    triggerHapticFeedback('light');
    onUpdateQuantity(itemId, currentQty + 1);
  };

  const handleDecrement = (itemId: string, currentQty: number) => {
    if (disabled || isLoading) return;
    triggerHapticFeedback('light');
    if (currentQty > 1) {
      onUpdateQuantity(itemId, currentQty - 1);
    } else {
      onRemoveItem(itemId);
    }
  };

  const handleRemove = (itemId: string) => {
    if (disabled || isLoading) return;
    triggerHapticFeedback('medium');
    onRemoveItem(itemId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] flex flex-col p-0">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-display">Кошница</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'артикул' : 'артикула'}
                </SheetDescription>
              </div>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCart}
                disabled={disabled || isLoading}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Изчисти</span>
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Кошницата е празна
              </p>
              <p className="text-sm text-muted-foreground/70">
                Добавете артикули от менюто
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-card border border-border rounded-lg p-3 sm:p-4 transition-all',
                  'hover:border-primary/30 hover:shadow-md'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-primary">
                      {item.price.toFixed(2)} лв
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Decrement */}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-border hover:border-primary/50 hover:bg-primary/5 touch-manipulation"
                      onClick={() => handleDecrement(item.id, item.quantity)}
                      disabled={disabled || isLoading}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    {/* Quantity Display */}
                    <div className="min-w-[2.5rem] text-center">
                      <span className="text-lg sm:text-xl font-bold text-foreground">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Increment */}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-border hover:border-primary/50 hover:bg-primary/5 touch-manipulation"
                      onClick={() => handleIncrement(item.id, item.quantity)}
                      disabled={disabled || isLoading}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 ml-1 touch-manipulation"
                      onClick={() => handleRemove(item.id)}
                      disabled={disabled || isLoading}
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Подобщо:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {(item.price * item.quantity).toFixed(2)} лв
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Total */}
        {cartItems.length > 0 && (
          <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-medium text-foreground">
                Общо:
              </span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
                {total.toFixed(2)} лв
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
