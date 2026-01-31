import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItemCardProps {
  id: string;
  name: string;
  price: number;
  description?: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  variant?: 'standard' | 'premium';
  disabled?: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  name,
  price,
  description,
  quantity,
  onAdd,
  onRemove,
  variant = 'standard',
  disabled = false,
}) => {
  if (variant === 'premium') {
    return (
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            <p className="text-primary font-semibold mt-2">
              {price.toFixed(2)} лв
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {quantity > 0 && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-primary/30 hover:bg-primary/10"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-foreground">
                  {quantity}
                </span>
              </>
            )}
            <Button
              size="icon"
              className="h-9 w-9 rounded-full btn-gold"
              onClick={onAdd}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative py-5 border-b border-border/50 last:border-0 hover:border-primary/20 transition-colors duration-300 animate-fade-in">
      <div className="flex items-center justify-between gap-6">
        {/* Item Name and Price - Classic Restaurant Menu Style */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <h3 className="font-display text-lg font-medium text-foreground tracking-tight flex-shrink-0">
            {name}
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
          <div className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-lg font-semibold text-foreground">
              {price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground font-light">лв</span>
          </div>
        </div>
        
        {/* Quantity Controls - Elegant and Minimal */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {quantity > 0 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full border border-border/30 hover:bg-secondary hover:border-primary/40 transition-all"
                onClick={onRemove}
                disabled={disabled}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <div className="min-w-[28px] text-center">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                  {quantity}
                </span>
              </div>
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full border border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
