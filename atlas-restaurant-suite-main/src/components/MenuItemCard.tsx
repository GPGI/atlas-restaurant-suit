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
    <div className="group relative glass-card rounded-2xl p-5 animate-fade-in border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 opacity-0 group-hover:opacity-100" />
      
      <div className="relative flex justify-between items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-primary font-bold text-xl">
              {price.toFixed(2)}
            </p>
            <span className="text-xs text-muted-foreground">лв</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {quantity > 0 && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-110 active:scale-95"
                onClick={onRemove}
                disabled={disabled}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="min-w-[2.5rem] flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-bold text-sm">
                  {quantity}
                </span>
              </div>
            </>
          )}
          <Button
            size="icon"
            className="h-10 w-10 rounded-full btn-gold transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
