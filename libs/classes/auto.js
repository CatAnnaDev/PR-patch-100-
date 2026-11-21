class AutoTune {
  constructor(mod, mods) {
    this.mod = mod;
    this.mods = mods;
    this.pressure = 0;
    this.floor = 0;
    this.saturatedSince = 0;
    this.lastDecay = Date.now();
    this.lastEvent = 0;
    this.notified = false;
    this.instantForcedOff = false;
    this.counts = {
      desync: 0,
      rubberband: 0,
      mismatch: 0,
      reject: 0,
      stall: 0,
      loop: 0,
      fallbacks: 0
    };
    this.registerCommands();
  }
  registerCommands = () => {
    if (!this.mods.command) {
      this.mod.setTimeout(this.registerCommands, 50);
      return;
    }
    this.mods.command.add("auto", this.toggle);
    this.mods.command.add("autostatus", this.report);
  };
  get cfg() {
    const raw = this.mods.settings?.info?.auto || {};
    return {
      enabled: raw.enabled ?? true,
      maxMs: raw.maxMs ?? 50,
      floorMax: raw.floorMax ?? 40,
      recoveryPerMs: raw.recoveryPerMs ?? 0.08,
      floorStep: raw.floorStep ?? 8,
      floorRecoveryPerMs: raw.floorRecoveryPerMs ?? 0.004,
      sustainMs: raw.sustainMs ?? 1500,
      sustainFrac: raw.sustainFrac ?? 0.7,
      notify: raw.notify ?? 0,
      autoInstant: raw.autoInstant ?? true,
      fallbackFrac: raw.fallbackFrac ?? 0.8,
      restoreFloor: raw.restoreFloor ?? 2,
      weights: {
        desync: 18,
        rubberband: 0,
        mismatch: 0,
        reject: 0,
        ...(raw.weights || {})
      }
    };
  }
  advance() {
    const now = Date.now();
    const dt = now - this.lastDecay;
    this.lastDecay = now;
    if (dt <= 0) return;
    const cfg = this.cfg;
    if (this.pressure > 0) this.pressure = Math.max(0, this.pressure - dt * cfg.recoveryPerMs);
    if (this.pressure >= cfg.maxMs * cfg.sustainFrac) {
      if (!this.saturatedSince) this.saturatedSince = now;
      if (now - this.saturatedSince >= cfg.sustainMs) {
        this.floor = Math.min(cfg.floorMax, this.floor + cfg.floorStep);
        this.saturatedSince = now;
      }
    } else {
      this.saturatedSince = 0;
    }
    if (this.floor > 0) this.floor = Math.max(0, this.floor - dt * cfg.floorRecoveryPerMs);
    const info = this.mods.settings?.info;
    if (cfg.autoInstant && info) {
      if (!this.instantForcedOff && info.instant && this.floor >= cfg.floorMax * cfg.fallbackFrac) {
        info.instant = false;
        this.instantForcedOff = true;
        this.counts.fallbacks = (this.counts.fallbacks || 0) + 1;
        this.mods.command?.message?.("Connection degraded: switching to jitter mode (instant off) until it settles.");
      } else if (this.instantForcedOff && this.floor <= cfg.restoreFloor) {
        info.instant = true;
        this.instantForcedOff = false;
        this.mods.command?.message?.("Connection restored: back to instant mode (zero ping).");
      }
    }
    if (this.pressure === 0 && this.floor === 0 && this.notified && cfg.notify > 0) {
      this.mods.command.message("Connection stable, back to zero ping.");
      this.notified = false;
    }
  }
  safetyMs() {
    if (!this.cfg.enabled) return 0;
    this.advance();
    return Math.round(Math.max(this.pressure, this.floor));
  }
  pump(amount) {
    const cfg = this.cfg;
    if (!cfg.enabled || !(amount > 0)) return;
    this.advance();
    this.lastEvent = Date.now();
    this.pressure = Math.min(cfg.maxMs, this.pressure + amount);
    const buffer = Math.max(this.pressure, this.floor);
    if (cfg.notify > 0 && !this.notified && buffer >= cfg.notify) {
      this.notified = true;
      this.mods.command?.message?.("Anti-desync buffer active (+" + Math.round(buffer) + " ms) to smooth the connection.");
    }
  }
  hit(kind) {
    const weight = this.cfg.weights[kind] || 0;
    if (!weight) return;
    this.counts[kind] = (this.counts[kind] || 0) + 1;
    this.pump(weight);
  }
  toggle = () => {
    const info = this.mods.settings?.info;
    if (!info) return;
    info.auto = info.auto || {};
    info.auto.enabled = !(info.auto.enabled ?? true);
    if (!info.auto.enabled) {
      this.pressure = 0;
      this.floor = 0;
      if (this.instantForcedOff) {
        info.instant = true;
        this.instantForcedOff = false;
      }
    }
    this.mods.command.message("Auto-tune anti-desync", info.auto.enabled ? "on" : "off");
  };
  report = () => {
    this.advance();
    const cfg = this.cfg;
    this.mods.command.message("\nAuto-tune: " + (cfg.enabled ? "on" : "off") + "\nLive buffer: " + Math.round(this.pressure) + " / " + cfg.maxMs + " ms\nAdaptive floor: " + Math.round(this.floor) + " / " + cfg.floorMax + " ms\nMode: " + (this.instantForcedOff ? "jitter (auto fallback)" : "instant") + "\nEvents -> desync: " + this.counts.desync + " | stall: " + this.counts.stall + " | loop: " + this.counts.loop + " | rubber-band: " + this.counts.rubberband + " | reject: " + this.counts.reject);
  };
  destructor() {}
}
module.exports = AutoTune;
