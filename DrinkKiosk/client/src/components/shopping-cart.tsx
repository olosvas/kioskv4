import { Minus, Plus, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CartItem } from "@/pages/kiosk";

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (drinkId: string, volume: number, quantity: number) => void;
  onRemoveItem: (drinkId: string, volume: number) => void;
  onCheckout: () => void;
  totalPrice: number;
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  totalPrice,
}: ShoppingCartProps) {
  return (
    <div className="bg-white border-l border-slate-200 p-3 flex flex-col h-full">
      <h2 className="text-base font-medium text-slate-800 mb-2">Your Order</h2>

      {/* Cart Items */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">Your cart is empty</p>
            <p className="text-xs text-slate-400 mt-1">Select beverages to get started</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.drinkId}_${item.volume}`}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-slate-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-600">{item.volume}ml</p>
                </div>
                <Button
                  onClick={() => onRemoveItem(item.drinkId, item.volume)}
                  variant="ghost"
                  size="sm"
                  className="text-kiosk-error hover:text-red-700 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => onUpdateQuantity(item.drinkId, item.volume, item.quantity - 1)}
                    variant="outline"
                    size="sm"
                    className="quantity-btn w-8 h-8 rounded-full p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <Button
                    onClick={() => onUpdateQuantity(item.drinkId, item.volume, item.quantity + 1)}
                    variant="default"
                    size="sm"
                    className="quantity-btn w-8 h-8 bg-kiosk-primary text-white rounded-full p-0 hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <span className="font-bold text-sm text-slate-800">
                  €{item.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-slate-200 pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium text-slate-800">Total:</span>
          <span className="text-xl font-bold text-kiosk-primary">
            €{totalPrice.toFixed(2)}
          </span>
        </div>

        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-12 bg-kiosk-secondary text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Checkout
        </Button>
      </div>
    </div>
  );
}
