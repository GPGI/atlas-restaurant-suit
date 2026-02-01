import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface CartSummaryProps {
  itemCount: number;
  total: number;
  variant?: 'standard' | 'premium';
}

const CartSummary: React.FC<CartSummaryProps> = ({ 
  itemCount, 
  total, 
  variant = 'standard' 
}) => {
  if (itemCount === 0) return null;

  if (variant === 'premium') {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <p className="font-display text-lg font-semibold text-foreground">
              {total.toFixed(2)} лв
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 animate-fade-in">
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">
          {itemCount} {itemCount === 1 ? 'артикул' : 'артикула'}
        </p>
        <p className="font-semibold text-foreground text-sm sm:text-base truncate">
          {total.toFixed(2)} лв
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
