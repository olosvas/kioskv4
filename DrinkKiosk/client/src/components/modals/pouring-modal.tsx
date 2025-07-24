import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type CartItem } from "@/pages/kiosk";

interface PouringModalProps {
  isOpen: boolean;
  orderItems: CartItem[];
  onComplete: () => void;
}

interface PourProgress {
  itemKey: string;
  name: string;
  volume: string;
  status: "waiting" | "pouring" | "completed";
  progress: number;
  poured: number;
  remaining: number;
}

export default function PouringModal({ isOpen, orderItems, onComplete }: PouringModalProps) {
  const [pourProgress, setPourProgress] = useState<PourProgress[]>([]);
  const [currentItem, setCurrentItem] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && orderItems.length > 0) {
      initializePourProcess();
    }
  }, [isOpen, orderItems]);

  const initializePourProcess = () => {
    const items: PourProgress[] = [];
    
    orderItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        items.push({
          itemKey: `${item.drinkId}_${item.volume}_${i}`,
          name: `${item.name} ${item.volume}ml`,
          volume: `${item.volume}ml`,
          status: "waiting",
          progress: 0,
          poured: 0,
          remaining: item.volume,
        });
      }
    });

    setPourProgress(items);
    setCurrentItem(0);
    setEstimatedTime(items.length * 5); // 5 seconds per item
    startPouringProcess(items);
  };

  const startPouringProcess = async (items: PourProgress[]) => {
    try {
      for (let i = 0; i < items.length; i++) {
        setCurrentItem(i);
        await pourSingleItem(i, items);
      }
      
      toast({
        title: "Order Complete",
        description: "All beverages have been dispensed successfully.",
      });
      
      setTimeout(() => {
        onComplete();
      }, 1000);
      
    } catch (error) {
      console.error("Pouring process failed:", error);
      toast({
        title: "Pouring Error",
        description: "There was an issue dispensing your beverages.",
        variant: "destructive",
      });
    }
  };

  const pourSingleItem = async (itemIndex: number, items: PourProgress[]) => {
    return new Promise<void>((resolve) => {
      // Update status to pouring
      setPourProgress(prev => 
        prev.map((item, index) => 
          index === itemIndex 
            ? { ...item, status: "pouring" }
            : item
        )
      );

      let progress = 0;
      const targetVolume = items[itemIndex].remaining;
      const interval = setInterval(() => {
        progress += 2; // 2% every 100ms = 5 seconds total
        const poured = Math.round((progress / 100) * targetVolume);
        const remaining = Math.max(0, targetVolume - poured);

        setPourProgress(prev => 
          prev.map((item, index) => 
            index === itemIndex 
              ? { 
                  ...item, 
                  progress: Math.min(progress, 100),
                  poured,
                  remaining,
                  status: progress >= 100 ? "completed" : "pouring"
                }
              : item
          )
        );

        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  const getOverallProgress = () => {
    if (pourProgress.length === 0) return 0;
    const totalProgress = pourProgress.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / pourProgress.length);
  };

  const getEstimatedTimeRemaining = () => {
    const remainingItems = pourProgress.length - currentItem;
    const currentItemProgress = pourProgress[currentItem]?.progress || 0;
    const currentItemTimeLeft = ((100 - currentItemProgress) / 100) * 5;
    return Math.round(currentItemTimeLeft + (remainingItems - 1) * 5);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Preparing Your Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {pourProgress.map((item, index) => (
            <div key={item.itemKey} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{item.name}</span>
                <span className="text-sm text-slate-600 capitalize">{item.status}</span>
              </div>
              <Progress 
                value={item.progress} 
                className="w-full h-2 mb-1"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{item.poured}ml poured</span>
                <span>{item.remaining}ml remaining</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center border-t pt-4">
          <div className="mb-2">
            <span className="text-sm font-medium">Overall Progress: {getOverallProgress()}%</span>
          </div>
          <DialogDescription>
            Please wait while we prepare your beverages...
          </DialogDescription>
          <p className="text-xs text-slate-500 mt-2">
            Estimated completion: {getEstimatedTimeRemaining()} seconds
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
