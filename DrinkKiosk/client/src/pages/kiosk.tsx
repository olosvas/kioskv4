import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coffee } from "lucide-react";
import BeverageGrid from "@/components/beverage-grid";
import ShoppingCart from "@/components/shopping-cart";
import GDPRModal from "@/components/modals/gdpr-modal";
import AgeVerificationModal from "@/components/modals/age-verification-modal";
import PaymentModal from "@/components/modals/payment-modal";
import PouringModal from "@/components/modals/pouring-modal";
import CompletionModal from "@/components/modals/completion-modal";
import { type Beverage, type OrderItem } from "@shared/schema";

export interface CartItem extends OrderItem {
  name: string;
  pricePerUnit: number;
  totalPrice: number;
  isAlcoholic: boolean;
}

export default function KioskPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("selection");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  // Fetch beverages
  const { data: beverages = [], isLoading } = useQuery<Beverage[]>({
    queryKey: ["/api/drinks"],
  });

  // Fetch kiosk config
  const { data: config } = useQuery({
    queryKey: ["/api/kiosk/config"],
  });

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (beverage: Beverage, volume: number) => {
    const itemKey = `${beverage.id}_${volume}`;
    const pricePerUnit = (parseFloat(beverage.pricePer100ml) * volume) / 100;
    const isAlcoholic = beverage.type === "alcoholic";

    setCartItems(prev => {
      const existingItem = prev.find(item => 
        item.drinkId === beverage.id && item.volume === volume
      );

      if (existingItem) {
        return prev.map(item =>
          item.drinkId === beverage.id && item.volume === volume
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: pricePerUnit * (item.quantity + 1),
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          drinkId: beverage.id,
          volume,
          quantity: 1,
          name: beverage.name,
          pricePerUnit,
          totalPrice: pricePerUnit,
          isAlcoholic,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (drinkId: string, volume: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => 
        prev.filter(item => !(item.drinkId === drinkId && item.volume === volume))
      );
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.drinkId === drinkId && item.volume === volume
            ? {
                ...item,
                quantity: newQuantity,
                totalPrice: item.pricePerUnit * newQuantity,
              }
            : item
        )
      );
    }
  };

  const removeItem = (drinkId: string, volume: number) => {
    setCartItems(prev => 
      prev.filter(item => !(item.drinkId === drinkId && item.volume === volume))
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const hasAlcoholicItems = () => {
    return cartItems.some(item => item.isAlcoholic);
  };

  const startCheckout = () => {
    if (cartItems.length === 0) return;

    if (hasAlcoholicItems() && !gdprConsent) {
      setCurrentStep("gdpr");
      return;
    }

    if (hasAlcoholicItems() && !ageVerified) {
      setCurrentStep("age_verification");
      return;
    }

    setCurrentStep("payment");
  };

  const handleGDPRResponse = (accepted: boolean) => {
    setCurrentStep("selection");
    if (accepted) {
      setGdprConsent(true);
      setCurrentStep("age_verification");
    } else {
      // Remove alcoholic items from cart
      setCartItems(prev => prev.filter(item => !item.isAlcoholic));
      if (cartItems.filter(item => !item.isAlcoholic).length > 0) {
        setCurrentStep("payment");
      }
    }
  };

  const handleAgeVerified = (verified: boolean) => {
    setCurrentStep("selection");
    if (verified) {
      setAgeVerified(true);
      setCurrentStep("payment");
    } else {
      // Remove alcoholic items and proceed if non-alcoholic items remain
      setCartItems(prev => prev.filter(item => !item.isAlcoholic));
      if (cartItems.filter(item => !item.isAlcoholic).length > 0) {
        setCurrentStep("payment");
      }
    }
  };

  const handlePaymentComplete = (orderData: any) => {
    setCurrentOrder(orderData);
    setCurrentStep("pouring");
  };

  const handlePouringComplete = () => {
    setCurrentStep("complete");
  };

  const startNewOrder = () => {
    setCartItems([]);
    setCurrentOrder(null);
    setGdprConsent(false);
    setAgeVerified(false);
    setCurrentStep("selection");
  };

  if (isLoading) {
    return (
      <div className="kiosk-container flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Coffee className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium">Loading beverages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="kiosk-header bg-white shadow-sm flex items-center justify-between px-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Coffee className="w-4 h-4 text-kiosk-primary" />
          <span className="text-sm font-medium text-slate-800">BeverageKiosk</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-slate-600">Online</span>
          </div>
          <span className="text-xs text-slate-500">{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="beverage-content flex">
        {/* Beverage Selection */}
        <div className="flex-1 p-3">
          <div className="mb-2">
            <h2 className="text-base font-medium text-slate-800 mb-1">Select Your Beverage</h2>
            <p className="text-xs text-slate-600">Choose from our available drinks</p>
          </div>

          <BeverageGrid 
            beverages={beverages} 
            onAddToCart={addToCart}
            cartItems={cartItems}
          />
        </div>

        {/* Shopping Cart */}
        <div className="cart-width">
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={startCheckout}
            totalPrice={getTotalPrice()}
          />
        </div>
      </div>

      {/* Modals */}
      <GDPRModal
        isOpen={currentStep === "gdpr"}
        onResponse={handleGDPRResponse}
      />

      <AgeVerificationModal
        isOpen={currentStep === "age_verification"}
        onVerified={handleAgeVerified}
      />

      <PaymentModal
        isOpen={currentStep === "payment"}
        totalAmount={getTotalPrice()}
        cartItems={cartItems}
        onPaymentComplete={handlePaymentComplete}
      />

      <PouringModal
        isOpen={currentStep === "pouring"}
        orderItems={cartItems}
        onComplete={handlePouringComplete}
      />

      <CompletionModal
        isOpen={currentStep === "complete"}
        onStartNewOrder={startNewOrder}
      />
    </div>
  );
}
