import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Beverage } from "@shared/schema";
import { type CartItem } from "@/pages/kiosk";

interface BeverageGridProps {
  beverages: Beverage[];
  onAddToCart: (beverage: Beverage, volume: number) => void;
  cartItems: CartItem[];
}

export default function BeverageGrid({ beverages, onAddToCart, cartItems }: BeverageGridProps) {
  const getAvailableStock = (beverageId: string) => {
    const totalInCart = cartItems
      .filter(item => item.drinkId === beverageId)
      .reduce((total, item) => total + (item.volume * item.quantity), 0);
    
    const beverage = beverages.find(b => b.id === beverageId);
    return beverage ? beverage.stockMl - totalInCart : 0;
  };

  const canAddVolume = (beverageId: string, volume: number) => {
    return getAvailableStock(beverageId) >= volume;
  };

  const getGridClass = () => {
    const count = beverages.length;
    if (count === 1) return "grid-cols-1 justify-center";
    if (count === 2) return "grid-cols-1 gap-1";
    return "grid-cols-2 gap-1";
  };

  const getTypeIndicator = (type: string) => {
    switch (type) {
      case "alcoholic":
        return (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-kiosk-warning" />
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              Alcoholic
            </span>
          </div>
        );
      case "hot":
        return (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
            Hot
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
            Non-alcoholic
          </span>
        );
    }
  };

  return (
    <div className={`beverage-grid grid ${getGridClass()}`}>
      {beverages.map((beverage) => (
        <div
          key={beverage.id}
          className="beverage-card bg-white rounded-lg p-2 shadow-sm border border-slate-200 flex flex-col"
        >
          <div className="flex items-start space-x-2 mb-2">
            <img
              src={beverage.imageUrl || `https://images.unsplash.com/photo-1581636625402-29b2a704ef13?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50`}
              alt={beverage.name}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800 text-sm">{beverage.name}</h3>
                {getTypeIndicator(beverage.type)}
              </div>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            {beverage.volumes.map((volume) => {
              const price = (parseFloat(beverage.pricePer100ml) * volume) / 100;
              const canAdd = canAddVolume(beverage.id, volume);
              
              return (
                <Button
                  key={volume}
                  onClick={() => onAddToCart(beverage, volume)}
                  disabled={!canAdd}
                  className="w-full h-7 bg-kiosk-primary text-white text-xs font-medium rounded flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                >
                  {volume}ml - €{price.toFixed(2)}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
