import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GDPRModalProps {
  isOpen: boolean;
  onResponse: (accepted: boolean) => void;
}

export default function GDPRModal({ isOpen, onResponse }: GDPRModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>GDPR Consent Required</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            To verify your age for alcoholic beverages, we need to process your image using our age verification service. 
            This involves sending your image to a third-party API for analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex space-x-3 mt-4">
          <Button
            onClick={() => onResponse(false)}
            variant="outline"
            className="flex-1"
          >
            Decline
          </Button>
          <Button
            onClick={() => onResponse(true)}
            className="flex-1 bg-kiosk-primary hover:bg-blue-700"
          >
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
