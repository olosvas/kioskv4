import { useState, useRef, useCallback } from "react";

export function useWebcam() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      streamRef.current = stream;
      setIsActive(true);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setError("Failed to access camera. Please check permissions.");
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, []);

  const captureImage = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !isActive) {
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      
      if (!context) {
        throw new Error("Failed to get canvas context");
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      
      // Convert to base64 JPEG
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      return imageData;
    } catch (err) {
      console.error("Failed to capture image:", err);
      setError("Failed to capture image");
      return null;
    }
  }, [isActive]);

  return {
    isActive,
    error,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
  };
}
