import { useState } from "react";
import { CreditCard, Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type CartItem } from "@/pages/kiosk";

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  cartItems: CartItem[];
  onPaymentComplete: (orderData: any) => void;
}

export default function PaymentModal({
  isOpen,
  totalAmount,
  cartItems,
  onPaymentComplete,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processPayment = async (method: "card" | "contactless") => {
    try {
      setIsProcessing(true);

      // Create order first
      const orderData = {
        items: JSON.stringify(cartItems.map(item => ({
          drinkId: item.drinkId,
          volume: item.volume,
          quantity: item.quantity,
        }))),
        ageVerified: cartItems.some(item => item.isAlcoholic),
        gdprConsent: cartItems.some(item => item.isAlcoholic),
        language: "sk",
      };

      const orderResponse = await apiRequest("POST", "/api/order", orderData);
      const order = await orderResponse.json();

      // Process payment
      const paymentResponse = await apiRequest("POST", "/api/payment", {
        orderId: order.orderId,
        method,
      });
      const payment = await paymentResponse.json();

      if (payment.success) {
        toast({
          title: "Payment Successful",
          description: `Payment processed via ${method}`,
        });
        onPaymentComplete({ ...order, paymentData: payment });
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Payment Processing</DialogTitle>
        </DialogHeader>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-kiosk-primary rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-medium text-slate-800 mb-2">
            Total: €{totalAmount.toFixed(2)}
          </p>
          <DialogDescription>
            Please insert your card or use contactless payment
          </DialogDescription>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={() => processPayment("card")}
            disabled={isProcessing}
            className="w-full h-12 bg-kiosk-primary text-white hover:bg-blue-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isProcessing ? "Processing..." : "Simulate Card Payment"}
          </Button>
          <Button
            onClick={() => processPayment("contactless")}
            disabled={isProcessing}
            variant="outline"
            className="w-full h-12"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Simulate Contactless
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
