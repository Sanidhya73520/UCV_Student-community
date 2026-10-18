import EventEmitter from 'events';
import { User } from '../models/User.js';
import { getCountryName } from '../../../shared/countries.js';

class MapEventEmitter extends EventEmitter {}
const mapBroadcaster = new MapEventEmitter();
mapBroadcaster.setMaxListeners(500);

/**
 * Fetch and construct standardized map payload
 */
export async function getMapPayload() {
  const countryAgg = await User.aggregate([
    { $match: { role: 'student', status: 'approved' } },
    {
      $project: {
        countryCode: { $toUpper: { $trim: { input: '$countryCode' } } },
        firstName: 1,
        approvedAt: 1,
        createdAt: 1
      }
    },
    { $group: { _id: '$countryCode', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalStudents = countryAgg.reduce((acc, curr) => acc + curr.count, 0);

  const byCountry = countryAgg.map((c) => ({
    countryCode: c._id,
    countryName: getCountryName(c._id),
    count: c.count
  }));

  const latestStudents = await User.find({ role: 'student', status: 'approved' })
    .sort({ approvedAt: -1, createdAt: -1 })
    .limit(6)
    .select('firstName countryCode')
    .lean();

  const recentlyJoined = latestStudents.map((s) => {
    const code = (s.countryCode || '').trim().toUpperCase();
    return {
      id: s._id.toString(),
      firstName: s.firstName || 'Student',
      countryCode: code,
      countryName: getCountryName(code)
    };
  });

  const justJoined = recentlyJoined.length > 0 ? recentlyJoined[0] : null;

  return {
    totalStudents,
    countriesCount: countryAgg.length,
    byCountry,
    recentlyJoined,
    justJoined,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Broadcast updated map data to all active SSE subscribers instantly
 */
export async function notifyMapUpdated() {
  try {
    const payload = await getMapPayload();
    mapBroadcaster.emit('map_update', payload);
  } catch (err) {
    console.error('[MAP_BROADCAST] Failed to broadcast map update:', err);
  }
}

/**
 * Handle Server-Sent Events (SSE) connection for live map stream
 */
export async function handleMapStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': req.headers.origin || '*'
  });

  res.flushHeaders?.();

  // 1. Immediately send current map state to the connecting client
  try {
    const initialPayload = await getMapPayload();
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
  } catch (err) {
    console.error('[MAP_SSE] Failed to send initial map state:', err);
  }

  // 2. Listen to broadcast events
  const onMapUpdate = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // Ignored if socket closed
    }
  };

  mapBroadcaster.on('map_update', onMapUpdate);

  // 3. Keep-alive heartbeat every 20 seconds to prevent proxy/firewall timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // Socket closed
    }
  }, 20000);

  // 4. Cleanup when client disconnects
  req.on('close', () => {
    clearInterval(heartbeat);
    mapBroadcaster.off('map_update', onMapUpdate);
  });
}
