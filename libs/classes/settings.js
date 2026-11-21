const fs = require("fs"),
  path = require("path");
class Settings {
  constructor(v1, v2) {
    this.mod = v1;
    this.mods = v2;
    const v4 = {
      enabled: true,
      block: true,
      jaunt: true,
      debug: false,
      dash: 25,
      delay: 0,
      instant: false,
      spikeCap: 150,
      spikeDecay: 0.6,
      spikeMargin: 4,
      spikeNotify: 40,
      auto: {
        enabled: true,
        maxMs: 50,
        floorMax: 40,
        recoveryPerMs: 0.08,
        floorStep: 8,
        floorRecoveryPerMs: 0.004,
        sustainMs: 1500,
        sustainFrac: 0.7,
        notify: 0,
        autoInstant: true,
        fallbackFrac: 0.8,
        restoreFloor: 2,
        stallGapMs: 250,
        stallFactor: 0.15,
        loopLagMs: 40,
        loopFactor: 0.3,
        jitterPadK: 0.8,
        jitterPadDead: 8,
        jitterPadCap: 20,
        weights: {
          desync: 18,
          rubberband: 0,
          mismatch: 0,
          reject: 0
        }
      }
    };
    this.defaults = v4;
    try {
      const v5 = JSON.parse(fs.readFileSync(path.join(__dirname, "../../config.json"), "utf-8"));
      this.info = Object.assign({}, v4, v5);
    } catch (v6) {
      this.info = v4;
    }
    this.sanitize();
    this.mods.command.add("$default", this.toggle);
    this.mods.command.add("on", this.on);
    this.mods.command.add("off", this.off);
    this.mods.command.add("block", this.block);
    this.mods.command.add("delay", this.delay);
    this.mods.command.add("jaunt", this.jaunt);
    this.mods.command.add("instant", this.instant);
  }
  coerceNumber(value, fallback, min, max) {
    let n = typeof value === "number" ? value : parseFloat(value);
    if (!Number.isFinite(n)) n = fallback;
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    return n;
  }
  coerceBool(value, fallback) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (["true", "1", "on", "yes"].includes(normalized)) return true;
      if (["false", "0", "off", "no"].includes(normalized)) return false;
    }
    return fallback;
  }
  sanitize() {
    const info = this.info,
      def = this.defaults;
    const num = (key, min, max) => {
      info[key] = this.coerceNumber(info[key], def[key], min, max);
    };
    const bool = key => {
      info[key] = this.coerceBool(info[key], def[key]);
    };
    bool("enabled");
    bool("block");
    bool("jaunt");
    bool("debug");
    bool("instant");
    num("dash", 0, 500);
    num("delay", 0, 1000);
    num("spikeCap", 0, 1000);
    num("spikeDecay", 0, 100);
    num("spikeMargin", 0, 100);
    num("spikeNotify", 0, 1000);
    if (typeof info.auto !== "object" || info.auto === null) info.auto = {};
    const auto = info.auto,
      autoDef = def.auto;
    const anum = (key, min, max) => {
      auto[key] = this.coerceNumber(auto[key], autoDef[key], min, max);
    };
    const abool = key => {
      auto[key] = this.coerceBool(auto[key], autoDef[key]);
    };
    abool("enabled");
    abool("autoInstant");
    anum("maxMs", 0, 1000);
    anum("floorMax", 0, 1000);
    anum("recoveryPerMs", 0, 100);
    anum("floorStep", 0, 1000);
    anum("floorRecoveryPerMs", 0, 100);
    anum("sustainMs", 0, 60000);
    anum("sustainFrac", 0, 1);
    anum("notify", 0, 1000);
    anum("fallbackFrac", 0, 1);
    anum("restoreFloor", 0, 1000);
    anum("stallGapMs", 20, 60000);
    anum("stallFactor", 0, 100);
    anum("loopLagMs", 0, 60000);
    anum("loopFactor", 0, 100);
    anum("jitterPadK", 0, 100);
    anum("jitterPadDead", 0, 1000);
    anum("jitterPadCap", 0, 1000);
    if (typeof auto.weights !== "object" || auto.weights === null) auto.weights = {};
    const weights = auto.weights,
      weightDef = autoDef.weights;
    for (const key of ["desync", "rubberband", "mismatch", "reject"]) {
      weights[key] = this.coerceNumber(weights[key], weightDef[key], 0, 1000);
    }
  }
  instant = () => {
    this.info.instant = !this.info.instant;
    this.mods.command.message("Instant (zero-jitter) mode has been turned", this.info.instant ? "on" : "off");
  };
  toggle = () => {
    this.info.enabled = !this.info.enabled;
    this.mods.command.message("PR has been turned", this.info.enabled ? "on" : "off");
  };
  off = () => {
    this.info.enabled = false;
    this.mods.command.message("PR has been turned off");
  };
  on = () => {
    this.info.enabled = true;
    this.mods.command.message("PR has been turned on");
  };
  block = () => {
    this.info.block = !this.info.block;
    this.mods.command.message("Smooth block has been turned", this.info.block ? "on" : "off");
  };
  delay = v11 => {
    v11 = +v11;
    if (isNaN(v11) || v11 < 0) return this.mods.command.message("The artificial delay needs to be a number >= 0");
    this.info.delay = v11;
    this.mods.command.message("Set artificial delay to", v11);
  };
  jaunt = () => {
    this.info.jaunt = !this.info.jaunt;
    this.mods.command.message("Smooth jaunt has been turned", this.info.jaunt ? "on" : "off");
  };
  get enabled() {
    return this.info.enabled;
  }
  get smoothBlock() {
    return this.info.block;
  }
  get emulateJaunt() {
    return this.info.jaunt;
  }
  get debug() {
    return this.info.debug;
  }
  set debug(v18) {
    this.info.debug = v18;
  }
  get dash() {
    return this.info.dash;
  }
  set dash(v21) {
    this.info.dash = v21;
  }
  destructor() {
    fs.writeFileSync(path.join(__dirname, "../../config.json"), JSON.stringify(this.info, null, "  "));
  }
}
module.exports = Settings;
