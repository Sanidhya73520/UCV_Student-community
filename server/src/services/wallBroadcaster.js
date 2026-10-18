import EventEmitter from 'events';

class WallEventEmitter extends EventEmitter {}
const wallBroadcaster = new WallEventEmitter();
wallBroadcaster.setMaxListeners(500);

/**
 * Broadcast an updated wall event to all active SSE subscribers instantly.
 * Supports action types: 'create', 'update', 'remove', 'restore', 'delete', 'meToo', 'color_update'.
 */
export function notifyWallUpdated(payload = {}) {
  try {
    wallBroadcaster.emit('wall_update', {
      type: 'WALL_UPDATED',
      timestamp: Date.now(),
      ...payload
    });
  } catch (err) {
    console.error('[WALL_BROADCAST] Failed to broadcast wall update:', err);
  }
}

/**
 * Handle Server-Sent Events (SSE) connection for live wall synchronization.
 * Supports 100+ concurrent connections efficiently with minimal overhead.
 */
export function handleWallStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': req.headers.origin || '*'
  });

  res.flushHeaders?.();

  // Send initial ping to keep connection alive
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  // Listen for broadcast events
  const onUpdate = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      cleanup();
    }
  };

  // Heartbeat ping every 25 seconds to keep intermediary proxies alive
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      cleanup();
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(pingInterval);
    wallBroadcaster.removeListener('wall_update', onUpdate);
  };

  wallBroadcaster.on('wall_update', onUpdate);

  req.on('close', cleanup);
  req.on('end', cleanup);
}
