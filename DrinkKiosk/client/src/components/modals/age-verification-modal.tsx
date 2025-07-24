import { useState } from "react";
import { Camera, IdCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWebcam } from "@/hooks/use-webcam";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerified: (verified: boolean) => void;
}

export default function AgeVerificationModal({ isOpen, onVerified }: AgeVerificationModalProps) {
  const [verificationMethod, setVerificationMethod] = useState<"webcam" | "id">("webcam");
  const [isVerifying, setIsVerifying] = useState(false);
  const { startCamera, captureImage, stopCamera, isActive, videoRef } = useWebcam();
  const { toast } = useToast();

  const handleWebcamVerification = async () => {
    try {
      setIsVerifying(true);
      
      if (!isActive) {
        await startCamera();
        // Wait a moment for camera to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const imageData = await captureImage();
      if (!imageData) {
        throw new Error("Failed to capture image");
      }

      const response = await apiRequest("POST", "/api/verify-age", { imageData });
      const result = await response.json();

      if (result.verified) {
        toast({
          title: "Age Verified",
          description: "Your age has been successfully verified.",
        });
        onVerified(true);
      } else {
        toast({
          title: "Verification Failed",
          description: "Age verification was not successful. Please try ID verification.",
          variant: "destructive",
        });
        setVerificationMethod("id");
      }
    } catch (error) {
      console.error("Age verification failed:", error);
      toast({
        title: "Verification Error",
        description: "Age verification service is unavailable. Please try ID verification.",
        variant: "destructive",
      });
      setVerificationMethod("id");
    } finally {
      setIsVerifying(false);
      stopCamera();
    }
  };

  const handleIDVerification = async () => {
    try {
      setIsVerifying(true);
      
      if (!isActive) {
        await startCamera();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const imageData = await captureImage();
      if (!imageData) {
        throw new Error("Failed to capture ID image");
      }

      const response = await apiRequest("POST", "/api/verify-id", { imageData });
      const result = await response.json();

      if (result.verified && result.age >= 18) {
        toast({
          title: "ID Verified",
          description: "Your ID has been successfully verified.",
        });
        onVerified(true);
      } else {
        toast({
          title: "ID Verification Failed",
          description: "ID verification was not successful or age requirement not met.",
          variant: "destructive",
        });
        onVerified(false);
      }
    } catch (error) {
      console.error("ID verification failed:", error);
      toast({
        title: "Verification Error",
        description: "ID verification service is unavailable.",
        variant: "destructive",
      });
      onVerified(false);
    } finally {
      setIsVerifying(false);
      stopCamera();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle>Age Verification Required</DialogTitle>
        </DialogHeader>

        {verificationMethod === "webcam" ? (
          <div className="space-y-4">
            <DialogDescription>
              Please look at the camera for age verification:
            </DialogDescription>
            
            <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center">
              {isActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Camera will activate when verification starts</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setVerificationMethod("id")}
                variant="outline"
                className="flex-1"
                disabled={isVerifying}
              >
                Use ID Instead
              </Button>
              <Button
                onClick={handleWebcamVerification}
                className="flex-1 bg-kiosk-primary hover:bg-blue-700"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Start Verification"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DialogDescription>
              Please show your ID to the camera:
            </DialogDescription>
            
            <div className="bg-slate-100 rounded-lg h-32 flex items-center justify-center">
              {isActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <IdCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">ID scanning area</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setVerificationMethod("webcam")}
                variant="outline"
                className="flex-1"
                disabled={isVerifying}
              >
                Back to Webcam
              </Button>
              <Button
                onClick={handleIDVerification}
                className="flex-1 bg-kiosk-primary hover:bg-blue-700"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying ID..." : "Verify ID"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
