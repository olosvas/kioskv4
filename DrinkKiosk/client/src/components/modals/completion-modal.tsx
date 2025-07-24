import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompletionModalProps {
  isOpen: boolean;
  onStartNewOrder: () => void;
}

export default function CompletionModal({ isOpen, onStartNewOrder }: CompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4 text-center">
        <DialogHeader>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle>Order Complete!</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mb-6">
            Your beverages are ready. Please collect them from the dispensing area.
          </DialogDescription>
        </DialogHeader>
        <Button
          onClick={onStartNewOrder}
          className="w-full h-12 bg-kiosk-primary text-white hover:bg-blue-700"
        >
          Start New Order
        </Button>
      </DialogContent>
    </Dialog>
  );
}
