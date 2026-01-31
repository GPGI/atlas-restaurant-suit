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
    <div className="card-premium rounded-xl p-4 animate-fade-in">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{name}</h3>
          <p className="text-primary font-semibold mt-1">
            {price.toFixed(2)} лв
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {quantity > 0 && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full border-muted-foreground/30 hover:bg-secondary"
                onClick={onRemove}
                disabled={disabled}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-semibold text-foreground">
                {quantity}
              </span>
            </>
          )}
          <Button
            size="icon"
            className="h-8 w-8 rounded-full btn-gold"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
