import { useEffect } from 'react';
import { apiClient } from '../api/client';

/**
 * KeepAlive Component
 * 
 * Silently pings the FastAPI backend every 5 minutes to prevent the 
 * Render free-tier container from spinning down and causing a cold-start timeout.
 */
export default function KeepAlive() {
  useEffect(() => {
    // 5 minutes in milliseconds
    const PING_INTERVAL = 5 * 60 * 1000;

    const pingBackend = async () => {
      try {
        await apiClient.get('/health');
        // Successfully pinged
      } catch (error) {
        console.warn('[System] Keep-alive ping failed', error);
      }
    };

    // Removed initial ping to eliminate initial page load network congestion.
    // The setInterval below is sufficient to keep the backend warm.

    // Set interval for ongoing pings
    const intervalId = setInterval(pingBackend, PING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component does not render anything visually
}
