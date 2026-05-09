# Consistent Hashing Load Balancer

A full-stack project that demonstrates how consistent hashing works by building a real load balancer with a live React dashboard.

---

## What is this project?

Imagine you have 3 servers and thousands of users sending requests. You need to decide which server handles which user. A naive approach is to just rotate — user 1 goes to server 1, user 2 goes to server 2, user 3 goes to server 3, user 4 goes back to server 1, and so on. This works, but has a big problem: if you add or remove a server, almost every user gets reassigned to a different server. This breaks things like login sessions and caches.

**Consistent hashing** solves this. It uses math to assign users to servers in a way that — if a server is added or removed — only a small fraction of users need to be reassigned. Everyone else stays put.

This project builds that system from scratch and shows it working in a real-time UI.

---

## How it works (plain English)

1. Imagine a circular ring numbered from 0 to 4,294,967,295 (that is 2³² positions).
2. Each server gets placed at multiple positions on that ring (called virtual nodes).
3. When a request comes in with a key like `"user-42"`, we run it through a hash function (MD5) which turns it into a number, say `1,982,970,887`.
4. We find that number on the ring and walk clockwise until we hit the nearest server.
5. That server handles the request.
6. The same key always produces the same number, so the same key always goes to the same server — no matter how many times you ask.
7. If a server goes down, only the keys that were pointing to it need to move. Every other key is unaffected.

---

## Project structure

```
consistent_hashing_load_balancer/
│
├── package.json          ← backend dependencies and scripts
├── hashRing.js           ← the consistent hashing algorithm (pure logic, no Express)
├── servers.js            ← 3 simple backend servers on ports 3001, 3002, 3003
├── loadBalancer.js       ← the proxy on port 3000 that routes requests using the ring
│
└── ui/                   ← React frontend (built with Vite)
    ├── package.json
    └── src/
        └── App.jsx       ← the entire dashboard UI
```

---

## Prerequisites

Before running this project, make sure you have:

- **Node.js** version 18 or higher — download from [nodejs.org](https://nodejs.org)
- **npm** — comes bundled with Node.js
- A terminal (PowerShell, bash, or any command line)

To check if Node is installed, run:

```bash
node --version
npm --version
```

---

## Installation

### Step 1 — Clone or download the project

If you have git:

```bash
git clone <your-repo-url>
cd consistent_hashing_load_balancer
```

Or just download the ZIP and extract it.

### Step 2 — Install backend dependencies

From the project root folder:

```bash
npm install
```

This installs three packages:
- `express` — a minimal web server framework for Node.js
- `http-proxy` — forwards requests from the load balancer to the backend servers
- `cors` — allows the React UI (on a different port) to talk to the load balancer

### Step 3 — Install frontend dependencies

```bash
cd ui
npm install
cd ..
```

This installs React, Vite, and everything the UI needs.

---

## Running the project

You need **three separate terminals** open at the same time.

### Terminal 1 — Start the backend servers

```bash
node servers.js
```

You should see:

```
Server 1 listening on http://localhost:3001
Server 2 listening on http://localhost:3002
Server 3 listening on http://localhost:3003
```

These are your three simple servers. Each one just responds with "Request received by Server X" when it gets a request.

### Terminal 2 — Start the load balancer

```bash
node loadBalancer.js
```

You should see:

```
Load balancer running on http://localhost:3000
SSE stream at http://localhost:3000/events
```

The load balancer sits in front of the three servers. Every request goes here first, and it decides which server to forward it to using consistent hashing.

### Terminal 3 — Start the React UI

```bash
cd ui
npm run dev
```

You should see:

```
VITE ready in 300ms
Local: http://localhost:5173/
```

Now open your browser and go to **http://localhost:5173**

---

## Using the UI

### The dashboard has four sections:

**1. Server cards (top)**
Three cards, one per server. Each shows how many requests it has handled and lights up green/blue/purple when it is the active server receiving a request.

**2. Send a request (middle left)**
Type any key — like `user-42`, `session-xyz`, or `hello` — and click Send. The load balancer hashes that key, picks a server, and forwards the request. The backend's response appears below the form.

Try sending the same key multiple times. It always goes to the same server. That is consistent hashing working correctly.

Try different keys. You will see different servers get picked depending on where the hash lands on the ring.

**3. Hash calculation (middle right)**
Every time you send a request, this panel shows you the full breakdown:
- Step 1: the raw key you typed
- Step 2: the MD5 hash output (shown as 4 hex pairs)
- Step 3: that hex value converted to a decimal number (the ring position)
- Step 4: the nearest virtual node found clockwise on the ring
- Step 5: which server owns that virtual node

**4. Routing log (bottom)**
A live feed of every request that has passed through the load balancer, showing the key, its hash, and which server it went to.

---

## File by file explanation

### `hashRing.js`

This is the brain of the project. It has no knowledge of HTTP or Express — it only knows about servers and keys.

- `addServer(name)` — places 100 virtual nodes on the ring for that server, each at a different hash position
- `removeServer(name)` — removes all virtual nodes belonging to that server
- `getServer(key)` — hashes the key and walks clockwise to find the nearest server
- `_hash(key)` — runs MD5 on the key and takes the first 8 hex characters, converting them to a 32-bit integer

The ring is stored as a JavaScript `Map` where the keys are ring positions (integers) and the values are server names. We keep a sorted array of those positions so binary search works in O(log n) time.

### `servers.js`

Creates three Express apps, each listening on a different port (3001, 3002, 3003). Each server handles any GET request and responds with a JSON message saying which server received it. All three run in the same Node.js process.

### `loadBalancer.js`

The main proxy. It:
- Creates a `HashRing` instance and registers all three servers
- Listens on port 3000
- On `GET /route?key=<something>` — hashes the key, picks a server, and uses `http-proxy` to forward the request
- Has a `GET /events` endpoint that streams routing decisions to the browser using **Server-Sent Events (SSE)** — a built-in browser technology for real-time one-way updates
- Emits a `routed` event every time a request is forwarded, which the SSE stream picks up and pushes to the UI instantly

### `ui/src/App.jsx`

The React dashboard. It is split into self-contained components:

| Component | What it does |
|---|---|
| `ServerCard` | Displays one server, its request count, and whether it is currently active |
| `RequestForm` | Input field and Send button, makes a fetch call to the load balancer |
| `HashCalculator` | Shows the step-by-step hash calculation for the latest request |
| `EventLog` | Scrollable log of all routing events received via SSE |
| `RelatedReadings` | Sidebar with links to learn more |
| `App` | Root component — connects to the SSE stream on mount, holds all shared state |

The UI connects to `http://localhost:3000/events` using the browser's built-in `EventSource` API. This keeps a persistent connection open. Every time the load balancer routes a request, it sends a message down that connection and the UI updates instantly — no polling, no page refresh.

---

## Demonstrating key concepts

### Same key, same server (determinism)

Send `user-42` five times. It always goes to the same server. This is the core guarantee of consistent hashing. It means user sessions are sticky — the same user always reaches the same server without any central coordination.

### Different keys, different servers

Send `user-1`, `user-2`, `user-3`, `user-99`, `hello`, `test`. You will see requests spread across all three servers. Each key hashes to a different ring position and lands on a different server.

### Removing a server (the killer demo)

Add these endpoints to `loadBalancer.js`:

```js
app.post('/remove-server/:name', (req, res) => {
  ring.removeServer(req.params.name);
  res.json({ removed: req.params.name });
});

app.post('/add-server/:name', (req, res) => {
  ring.addServer(req.params.name);
  res.json({ added: req.params.name });
});
```

Then in a terminal:

```bash
curl -X POST http://localhost:3000/remove-server/server3
```

Now send the keys that were previously going to server3. They reroute to the nearest neighbor. Keys that were going to server1 and server2 are completely unaffected. Only the keys that "owned" server3 move. This is the fundamental advantage over round-robin or modulo hashing.

---

## Common errors and fixes

**Port already in use**
```
Error: listen EADDRINUSE :::3000
```
Another process is using that port. Run `lsof -i :3000` on Mac/Linux or `netstat -ano | findstr :3000` on Windows to find and kill it.

**Cannot find module**
```
Error: Cannot find module 'express'
```
You forgot to run `npm install` in the project root. Run it and try again.

**UI shows "disconnected"**
The load balancer is not running. Make sure Terminal 2 is active with `node loadBalancer.js`.

**All requests go to one server**
Make sure you saved the updated `hashRing.js` with the `Map`-based implementation and numeric sort. The old version had a string-sort bug that caused uneven distribution.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Backend servers | Node.js + Express | Simple, minimal boilerplate |
| Load balancer | Node.js + http-proxy | Handles request forwarding transparently |
| Hashing | Node.js crypto (MD5) | Built-in, no extra dependency |
| Real-time updates | Server-Sent Events | Native browser API, simpler than WebSockets for one-way data |
| Frontend | React + Vite | Fast dev server, component-based UI |

---

## Further reading

- [Consistent hashing explained — Toptal](https://www.toptal.com/big-data/consistent-hashing)
- [Wikipedia — Consistent hashing](https://en.wikipedia.org/wiki/Consistent_hashing)
- [How Amazon DynamoDB uses consistent hashing](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [Server-Sent Events — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)