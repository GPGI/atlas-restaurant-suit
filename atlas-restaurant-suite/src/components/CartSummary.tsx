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
    <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <ShoppingBag className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {itemCount} items
        </p>
        <p className="font-semibold text-foreground text-sm">
          {total.toFixed(2)} лв
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
