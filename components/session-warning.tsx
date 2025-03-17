"use client"

import { Button } from "@/components/ui/button";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { AlertCircle } from "lucide-react";

export function SessionWarning() {
  const { showWarning, timeLeft, resetTimer } = useSessionTimeout();
  
  if (!showWarning) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-destructive/90 text-white p-4 rounded-md shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium mb-1">Session timeout warning</h4>
            <p className="text-sm opacity-90 mb-3">
              Your session will expire in {timeLeft} seconds due to inactivity.
            </p>
            <Button 
              onClick={resetTimer}
              variant="outline" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Stay logged in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
