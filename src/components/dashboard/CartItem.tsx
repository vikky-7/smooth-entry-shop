import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  id: string;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  isUpdating: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  productName,
  productPrice,
  productImage,
  quantity,
  onUpdateQuantity,
  onRemoveItem,
  isUpdating,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={productImage}
            alt={productName}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="flex-1">
            <h3 className="font-medium">{productName}</h3>
            <p className="text-sm text-muted-foreground">
              ${productPrice.toFixed(2)} each
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(id, quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onUpdateQuantity(id, quantity + 1)}
              disabled={isUpdating}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              ${(productPrice * quantity).toFixed(2)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(id)}
              disabled={isUpdating}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};