import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface PouringProgress {
  orderId: string;
  items: Array<{
    drinkId: string;
    volume: number;
    progress: number;
    status: "waiting" | "pouring" | "completed" | "error";
  }>;
}

export function useHardware() {
  const [isPouringActive, setIsPouringActive] = useState(false);
  const [pouringProgress, setPouringProgress] = useState<PouringProgress | null>(null);

  const startPouring = useCallback(async (orderId: string) => {
    try {
      setIsPouringActive(true);
      
      const response = await apiRequest("POST", "/api/pour", { orderId });
      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.message || "Pouring failed");
      }
    } catch (error) {
      console.error("Hardware pouring error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    } finally {
      setIsPouringActive(false);
    }
  }, []);

  const stopPouring = useCallback(async () => {
    try {
      // Emergency stop functionality
      // In production, this would send a stop signal to all valves
      setIsPouringActive(false);
      setPouringProgress(null);
      
      console.log("Emergency stop activated");
      return { success: true };
    } catch (error) {
      console.error("Failed to stop pouring:", error);
      return { success: false, error: "Failed to stop pouring process" };
    }
  }, []);

  const getHardwareStatus = useCallback(async () => {
    try {
      // This would check GPIO pin states, valve positions, sensor readings
      return {
        valves: {
          pin17: { status: "closed", lastUsed: null },
          pin18: { status: "closed", lastUsed: null },
          pin19: { status: "closed", lastUsed: null },
          pin20: { status: "closed", lastUsed: null },
        },
        sensors: {
          pin27: { reading: 0, unit: "ml/s" },
          pin28: { reading: 0, unit: "ml/s" },
          pin29: { reading: 0, unit: "ml/s" },
          pin30: { reading: 0, unit: "ml/s" },
        },
        temperature: 22.5,
        errors: [],
      };
    } catch (error) {
      console.error("Failed to get hardware status:", error);
      return { error: "Hardware status unavailable" };
    }
  }, []);

  return {
    isPouringActive,
    pouringProgress,
    startPouring,
    stopPouring,
    getHardwareStatus,
  };
}
