import { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const setOnlineStatus = useCartStore((state) => state.setOnlineStatus);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOnlineStatus(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return isOnline;
}
