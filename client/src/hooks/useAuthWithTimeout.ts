// Custom hook for authentication with timeout to prevent infinite loading

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthWithTimeout = (timeoutMs: number = 10000) => {
  const { user, loading, isAuthenticated, error } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setTimeoutReached(true);
      }, timeoutMs);

      return () => clearTimeout(timeoutId);
    } else {
      setTimeoutReached(false);
    }
  }, [loading, timeoutMs]);

  return {
    user,
    loading: loading && !timeoutReached,
    isAuthenticated,
    error: error || (timeoutReached ? 'Authentication timeout - please refresh the page' : null),
    timeoutReached
  };
};
