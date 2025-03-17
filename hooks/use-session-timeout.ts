import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

const TIMEOUT_DURATION = 7 * 60 * 1000; // 7 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before timeout

export function useSessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  }, []);
  
  // Handle user logout on timeout
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast.info('You have been logged out due to inactivity');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);
  
  useEffect(() => {
    // Initialize timer
    resetTimer();
    
    // Track user activity events
    const events = [
      'mousedown', 
      'mousemove',
      'keypress', 
      'scroll', 
      'touchstart',
      'click',
      'keydown'
    ];
    
    const handleUserActivity = () => {
      resetTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });
    
    // Check for timeout periodically
    const intervalId = setInterval(() => {
      const lastActivity = Number(localStorage.getItem('lastActivity') || '0');
      const now = Date.now();
      const elapsed = now - lastActivity;
      
      if (elapsed > TIMEOUT_DURATION) {
        // Log user out if session has expired
        clearInterval(intervalId);
        handleLogout();
      } else if (elapsed > TIMEOUT_DURATION - WARNING_TIME) {
        // Show warning when approaching timeout
        setShowWarning(true);
        setTimeLeft(Math.round((TIMEOUT_DURATION - elapsed) / 1000));
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      // Clean up event listeners and interval
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearInterval(intervalId);
    };
  }, [resetTimer, handleLogout]);
  
  return { showWarning, timeLeft, resetTimer };
}
