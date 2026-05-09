import express from 'express';

// We define our three servers as simple config objects.
// Each has a name and a port number.
const SERVERS = [
  { name: 'Server 1', port: 3001 },
  { name: 'Server 2', port: 3002 },
  { name: 'Server 3', port: 3003 },
];

// Loop over each server config and spin up an Express app for it.
SERVERS.forEach(({ name, port }) => {
  const app = express();

  // This single route handles ALL incoming paths (/* means anything).
  // req = incoming request object, res = outgoing response object.
  app.get('*', (req, res) => {
    // Log to the terminal so you can see which server got hit.
    console.log(`[${name}] Received: ${req.method} ${req.path}`);

    // Respond with a JSON object. This is what the client will see.
    res.json({
      message: `Request received by ${name}`,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  });

  // Start listening on the assigned port.
  // The callback fires once the server is ready.
  app.listen(port, () => {
    console.log(`${name} listening on http://localhost:${port}`);
  });
});