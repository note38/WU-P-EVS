export const profileCache = {
  data: null as any | null,
  timestamp: 0,
  ttl: 30000, // 30 seconds in milliseconds

  set(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  },

  get() {
    if (this.data && Date.now() - this.timestamp < this.ttl) {
      return this.data;
    }
    return null;
  },

  clear() {
    this.data = null;
  },
};
