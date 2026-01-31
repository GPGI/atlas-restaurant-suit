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
    <div className="glass-card rounded-xl p-3 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/20 group">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <ShoppingBag className="h-5 w-5 text-primary" />
          {itemCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <span className="text-[10px] font-bold text-primary-foreground">{itemCount}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            {itemCount} {itemCount === 1 ? 'артикул' : 'артикула'}
          </p>
          <p className="font-display text-lg font-bold text-primary">
            {total.toFixed(2)} лв
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
