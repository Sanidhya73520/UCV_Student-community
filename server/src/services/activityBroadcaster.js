import EventEmitter from 'events';

class ActivityEventEmitter extends EventEmitter {}
const activityBroadcaster = new ActivityEventEmitter();
activityBroadcaster.setMaxListeners(500);

/**
 * Broadcast an updated activity or RSVP event to all active SSE subscribers instantly
 */
export function notifyActivityUpdated(payload = {}) {
  try {
    activityBroadcaster.emit('activity_update', {
      type: 'ACTIVITY_UPDATED',
      timestamp: Date.now(),
      ...payload
    });
  } catch (err) {
    console.error('[ACTIVITY_BROADCAST] Failed to broadcast activity update:', err);
  }
}

/**
 * Handle Server-Sent Events (SSE) connection for live activity and RSVP stream
 */
export function handleActivitiesStream(req, res) {
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
    activityBroadcaster.removeListener('activity_update', onUpdate);
  };

  activityBroadcaster.on('activity_update', onUpdate);

  req.on('close', cleanup);
  req.on('end', cleanup);
}
