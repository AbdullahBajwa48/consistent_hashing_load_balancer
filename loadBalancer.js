import express from 'express';
import httpProxy from 'http-proxy';
import cors from 'cors';
import { EventEmitter } from 'events';
import { HashRing } from './hashRing.js';

const app = express();

// cors() middleware tells Express to add the header:
//   Access-Control-Allow-Origin: *
// Without this, the browser blocks React's fetch calls to port 3000.
app.use(cors());
app.use(express.json());

// --- Hash ring setup ---
const ring = new HashRing(150);

// Register our three backend servers by the names we'll route to.
// The names must match what we pass to httpProxy.web().
ring.addServer('server1');
ring.addServer('server2');
ring.addServer('server3');

// Map each server name to its actual URL.
// httpProxy will forward the request to these addresses.
const SERVER_URLS = {
  server1: 'http://localhost:3001',
  server2: 'http://localhost:3002',
  server3: 'http://localhost:3003',
};

// --- SSE event bus ---
// EventEmitter is Node's built-in publish/subscribe system.
// We'll emit a 'routed' event every time a request is proxied.
// The SSE endpoint below subscribes to these events and pushes
// them to connected browser clients in real time.
const routeEvents = new EventEmitter();

// --- SSE endpoint ---
// Server-Sent Events: a one-way stream from server → browser.
// The browser connects once, keeps the connection open,
// and receives text/event-stream messages whenever we emit.
app.get('/events', (req, res) => {
  // These headers switch the response into SSE mode.
  // 'text/event-stream' tells the browser: don't close this connection,
  //   keep reading lines as they arrive.
  // 'Cache-Control: no-cache' prevents proxies from buffering the stream.
  // 'Connection: keep-alive' keeps the TCP socket open.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send an initial "connected" message so the UI knows it's live.
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  // SSE format: each message is "data: <payload>\n\n"
  // The double newline (\n\n) signals the end of one message.

  // Define the handler that fires on every routing decision.
  const handler = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe this SSE connection to routing events.
  routeEvents.on('routed', handler);

  // When this browser tab closes or disconnects, clean up the listener.
  // Without this, dead listeners pile up and cause memory leaks.
  req.on('close', () => {
    routeEvents.off('routed', handler);
  });
});

// --- Main proxy route ---
// The load balancer listens on port 3000.
// Any GET request to /route?key=<something> will be proxied.
const proxy = httpProxy.createProxyServer({});

app.get('/route', (req, res) => {
  // Read the 'key' query param. This is what we hash to pick a server.
  // Example: GET /route?key=user-42
  // If no key is provided, fall back to a timestamp so it still works.
  const key = req.query.key || `anon-${Date.now()}`;

  // Ask the hash ring which server this key belongs to.
  const result = ring.getServer(key);

  if (!result) {
    return res.status(503).json({ error: 'No servers available' });
  }

  const { server, keyHash, ringPosition } = result;
  const targetUrl = SERVER_URLS[server];

  // Build the event payload we'll push to the UI.
  const eventData = {
    type: 'routed',
    key,
    keyHash,        // the MD5-derived integer of the key
    ringPosition,   // which virtual node on the ring caught it
    server,         // e.g. "server2"
    targetUrl,
    timestamp: new Date().toISOString(),
  };

  // Emit the event BEFORE proxying so the UI updates as fast as possible.
  routeEvents.emit('routed', eventData);

  // proxy.web() takes the incoming req/res and forwards them to targetUrl.
  // It copies the method, headers, body, and streams back the response.
  proxy.web(req, res, { target: targetUrl }, (err) => {
    // The 4th argument is an error callback.
    // If the backend server is down, this fires instead of crashing.
    console.error(`Proxy error for ${server}:`, err.message);
    res.status(502).json({ error: `Backend ${server} unreachable` });
  });
});

app.listen(3000, () => {
  console.log('Load balancer running on http://localhost:3000');
  console.log('SSE stream at http://localhost:3000/events');
});

app.post('/remove-server/:name', (req, res) => {
  const { name } = req.params;
  ring.removeServer(name);
  res.json({ message: `${name} removed`, remaining: ring.sortedKeys.length });
});

app.post('/add-server/:name', (req, res) => {
  const { name } = req.params;
  ring.addServer(name);
  res.json({ message: `${name} added`, total: ring.sortedKeys.length });
});