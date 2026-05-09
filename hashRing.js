import crypto from 'crypto';

export class HashRing {
  constructor(virtualNodes = 100) {
    this.virtualNodes = virtualNodes;
    // Use a Map instead of plain object — no key coercion issues
    this.ring = new Map();
    this.sortedKeys = [];
  }

  _hash(key) {
    // Take 8 hex chars = 32-bit integer, consistent across all keys
    const hex = crypto.createHash('md5').update(String(key)).digest('hex').slice(0, 8);
    return parseInt(hex, 16);
  }

  addServer(serverName) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this._hash(`${serverName}:vnode:${i}`);
      this.ring.set(hash, serverName);
    }
    // Sort numerically — this was the bug before (string sort "10" < "9")
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  removeServer(serverName) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this._hash(`${serverName}:vnode:${i}`);
      this.ring.delete(hash);
    }
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  getServer(requestKey) {
    if (this.sortedKeys.length === 0) return null;

    const hash = this._hash(requestKey);

    // Binary search for first ring position >= hash
    let lo = 0, hi = this.sortedKeys.length - 1, pos = -1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (this.sortedKeys[mid] >= hash) {
        pos = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    // Wrap around to start if past the end
    const ringPos = pos === -1 ? this.sortedKeys[0] : this.sortedKeys[pos];
    return {
      server: this.ring.get(ringPos),
      keyHash: hash,
      ringPosition: ringPos,
    };
  }

  // Returns distribution stats — useful for the UI
  getDistribution() {
    const counts = {};
    this.ring.forEach((server) => {
      counts[server] = (counts[server] || 0) + 1;
    });
    return counts;
  }
}