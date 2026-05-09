import { useState, useEffect, useRef } from "react";

const SERVERS = ["server1", "server2", "server3"];

const COLORS = {
  server1: { bg: "#E1F5EE", text: "#085041", accent: "#1D9E75" },
  server2: { bg: "#E6F1FB", text: "#0C447C", accent: "#378ADD" },
  server3: { bg: "#EEEDFE", text: "#3C3489", accent: "#7F77DD" },
};

// ── Server Card ──────────────────────────────────────────────
function ServerCard({ name, requestCount, isActive }) {
  const c = COLORS[name];
  return (
    <div style={{
      border: `2px solid ${isActive ? c.accent : "var(--color-border-tertiary)"}`,
      borderRadius: 12,
      padding: "16px",
      background: isActive ? c.bg : "var(--color-background-secondary)",
      transition: "all 0.25s",
      textAlign: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: c.accent, margin: "0 auto 8px",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 500, fontSize: 16,
      }}>
        {name.slice(-1)}
      </div>
      <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: 14 }}>
        {name}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
        port 300{name.slice(-1)}
      </div>
      <div style={{
        marginTop: 10,
        fontSize: 22, fontWeight: 500,
        color: isActive ? c.accent : "var(--color-text-primary)",
      }}>
        {requestCount}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>requests</div>
      {isActive && (
        <div style={{
          marginTop: 8, fontSize: 11, padding: "2px 8px",
          background: c.accent, color: "#fff", borderRadius: 20,
          display: "inline-block",
        }}>
          active
        </div>
      )}
    </div>
  );
}

// ── Request Form ─────────────────────────────────────────────
function RequestForm({ onResult }) {
  const [key, setKey] = useState("user-42");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/route?key=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      onResult({ key, ...data });
    } catch (e) {
      onResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontWeight: 500, marginBottom: 10, color: "var(--color-text-primary)" }}>
        Send a request
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. user-42, session-abc"
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 14,
            border: "1px solid var(--color-border-secondary)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 14,
            fontWeight: 500, border: "none", cursor: "pointer",
            background: loading ? "#AFA9EC" : "#534AB7",
            color: "#fff", transition: "background 0.2s",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 6 }}>
        Same key always goes to the same server. Try it multiple times.
      </div>
    </div>
  );
}

// ── Event Log ─────────────────────────────────────────────────
function EventLog({ events }) {

  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 16,
    }}>
      <div style={{
        fontWeight: 500, marginBottom: 10,
        color: "var(--color-text-primary)",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>Routing log</span>
        <span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-tertiary)" }}>
          {events.length} events
        </span>
      </div>
      <div style={{
        maxHeight: 220, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        {events.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", padding: "8px 0" }}>
            No requests yet.
          </div>
        )}
        {[...events].reverse().map((e, i) => {
          const c = COLORS[e.server];
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", borderRadius: 8,
              background: "var(--color-background-secondary)",
              fontSize: 13,
            }}>
              <span style={{
                padding: "2px 9px", borderRadius: 20,
                background: c?.bg, color: c?.text,
                border: `1px solid ${c?.accent}`,
                fontWeight: 500, fontSize: 12, whiteSpace: "nowrap",
              }}>
                {e.server}
              </span>
              <span style={{
                fontFamily: "monospace",
                color: "var(--color-text-primary)", flex: 1,
              }}>
                {e.key}
              </span>
              <span style={{
                fontFamily: "monospace", fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}>
                {e.keyHash?.toString(16).toUpperCase().padStart(8, "0")}
              </span>
            </div>
          );
        })}
       
      </div>
    </div>
  );
}

// ── Last Response Box ─────────────────────────────────────────
function ResponseBox({ data }) {
  if (!data) return null;
  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 14,
      background: "var(--color-background-secondary)",
    }}>
      <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
        Last backend response
      </div>
      <pre style={{
        margin: 0, fontSize: 12, fontFamily: "monospace",
        color: "var(--color-text-primary)", whiteSpace: "pre-wrap",
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
function HashCalculator({ events }) {
  const latest = events[events.length - 1];

  if (!events.length) return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 16, height: "100%",
    }}>
      <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>
        Hash calculation
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
        Send a request to see the calculation
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 40 }}>
        Waiting for first request...
      </div>
    </div>
  );

  const c = COLORS[latest.server];

  // Break the hash hex into groups of 2 for visual display
  const hexFull = latest.keyHash.toString(16).toUpperCase().padStart(8, "0");
  const hexGroups = hexFull.match(/.{2}/g); // ["7A", "BC", "13", "F2"]

  return (
    <div style={{
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>
        Hash calculation
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
        Real-time breakdown of the latest request
      </div>

      {/* Step 1: Input key */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
          Step 1 — input key
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 14, fontWeight: 500,
          padding: "8px 12px", borderRadius: 8,
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-tertiary)",
        }}>
          "{latest.key}"
        </div>
      </div>

      {/* Step 2: MD5 output */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
          Step 2 — MD5 hash (first 8 hex chars)
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {hexGroups.map((group, i) => (
            <div key={i} style={{
              fontFamily: "monospace", fontSize: 13, fontWeight: 500,
              padding: "6px 8px", borderRadius: 6,
              background: i === 0 ? c.bg : "var(--color-background-secondary)",
              color: i === 0 ? c.text : "var(--color-text-secondary)",
              border: `1px solid ${i === 0 ? c.accent : "var(--color-border-tertiary)"}`,
              flex: 1, textAlign: "center",
            }}>
              {group}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
          0x{hexFull}
        </div>
      </div>

      {/* Step 3: Decimal */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
          Step 3 — convert hex → decimal (ring position)
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 13,
          padding: "8px 12px", borderRadius: 8,
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border-tertiary)",
        }}>
          0x{hexFull} = <strong>{latest.keyHash.toLocaleString()}</strong>
        </div>
      </div>

      {/* Step 4: Ring lookup */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
          Step 4 — clockwise lookup on ring
        </div>
        <div style={{
          padding: "8px 12px", borderRadius: 8, fontSize: 13,
          background: "var(--color-background-secondary)",
          border: "1px solid var(--color-border-tertiary)",
          color: "var(--color-text-primary)",
        }}>
          First virtual node &ge; <span style={{ fontFamily: "monospace" }}>{latest.keyHash.toLocaleString()}</span>
          <br />
          Ring position: <span style={{ fontFamily: "monospace" }}>{latest.ringPosition?.toLocaleString()}</span>
        </div>
      </div>

      {/* Step 5: Result */}
      <div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
          Step 5 — routed to
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: c.bg, border: `1px solid ${c.accent}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: c.accent, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 500, fontSize: 14,
          }}>
            {latest.server.slice(-1)}
          </div>
          <div>
            <div style={{ fontWeight: 500, color: c.text, fontSize: 14 }}>
              {latest.server}
            </div>
            <div style={{ fontSize: 11, color: c.text, opacity: 0.7 }}>
              port 300{latest.server.slice(-1)}
            </div>
          </div>
        </div>
      </div>

      {/* History table */}
      {events.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6 }}>
            Previous requests
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["key", "hash", "server"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "4px 6px",
                    color: "var(--color-text-tertiary)", fontWeight: 500,
                    borderBottom: "1px solid var(--color-border-tertiary)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...events].reverse().slice(1, 6).map((e, i) => {
                const ec = COLORS[e.server];
                return (
                  <tr key={i}>
                    <td style={{
                      padding: "5px 6px", fontFamily: "monospace",
                      color: "var(--color-text-primary)",
                      borderBottom: "1px solid var(--color-border-tertiary)",
                    }}>
                      {e.key}
                    </td>
                    <td style={{
                      padding: "5px 6px", fontFamily: "monospace",
                      color: "var(--color-text-secondary)",
                      borderBottom: "1px solid var(--color-border-tertiary)",
                    }}>
                      {e.keyHash?.toString(16).toUpperCase().padStart(8, "0")}
                    </td>
                    <td style={{
                      padding: "5px 6px",
                      borderBottom: "1px solid var(--color-border-tertiary)",
                    }}>
                      <span style={{
                        padding: "1px 7px", borderRadius: 20, fontSize: 11,
                        background: ec?.bg, color: ec?.text,
                        border: `1px solid ${ec?.accent}`,
                      }}>
                        {e.server}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



//*****************Related reading section************************ */
function RelatedReadings() {
  const links = [
    {
      category: "Consistent hashing",
      items: [
        { title: "Consistent hashing explained", url: "https://www.toptal.com/big-data/consistent-hashing" },
        { title: "How Discord scaled to millions", url: "https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users" },
        { title: "Consistent hashing — Wikipedia", url: "https://en.wikipedia.org/wiki/Consistent_hashing" },
      ]
    },
    {
      category: "Hash functions",
      items: [
        { title: "MD5 algorithm overview", url: "https://www.geeksforgeeks.org/md5-hash-python/" },
        { title: "MurmurHash vs MD5", url: "https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed" },
      ]
    },
    {
      category: "Load balancing",
      items: [
        { title: "Load balancing algorithms", url: "https://www.nginx.com/resources/glossary/load-balancing/" },
        { title: "Consistent hashing in Cassandra", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html" },
      ]
    },
  ];

  return (
    <div style={{
      width: 220, flexShrink: 0,
      border: "1px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: 16,
      alignSelf: "flex-start",
      position: "sticky", top: 24,
    }}>
      <div style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 4 }}>
        Related readings
      </div>
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
        Learn more about the concepts used here
      </div>

      {links.map((section) => (
        <div key={section.category} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, textTransform: "uppercase",
            letterSpacing: "0.05em", color: "var(--color-text-tertiary)",
            marginBottom: 8,
          }}>
            {section.category}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {section.items.map((item) => (
              <a
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex", alignItems: "flex-start", gap: 6,
                  fontSize: 13, color: "var(--color-text-primary)",
                  textDecoration: "none", lineHeight: 1.4,
                  padding: "6px 8px", borderRadius: 8,
                  border: "1px solid transparent",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--color-background-secondary)";
                  e.currentTarget.style.borderColor = "var(--color-border-tertiary)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <i className="ti ti-external-link" style={{ fontSize: 13, marginTop: 1, flexShrink: 0, color: "var(--color-text-tertiary)" }} aria-hidden="true" />
                {item.title}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [counts, setCounts] = useState({ server1: 0, server2: 0, server3: 0 });
  const [sseStatus, setSseStatus] = useState("connecting");

  useEffect(() => {
    const es = new EventSource("http://localhost:3000/events");
    es.onopen = () => setSseStatus("connected");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "routed") {
        setEvents((prev) => [...prev, data]);
        setLastEvent(data);
        setCounts((prev) => ({
          ...prev,
          [data.server]: (prev[data.server] || 0) + 1,
        }));
      }
    };
    es.onerror = () => setSseStatus("disconnected");
    return () => es.close();
  }, []);

  return (
    <div style={{ display: "flex", gap: 20, maxWidth: 1200, margin: "0 auto", padding: "28px 16px", fontFamily: "system-ui, sans-serif" }}>
    <RelatedReadings />
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Consistent hashing load balancer
          </h1>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }}>
            Requests route deterministically based on key hash
          </div>
        </div>
        <span style={{
          marginLeft: "auto", padding: "3px 10px", borderRadius: 20, fontSize: 12,
          background: sseStatus === "connected" ? "#EAF3DE" : "#FCEBEB",
          color: sseStatus === "connected" ? "#27500A" : "#791F1F",
          border: `1px solid ${sseStatus === "connected" ? "#3B6D11" : "#A32D2D"}`,
        }}>
          {sseStatus === "connected" ? "Live" : sseStatus}
        </span>
      </div>

      {/* Server cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {SERVERS.map((s) => (
          <ServerCard
            key={s}
            name={s}
            requestCount={counts[s]}
            isActive={lastEvent?.server === s}
          />
        ))}
      </div>


      {/* Request form */}
     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <RequestForm onResult={setLastResponse} />
    <ResponseBox data={lastResponse} />
  </div>
  <HashCalculator events={events} />
</div>

      {/* Event log */}
      <EventLog events={events} />
    </div>  
  </div>    
  
  );
}
