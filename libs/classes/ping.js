class Ping {
  get ping() {
    return this.mod.require.ping.ping;
  }
  get jitter() {
    return this.mod.require.ping.jitter;
  }
  get rtt() {
    return this.ping + this.jitter;
  }
  constructor(mod) {
    this.mod = mod;
  }
}
module.exports = Ping;
