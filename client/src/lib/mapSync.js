import { useEffect, useRef } from 'react';

const CHANNEL_NAME = 'ucv_map_sync';

/**
 * Broadcast an instant map update event across all open windows, tabs, and components.
 * Latency is sub-millisecond (instant synchronous memory dispatch).
 */
export function broadcastMapUpdate(detail = {}) {
  try {
    if (typeof window !== 'undefined') {
      // 1. In-page CustomEvent
      window.dispatchEvent(new CustomEvent('ucv_map_update', { detail }));

      // 2. Cross-tab BroadcastChannel
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: 'MAP_UPDATED', timestamp: Date.now(), ...detail });
        channel.close();
      }

      // 3. Fallback localStorage event for older browsers / isolated tabs
      try {
        localStorage.setItem('ucv_map_last_updated', Date.now().toString());
      } catch {
        // Ignored
      }
    }
  } catch (err) {
    console.warn('[MAP_SYNC] Failed to broadcast local map update:', err);
  }
}

/**
 * React hook to synchronize map data in real-time.
 * Combines:
 * 1. Nanosecond local BroadcastChannel & CustomEvent dispatch
 * 2. Cross-device Server-Sent Events (SSE) stream (/api/public/map/stream)
 * 3. Polling fallback + instant refresh on focus / visibility change
 */
export function useLiveMapSync({ onData, fallbackFetch, enabled = true, streamUrl = '/api/public/map/stream' }) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const fallbackFetchRef = useRef(fallbackFetch);
  fallbackFetchRef.current = fallbackFetch;

  useEffect(() => {
    if (!enabled) return;

    let eventSource = null;
    let broadcastChannel = null;
    let pollInterval = null;

    // 1. Nanosecond Local BroadcastChannel listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'MAP_UPDATED') {
            if (event.data?.payload) {
              onDataRef.current?.(event.data.payload);
            } else {
              fallbackFetchRef.current?.();
            }
          }
        };
      } catch {
        // Fallback below
      }
    }

    // 2. Intra-window CustomEvent listener (nanosecond execution)
    const handleCustomEvent = (event) => {
      if (event.detail?.payload) {
        onDataRef.current?.(event.detail.payload);
      } else {
        fallbackFetchRef.current?.();
      }
    };
    window.addEventListener('ucv_map_update', handleCustomEvent);

    // 3. Cross-tab localStorage storage event listener
    const handleStorageEvent = (event) => {
      if (event.key === 'ucv_map_last_updated') {
        fallbackFetchRef.current?.();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Server-Sent Events (SSE) for real-time push across all devices
    const connectSSE = () => {
      if (typeof window === 'undefined' || !('EventSource' in window)) return;

      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && typeof data === 'object') {
              onDataRef.current?.(data);
            }
          } catch (err) {
            console.error('[MAP_SSE] Failed to parse stream data:', err);
          }
        };

        eventSource.onerror = () => {
          // EventSource automatically attempts reconnection
          // Start fallback polling if not already running
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              fallbackFetchRef.current?.();
            }, 3000);
          }
        };
      } catch (err) {
        console.warn('[MAP_SSE] SSE connection failed, using fallback:', err);
      }
    };

    connectSSE();

    // 5. Visibility and Focus listeners for immediate re-sync
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fallbackFetchRef.current?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // 6. Cleanup
    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener('ucv_map_update', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [enabled, streamUrl]);
}
